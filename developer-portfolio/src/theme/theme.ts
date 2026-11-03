export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'hcs-theme';
const QUERY = '(prefers-color-scheme: dark)';
const CHANGE_EVENT = 'hcs-theme-change';

export function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* storage blocked */
  }
  return 'system';
}

export function systemTheme(): ResolvedTheme {
  return window.matchMedia?.(QUERY).matches ? 'dark' : 'light';
}

export function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? systemTheme() : pref;
}

export function applyTheme(pref: ThemePreference): void {
  const resolved = resolve(pref);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = pref;
  root.style.colorScheme = resolved;
}

export function writePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage blocked: still apply for this visit */
  }
  applyTheme(pref);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Notifies on: explicit changes, changes in other tabs, and OS theme changes. */
export function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia?.(QUERY);
  const onSystem = () => {
    if (readPreference() === 'system') applyTheme('system');
    callback();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      applyTheme(readPreference());
      callback();
    }
  };
  mql?.addEventListener('change', onSystem);
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    mql?.removeEventListener('change', onSystem);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}
