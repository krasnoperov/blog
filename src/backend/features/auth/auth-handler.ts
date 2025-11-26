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

@injectable()
export class AuthHandler {
  constructor(
    @inject(AuthController) private authController: AuthController,
    @inject(AuthService) private authService: AuthService,
  ) {}

  async authorize(c: Context): Promise<Response> {
    const url = new URL(c.req.url);
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const responseType = url.searchParams.get('response_type');
    const codeChallenge = url.searchParams.get('code_challenge');
    const codeChallengeMethod = url.searchParams.get('code_challenge_method');
    const originalState = url.searchParams.get('state');

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

    // Check if user is already authenticated
    const token = getAuthToken(c.req.header('Cookie') || null);
    const userSession = token ? await this.authService.verifyJWT(token) : null;

    const requestId = crypto.randomUUID();

    if (!userSession) {
      // User NOT authenticated: store request and redirect to Google
      await storeAuthorizationRequest(c.env.OAUTH_KV, requestId, {
        clientId,
        redirectUri,
        codeChallenge: codeChallenge ?? null,
        codeChallengeMethod: (codeChallengeMethod as 'S256' | 'plain' | null) ?? null,
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

    // User IS authenticated: redirect to approval page
    await storeAuthorizationRequest(c.env.OAUTH_KV, requestId, {
      clientId,
      redirectUri,
      codeChallenge: codeChallenge ?? null,
      codeChallengeMethod: (codeChallengeMethod as 'S256' | 'plain' | null) ?? null,
      originalState,
      userId: userSession.userId, // Bind to authenticated user
    });

    return c.redirect(`/oauth/approve?request=${requestId}`, 302);
  }

  async oauthCallback(c: Context): Promise<Response> {
    const url = new URL(c.req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

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

      // Create session JWT and set cookie
      const jwt = result.token;
      c.header('Set-Cookie', createAuthCookie(jwt));

      // Store Google refresh token if provided
      if (googleTokens.refresh_token) {
        const { storeGoogleRefreshToken } = await import('./oauth-store');
        await storeGoogleRefreshToken(c.env.OAUTH_KV, result.user.id, googleTokens.refresh_token);
      }

      // Check if this is an OAuth authorization flow
      if (!pending.clientId) {
        // Regular website login: redirect to home
        return c.redirect('/', 302);
      }

      // OAuth flow: update request with userId and redirect to approval page
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

  async getApprovalRequest(c: Context): Promise<Response> {
    const requestId = c.req.query('request');

    if (!requestId) {
      return c.json({ error: 'Missing request parameter' }, 400);
    }

    // Verify user is authenticated
    const token = getAuthToken(c.req.header('Cookie') || null);
    const userSession = token ? await this.authService.verifyJWT(token) : null;

    if (!userSession) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    // Retrieve authorization request (non-destructive read)
    const { getAuthorizationRequest } = await import('./oauth-store');
    const request = await getAuthorizationRequest(c.env.OAUTH_KV, requestId);

    if (!request) {
      return c.json({ error: 'Invalid or expired request' }, 404);
    }

    // Verify request belongs to this user
    if (request.userId !== userSession.userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get user details
    const userResult = await this.authController.getCurrentUser(userSession.userId);
    if (!userResult.user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Return client details for approval UI
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

  async handleApprovalDecision(c: Context): Promise<Response> {
    const body = await c.req.json<{ requestId: string; approved: boolean }>();
    const { requestId, approved } = body;

    if (!requestId || typeof approved !== 'boolean') {
      return c.json({ error: 'Invalid request' }, 400);
    }

    // Verify user is authenticated
    const token = getAuthToken(c.req.header('Cookie') || null);
    const userSession = token ? await this.authService.verifyJWT(token) : null;

    if (!userSession) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    // Retrieve and consume authorization request
    const request = await consumeAuthorizationRequest(c.env.OAUTH_KV, requestId);

    if (!request) {
      return c.json({ error: 'Invalid or expired request' }, 404);
    }

    // Verify request belongs to this user
    if (request.userId !== userSession.userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    if (!approved) {
      // User denied: redirect to client with error
      const errorUrl = new URL(request.redirectUri);
      errorUrl.searchParams.set('error', 'access_denied');
      errorUrl.searchParams.set('error_description', 'User denied authorization');
      if (request.originalState) {
        errorUrl.searchParams.set('state', request.originalState);
      }
      return c.json({ redirectUrl: errorUrl.toString() });
    }

    // User approved: generate authorization code
    const authCode = crypto.randomUUID();
    await storeAuthorizationCode(c.env.OAUTH_KV, authCode, {
      userId: userSession.userId,
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod,
    });

    // Redirect to client with authorization code
    const callbackUrl = new URL(request.redirectUri);
    callbackUrl.searchParams.set('code', authCode);
    if (request.originalState) {
      callbackUrl.searchParams.set('state', request.originalState);
    }

    return c.json({ redirectUrl: callbackUrl.toString() });
  }

  private getClientName(clientId: string): string {
    // Map client IDs to friendly names
    const clientNames: Record<string, string> = {
      'lrsr-cli': 'Whitelabel CLI',
      'claude-desktop': 'Claude Desktop',
    };
    return clientNames[clientId] || clientId;
  }

  async googleAuth(c: Context): Promise<Response> {
    try {
      const { access_token } = await c.req.json();

      if (!access_token) {
        return c.json({ error: "Access token required" }, 400);
      }

      const result = await this.authController.authenticateWithGoogle(access_token);

      if (!result.success || !result.token) {
        return c.json({ error: result.error || "Authentication failed" }, 500);
      }

      c.header("Set-Cookie", createAuthCookie(result.token));

      return c.json({ success: true, user: result.user });
    } catch (error) {
      console.error("Auth handler error:", error);
      return c.json({ error: "Authentication failed" }, 500);
    }
  }

  async oauthToken(c: Context): Promise<Response> {
    const {
      grantType,
      code,
      codeVerifier,
      redirectUri,
      clientId,
    } = await this.parseOAuthRequest(c);

    if (grantType !== 'authorization_code' || !code || !redirectUri || !clientId) {
      return c.json({ error: 'invalid_request' }, 400);
    }

    if (!this.authService.isClientAllowed(clientId)) {
      return c.json({ error: 'unauthorized_client' }, 401);
    }

    try {
      const entry = await consumeAuthorizationCode(c.env.OAUTH_KV, code);
      if (!entry) {
        return c.json({ error: 'invalid_grant' }, 400);
      }

      if (entry.clientId !== clientId) {
        return c.json({ error: 'invalid_grant' }, 400);
      }

      if (entry.redirectUri !== redirectUri) {
        return c.json({ error: 'invalid_grant' }, 400);
      }

      if (entry.codeChallenge) {
        if (!codeVerifier) {
          return c.json({ error: 'invalid_request' }, 400);
        }

        let expectedChallenge = entry.codeChallenge;
        if (entry.codeChallengeMethod === 'S256') {
          expectedChallenge = await computeCodeChallenge(codeVerifier);
        } else if (entry.codeChallengeMethod === 'plain') {
          expectedChallenge = codeVerifier;
        }

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
    c.header("Set-Cookie", clearAuthCookie());
    return c.json({ success: true });
  }

  async getSession(c: Context): Promise<Response> {
    // Always return 200 with session data
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
      }
    };

    // Try to get the current user if authenticated
    const cookieHeader = c.req.header("Cookie");
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

    // Always return 200 with session data
    return c.json(sessionData);
  }

  private async parseOAuthRequest(c: Context): Promise<{
    grantType: string | null;
    code: string | null;
    codeVerifier: string | null;
    redirectUri: string | null;
    clientId: string | null;
  }> {
    const contentType = c.req.header('content-type') ?? '';
    let grantType: string | null = null;
    let code: string | null = null;
    let codeVerifier: string | null = null;
    let redirectUri: string | null = null;
    let clientId: string | null = null;

    if (contentType.includes('application/json')) {
      const body = await c.req.json<Record<string, string | undefined>>();
      grantType = body.grant_type ?? null;
      code = body.code ?? null;
      codeVerifier = body.code_verifier ?? null;
      redirectUri = body.redirect_uri ?? null;
      clientId = body.client_id ?? null;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await c.req.formData();
      grantType = form.get('grant_type')?.toString() ?? null;
      code = form.get('code')?.toString() ?? null;
      codeVerifier = form.get('code_verifier')?.toString() ?? null;
      redirectUri = form.get('redirect_uri')?.toString() ?? null;
      clientId = form.get('client_id')?.toString() ?? null;
    } else {
      // Attempt JSON parse fallback
      try {
        const body = await c.req.json<Record<string, string | undefined>>();
        grantType = body.grant_type ?? null;
        code = body.code ?? null;
        codeVerifier = body.code_verifier ?? null;
        redirectUri = body.redirect_uri ?? null;
        clientId = body.client_id ?? null;
      } catch {
        // ignore
      }
    }

    return {
      grantType,
      code,
      codeVerifier,
      redirectUri,
      clientId,
    };
  }
}
