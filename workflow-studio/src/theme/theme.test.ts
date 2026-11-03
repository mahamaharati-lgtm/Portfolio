import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, readPreference, resolve, THEME_STORAGE_KEY } from './theme';

function mockSystem(dark: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: dark && q.includes('dark'),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('theme', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to system and ignores invalid stored values', () => {
    expect(readPreference()).toBe('system');
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    expect(readPreference()).toBe('system');
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readPreference()).toBe('dark');
  });

  it('resolves system preference from the OS', () => {
    mockSystem(true);
    expect(resolve('system')).toBe('dark');
    mockSystem(false);
    expect(resolve('system')).toBe('light');
    expect(resolve('dark')).toBe('dark');
  });

  it('applies the theme to the document element', () => {
    mockSystem(false);
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.dataset.themePreference).toBe('dark');
    applyTheme('system');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
