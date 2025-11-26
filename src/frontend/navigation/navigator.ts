// Simple navigation handler using modern Navigation API with History API fallback

type NavigationListener = (url: URL) => void;

const listeners = new Set<NavigationListener>();
let initialized = false;

// Notify all listeners of URL change
const notifyListeners = (url: URL) => {
  listeners.forEach(listener => listener(url));
};

// Initialize navigation handling
export const initNavigator = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Try to use Navigation API first (Chrome 102+)
  if ('navigation' in window && typeof window.navigation?.addEventListener === 'function') {
    // Modern Navigation API
    window.navigation.addEventListener('navigate', (event: NavigateEvent) => {
      // Skip external navigations, downloads, and reloads
      if (!event.canIntercept || event.hashChange || event.downloadRequest) {
        return;
      }

      const url = new URL(event.destination.url);

      // Only handle same-origin navigations
      if (url.origin !== window.location.origin) {
        return;
      }

      // Intercept the navigation to handle it client-side
      event.intercept({
        handler: async () => {
          notifyListeners(url);
        }
      });
    });
  } else {
    // Fallback to History API
    window.addEventListener('popstate', () => {
      notifyListeners(new URL(window.location.href));
    });

    // Intercept pushState/replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      notifyListeners(new URL(window.location.href));
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      notifyListeners(new URL(window.location.href));
    };
  }
};

// Subscribe to navigation events
export const subscribeToNavigation = (listener: NavigationListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Navigate programmatically
export const navigate = (href: string, options?: { replace?: boolean }) => {
  const url = new URL(href, window.location.origin);

  if ('navigation' in window && typeof window.navigation?.navigate === 'function') {
    // Use Navigation API
    window.navigation.navigate(url.href, {
      history: options?.replace ? 'replace' : 'auto'
    });
  } else {
    // Use History API
    if (options?.replace) {
      window.history.replaceState({}, '', url.href);
    } else {
      window.history.pushState({}, '', url.href);
    }
    notifyListeners(url);
  }
};

// Type augmentation for Navigation API
declare global {
  interface Window {
    navigation?: {
      addEventListener(type: 'navigate', listener: (event: NavigateEvent) => void): void;
      navigate(url: string, options?: { history?: 'auto' | 'replace' | 'push' }): void;
    };
  }

  interface NavigateEvent extends Event {
    destination: {
      url: string;
    };
    canIntercept: boolean;
    hashChange: boolean;
    downloadRequest?: string;
    intercept(options: { handler: () => Promise<void> }): void;
  }
}