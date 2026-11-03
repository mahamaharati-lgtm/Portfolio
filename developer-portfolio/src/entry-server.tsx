import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App } from './App';
import { routerBasename } from './lib/url';

export { PAGE_META } from './content/meta';

/** `url` is the route path without the base, e.g. "/projects/workflow-studio". */
export function render(url: string): string {
  const location = routerBasename === '/' ? url : routerBasename + url;
  return renderToString(
    <StrictMode>
      <StaticRouter location={location} basename={routerBasename}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
}
