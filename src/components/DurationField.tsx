import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../lib/theme';
import { Input } from './ui';

/** Minutes + seconds input. Minutes can go above 60 (e.g. 95 min). `value` is only read on mount; remount with a `key` to reset. */
export function DurationField({ value, onChange, label }: { value: number; onChange: (sec: number) => void; label?: string }) {
  const t = useTheme();
  const [m, setM] = useState(value ? String(Math.floor(value / 60)) : '');
  const [s, setS] = useState(value ? String(value % 60) : '');

  const update = (nm: string, ns: string) => {
    setM(nm);
    setS(ns);
    onChange((parseInt(nm || '0', 10) || 0) * 60 + Math.min(59, parseInt(ns || '0', 10) || 0));
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Input
        accessibilityLabel={`${label ?? 'Duration'} minutes`}
        value={m}
        onChangeText={(v) => update(v.replace(/[^0-9]/g, ''), s)}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder="0"
        style={{ width: 72, textAlign: 'center' }}
      />
      <Text style={{ color: t.textSecondary }}>min</Text>
      <Input
        accessibilityLabel={`${label ?? 'Duration'} seconds`}
        value={s}
        onChangeText={(v) => update(m, v.replace(/[^0-9]/g, '').slice(0, 2))}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder="0"
        style={{ width: 60, textAlign: 'center' }}
      />
      <Text style={{ color: t.textSecondary }}>s</Text>
    </View>
  );
}
