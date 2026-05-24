import { useEffect, useState, useCallback } from 'react';

/**
 * Minimal hash-based router. Returns the current `window.location.hash` and a
 * `navigate(to)` helper. Subscribes to `hashchange` so all components stay in
 * sync when the URL changes.
 *
 * Routes used by the app:
 *   "" / "#" / "#/"   → main dashboard
 *   "#/live"          → dedicated live timing page
 *   "#drivers" etc.   → main dashboard + native anchor scroll
 */
export function useHashRoute() {
  const [hash, setHash] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.hash : '',
  );

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    // Setting hash triggers `hashchange`; if the target equals current hash,
    // force a state update so consumers still see the navigation.
    if (window.location.hash === to) {
      setHash(to);
    } else {
      window.location.hash = to;
    }
  }, []);

  return { hash, navigate };
}

/** True if the current hash is the dedicated live route. */
export function isLiveRoute(hash: string): boolean {
  return hash === '#/live' || hash === '#live';
}
