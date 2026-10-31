/** Prefixes a site path with the deploy base, e.g. '/playground' → '/lwon-studio/playground'. */
export function url(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path;
}

/** The current page's path without the deploy base or `.html`, e.g. '/playground'. */
export function pagePath(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const p = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return p.replace(/\.html$/, '').replace(/\/$/, '') || '/';
}
