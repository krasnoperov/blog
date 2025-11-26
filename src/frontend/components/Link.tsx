import React from 'react';
import { navigate } from '../navigation/navigator';

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
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow modifier keys to work normally (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    // Allow custom onClick handlers
    if (onClick) {
      onClick(e);
    }

    // If default was prevented by custom handler, don't navigate
    if (e.defaultPrevented) {
      return;
    }

    // Prevent default link behavior and use our navigation
    e.preventDefault();
    navigate(to, { replace });
  };

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

// Export as default for easier migration from React Router
export default Link;