import { Linking, Pressable, Text, View } from 'react-native';
import { ReasonList } from '../../components/ReasonList';
import { Body, Card, H1, H2, Screen } from '../../components/ui';
import type { Reason } from '../../lib/engine';
import { SOURCE_LIST } from '../../lib/sources';
import { useTheme } from '../../lib/theme';

const PRINCIPLES: { title: string; items: Reason[] }[] = [
  {
    title: '1. Stay under threshold',
    items: [
      { text: 'Every absence should end before your dog becomes upset. This is the main rule every source shares.', basis: 'source', sources: ['aspca', 'vca', 'rspca'] },
      { text: 'Whining, barking, howling, pacing, panting, drooling, trembling and scratching at the door all count as stress signs. Some dogs “suffer in silence”, so watch on a camera.', basis: 'source', sources: ['rspca', 'dogstrust', 'bluecross', 'vca'] },
    ],
  },
  {
    title: '2. Increase slowly, only after calm sessions',
    items: [
      { text: 'Increase only when the last absence was calm. After a setback, repeat a duration before increasing.', basis: 'source', sources: ['rspca', 'aspca', 'demartini-slow'] },
      { text: 'Under 40 min: about +10% per step (min 5 s, max 3 min). From 40 min: +5 min. From 90 min: +15 min. From 4 hours: +1 hour, up to the goal of 8 hours (a full work day). The ASPCA says a dog that is calm for 90 minutes can probably handle 4–8 hours, starting with 4 and building to 8 over a few days.', basis: 'app', sources: ['aspca', 'bluecross'] },
      { text: 'The RSPCA and Dogs Trust advise not leaving a dog alone for more than 4 hours. Past 4 hours the app shows this as a note and suggests breaking up long days with a midday walk or visit.', basis: 'source', sources: ['rspca', 'dogstrust'] },
      { text: 'Mix in an easy (shorter) session after three increases in a row, so absences vary in length.', basis: 'source', sources: ['vca', 'rspca'] },
    ],
  },
  {
    title: '3. After stress signs, step back',
    items: [
      { text: 'Go back to a duration your dog handled calmly, and progress more slowly.', basis: 'source', sources: ['rspca', 'bluecross', 'dogstrust'] },
      { text: 'Look for patterns, not a single moment. One brief sign after which the dog settles may not mean the dog went over threshold.', basis: 'source', sources: ['demartini-quiet'] },
      { text: 'One single brief sign, then calm for at least a quarter of the session, with no signs in the 2 sessions before: back to the last calm duration, repeated until calm twice before increasing. If a sign comes back within the next 2 sessions, it counts as a pattern and the stricter rules below apply.', basis: 'app', sources: ['demartini-quiet', 'rspca', 'bluecross'] },
      { text: 'Otherwise, one or two brief signs: plan about 80% of the time the first sign appeared. More than that: about 50%. Two stressful sessions in a row: another 25% less. The next absence ends before the time the dog got upset last time.', basis: 'app', sources: ['aspca'] },
      { text: 'Stop training for the day after distress. Regressions are normal and often come before progress.', basis: 'source', sources: ['vca', 'demartini-regress'] },
    ],
  },
  {
    title: '4. Rhythm and rest',
    items: [
      { text: 'Wait a few minutes between absences (the app uses 5 min), until your dog is relaxed.', basis: 'source', sources: ['aspca', 'vca'] },
      { text: 'About 20–30 minutes of training a day, 5 days a week with 2 days off. Rest helps learning; more training does not speed it up. You can switch rest days off in Settings.', basis: 'source', sources: ['demartini-less'] },
      { text: 'The 30-minute daily limit is for short practice absences done several in a row. It is not a limit on how long your dog can be alone. Once absences are 30 minutes or longer, the app plans one per day, all the way up to 8 hours.', basis: 'app', sources: ['demartini-less', 'aspca'] },
    ],
  },
  {
    title: '5. Time since the last session',
    items: [
      { text: 'Short breaks, like a normal weekend off, are good for learning, so up to 3 days needs no adjustment.', basis: 'source', sources: ['demartini-less'] },
      { text: 'No source gives a number for how a longer break affects tolerance, but regressions are common and the under-threshold rule always applies. After a break of 4–7 days the app starts at 85% of the calm level, after 8–13 days at 70%, and after 14+ days at 50%. Then it goes back to the calm level and normal steps.', basis: 'app', sources: ['demartini-regress', 'aspca'] },
    ],
  },
  {
    title: '6. Get help when needed',
    items: [
      { text: 'If stress signs keep coming, get earlier each time, or include continuous howling or scratching at the door, talk to your vet or a qualified behaviour professional.', basis: 'source', sources: ['aspca', 'rspca', 'vca'] },
    ],
  },
];

export default function GuideScreen() {
  const t = useTheme();
  return (
    <Screen>
      <H1>How the app decides</H1>
      <Body muted>
        Everything the app suggests follows the rules below. “Source” rules come straight from the trusted sources. “App rule” is where
        the sources agree on the direction but give no exact number, so the app picks a careful one.
      </Body>

      {PRINCIPLES.map((p) => (
        <Card key={p.title}>
          <H2>{p.title}</H2>
          <ReasonList reasons={p.items} />
        </Card>
      ))}

      <H1>Sources</H1>
      {SOURCE_LIST.map((s) => (
        <Card key={s.id}>
          <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }}>{s.org}</Text>
          <Pressable onPress={() => Linking.openURL(s.url)} accessibilityRole="link">
            <Text style={{ color: t.accent, fontSize: 17, fontWeight: '700', textDecorationLine: 'underline' }}>{s.title} ↗</Text>
          </Pressable>
          {s.authors && <Body muted>{s.authors}</Body>}
          <View style={{ gap: 6 }}>
            {s.points.map((pt, i) => (
              <Body key={i}>• {pt}</Body>
            ))}
          </View>
        </Card>
      ))}

      <Card>
        <Body muted>
          This app gives general training guidance. It isn’t a diagnosis or veterinary advice. If your dog panics, hurts itself, or
          isn’t improving, contact your vet or a qualified behaviour professional.
        </Body>
      </Card>
    </Screen>
  );
}
