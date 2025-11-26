import { injectable, inject } from 'inversify';
import {
  SignJWT,
  jwtVerify,
  importPKCS8,
  importSPKI,
  exportJWK,
  type JWTPayload,
  type JWK,
} from 'jose';
import { TYPES } from '../../../core/di-types';
import type { Env } from '../../../core/types';

type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: 'Bearer';
};

type PublicJwk = JWK & { use: string; alg: string; kid: string };

@injectable()
export class AuthService {
  private signingKeyPromise?: Promise<CryptoKey>;
  private publicKeyPromise?: Promise<CryptoKey>;
  private publicJwkPromise?: Promise<PublicJwk>;
  private readonly accessTokenTtlSeconds = 30 * 24 * 60 * 60; // 1 month

  constructor(@inject(TYPES.Env) private env: Env) {}

  private requireEnv(key: keyof Env, label: string): string {
    const value = this.env[key];
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Missing required env var: ${label}`);
    }
    return value;
  }

  private getIssuer(): string {
    const issuer = this.env.OIDC_ISSUER;
    if (issuer && issuer.trim().length > 0) {
      return issuer;
    }
    if (this.env.ENVIRONMENT === 'production') {
      return 'https://whitelabel.krasnoperov.me';
    }
    return 'https://whitelabel-stage.krasnoperov.me';
  }

  private getAudience(): string {
    const aud = this.env.OIDC_AUDIENCE;
    if (aud && aud.trim().length > 0) {
      return aud;
    }
    return 'lrsr-api';
  }

  getIssuerUrl(): string {
    return this.getIssuer();
  }

  getAudienceClaim(): string {
    return this.getAudience();
  }

  private getKeyId(): string {
    const kid = this.env.OIDC_KEY_ID;
    if (kid && kid.trim().length > 0) {
      return kid;
    }
    return 'primary';
  }

  private async getSigningKey(): Promise<CryptoKey> {
    if (!this.signingKeyPromise) {
      const privateKeyPem = this.requireEnv('OIDC_PRIVATE_KEY', 'OIDC_PRIVATE_KEY');
      this.signingKeyPromise = importPKCS8(privateKeyPem, 'ES256');
    }
    return this.signingKeyPromise;
  }

  private async getPublicKey(): Promise<CryptoKey> {
    if (!this.publicKeyPromise) {
      const publicKeyPem = this.requireEnv('OIDC_PUBLIC_KEY', 'OIDC_PUBLIC_KEY');
      this.publicKeyPromise = importSPKI(publicKeyPem, 'ES256');
    }
    return this.publicKeyPromise;
  }

  getAccessTokenTtlSeconds(): number {
    return this.accessTokenTtlSeconds;
  }

  async getJwks(): Promise<{ keys: PublicJwk[] }> {
    if (!this.publicJwkPromise) {
      this.publicJwkPromise = (async () => {
        const publicKey = await this.getPublicKey();
        const jwk = await exportJWK(publicKey);
        return {
          ...jwk,
          use: 'sig',
          alg: 'ES256',
          kid: this.getKeyId(),
        } as PublicJwk;
      })();
    }

    return { keys: [await this.publicJwkPromise] };
  }

  async createJWT(userId: number): Promise<string> {
    const signingKey = await this.getSigningKey();
    const now = Math.floor(Date.now() / 1000);

    return await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: this.getKeyId() })
      .setSubject(String(userId))
      .setAudience(this.getAudience())
      .setIssuer(this.getIssuer())
      .setIssuedAt(now)
      .setExpirationTime(now + this.accessTokenTtlSeconds)
      .sign(signingKey);
  }

  async verifyJWT(token: string): Promise<{ userId: number } | null> {
    try {
      const publicKey = await this.getPublicKey();
      const { payload } = await jwtVerify(token, publicKey, {
        issuer: this.getIssuer(),
        audience: this.getAudience(),
      });

      return this.extractUserId(payload);
    } catch {
      return null;
    }
  }

  private extractUserId(payload: JWTPayload): { userId: number } | null {
    if (!payload.sub) {
      return null;
    }

    const userId = Number(payload.sub);
    if (Number.isNaN(userId)) {
      return null;
    }

    return { userId };
  }

  async fetchGoogleUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
  }> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const data = await response.json() as { id: string; email: string; name: string };
    return {
      id: data.id,
      email: data.email,
      name: data.name,
    };
  }

  async exchangeGoogleAuthorizationCode(input: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.requireEnv('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID'),
      client_secret: this.requireEnv('GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'),
      code: input.code,
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
    });

    if (input.codeVerifier) {
      body.set('code_verifier', input.codeVerifier);
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google token exchange failed', { status: response.status, body: errorBody });
      throw new Error('Failed to exchange authorization code with Google');
    }

    return response.json<GoogleTokenResponse>();
  }

  getAllowedClientIds(): string[] {
    const raw = this.env.OIDC_ALLOWED_CLIENT_IDS;
    if (!raw || raw.trim().length === 0) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((value): value is string => typeof value === 'string' && value.length > 0);
      }
      console.warn('OIDC_ALLOWED_CLIENT_IDS must be a JSON array of strings');
      return [];
    } catch (error) {
      console.warn('Failed to parse OIDC_ALLOWED_CLIENT_IDS', error);
      return [];
    }
  }

  isClientAllowed(clientId: string): boolean {
    const allowed = this.getAllowedClientIds();
    if (allowed.length === 0) {
      return false;
    }
    return allowed.includes(clientId);
  }
}
