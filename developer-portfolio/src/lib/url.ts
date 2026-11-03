/** Prefixes a site-relative path with the deploy base ('/' locally, '/Portfolio/' on GitHub Pages). */
export function withBase(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}

export const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
