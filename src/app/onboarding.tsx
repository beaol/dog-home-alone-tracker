import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AttemptForm } from '../components/AttemptForm';
import { Body, Button, Card, H1, H2, Input, Label, Screen } from '../components/ui';
import { formatDateTime, formatDuration, uid } from '../lib/format';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';
import type { Attempt } from '../lib/types';

const NEEDED = 5;

function blankAttempt(daysAgo: number): Attempt {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(10, 0, 0, 0);
  return { id: uid(), startedAt: d.toISOString(), durationSec: 0, events: [] };
}

export default function Onboarding() {
  const t = useTheme();
  const { completeOnboarding, data } = useStore();
  const [step, setStep] = useState(0); // 0 = intro, 1..5 = attempts
  const [name, setName] = useState(data.dogName);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const finish = (list: Attempt[]) => {
    completeOnboarding(name.trim(), list);
    router.replace('/');
  };

  if (step === 0) {
    return (
      <Screen>
        <H1>Home Alone Trainer</H1>
        <Card>
          <Body>
            This app helps you build up how long your dog can stay home alone calmly. After each attempt, it suggests how long the next
            one should be, when to do it, and why.
          </Body>
          <Body muted>
            The suggestions follow the ASPCA, VCA veterinary behaviourists, RSPCA, Dogs Trust, Blue Cross and separation anxiety
            specialist Malena DeMartini. They’re general guidance and don’t replace your vet or a behaviour professional.
          </Body>
        </Card>
        <Card>
          <Label>Your dog’s name</Label>
          <Input value={name} onChangeText={setName} placeholder="e.g. Luna" autoCapitalize="words" />
        </Card>
        <Card>
          <H2>Your starting point</H2>
          <Body>
            Next, enter your last {NEEDED} home alone attempts: how long your dog was alone, and whether and when they whined, barked,
            howled or showed body-language stress signs. This history is the starting point for the first suggestion.
          </Body>
        </Card>
        <Button title="Enter the last 5 attempts" onPress={() => setStep(1)} />
      </Screen>
    );
  }

  const idx = step - 1;
  const done = attempts.slice(0, idx);
  return (
    <Screen>
      <Text style={{ color: t.textSecondary, fontWeight: '600' }}>
        Attempt {step} of {NEEDED}
      </Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: NEEDED }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? t.accent : t.border }} />
        ))}
      </View>
      <H1>{idx === 0 ? 'Most recent attempt' : `Attempt before that (${step} of ${NEEDED})`}</H1>
      <Body muted>Start with the most recent attempt and work backwards. The order doesn’t matter in the end because attempts are sorted by date.</Body>

      {done.length > 0 && (
        <Card>
          <Label>Entered so far</Label>
          {done.map((a) => (
            <Body key={a.id}>
              {formatDateTime(a.startedAt)} · {formatDuration(a.durationSec)} · {a.events.length ? `${a.events.length} stress sign(s)` : 'calm'}
            </Body>
          ))}
        </Card>
      )}

      <Card>
        <AttemptForm
          key={step}
          initial={attempts[idx] ?? blankAttempt(idx)}
          submitLabel={step === NEEDED ? 'Save and see the plan' : 'Save and continue'}
          onSubmit={(a) => {
            const next = [...done, a, ...attempts.slice(idx + 1)];
            setAttempts(next);
            if (step === NEEDED) finish(next);
            else setStep(step + 1);
          }}
        />
      </Card>

      {done.length > 0 && (
        <Card>
          <Body muted>
            Has your dog done fewer than {NEEDED} attempts? You can start with what you have. The first suggestions will be more careful.
          </Body>
          <Button title={`Start with ${done.length} attempt${done.length > 1 ? 's' : ''}`} variant="secondary" onPress={() => finish(done)} />
        </Card>
      )}
      <Button title="Back" variant="ghost" onPress={() => setStep(step - 1)} />
    </Screen>
  );
}
