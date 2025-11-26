import { Hono } from 'hono';
import type { AppContext } from './types';
import { AuthService } from '../features/auth/auth-service';
import { AuthHandler } from '../features/auth/auth-handler';

const oauthRoutes = new Hono<AppContext>();

oauthRoutes.get('/.well-known/openid-configuration', (c) => {
  const container = c.get('container');
  const authService = container.get(AuthService);
  const issuer = authService.getIssuerUrl();

  const base = issuer.replace(/\/$/, '');

  return c.json({
    issuer,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    jwks_uri: `${base}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['openid', 'profile', 'email'],
  });
});

oauthRoutes.get('/.well-known/jwks.json', async (c) => {
  const container = c.get('container');
  const authService = container.get(AuthService);
  const jwks = await authService.getJwks();
  return c.json(jwks);
});

oauthRoutes.get('/api/oauth/authorize', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.authorize(c);
});

oauthRoutes.get('/api/oauth/callback', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.oauthCallback(c);
});

oauthRoutes.post('/api/oauth/token', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.oauthToken(c);
});

oauthRoutes.get('/api/oauth/authorize/request', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.getApprovalRequest(c);
});

oauthRoutes.post('/api/oauth/authorize/decision', async (c) => {
  const container = c.get('container');
  const authHandler = container.get(AuthHandler);
  return authHandler.handleApprovalDecision(c);
});

export { oauthRoutes };