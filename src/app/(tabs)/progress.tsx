import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ProgressChart } from '../../components/ProgressChart';
import { Body, Card, Chip, H1, H2, Label, Row, Screen } from '../../components/ui';
import { analyseHistory, recommend, roundDuration, sortAttempts, stressOnset } from '../../lib/engine';
import { formatDateTime, formatDuration } from '../../lib/format';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';

type Range = 14 | 30 | 'all';

export default function ProgressScreen() {
  const t = useTheme();
  const { data } = useStore();
  const [range, setRange] = useState<Range>(14);
  const sorted = useMemo(() => sortAttempts(data.attempts), [data.attempts]);
  const rec = useMemo(() => recommend(data.attempts, new Date(), data.dogName), [data.attempts, data.dogName]);
  const shown = range === 'all' ? sorted : sorted.slice(-range);

  const calm = sorted.filter((a) => stressOnset(a) === null);
  const bestCalm = calm.reduce((m, a) => Math.max(m, a.durationSec), 0);
  const last10 = sorted.slice(-10);
  const calmRate = last10.length ? Math.round((last10.filter((a) => stressOnset(a) === null).length / last10.length) * 100) : 0;
  const rawComfort = analyseHistory(sorted).comfort;
  const comfort = rawComfort === null ? null : roundDuration(rawComfort, 'down');

  return (
    <Screen>
      <H1>Progress</H1>
      <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
        <Stat label="Calm level now" value={comfort !== null ? formatDuration(comfort) : '–'} />
        <Stat label="Longest calm" value={bestCalm ? formatDuration(bestCalm) : '–'} />
        <Stat label="Calm, last 10" value={last10.length ? `${calmRate}%` : '–'} />
        <Stat label="Attempts" value={String(sorted.length)} />
      </View>

      <Card>
        <H2>Time alone per attempt</H2>
        <Row>
          {([14, 30, 'all'] as Range[]).map((r) => (
            <Chip key={String(r)} label={r === 'all' ? 'All' : `Last ${r}`} selected={range === r} onPress={() => setRange(r)} />
          ))}
        </Row>
        {shown.length ? <ProgressChart key={String(range)} attempts={shown} nextTarget={rec.targetSec} /> : <Body muted>No attempts yet.</Body>}
      </Card>

      <Card>
        <H2>History</H2>
        <Body muted>Tap an attempt to edit or delete it.</Body>
        {[...sorted].reverse().map((a) => {
          const onset = stressOnset(a);
          return (
            <Pressable
              key={a.id}
              onPress={() => router.push({ pathname: '/attempt/[id]', params: { id: a.id } })}
              style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.border, gap: 2 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>{formatDateTime(a.startedAt)}</Text>
                <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{formatDuration(a.durationSec)}</Text>
              </View>
              <Text style={{ color: onset === null ? t.goodText : t.criticalText, fontSize: 14 }}>
                {onset === null ? '✓ Calm' : `⚠ ${a.events.length} sign(s), first at ${formatDuration(onset)}`}
              </Text>
              {a.notes ? <Text style={{ color: t.textSecondary, fontSize: 13 }}>{a.notes}</Text> : null}
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        backgroundColor: t.surface,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 4,
      }}
    >
      <Label>{label}</Label>
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}
