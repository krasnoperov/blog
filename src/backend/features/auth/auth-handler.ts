import { inject, injectable } from 'inversify';
import { Context } from 'hono';
import { AuthController } from './auth-controller';
import { AuthService } from './auth-service';
import { createAuthCookie, clearAuthCookie, getAuthToken } from '../../auth';
import {
  consumeAuthorizationCode,
  consumeAuthorizationRequest,
  storeAuthorizationCode,
  storeAuthorizationRequest,
} from './oauth-store';
import { computeCodeChallenge } from './pkce';
import { readTestSessionOverride, TEST_SESSION_HEADER } from './test-session';
import type { ApiAuthGoogleRequest } from '../../../shared/schemas/auth';
import type {
  ApiOAuthApprovalDecisionRequest,
  ApiOAuthApprovalRequestQuery,
  ApiOAuthAuthorizeQuery,
  ApiOAuthCallbackQuery,
  ApiOAuthTokenRequest,
} from '../../../shared/schemas/oauth';

@injectable()
export class AuthHandler {
  constructor(
    @inject(AuthController) private authController: AuthController,
    @inject(AuthService) private authService: AuthService,
  ) {}

  async authorize(c: Context, query: ApiOAuthAuthorizeQuery): Promise<Response> {
    const clientId = query.client_id ?? null;
    const redirectUri = query.redirect_uri ?? null;
    const responseType = query.response_type ?? null;
    const codeChallenge = query.code_challenge ?? null;
    const codeChallengeMethod = query.code_challenge_method ?? null;
    const originalState = query.state ?? null;

    if (!clientId || !redirectUri || responseType !== 'code') {
      return c.json({ error: 'invalid_request' }, 400);
    }

    if (!this.authService.isClientAllowed(clientId)) {
      return c.json({ error: 'unauthorized_client' }, 401);
    }

    if (codeChallengeMethod && codeChallengeMethod !== 'S256' && codeChallengeMethod !== 'plain') {
      return c.json({ error: 'invalid_request' }, 400);
    }

    if (codeChallengeMethod && !codeChallenge) {
      return c.json({ error: 'invalid_request' }, 400);
    }

    const token = getAuthToken(c.req.header('Cookie') || null);
    const userSession = token ? await this.authService.verifyJWT(token) : null;
    const requestId = crypto.randomUUID();

    if (!userSession) {
      await storeAuthorizationRequest(c.env.OAUTH_KV, requestId, {
        clientId,
        redirectUri,
        codeChallenge,
        codeChallengeMethod,
        originalState,
      });

      const googleClientId = c.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        return c.json({ error: 'server_error' }, 500);
      }

      const callbackUrl = `${this.authService.getIssuerUrl().replace(/\/$/, '')}/api/oauth/callback`;
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', googleClientId);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
      googleAuthUrl.searchParams.set('state', requestId);
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');

      return c.redirect(googleAuthUrl.toString(), 302);
    }

    await storeAuthorizationRequest(c.env.OAUTH_KV, requestId, {
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      originalState,
      userId: userSession.userId,
    });

    return c.redirect(`/oauth/approve?request=${requestId}`, 302);
  }

  async oauthCallback(c: Context, query: ApiOAuthCallbackQuery): Promise<Response> {
    const code = query.code ?? null;
    const state = query.state ?? null;

    if (!code || !state) {
      return c.json({ error: 'invalid_request' }, 400);
    }

    const pending = await consumeAuthorizationRequest(c.env.OAUTH_KV, state);
    if (!pending) {
      return c.json({ error: 'invalid_request' }, 400);
    }

    try {
      const callbackUrl = `${this.authService.getIssuerUrl().replace(/\/$/, '')}/api/oauth/callback`;
      const googleTokens = await this.authService.exchangeGoogleAuthorizationCode({
        code,
        redirectUri: callbackUrl,
      });

      const result = await this.authController.authenticateWithGoogle(googleTokens.access_token);
      if (!result.success || !result.user || !result.token) {
        return c.json({ error: 'invalid_grant' }, 400);
      }

      c.header('Set-Cookie', createAuthCookie(result.token));

      if (googleTokens.refresh_token) {
        const { storeGoogleRefreshToken } = await import('./oauth-store');
        await storeGoogleRefreshToken(c.env.OAUTH_KV, result.user.id, googleTokens.refresh_token);
      }

      if (!pending.clientId) {
        return c.redirect('/', 302);
      }

      const newRequestId = crypto.randomUUID();
      await storeAuthorizationRequest(c.env.OAUTH_KV, newRequestId, {
        ...pending,
        userId: result.user.id,
      });

      return c.redirect(`/oauth/approve?request=${newRequestId}`, 302);
    } catch (error) {
      console.error('OIDC callback failed', error);
      const redirectUrl = new URL(pending.redirectUri);
      redirectUrl.searchParams.set('error', 'server_error');
      if (pending.originalState) {
        redirectUrl.searchParams.set('state', pending.originalState);
      }
      return c.redirect(redirectUrl.toString(), 302);
    }
  }

  async getApprovalRequest(c: Context, query: ApiOAuthApprovalRequestQuery): Promise<Response> {
    const requestId = query.request;

    const token = getAuthToken(c.req.header('Cookie') || null);
    const userSession = token ? await this.authService.verifyJWT(token) : null;

    if (!userSession) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const { getAuthorizationRequest } = await import('./oauth-store');
    const request = await getAuthorizationRequest(c.env.OAUTH_KV, requestId);

    if (!request) {
      return c.json({ error: 'Invalid or expired request' }, 404);
    }

    if (request.userId !== userSession.userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const userResult = await this.authController.getCurrentUser(userSession.userId);
    if (!userResult.user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const clientName = this.getClientName(request.clientId);

    return c.json({
      clientId: request.clientId,
      clientName,
      scopes: ['openid', 'profile', 'email'],
      user: {
        id: userResult.user.id,
        email: userResult.user.email,
      },
    });
  }

  async handleApprovalDecision(c: Context, body: ApiOAuthApprovalDecisionRequest): Promise<Response> {
    const { requestId, approved } = body;

    const token = getAuthToken(c.req.header('Cookie') || null);
    const userSession = token ? await this.authService.verifyJWT(token) : null;

    if (!userSession) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const request = await consumeAuthorizationRequest(c.env.OAUTH_KV, requestId);

    if (!request) {
      return c.json({ error: 'Invalid or expired request' }, 404);
    }

    if (request.userId !== userSession.userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    if (!approved) {
      const errorUrl = new URL(request.redirectUri);
      errorUrl.searchParams.set('error', 'access_denied');
      errorUrl.searchParams.set('error_description', 'User denied authorization');
      if (request.originalState) {
        errorUrl.searchParams.set('state', request.originalState);
      }
      return c.json({ redirectUrl: errorUrl.toString() });
    }

    const authCode = crypto.randomUUID();
    await storeAuthorizationCode(c.env.OAUTH_KV, authCode, {
      userId: userSession.userId,
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod,
    });

    const callbackUrl = new URL(request.redirectUri);
    callbackUrl.searchParams.set('code', authCode);
    if (request.originalState) {
      callbackUrl.searchParams.set('state', request.originalState);
    }

    return c.json({ redirectUrl: callbackUrl.toString() });
  }

  private getClientName(clientId: string): string {
    const clientNames: Record<string, string> = {
      'lrsr-cli': 'Whitelabel CLI',
      'claude-desktop': 'Claude Desktop',
    };
    return clientNames[clientId] || clientId;
  }

  async googleAuth(c: Context, body: ApiAuthGoogleRequest): Promise<Response> {
    try {
      const result = await this.authController.authenticateWithGoogle(body.access_token);

      if (!result.success || !result.token) {
        return c.json({ error: result.error || 'Authentication failed' }, 500);
      }

      c.header('Set-Cookie', createAuthCookie(result.token));

      return c.json({ success: true, user: result.user });
    } catch (error) {
      console.error('Auth handler error:', error);
      return c.json({ error: 'Authentication failed' }, 500);
    }
  }

  async oauthToken(c: Context, body: ApiOAuthTokenRequest): Promise<Response> {
    const grantType = body.grant_type ?? null;
    const code = body.code ?? null;
    const codeVerifier = body.code_verifier ?? null;
    const redirectUri = body.redirect_uri ?? null;
    const clientId = body.client_id ?? null;

    if (grantType !== 'authorization_code' || !code || !redirectUri || !clientId) {
      return c.json({ error: 'invalid_request' }, 400);
    }

    if (!this.authService.isClientAllowed(clientId)) {
      return c.json({ error: 'unauthorized_client' }, 401);
    }

    try {
      const entry = await consumeAuthorizationCode(c.env.OAUTH_KV, code);
      if (!entry || entry.clientId !== clientId || entry.redirectUri !== redirectUri) {
        return c.json({ error: 'invalid_grant' }, 400);
      }

      if (entry.codeChallenge) {
        if (!codeVerifier) {
          return c.json({ error: 'invalid_request' }, 400);
        }

        const expectedChallenge = entry.codeChallengeMethod === 'S256'
          ? await computeCodeChallenge(codeVerifier)
          : codeVerifier;

        if (expectedChallenge !== entry.codeChallenge) {
          return c.json({ error: 'invalid_grant' }, 400);
        }
      }

      const accessToken = await this.authService.createJWT(entry.userId);
      const userInfo = await this.authController.getCurrentUser(entry.userId);

      c.header('Cache-Control', 'no-store');
      c.header('Pragma', 'no-cache');

      return c.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: this.authService.getAccessTokenTtlSeconds(),
        id_token: accessToken,
        scope: 'openid profile email',
        user: userInfo.user ?? null,
      });
    } catch (error) {
      console.error('OIDC token exchange failed', error);
      return c.json({ error: 'invalid_grant' }, 400);
    }
  }

  async logout(c: Context): Promise<Response> {
    c.header('Set-Cookie', clearAuthCookie());
    return c.json({ success: true });
  }

  async getSession(c: Context): Promise<Response> {
    const sessionData: {
      user: {
        id: number;
        email: string;
        name: string;
        google_id: string | null;
        created_at: string;
        updated_at: string;
      } | null;
      config: {
        googleClientId: string;
        environment: string;
      };
    } = {
      user: null,
      config: {
        googleClientId: c.env.GOOGLE_CLIENT_ID || '',
        environment: c.env.ENVIRONMENT || 'development',
      },
    };

    const testSessionUser = readTestSessionOverride(c.env, c.req.header(TEST_SESSION_HEADER));
    if (testSessionUser !== undefined) {
      sessionData.user = testSessionUser;
      return c.json(sessionData);
    }

    const cookieHeader = c.req.header('Cookie');
    const token = getAuthToken(cookieHeader || null);

    if (token) {
      const container = c.get('container');
      const authService = container.get(AuthService);
      const payload = await authService.verifyJWT(token);

      if (payload) {
        const result = await this.authController.getCurrentUser(payload.userId);
        if (!result.error && result.user) {
          sessionData.user = result.user;
        }
      }
    }

    return c.json(sessionData);
  }
}
