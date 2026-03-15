import type {
  ApiContractKey,
  ApiPathParams,
  ApiQuery,
  ApiRequestBody,
  ApiResponse,
} from '../../shared/api-contracts';
import { buildApiPath, apiRouteMeta } from '../../shared/api-routes';
import { ApiError, parseApiErrorPayload } from '../../shared/api-error';

function normalizeRequestBody(body: unknown): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  return typeof body === 'string' ? body : JSON.stringify(body);
}

export async function requestContract<K extends ApiContractKey>(
  key: K,
  pathParams?: ApiPathParams<K>,
  options: Omit<RequestInit, 'body' | 'method'> & {
    body?: ApiRequestBody<K> | string;
    query?: ApiQuery<K>;
  } = {},
): Promise<ApiResponse<K>> {
  const { query, body, ...rest } = options;
  const headers = new Headers(rest.headers);
  const requestBody = normalizeRequestBody(body);

  if (requestBody && !headers.has('content-type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(
    buildApiPath(key, pathParams as Record<string, string> | undefined, query as Record<string, unknown> | undefined),
    {
      ...rest,
      method: apiRouteMeta[key].method,
      credentials: rest.credentials ?? 'include',
      headers,
      body: requestBody,
    },
  );

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
