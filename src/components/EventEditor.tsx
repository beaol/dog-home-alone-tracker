import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatClock, uid } from '../lib/format';
import { useTheme } from '../lib/theme';
import {
  BODY_KINDS,
  INTENSITY_LABEL,
  KIND_LABEL,
  VOCAL_KINDS,
  type Intensity,
  type StressEvent,
  type StressKind,
} from '../lib/types';
import { DurationField } from './DurationField';
import { Body, Button, Chip, Label, Row } from './ui';

const INTENSITIES: Intensity[] = ['brief', 'intermittent', 'continuous'];

export function EventEditor({
  events,
  onChange,
  maxSec,
}: {
  events: StressEvent[];
  onChange: (e: StressEvent[]) => void;
  maxSec: number;
}) {
  const t = useTheme();
  const [draft, setDraft] = useState<StressEvent | null>(null);

  const sorted = [...events].sort((a, b) => a.atSec - b.atSec);

  return (
    <View style={{ gap: 10 }}>
      {sorted.length === 0 && !draft && <Body muted>No stress signs. The dog stayed calm the whole time.</Body>}
      {sorted.map((e) => (
        <View
          key={e.id}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, backgroundColor: t.surfaceAlt }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>
              {KIND_LABEL[e.kind]} at {formatClock(e.atSec)}
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>
              {INTENSITY_LABEL[e.intensity]}
              {e.lastedSec ? ` · lasted ${formatClock(e.lastedSec)}` : ''}
              {maxSec > 0 && e.atSec > maxSec ? ' · after the session ended?' : ''}
            </Text>
          </View>
          <Pressable accessibilityLabel="Edit sign" onPress={() => setDraft(e)} hitSlop={8}>
            <Text style={{ color: t.accent, fontWeight: '600' }}>Edit</Text>
          </Pressable>
          <Pressable accessibilityLabel="Remove sign" onPress={() => onChange(events.filter((x) => x.id !== e.id))} hitSlop={8}>
            <Text style={{ color: t.criticalText, fontWeight: '600' }}>Remove</Text>
          </Pressable>
        </View>
      ))}

      {draft ? (
        <View key={draft.id} style={{ gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.border }}>
          <Label>Sound</Label>
          <Row>
            {VOCAL_KINDS.map((k) => (
              <Chip key={k} label={KIND_LABEL[k]} selected={draft.kind === k} onPress={() => setDraft({ ...draft, kind: k })} />
            ))}
          </Row>
          <Label>Body language</Label>
          <Row>
            {BODY_KINDS.map((k) => (
              <Chip key={k} label={KIND_LABEL[k]} selected={draft.kind === k} onPress={() => setDraft({ ...draft, kind: k as StressKind })} />
            ))}
          </Row>
          <Label>When did it start (after you left)?</Label>
          <DurationField label="Started at" value={draft.atSec} onChange={(atSec) => setDraft({ ...draft, atSec })} />
          <Label>Intensity</Label>
          <Row>
            {INTENSITIES.map((i) => (
              <Chip key={i} label={INTENSITY_LABEL[i]} selected={draft.intensity === i} onPress={() => setDraft({ ...draft, intensity: i })} />
            ))}
          </Row>
          <Label>How long did it last? (optional)</Label>
          <DurationField label="Lasted" value={draft.lastedSec ?? 0} onChange={(lastedSec) => setDraft({ ...draft, lastedSec: lastedSec || undefined })} />
          <Row>
            <Button
              title="Save sign"
              onPress={() => {
                const exists = events.some((x) => x.id === draft.id);
                onChange(exists ? events.map((x) => (x.id === draft.id ? draft : x)) : [...events, draft]);
                setDraft(null);
              }}
            />
            <Button title="Cancel" variant="ghost" onPress={() => setDraft(null)} />
          </Row>
        </View>
      ) : (
        <Button
          title="+ Add a stress sign"
          variant="secondary"
          onPress={() => setDraft({ id: uid(), kind: 'whine', atSec: 0, intensity: 'brief' })}
        />
      )}
    </View>
  );
}
