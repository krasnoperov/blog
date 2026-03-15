import {
  ApiUserProfileSchema,
  ApiUserProfileUpdateRequestSchema,
  ApiUserProfileUpdateResponseSchema,
} from '../schemas/user';
import { defineContract } from './api-contracts-common';

export const userApiContracts = {
  userProfileGet: defineContract({
    method: 'GET',
    path: '/api/user/profile',
    pathParams: [],
    response: ApiUserProfileSchema,
  }),
  userProfileUpdate: defineContract({
    method: 'PATCH',
    path: '/api/user/profile',
    pathParams: [],
    body: ApiUserProfileUpdateRequestSchema,
    response: ApiUserProfileUpdateResponseSchema,
  }),
} as const;
