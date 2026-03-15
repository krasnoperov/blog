import {
  ApiHealthResponseSchema,
  ApiHelloResponseSchema,
} from '../schemas/health';
import { defineContract } from './api-contracts-common';

export const healthApiContracts = {
  healthCheck: defineContract({
    method: 'GET',
    path: '/api/health',
    pathParams: [],
    response: ApiHealthResponseSchema,
  }),
  hello: defineContract({
    method: 'GET',
    path: '/api/hello',
    pathParams: [],
    response: ApiHelloResponseSchema,
  }),
} as const;
