import { useSyncExternalStore } from 'react';
import { readPreference, subscribe, writePreference, type ThemePreference } from './theme';

/** Server render and hydration use "system"; the real preference is read right after. */
export function useThemePreference(): [ThemePreference, (pref: ThemePreference) => void] {
  const pref = useSyncExternalStore(subscribe, readPreference, () => 'system' as const);
  return [pref, writePreference];
}
