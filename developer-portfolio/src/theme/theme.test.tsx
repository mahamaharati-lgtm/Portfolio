import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readPreference, resolve, THEME_STORAGE_KEY } from './theme';
import { ThemeSwitcher } from './ThemeSwitcher';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('dark'),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

describe('theme', () => {
  it('defaults to system, which resolves from the OS', () => {
    expect(readPreference()).toBe('system');
    expect(resolve('system')).toBe('dark');
  });

  it('switcher persists and applies the selection', async () => {
    render(<ThemeSwitcher />);
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });
});
