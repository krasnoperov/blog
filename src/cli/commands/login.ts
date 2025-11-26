import process from 'node:process';
import type { ParsedArgs, StoredConfig } from '../lib/types';
import {
  DEFAULT_CLIENT_ID,
  DEFAULT_REDIRECT_PORT,
  AUTH_SCOPES,
  fetchOidcConfiguration,
  exchangeCodeForToken,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  waitForAuthorizationCode,
  openBrowser,
} from '../lib/auth';
import { DEFAULT_ENVIRONMENT, resolveBaseUrl, saveConfig, getConfigPath } from '../lib/config';

export async function handleLogin(parsed: ParsedArgs) {
  // Handle --local flag
  const isLocal = parsed.options.local === 'true';
  const env = isLocal ? 'local' : (parsed.options.env ?? DEFAULT_ENVIRONMENT);
  const baseUrl = resolveBaseUrl(env);
  const clientId = DEFAULT_CLIENT_ID;
  const redirectPort = DEFAULT_REDIRECT_PORT;
  const insecure = isLocal;

  if (insecure) {
    console.log('⚠️  SSL certificate verification disabled (local dev mode)');
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  console.log(`Starting login for environment "${env}" using ${baseUrl}`);

  const oidcConfig = await fetchOidcConfiguration(baseUrl, insecure);
  const authorizationEndpoint = oidcConfig.authorization_endpoint;

  if (typeof authorizationEndpoint !== 'string' || authorizationEndpoint.length === 0) {
    throw new Error('OIDC configuration missing authorization_endpoint');
  }

  const state = generateState();
  const redirectUri = `http://127.0.0.1:${redirectPort}/callback`;
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const authUrl = new URL(authorizationEndpoint);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', AUTH_SCOPES);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');

  console.log('Opening browser for Google authentication...');
  try {
    await openBrowser(authUrl.toString());
  } catch (error) {
    console.warn('Unable to open browser automatically. Please copy the URL below into your browser:');
    console.log(authUrl.toString());
  }

  const { code } = await waitForAuthorizationCode(redirectPort, state);

  console.log('Received authorization code. Exchanging for access token...');
  const tokenResponse = await exchangeCodeForToken({
    baseUrl,
    code,
    codeVerifier,
    redirectUri,
    clientId,
  });

  const storedConfig: StoredConfig = {
    environment: env,
    baseUrl,
    clientId,
    token: {
      accessToken: tokenResponse.access_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      issuedAt: Date.now(),
      scope: tokenResponse.scope,
    },
    user: tokenResponse.user ?? null,
    updatedAt: new Date().toISOString(),
  };

  await saveConfig(storedConfig);
  console.log(`Login successful. Credentials saved to ${await getConfigPath()}`);
}
