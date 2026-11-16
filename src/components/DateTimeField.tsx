import { useState } from 'react';
import { fromLocalInputValue, toLocalInputValue } from '../lib/format';
import { Input } from './ui';

/** Native fallback: type "YYYY-MM-DDTHH:MM". The web build (DateTimeField.web.tsx) uses the system picker. */
export function DateTimeField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [text, setText] = useState(toLocalInputValue(value));
  return (
    <Input
      value={text}
      onChangeText={(v) => {
        setText(v);
        const iso = fromLocalInputValue(v);
        if (iso) onChange(iso);
      }}
      placeholder="2026-11-16T09:30"
    />
  );
}
