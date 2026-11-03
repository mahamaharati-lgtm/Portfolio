import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { ThemeContext } from './context';
import {
  applyTheme,
  readPreference,
  subscribeToSystemTheme,
  systemTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>(readPreference);
  // Follows the operating-system setting live, even while the page is open.
  const system = useSyncExternalStore(subscribeToSystemTheme, systemTheme, () => 'light' as const);
  const resolved = preference === 'system' ? system : preference;

  useEffect(() => {
    applyTheme(preference);
  }, [preference, system]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) setPref(readPreference());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      /* storage blocked: the choice still applies for this visit */
    }
    setPref(pref);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
