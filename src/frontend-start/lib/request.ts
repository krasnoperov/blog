import type {
  ApiContractKey,
  ApiPathParams,
  ApiQuery,
  ApiRequestBody,
  ApiResponse,
} from '../../shared/api-contracts';
import { buildApiPath, apiRouteMeta } from '../../shared/api-routes';
import { ApiError, parseApiErrorPayload } from '../../shared/api-error';
import type { StartRouterContext } from '../app-context';

export type StartLoaderContext =
  | Pick<StartRouterContext, 'serverContext'>
  | { serverContext?: StartRouterContext['serverContext'] };

function normalizeRequestBody(body: unknown): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  return typeof body === 'string' ? body : JSON.stringify(body);
}

async function getRequestMeta(context?: StartLoaderContext | null) {
  const serverMeta = context?.serverContext?.requestMeta;
  if (serverMeta) {
    return serverMeta;
  }

  if (typeof window !== 'undefined') {
    return {
      origin: window.location.origin,
    };
  }

  return null;
}

export async function requestContract<K extends ApiContractKey>(
  key: K,
  pathParams?: ApiPathParams<K>,
  options: Omit<RequestInit, 'body' | 'method'> & {
    body?: ApiRequestBody<K> | string;
    query?: ApiQuery<K>;
  } = {},
  context?: StartLoaderContext,
): Promise<ApiResponse<K>> {
  const { query, body, ...rest } = options;
  const headers = new Headers(rest.headers);
  const requestBody = normalizeRequestBody(body);
  const requestMeta = await getRequestMeta(context);

  if (requestBody && !headers.has('content-type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (requestMeta?.cookieHeader && !headers.has('cookie')) {
    headers.set('Cookie', requestMeta.cookieHeader);
  }
  if (requestMeta?.authorizationHeader && !headers.has('authorization')) {
    headers.set('Authorization', requestMeta.authorizationHeader);
  }
  if (requestMeta?.testSessionHeader && !headers.has('x-whitelabel-test-session')) {
    headers.set('x-whitelabel-test-session', requestMeta.testSessionHeader);
  }

  const path = buildApiPath(
    key,
    pathParams as Record<string, string> | undefined,
    query as Record<string, unknown> | undefined,
  );
  const url = requestMeta ? new URL(path, requestMeta.origin).toString() : path;
  const apiFetch = context?.serverContext?.apiFetch;
  const request = new Request(url, {
    ...rest,
    method: apiRouteMeta[key].method,
    headers,
    body: requestBody,
  });
  const response = apiFetch
    ? await apiFetch(request)
    : await fetch(request, {
        credentials: rest.credentials ?? 'include',
      });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    const parsed = parseApiErrorPayload(payload, response.status);
    throw new ApiError(parsed.message, response.status, {
      code: parsed.code,
      retryable: parsed.retryable,
    });
  }

  return response.json() as Promise<ApiResponse<K>>;
}

export async function shouldSkipStartSsrPrefetch(
  hasAuthenticatedUser: boolean,
  context?: StartLoaderContext,
): Promise<boolean> {
  const requestMeta = await getRequestMeta(context);
  if (!hasAuthenticatedUser || !requestMeta) {
    return false;
  }

  return Boolean(requestMeta.testSessionHeader);
}
