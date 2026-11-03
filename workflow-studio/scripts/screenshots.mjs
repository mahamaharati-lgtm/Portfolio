// Captures documentation screenshots from a running preview server.
// Usage: npm run build && npx vite preview --port 4173 & npm run screenshots
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = process.env.OUT_DIR ?? 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function page(theme, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  await context.addInitScript((t) => localStorage.setItem('ws-theme', t), theme);
  return context.newPage();
}

async function shot(p, name) {
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log('saved', name);
}

for (const theme of ['light', 'dark']) {
  let p = await page(theme);
  await p.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await shot(p, `list-${theme}`);

  await p.goto(`${BASE}/workflows/wf-purchase`, { waitUntil: 'networkidle' });
  await p.locator('.react-flow__node').filter({ hasText: 'Amount above' }).click();
  await shot(p, `editor-${theme}`);

  await p.getByRole('tab', { name: 'Simulate' }).click();
  await p.getByRole('button', { name: 'Start simulation' }).click();
  await p.getByLabel('Comment').fill('Fits the quarterly budget');
  await p.getByRole('button', { name: 'Approve', exact: true }).click();
  await shot(p, `simulation-${theme}`);

  await p.goto(`${BASE}/workflows/wf-change`, { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'Show step' }).click();
  await p.getByRole('tab', { name: /Issues/ }).click();
  await shot(p, `validation-${theme}`);
  await p.context().close();

  p = await page(theme, { width: 390, height: 844 });
  await p.goto(`${BASE}/workflows/wf-purchase`, { waitUntil: 'networkidle' });
  await shot(p, `mobile-${theme}`);
  await p.context().close();
}

await browser.close();
