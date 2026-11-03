import { expect, test } from '@playwright/test';
import {
  expectNoAxeViolations,
  expectNoHorizontalScroll,
  openSidePanel,
  setTheme,
  THEMES,
} from './helpers';

for (const theme of THEMES) {
  test.describe(`${theme} theme accessibility`, () => {
    test.beforeEach(async ({ page }) => setTheme(page, theme));

    test('workflow list, dialogs and about page have no axe violations', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expectNoAxeViolations(page, `list (${theme})`);
      await page.getByRole('button', { name: 'New workflow' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoAxeViolations(page, `create dialog (${theme})`);
      await page.keyboard.press('Escape');
      await page.goto('/about');
      await expectNoAxeViolations(page, `about (${theme})`);
    });

    test('editor canvas, list, properties, issues and simulation have no axe violations', async ({
      page,
    }) => {
      await page.goto('/workflows/wf-change');
      await expect(page.locator('.react-flow__node').first()).toBeVisible();
      await expectNoAxeViolations(page, `canvas + issues (${theme})`);
      await page.getByRole('button', { name: 'Show step' }).click();
      await expectNoAxeViolations(page, `properties with errors (${theme})`);
      await page.getByRole('tab', { name: 'List' }).click();
      await expectNoAxeViolations(page, `list view (${theme})`);

      await page.goto('/workflows/wf-purchase');
      await openSidePanel(page, 'Simulate');
      await page.getByRole('button', { name: 'Start simulation' }).click();
      await page.getByRole('button', { name: 'Approve', exact: true }).click();
      await expectNoAxeViolations(page, `simulation in progress (${theme})`);
      await page.getByRole('button', { name: 'Approve', exact: true }).click();
      await expect(page.getByText('Outcome: Approved', { exact: true })).toBeVisible();
      await expectNoAxeViolations(page, `simulation complete (${theme})`);
    });
  });
}

test.describe('theme behaviour', () => {
  test('persists the chosen theme across reloads with no flash', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.getByTitle('Dark theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // The inline head script must set the theme before the app bundle runs.
    await page.route('**/assets/*.js', (route) => route.abort());
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(14, 17, 21)');
  });

  test('System follows the operating-system setting live', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByTitle('Light theme').click();
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('reduced motion disables transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const duration = await page
      .getByRole('button', { name: 'New workflow' })
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every((d: string) => parseFloat(d) <= 0.0001)).toBe(true);
  });
});

test.describe('keyboard', () => {
  test('skip link, tab order and dialog focus management', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();

    const newButton = page.getByRole('button', { name: 'New workflow' });
    await newButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Workflow name')).toBeFocused();
    // Focus stays inside the dialog.
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    await expect(newButton).toBeFocused();
  });

  test('a workflow can be edited and simulated with the keyboard only', async ({ page }) => {
    await page.goto('/workflows/wf-leave');
    await page.getByRole('tab', { name: 'Canvas' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('button', { name: 'Edit HR review' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab', { name: 'Properties' })).toBeFocused();
    // Tab order: Properties tab → panel → Delete step → Step name
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Step name')).toBeFocused();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('HR policy review');
    await expect(page.getByRole('heading', { name: 'HR policy review' }).first()).toBeVisible();

    await page.keyboard.press('ControlOrMeta+s');
    await expect(page.getByText('All changes saved')).toBeVisible();

    await page.getByRole('tab', { name: 'Properties' }).focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Simulate' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('button', { name: 'Start simulation' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Waiting for Line Manager')).toBeVisible();
  });
});

test.describe('responsive layout', () => {
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await expectNoHorizontalScroll(page);
      await page.goto('/workflows/wf-purchase');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Purchase approval' }),
      ).toBeVisible();
      await expectNoHorizontalScroll(page);
      await page.goto('/about');
      await expectNoHorizontalScroll(page);
    });
  }

  test('phones get the structured List editor by default', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/workflows/wf-purchase');
    await expect(page.getByRole('tab', { name: 'List' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('list', { name: 'Workflow steps in order' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit Finance approval' }).click();
    await expect(page.getByRole('tabpanel').getByLabel('Approver role')).toHaveValue(
      'Finance Approver',
    );
    await expectNoAxeViolations(page, 'mobile list editor');
  });

  test('content reflows at 200% text zoom equivalent (640px)', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto('/');
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    await expectNoHorizontalScroll(page);
  });
});
