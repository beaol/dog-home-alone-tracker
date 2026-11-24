import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AttemptForm } from '../../components/AttemptForm';
import { Body, Button, Card, H1, H2, Label, Row, Screen } from '../../components/ui';
import { recommend } from '../../lib/engine';
import { formatClock, formatDuration, uid } from '../../lib/format';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { BODY_KINDS, INTENSITY_LABEL, KIND_LABEL, VOCAL_KINDS, type Attempt, type Intensity, type StressKind } from '../../lib/types';
import { useNow } from '../../lib/useNow';

const NEXT_INTENSITY: Record<Intensity, Intensity> = { brief: 'intermittent', intermittent: 'continuous', continuous: 'brief' };

export default function LogScreen() {
  const { data, setLive, saveAttempt, engineOptions } = useStore();
  const [mode, setMode] = useState<'choose' | 'manual' | 'review'>('choose');
  const [review, setReview] = useState<Attempt | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const rec = useMemo(
    () => recommend(data.attempts, new Date(), data.dogName, engineOptions),
    [data.attempts, data.dogName, engineOptions],
  );

  const onSaved = (a: Attempt) => {
    saveAttempt(a);
    setSavedMsg(`Saved: ${formatDuration(a.durationSec)}${a.events.length ? `, ${a.events.length} stress sign(s)` : ', calm'}.`);
    setMode('choose');
    setReview(null);
    router.navigate('/');
  };

  if (data.live) {
    return (
      <LiveTimer
        onEnd={(a) => {
          setLive(null);
          setReview(a);
          setMode('review');
        }}
      />
    );
  }

  if (mode === 'review' && review) {
    return (
      <Screen>
        <H1>Check and save</H1>
        <Body muted>Adjust anything that isn’t right, e.g. if you stopped the timer a bit late.</Body>
        <Card>
          <AttemptForm initial={review} onSubmit={onSaved} secondary={{ title: 'Discard this session', variant: 'ghost', onPress: () => setMode('choose') }} />
        </Card>
      </Screen>
    );
  }

  if (mode === 'manual') {
    return (
      <Screen>
        <H1>Log an attempt</H1>
        <Card>
          <AttemptForm
            initial={{ id: uid(), startedAt: new Date().toISOString(), durationSec: 0, events: [] }}
            onSubmit={onSaved}
            secondary={{ title: 'Cancel', variant: 'ghost', onPress: () => setMode('choose') }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <H1>Log</H1>
      {savedMsg && <Body>{savedMsg}</Body>}
      <Card>
        <H2>Start a session now</H2>
        <Body muted>
          A timer runs while you’re out. Tap the buttons when you see or hear stress signs on your camera, and the time is recorded
          automatically. Suggested length: <Text style={{ fontWeight: '700' }}>{formatDuration(rec.targetSec)}</Text>.
        </Body>
        <Button title="Start timer, I’m leaving now" onPress={() => setLive({ startedAt: new Date().toISOString(), events: [], targetSec: rec.targetSec })} />
      </Card>
      <Card>
        <H2>Log a past attempt</H2>
        <Body muted>Enter an attempt you’ve already done, with times for any whining, barking, howling or other signs.</Body>
        <Button title="Enter manually" variant="secondary" onPress={() => setMode('manual')} />
      </Card>
    </Screen>
  );
}

function LiveTimer({ onEnd }: { onEnd: (a: Attempt) => void }) {
  const t = useTheme();
  const { data, setLive } = useStore();
  const live = data.live!;
  const now = useNow(1000);
  const elapsed = Math.max(0, Math.floor((now.getTime() - Date.parse(live.startedAt)) / 1000));
  const target = live.targetSec ?? 0;
  const reached = target > 0 && elapsed >= target;
  const pct = target ? Math.min(1, elapsed / target) : 0;

  const addEvent = (kind: StressKind) =>
    setLive({ ...live, events: [...live.events, { id: uid(), kind, atSec: elapsed, intensity: 'brief' }] });

  const end = () =>
    onEnd({ id: uid(), startedAt: live.startedAt, durationSec: Math.max(1, elapsed), events: live.events });

  return (
    <Screen>
      <H1>Session running</H1>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ color: t.text, fontSize: 64, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{formatClock(elapsed)}</Text>
        {target > 0 && (
          <>
            <View style={{ width: '100%', height: 8, borderRadius: 4, backgroundColor: t.surfaceAlt, overflow: 'hidden' }}>
              <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: reached ? t.good : t.accent }} />
            </View>
            <Text style={{ color: reached ? t.goodText : t.textSecondary, fontWeight: '600', fontSize: 16 }}>
              {reached ? `✓ Target ${formatClock(target)} reached. Go back in calmly.` : `Target ${formatClock(target)}`}
            </Text>
          </>
        )}
      </Card>

      {live.events.length > 0 && live.events.some((e) => e.kind === 'howl' || e.intensity === 'continuous') && (
        <Card style={{ borderColor: t.critical, borderWidth: 1.5 }}>
          <Text style={{ color: t.criticalText, fontWeight: '700' }}>Consider going back now.</Text>
          <Body muted>The sources agree: return before the distress builds, and don’t continue the exercise today.</Body>
        </Card>
      )}

      <Card>
        <Label>Tap when you hear</Label>
        <Row>
          {VOCAL_KINDS.map((k) => (
            <BigTap key={k} label={KIND_LABEL[k]} onPress={() => addEvent(k)} />
          ))}
        </Row>
        <Label>Tap when you see</Label>
        <Row>
          {BODY_KINDS.map((k) => (
            <BigTap key={k} small label={KIND_LABEL[k]} onPress={() => addEvent(k)} />
          ))}
        </Row>
      </Card>

      {live.events.length > 0 && (
        <Card>
          <Label>Logged signs (tap to change intensity)</Label>
          {live.events.map((e) => (
            <Pressable
              key={e.id}
              onPress={() =>
                setLive({ ...live, events: live.events.map((x) => (x.id === e.id ? { ...x, intensity: NEXT_INTENSITY[x.intensity] } : x)) })
              }
              style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}
            >
              <Body>
                {formatClock(e.atSec)} · {KIND_LABEL[e.kind]}
              </Body>
              <Text style={{ color: t.accent, fontWeight: '600' }}>{INTENSITY_LABEL[e.intensity]}</Text>
            </Pressable>
          ))}
        </Card>
      )}

      <Button title="I’m back, end session" onPress={end} />
      <Button title="Cancel session (don’t save)" variant="ghost" onPress={() => setLive(null)} />
    </Screen>
  );
}

function BigTap({ label, onPress, small }: { label: string; onPress: () => void; small?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: small ? 10 : 16,
        paddingHorizontal: small ? 12 : 18,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: t.critical,
        backgroundColor: pressed ? t.critical : t.surface,
        minWidth: small ? undefined : 96,
        alignItems: 'center',
      })}
    >
      {({ pressed }) => (
        <Text style={{ color: pressed ? '#fff' : t.criticalText, fontWeight: '700', fontSize: small ? 14 : 17 }}>{label}</Text>
      )}
    </Pressable>
  );
}
