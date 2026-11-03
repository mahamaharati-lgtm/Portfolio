import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { routerBasename } from './lib/url';
import './index.css';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Pages are pre-rendered at build time; hydrate them. Fall back to a client render in dev.
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
