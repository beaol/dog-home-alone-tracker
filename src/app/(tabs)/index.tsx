import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ForecastCard } from '../../components/ForecastCard';
import { ReasonList } from '../../components/ReasonList';
import { Body, Button, Card, H1, H2, Label, Row, Screen } from '../../components/ui';
import { recommend, type RecKind } from '../../lib/engine';
import { formatDuration } from '../../lib/format';
import { useStore } from '../../lib/store';
import { useTheme } from '../../lib/theme';
import { useNow } from '../../lib/useNow';

const KIND_ICON: Record<RecKind, string> = {
  start: '▶',
  increase: '▲',
  repeat: '●',
  recheck: '↩',
  stepBack: '▼',
  easy: '◐',
  warmup: '↺',
  goal: '★',
};

export default function PlanScreen() {
  const t = useTheme();
  const { data } = useStore();
  const now = useNow(15_000);
  const dog = data.dogName || 'your dog';
  const rec = useMemo(() => recommend(data.attempts, now, data.dogName), [data.attempts, now, data.dogName]);
  const ready = rec.earliestNext.getTime() <= now.getTime();

  const delta = rec.previousSec !== null ? rec.targetSec - rec.previousSec : null;
  const kindColor =
    rec.kind === 'stepBack' ? t.criticalText : rec.kind === 'increase' || rec.kind === 'goal' ? t.goodText : t.accent;

  return (
    <Screen>
      <H1>Next session{data.dogName ? ` for ${data.dogName}` : ''}</H1>

      {data.live && (
        <Card style={{ borderColor: t.accent, borderWidth: 2 }}>
          <Body>A session is running right now.</Body>
          <Button title="Open the timer" onPress={() => router.navigate('/log')} />
        </Card>
      )}

      <Card>
        <Row>
          <Text style={{ color: kindColor, fontSize: 15, fontWeight: '700' }}>
            {KIND_ICON[rec.kind]} {rec.headline}
          </Text>
        </Row>
        <Text style={{ color: t.text, fontSize: 44, fontWeight: '800', letterSpacing: -1 }} accessibilityLabel={`Target ${formatDuration(rec.targetSec)}`}>
          {formatDuration(rec.targetSec)}
        </Text>
        <View style={{ gap: 2 }}>
          {rec.previousSec !== null && (
            <Body muted>
              Last time: {formatDuration(rec.previousSec)}
              {delta !== null && delta !== 0 ? ` (${delta > 0 ? '+' : '−'}${formatDuration(Math.abs(delta))})` : ''}
            </Body>
          )}
          {rec.comfortSec !== null && <Body muted>Calm level right now: {formatDuration(rec.comfortSec)}</Body>}
        </View>
      </Card>

      <Card>
        <Label>When</Label>
        <H2>{rec.waitHeadline}</H2>
        {!ready && rec.earliestNext.getHours() + rec.earliestNext.getMinutes() > 0 && (
          <Body muted>Earliest: {rec.earliestNext.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</Body>
        )}
        {!ready && rec.earliestNext.getHours() + rec.earliestNext.getMinutes() === 0 && (
          <Body muted>Any time that day, once your dog is relaxed.</Body>
        )}
        {rec.repsLeftToday > 1 && ready && (
          <Body muted>About {rec.repsLeftToday} more short absences fit in today’s training.</Body>
        )}
        {rec.waitReasons.length > 0 && <ReasonList reasons={rec.waitReasons} />}
        <Button title={ready ? 'Start session with timer' : 'Start a session anyway'} variant={ready ? 'primary' : 'secondary'} onPress={() => router.navigate('/log')} />
      </Card>

      {rec.warnings.length > 0 && (
        <Card style={{ borderColor: t.critical, borderWidth: 1.5 }}>
          <Text style={{ color: t.criticalText, fontWeight: '700', fontSize: 16 }}>⚠ Worth paying attention to</Text>
          <ReasonList reasons={rec.warnings} />
        </Card>
      )}

      <ForecastCard attempts={data.attempts} now={now} dog={dog} />

      <Card>
        <H2>Why {formatDuration(rec.targetSec)}?</H2>
        <Body muted>
          “Source” means the point comes straight from a trusted source. “App rule” means the sources don’t give an exact number, so the app
          picked a careful one.
        </Body>
        <ReasonList reasons={rec.reasons} />
      </Card>

      <Card>
        <H2>Before you leave</H2>
        <ReasonList
          reasons={[
            {
              text: `Give ${dog} a food-stuffed toy that lasts 20–30 minutes as you leave, and pick it up when you come back.`,
              basis: 'source',
              sources: ['aspca'],
            },
            {
              text: `Watch on a camera or record audio. Then you can come back before ${dog} gets upset, and note exactly when any sign appears.`,
              basis: 'source',
              sources: ['vca', 'rspca'],
            },
            {
              text: `Leave when ${dog} is relaxed, not already worried by your preparations.`,
              basis: 'source',
              sources: ['vca', 'bluecross'],
            },
            {
              text: 'Never punish your dog for anything that happened while you were out.',
              basis: 'source',
              sources: ['rspca'],
            },
          ]}
        />
      </Card>
    </Screen>
  );
}
