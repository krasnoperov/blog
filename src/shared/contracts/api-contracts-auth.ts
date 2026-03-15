import {
  ApiAuthGoogleRequestSchema,
  ApiAuthGoogleResponseSchema,
  ApiAuthLogoutResponseSchema,
  ApiAuthSessionResponseSchema,
} from '../schemas/auth';
import { defineContract } from './api-contracts-common';

export const authApiContracts = {
  authSession: defineContract({
    method: 'GET',
    path: '/api/auth/session',
    pathParams: [],
    response: ApiAuthSessionResponseSchema,
  }),
  authGoogle: defineContract({
    method: 'POST',
    path: '/api/auth/google',
    pathParams: [],
    body: ApiAuthGoogleRequestSchema,
    response: ApiAuthGoogleResponseSchema,
  }),
  authLogout: defineContract({
    method: 'POST',
    path: '/api/auth/logout',
    pathParams: [],
    response: ApiAuthLogoutResponseSchema,
  }),
} as const;
