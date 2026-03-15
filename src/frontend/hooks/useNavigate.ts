import { useCallback } from 'react';
import { useNavigate as useRouterNavigate } from '@tanstack/react-router';

/**
 * Hook for programmatic navigation
 * Can be used as a drop-in replacement for React Router's useNavigate
 *
 * Note: Currently only supports string paths, not relative navigation numbers
 */
export function useNavigate() {
  const navigate = useRouterNavigate();

  return useCallback((to: string, options?: { replace?: boolean }) => {
    return navigate({
      to,
      replace: options?.replace,
    });
  }, [navigate]);
}

export default useNavigate;
