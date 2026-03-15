import React from 'react';
import { Link as RouterLink } from '@tanstack/react-router';

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  replace?: boolean;
  children: React.ReactNode;
}

/**
 * Link component that uses our navigation system
 * Can be used as a drop-in replacement for React Router's Link
 */
export function Link({ to, replace = false, children, onClick, ...props }: LinkProps) {
  return (
    <RouterLink to={to} replace={replace} onClick={onClick} {...props}>
      {children}
    </RouterLink>
  );
}

// Export as default for easier migration from React Router
export default Link;
