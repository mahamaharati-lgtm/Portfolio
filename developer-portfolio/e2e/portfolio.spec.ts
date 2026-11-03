import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { expectNoAxeViolations, expectNoHorizontalScroll, setTheme, THEMES } from './helpers';

test.describe('content and navigation', () => {
  test('home page shows verified details and sections in order', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Harshith C Shenoy\.?$/);
    await expect(page).toHaveTitle('Harshith C Shenoy — Frontend Software Engineer');
    const headings = await page.getByRole('heading', { level: 2 }).allTextContents();
    expect(headings).toEqual([
      'Featured project',
      'Frontend engineering with a UI/UX focus',
      'Experience',
      'Skills',
      'Let’s talk',
    ]);
    const roles = page.locator('#experience ~ * li, section[aria-labelledby="experience"] ol > li');
    await expect(roles).toHaveCount(3);
    await expect(roles.nth(0)).toContainText('Pivot Path');
    await expect(roles.nth(0)).toContainText('Jul 2026 – Present');
    await expect(roles.nth(1)).toContainText('Jan 2026 – Jun 2026');
    await expect(roles.nth(2)).toContainText('Frontend Developer Intern');
    await expect(roles.nth(2)).toContainText('Jul 2025 – Dec 2025');
    await expect(page.getByText('9342036381')).toHaveCount(0);
    await expect(page.locator('a[href*="linkedin"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('content is pre-rendered (visible without JavaScript)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/projects/workflow-studio');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Workflow Studio');
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(17);
    await context.close();
  });

  test('in-page navigation, case study route and back', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: 'Skills' })
      .click();
    await expect(page).toHaveURL(/#skills$/);
    await expect(page.getByRole('heading', { name: 'Skills', level: 2 })).toBeInViewport();

    await page.getByRole('link', { name: 'Read the case study' }).click();
    await expect(page).toHaveURL(/\/projects\/workflow-studio$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page).toHaveTitle(/Workflow Studio case study/);
    await page
      .getByRole('navigation', { name: 'Case study sections' })
      .getByRole('link', { name: /Accessibility decisions/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'Accessibility decisions' })).toBeInViewport();
    await page.getByRole('link', { name: 'Back to home' }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('unknown routes show the 404 page', async ({ page }) => {
    await page.goto('/nope');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  test('project and profile links point to the verified destinations', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('a[href^="http"]')
      .evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLAnchorElement).href))]);
    expect(hrefs.sort()).toEqual([
      'https://github.com/mahamaharati-lgtm',
      'https://github.com/mahamaharati-lgtm/portfolio/tree/main/developer-portfolio',
      'https://github.com/mahamaharati-lgtm/portfolio/tree/main/workflow-studio',
    ]);
    await expect(page.getByRole('link', { name: 'Send an email' })).toHaveAttribute(
      'href',
      'mailto:harshithcshenoy@gmail.com',
    );
  });

  test('résumé downloads are real, text-based files', async ({ page }, testInfo) => {
    await page.goto('/');
    const [pdf] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: /Download résumé/ }).click(),
    ]);
    expect(pdf.suggestedFilename()).toBe('Harshith-C-Shenoy-Resume.pdf');
    const pdfPath = testInfo.outputPath('resume.pdf');
    await pdf.saveAs(pdfPath);
    expect(fs.readFileSync(pdfPath).subarray(0, 5).toString()).toBe('%PDF-');
    try {
      const text = execFileSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8' });
      expect(text).toContain('HARSHITH C SHENOY');
      expect(text).toContain('Workflow Studio');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; // pdftotext not installed: skip text check
    }
    const [docx] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: /Word \(DOCX\)/ }).click(),
    ]);
    expect(docx.suggestedFilename()).toBe('Harshith-C-Shenoy-Resume.docx');
  });
});

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('menu opens, closes with Escape, and navigates', async ({ page }) => {
    await page.goto('/');
    const button = page.getByRole('button', { name: 'Menu' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByRole('navigation', { name: 'Mobile' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    await menu.getByRole('link', { name: 'Contact' }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#contact$/);
  });

  test('theme can be changed from the mobile menu', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Mobile' }).getByText('Dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('themes', () => {
  test('persists across reloads and pages, without a flash', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.getByRole('banner').getByTitle('Dark theme').first().click();
    await page.route('**/assets/*.js', (r) => r.abort());
    await page.goto('/projects/workflow-studio');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      'rgb(17, 18, 20)',
    );
  });

  test('System follows OS changes live and shows matching screenshots', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('.theme-img--dark').first()).toBeVisible();
    await expect(page.locator('.theme-img--light').first()).toBeHidden();
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('.theme-img--light').first()).toBeVisible();
  });
});

for (const theme of THEMES) {
  test(`no axe violations in ${theme} theme`, async ({ page }) => {
    await setTheme(page, theme);
    for (const url of ['/', '/projects/workflow-studio', '/nope']) {
      await page.goto(url);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expectNoAxeViolations(page, `${url} (${theme})`);
    }
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).click();
    await expectNoAxeViolations(page, `mobile menu (${theme})`);
  });
}

test.describe('keyboard', () => {
  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('copy email reports success', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/#contact');
    await page.getByRole('button', { name: 'Copy email' }).click();
    await expect(page.getByRole('button', { name: 'Email copied' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'harshithcshenoy@gmail.com',
    );
  });
});

test.describe('responsive', () => {
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const url of ['/', '/projects/workflow-studio']) {
        await page.goto(url);
        await expectNoHorizontalScroll(page);
      }
    });
  }

  test('reflows with 200% text size', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    for (const url of ['/', '/projects/workflow-studio']) {
      await page.goto(url);
      await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
      await expectNoHorizontalScroll(page);
    }
  });
});
