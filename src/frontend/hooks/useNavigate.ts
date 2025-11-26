import { useCallback } from 'react';
import { navigate } from '../navigation/navigator';

/**
 * Hook for programmatic navigation
 * Can be used as a drop-in replacement for React Router's useNavigate
 *
 * Note: Currently only supports string paths, not relative navigation numbers
 */
export function useNavigate() {
  return useCallback((to: string, options?: { replace?: boolean }) => {
    navigate(to, options);
  }, []);
}

export default useNavigate;