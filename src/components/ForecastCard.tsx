import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { forecast, type EngineOptions, type RecKind } from '../lib/engine';
import { formatDuration } from '../lib/format';
import { useTheme } from '../lib/theme';
import type { Attempt } from '../lib/types';
import { Body, Card, H2 } from './ui';

const KIND_WORD: Record<RecKind, string> = {
  start: 'start',
  increase: '▲ up',
  repeat: '● repeat',
  recheck: '↩ last calm',
  stepBack: '▼ step back',
  easy: '◐ easy',
  warmup: '↺ warm-up',
  goal: '★ goal',
};

export function ForecastCard({
  attempts,
  now,
  dog,
  options,
}: {
  attempts: Attempt[];
  now: Date;
  dog: string;
  options: EngineOptions;
}) {
  const t = useTheme();
  // Recompute once a minute at most
  const minute = Math.floor(now.getTime() / 60000);
  const days = useMemo(() => forecast(attempts, new Date(minute * 60000), 5, options), [attempts, minute, options]);

  const dayLabel = (d: Date, i: number) =>
    i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <Card>
      <H2>The next 5 days</H2>
      <Body muted>
        If {dog} is calm every time and each session hits its target, this is how the plan continues. Any stress sign changes it, so
        treat it as a preview, not a schedule.
      </Body>
      {days.map((d, i) => (
        <View key={d.date.toISOString()} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border }}>
          <View style={{ width: 92 }}>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{dayLabel(d.date, i)}</Text>
            <Text style={{ color: t.textMuted, fontSize: 12 }}>{d.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            {d.sessions.length === 0 ? (
              <Text style={{ color: t.textSecondary, fontSize: 15 }}>Rest day</Text>
            ) : (
              d.sessions.map((s, k) => (
                <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ color: t.text, fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{formatDuration(s.targetSec)}</Text>
                  <Text style={{ color: s.kind === 'increase' || s.kind === 'goal' ? t.goodText : t.textSecondary, fontSize: 13 }}>
                    {KIND_WORD[s.kind]}
                  </Text>
                </View>
              ))
            )}
            {d.sessions.length > 1 && (
              <Text style={{ color: t.textMuted, fontSize: 12 }}>
                {d.sessions.length} absences, at least 5 min apart, once {dog} is relaxed
              </Text>
            )}
          </View>
        </View>
      ))}
    </Card>
  );
}
