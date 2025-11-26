import { useMemo } from 'react';
import { useRouteStore } from '../stores/routeStore';

/**
 * Hook to access URL search params
 * Replacement for React Router's useSearchParams
 */
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const search = useRouteStore((state) => state.search);

  const searchParams = useMemo(
    () => new URLSearchParams(search),
    [search]
  );

  // For now, setSearchParams updates the URL directly
  // In the future, this could be enhanced to work with the navigation system
  const setSearchParams = (params: URLSearchParams) => {
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.pushState({}, '', newUrl);
    useRouteStore.getState().setLocation(window.location.pathname, newSearch ? `?${newSearch}` : '');
  };

  return [searchParams, setSearchParams];
}

export default useSearchParams;