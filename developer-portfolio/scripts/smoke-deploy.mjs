// Smoke-tests a deployed (or locally assembled) site in a real browser.
// Usage: node scripts/smoke-deploy.mjs https://mahamaharati-lgtm.github.io/Portfolio
import { chromium } from '@playwright/test';

const site = (process.argv[2] ?? process.env.SITE_URL ?? '').replace(/\/$/, '');
if (!site) throw new Error('Pass the site URL, e.g. https://owner.github.io/Repo');
const studio = `${site}/workflow-studio`;
// The portfolio links to the production Studio URL; override when testing a local copy.
const expectedStudioUrl = process.env.EXPECTED_STUDIO_URL ?? `${studio}/`;

const browser = await chromium.launch();
const results = [];
async function check(name, fn) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await fn(page, context);
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    results.push(['PASS', name]);
  } catch (e) {
    results.push(['FAIL', name, e.message.split('\n')[0]]);
  } finally {
    await context.close();
  }
}
const expectTrue = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const visible = (page, locator) =>
  page.locator(locator).first().waitFor({ state: 'visible', timeout: 15000 });

await check('portfolio home renders with verified details', async (page) => {
  await page.goto(`${site}/`);
  const h1 = (await page.locator('h1').innerText()).replace(/\s+/g, ' ');
  expectTrue(h1.includes('Harshith C Shenoy'), `h1 was "${h1}"`);
  expectTrue((await page.title()).includes('Frontend Software Engineer'), 'title');
  await visible(page, 'text=Jul 2026 – Present');
});

await check('portfolio images and live demo link', async (page) => {
  await page.goto(`${site}/#work`);
  await page.waitForLoadState('networkidle');
  const ok = await page
    .locator('img.screenshot:visible')
    .evaluateAll((imgs) => imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0));
  expectTrue(ok, 'a visible screenshot failed to load');
  const href = await page
    .getByRole('link', { name: /Live demo/ })
    .first()
    .getAttribute('href');
  expectTrue(href === expectedStudioUrl, `live demo href was ${href}`);
});

await check('case study direct URL and client navigation', async (page) => {
  await page.goto(`${site}/projects/workflow-studio`);
  expectTrue(
    (await page.title()).includes('Workflow Studio case study'),
    'direct case study title',
  );
  expectTrue((await page.locator('h2').count()) === 17, 'expected 17 sections');
  await page.getByRole('link', { name: 'Back to home' }).first().click();
  await page.getByRole('link', { name: 'Read the case study' }).click();
  await visible(page, 'h1:has-text("Workflow Studio")');
});

await check('résumé PDF and DOCX download', async (page) => {
  await page.goto(`${site}/`);
  for (const ext of ['pdf', 'docx']) {
    const res = await page.request.get(`${site}/resume/Harshith-C-Shenoy-Resume.${ext}`);
    expectTrue(res.status() === 200, `${ext} status ${res.status()}`);
    const body = await res.body();
    expectTrue(
      ext === 'pdf'
        ? body.subarray(0, 5).toString() === '%PDF-'
        : body.subarray(0, 2).toString() === 'PK',
      `${ext} content`,
    );
  }
});

await check('theme persists across reloads', async (page) => {
  await page.goto(`${site}/`);
  await page.getByRole('banner').getByTitle('Dark theme').first().click();
  await page.reload();
  expectTrue(
    (await page.locator('html').getAttribute('data-theme')) === 'dark',
    'theme not persisted',
  );
});

await check('portfolio 404 page', async (page) => {
  await page.goto(`${site}/does-not-exist`);
  await visible(page, 'h1:has-text("Page not found")');
});

await check('Workflow Studio list loads', async (page) => {
  await page.goto(`${studio}/`);
  await visible(page, 'h1:has-text("Workflows")');
  expectTrue(
    (await page.getByRole('list', { name: 'Workflows' }).getByRole('listitem').count()) === 5,
    'expected 5 workflows',
  );
});

await check('Workflow Studio deep link and ₹85,000 simulation', async (page) => {
  await page.goto(`${studio}/workflows/wf-purchase`);
  await visible(page, 'h1:has-text("Purchase approval")');
  expectTrue(
    new URL(page.url()).pathname.endsWith('/workflow-studio/workflows/wf-purchase'),
    `url was ${page.url()}`,
  );
  await visible(page, '.react-flow__node');
  await page.getByRole('tab', { name: 'Simulate' }).click();
  await page.getByRole('button', { name: 'Start simulation' }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await visible(page, 'text=Evaluated condition → Yes');
  await page.getByRole('button', { name: 'Approve', exact: true }).click();
  await visible(page, 'text=Outcome: Approved');
});

await check('Workflow Studio save persists after reload', async (page) => {
  await page.goto(`${studio}/workflows/wf-leave`);
  await page.getByRole('tab', { name: 'List' }).click();
  await page.getByRole('button', { name: 'Edit HR review' }).click();
  await page.getByRole('tabpanel').getByLabel('Step name').fill('HR policy review');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await page.getByRole('tab', { name: 'List' }).click();
  await visible(page, 'h3:has-text("HR policy review")');
});

await browser.close();
for (const r of results) console.log(r.join('  '));
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} checks passed for ${site}`);
process.exit(failed ? 1 : 0);
