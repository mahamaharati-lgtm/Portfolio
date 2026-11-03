import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const THEMES = ['light', 'dark'] as const;

export async function setTheme(page: Page, theme: 'light' | 'dark' | 'system') {
  await page.addInitScript((t) => localStorage.setItem('ws-theme', t), theme);
}

/** Runs axe with WCAG 2.0/2.1 A and AA rules and fails on any violation. */
export async function expectNoAxeViolations(page: Page, context: string) {
  // @axe-core/playwright is typed against a newer playwright-core; the runtime API is compatible.
  const results = await new AxeBuilder({
    page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]['page'],
  })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(' '))
        .join('\n  ')}`,
  );
  expect(summary, `axe violations on ${context}`).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

export async function openSidePanel(page: Page, name: 'Properties' | 'Issues' | 'Simulate') {
  await page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
}
