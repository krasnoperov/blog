import { useRouteStore } from '../stores/routeStore';

/**
 * Hook to access route params
 * Replacement for React Router's useParams
 */
export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const params = useRouteStore((state) => state.params);

  // For the speak page, we need to map episodeId from params
  // The route store sets episodeId for both /listen/:id and /speak/:id routes
  if (params.episodeId) {
    return {
      ...params,
      id: params.episodeId, // Map episodeId to id for compatibility
    } as unknown as T;
  }

  return params as unknown as T;
}

export default useParams;