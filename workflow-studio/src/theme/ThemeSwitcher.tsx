import { Monitor, Moon, Sun } from 'lucide-react';
import { useId } from 'react';
import type { ThemePreference } from './theme';
import { useTheme } from './useTheme';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

/** Native radio group: arrow keys move between options, and the choice is announced. */
export function ThemeSwitcher({ showLabels = false }: { showLabels?: boolean }) {
  const { preference, setPreference } = useTheme();
  const name = useId();
  return (
    <fieldset className="theme-switcher">
      <legend className="sr-only">Colour theme</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <label key={value} className="theme-switcher__option" title={`${label} theme`}>
          <input
            type="radio"
            name={name}
            value={value}
            checked={preference === value}
            onChange={() => setPreference(value)}
            className="sr-only"
          />
          <Icon aria-hidden="true" size={16} />
          <span className={showLabels ? '' : 'sr-only'}>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
