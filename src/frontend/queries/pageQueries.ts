import { queryOptions } from '@tanstack/react-query';
import { requestContract } from '../lib/api';

export function authSessionQueryOptions() {
  return queryOptions({
    queryKey: ['authSession'],
    queryFn: () => requestContract('authSession'),
  });
}

export function userProfileQueryOptions() {
  return queryOptions({
    queryKey: ['userProfile'],
    queryFn: () => requestContract('userProfileGet'),
  });
}

export function oauthApprovalRequestQueryOptions(requestId: string) {
  return queryOptions({
    queryKey: ['oauthApprovalRequest', requestId],
    queryFn: () => requestContract('oauthApprovalRequest', undefined, {
      query: { request: requestId },
    }),
  });
}
