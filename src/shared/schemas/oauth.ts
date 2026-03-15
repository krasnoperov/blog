import { z } from 'zod';

export const ApiOAuthApprovalRequestQuerySchema = z.object({
  request: z.string().min(1),
});
export type ApiOAuthApprovalRequestQuery = z.infer<typeof ApiOAuthApprovalRequestQuerySchema>;

export const ApiOAuthAuthorizeQuerySchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  response_type: z.literal('code'),
  code_challenge: z.string().optional(),
  code_challenge_method: z.enum(['S256', 'plain']).optional(),
  state: z.string().optional(),
});
export type ApiOAuthAuthorizeQuery = z.infer<typeof ApiOAuthAuthorizeQuerySchema>;

export const ApiOAuthCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
export type ApiOAuthCallbackQuery = z.infer<typeof ApiOAuthCallbackQuerySchema>;

export const ApiOAuthTokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string().min(1),
  code_verifier: z.string().optional(),
  redirect_uri: z.string().url(),
  client_id: z.string().min(1),
  client_secret: z.string().optional(),
});
export type ApiOAuthTokenRequest = z.infer<typeof ApiOAuthTokenRequestSchema>;

export const ApiOAuthDiscoveryResponseSchema = z.object({
  issuer: z.string().url(),
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
  jwks_uri: z.string().url(),
  response_types_supported: z.array(z.string()),
  grant_types_supported: z.array(z.string()),
  code_challenge_methods_supported: z.array(z.string()),
  token_endpoint_auth_methods_supported: z.array(z.string()),
  scopes_supported: z.array(z.string()),
});
export type ApiOAuthDiscoveryResponse = z.infer<typeof ApiOAuthDiscoveryResponseSchema>;

export const ApiJwksKeySchema = z.object({
  kid: z.string(),
  alg: z.string(),
  use: z.string(),
}).passthrough();

export const ApiJwksResponseSchema = z.object({
  keys: z.array(ApiJwksKeySchema),
});
export type ApiJwksResponse = z.infer<typeof ApiJwksResponseSchema>;

export const ApiOAuthTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  id_token: z.string(),
  scope: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    name: z.string(),
    google_id: z.string().nullable(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  }).nullable(),
});
export type ApiOAuthTokenResponse = z.infer<typeof ApiOAuthTokenResponseSchema>;

export const ApiOAuthApprovalRequestResponseSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  scopes: z.array(z.string()),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
  }),
});
export type ApiOAuthApprovalRequestResponse = z.infer<typeof ApiOAuthApprovalRequestResponseSchema>;

export const ApiOAuthApprovalDecisionRequestSchema = z.object({
  requestId: z.string().min(1),
  approved: z.boolean(),
});
export type ApiOAuthApprovalDecisionRequest = z.infer<typeof ApiOAuthApprovalDecisionRequestSchema>;

export const ApiOAuthApprovalDecisionResponseSchema = z.object({
  redirectUrl: z.string().url(),
});
export type ApiOAuthApprovalDecisionResponse = z.infer<typeof ApiOAuthApprovalDecisionResponseSchema>;
