import { Monitor, Moon, Sun } from 'lucide-react';
import { useId } from 'react';
import type { ThemePreference } from './theme';
import { useThemePreference } from './useTheme';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export function ThemeSwitcher({ showLabels = false }: { showLabels?: boolean }) {
  const [preference, setPreference] = useThemePreference();
  const name = useId();
  return (
    <fieldset className="segmented">
      <legend className="sr-only">Colour theme</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <label key={value} className="segmented__option" title={`${label} theme`}>
          <input
            type="radio"
            name={name}
            value={value}
            checked={preference === value}
            onChange={() => setPreference(value)}
            className="sr-only"
          />
          <Icon aria-hidden="true" size={15} />
          <span className={showLabels ? '' : 'sr-only'}>{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
