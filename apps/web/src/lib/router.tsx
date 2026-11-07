import { useEffect, useState } from 'react';

/** Hash routes: #page or #page--param (as in the original app, so it works as a static file). */
export type Route = { page: string; param: string | null };

export function parseHash(hash: string): Route {
  const raw = decodeURIComponent(hash.replace(/^#\/?/, ''));
  if (!raw) return { page: 'home', param: null };
  const i = raw.indexOf('--');
  if (i < 0) return { page: raw, param: null };
  return { page: raw.slice(0, i), param: raw.slice(i + 2) || null };
}

export const href = (page: string, param?: string | null) => `#${page}${param ? `--${param}` : ''}`;

export function navigate(page: string, param?: string | null) {
  window.location.hash = href(page, param);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
