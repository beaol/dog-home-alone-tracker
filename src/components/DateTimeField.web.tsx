import { fromLocalInputValue, toLocalInputValue } from '../lib/format';
import { useTheme } from '../lib/theme';

/** Uses the browser's own date/time picker (the native wheel picker on iPhone Safari). */
export function DateTimeField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const t = useTheme();
  return (
    <input
      type="datetime-local"
      aria-label="When you left"
      value={toLocalInputValue(value)}
      max={toLocalInputValue(new Date().toISOString())}
      onChange={(e) => {
        const iso = fromLocalInputValue(e.target.value);
        if (iso) onChange(iso);
      }}
      style={{
        fontSize: 16,
        padding: '10px 12px',
        borderRadius: 10,
        border: `1px solid ${t.border}`,
        background: t.surface,
        color: t.text,
        fontFamily: 'inherit',
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 44,
      }}
    />
  );
}
