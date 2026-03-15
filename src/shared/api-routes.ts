import { apiContracts, type ApiContractKey, type ApiContractPath } from './api-contracts';

export const apiRouteMeta = Object.fromEntries(
  Object.entries(apiContracts).map(([key, contract]) => [
    key,
    {
      method: contract.method,
      path: contract.path,
    },
  ]),
) as {
  [K in ApiContractKey]: {
    method: typeof apiContracts[K]['method'];
    path: typeof apiContracts[K]['path'];
  };
};

export function buildApiPath(
  keyOrPath: ApiContractKey | ApiContractPath,
  params: Record<string, string> = {},
  query?: Record<string, unknown>,
): string {
  const meta =
    apiRouteMeta[keyOrPath as ApiContractKey] ??
    Object.values(apiRouteMeta).find((entry) => entry.path === keyOrPath);

  if (!meta) {
    throw new Error(`Unknown API route ${keyOrPath}`);
  }

  let path = meta.path as string;
  for (const [param, value] of Object.entries(params)) {
    path = path.replaceAll(`:${param}`, encodeURIComponent(String(value)));
  }

  const unresolved = path.match(/:[a-zA-Z0-9_]+/g)?.[0];
  if (unresolved) {
    throw new Error(`Missing path param ${unresolved.replace(':', '')} for route ${keyOrPath}`);
  }

  if (!query) {
    return path;
  }

  const queryValues = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    queryValues.set(key, String(value));
  }

  const qs = queryValues.toString();
  return qs ? `${path}?${qs}` : path;
}
