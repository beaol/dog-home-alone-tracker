import { useState } from 'react';
import { View } from 'react-native';
import type { Attempt } from '../lib/types';
import { DateTimeField } from './DateTimeField';
import { DurationField } from './DurationField';
import { EventEditor } from './EventEditor';
import { Body, Button, Input, Label } from './ui';

export function AttemptForm({
  initial,
  onSubmit,
  submitLabel = 'Save attempt',
  secondary,
}: {
  initial: Attempt;
  onSubmit: (a: Attempt) => void;
  submitLabel?: string;
  secondary?: { title: string; onPress: () => void; variant?: 'secondary' | 'danger' | 'ghost' };
}) {
  const [a, setA] = useState<Attempt>(initial);
  const valid = a.durationSec > 0;

  return (
    <View style={{ gap: 12 }}>
      <Label>When did you leave?</Label>
      <DateTimeField value={a.startedAt} onChange={(startedAt) => setA({ ...a, startedAt })} />

      <Label>How long was your dog alone?</Label>
      <DurationField value={a.durationSec} onChange={(durationSec) => setA({ ...a, durationSec })} />

      <Label>Stress signs (whining, barking, howling, body language)</Label>
      <Body muted>Add every sign you saw or heard (camera or audio), with how long after you left it started.</Body>
      <EventEditor events={a.events} maxSec={a.durationSec} onChange={(events) => setA({ ...a, events })} />

      <Label>Notes (optional)</Label>
      <Input
        value={a.notes ?? ''}
        onChangeText={(notes) => setA({ ...a, notes })}
        placeholder="e.g. after a walk, gave a stuffed toy, neighbours were noisy"
        multiline
        style={{ minHeight: 60 }}
      />

      <Button title={submitLabel} disabled={!valid} onPress={() => onSubmit({ ...a, notes: a.notes?.trim() || undefined })} />
      {!valid && <Body muted>Enter how long the dog was alone.</Body>}
      {secondary && <Button title={secondary.title} variant={secondary.variant ?? 'secondary'} onPress={secondary.onPress} />}
    </View>
  );
}
