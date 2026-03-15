import { z } from 'zod';
import {
  ApiJwksResponseSchema,
  ApiOAuthApprovalDecisionRequestSchema,
  ApiOAuthApprovalDecisionResponseSchema,
  ApiOAuthApprovalRequestQuerySchema,
  ApiOAuthApprovalRequestResponseSchema,
  ApiOAuthAuthorizeQuerySchema,
  ApiOAuthCallbackQuerySchema,
  ApiOAuthDiscoveryResponseSchema,
  ApiOAuthTokenRequestSchema,
  ApiOAuthTokenResponseSchema,
} from '../schemas/oauth';
import { defineContract } from './api-contracts-common';

export const oauthApiContracts = {
  oauthDiscovery: defineContract({
    method: 'GET',
    path: '/.well-known/openid-configuration',
    pathParams: [],
    response: ApiOAuthDiscoveryResponseSchema,
  }),
  oauthJwks: defineContract({
    method: 'GET',
    path: '/.well-known/jwks.json',
    pathParams: [],
    response: ApiJwksResponseSchema,
  }),
  oauthAuthorize: defineContract({
    method: 'GET',
    path: '/api/oauth/authorize',
    pathParams: [],
    query: ApiOAuthAuthorizeQuerySchema,
    response: z.unknown(),
  }),
  oauthCallback: defineContract({
    method: 'GET',
    path: '/api/oauth/callback',
    pathParams: [],
    query: ApiOAuthCallbackQuerySchema,
    response: z.unknown(),
  }),
  oauthToken: defineContract({
    method: 'POST',
    path: '/api/oauth/token',
    pathParams: [],
    body: ApiOAuthTokenRequestSchema,
    response: ApiOAuthTokenResponseSchema,
  }),
  oauthApprovalRequest: defineContract({
    method: 'GET',
    path: '/api/oauth/authorize/request',
    pathParams: [],
    query: ApiOAuthApprovalRequestQuerySchema,
    response: ApiOAuthApprovalRequestResponseSchema,
  }),
  oauthApprovalDecision: defineContract({
    method: 'POST',
    path: '/api/oauth/authorize/decision',
    pathParams: [],
    body: ApiOAuthApprovalDecisionRequestSchema,
    response: ApiOAuthApprovalDecisionResponseSchema,
  }),
} as const;
