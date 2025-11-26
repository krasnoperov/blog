import type { KVNamespace } from '@cloudflare/workers-types';

type CodeChallengeMethod = 'S256' | 'plain' | null;

export type StoredAuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string | null;
  codeChallengeMethod: CodeChallengeMethod;
  originalState: string | null;
  userId?: number; // Added for Phase 2 - user binding after authentication
};

export type StoredAuthorizationCode = {
  userId: number;
  clientId: string;
  redirectUri: string;
  codeChallenge: string | null;
  codeChallengeMethod: CodeChallengeMethod;
};

export type StoredRefreshToken = {
  userId: number;
  clientId: string;
};

// KV key prefixes
const AUTH_REQUEST_PREFIX = 'auth_request:';
const AUTH_CODE_PREFIX = 'auth_code:';
const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const GOOGLE_REFRESH_TOKEN_PREFIX = 'google_refresh:';

// TTL values in seconds (KV uses seconds, not milliseconds)
const AUTH_REQUEST_TTL = 5 * 60; // 5 minutes
const AUTH_CODE_TTL = 5 * 60; // 5 minutes
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 60; // 60 days
const GOOGLE_REFRESH_TOKEN_TTL = 60 * 60 * 24 * 90; // 90 days

// ==========================================
// Authorization Request Storage
// ==========================================

export async function storeAuthorizationRequest(
  kv: KVNamespace,
  requestId: string,
  data: StoredAuthorizationRequest
): Promise<void> {
  await kv.put(
    `${AUTH_REQUEST_PREFIX}${requestId}`,
    JSON.stringify(data),
    { expirationTtl: AUTH_REQUEST_TTL }
  );
}

export async function getAuthorizationRequest(
  kv: KVNamespace,
  requestId: string
): Promise<StoredAuthorizationRequest | null> {
  const key = `${AUTH_REQUEST_PREFIX}${requestId}`;
  const data = await kv.get(key);
  if (!data) return null;
  return JSON.parse(data) as StoredAuthorizationRequest;
}

export async function consumeAuthorizationRequest(
  kv: KVNamespace,
  requestId: string
): Promise<StoredAuthorizationRequest | null> {
  const key = `${AUTH_REQUEST_PREFIX}${requestId}`;
  const data = await kv.get(key);
  if (!data) return null;

  // Delete after retrieving (consume)
  await kv.delete(key);
  return JSON.parse(data) as StoredAuthorizationRequest;
}

// ==========================================
// Authorization Code Storage
// ==========================================

export async function storeAuthorizationCode(
  kv: KVNamespace,
  code: string,
  data: StoredAuthorizationCode
): Promise<void> {
  await kv.put(
    `${AUTH_CODE_PREFIX}${code}`,
    JSON.stringify(data),
    { expirationTtl: AUTH_CODE_TTL }
  );
}

export async function consumeAuthorizationCode(
  kv: KVNamespace,
  code: string
): Promise<StoredAuthorizationCode | null> {
  const key = `${AUTH_CODE_PREFIX}${code}`;
  const data = await kv.get(key);
  if (!data) return null;

  // Delete after retrieving (consume)
  await kv.delete(key);
  return JSON.parse(data) as StoredAuthorizationCode;
}

// ==========================================
// Refresh Token Storage (Client Refresh Tokens)
// ==========================================

export async function storeClientRefreshToken(
  kv: KVNamespace,
  refreshToken: string,
  data: StoredRefreshToken
): Promise<void> {
  await kv.put(
    `${REFRESH_TOKEN_PREFIX}${refreshToken}`,
    JSON.stringify(data),
    { expirationTtl: REFRESH_TOKEN_TTL }
  );
}

export async function getClientRefreshToken(
  kv: KVNamespace,
  refreshToken: string
): Promise<StoredRefreshToken | null> {
  const key = `${REFRESH_TOKEN_PREFIX}${refreshToken}`;
  const data = await kv.get(key);
  if (!data) return null;
  return JSON.parse(data) as StoredRefreshToken;
}

export async function revokeClientRefreshToken(
  kv: KVNamespace,
  refreshToken: string
): Promise<void> {
  await kv.delete(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
}

// ==========================================
// Google Refresh Token Storage
// ==========================================

export async function storeGoogleRefreshToken(
  kv: KVNamespace,
  userId: number,
  googleRefreshToken: string
): Promise<void> {
  await kv.put(
    `${GOOGLE_REFRESH_TOKEN_PREFIX}${userId}`,
    googleRefreshToken,
    { expirationTtl: GOOGLE_REFRESH_TOKEN_TTL }
  );
}

export async function getGoogleRefreshToken(
  kv: KVNamespace,
  userId: number
): Promise<string | null> {
  return await kv.get(`${GOOGLE_REFRESH_TOKEN_PREFIX}${userId}`);
}

export async function revokeGoogleRefreshToken(
  kv: KVNamespace,
  userId: number
): Promise<void> {
  await kv.delete(`${GOOGLE_REFRESH_TOKEN_PREFIX}${userId}`);
}
