import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';
import { Body, Button, Card, H1, H2, Input, Label, Row, Screen } from '../../components/ui';
import { useTheme } from '../../lib/theme';
import { parseBackup, useStore } from '../../lib/store';

function confirmAction(msg: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert(msg, undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'OK', style: 'destructive', onPress: onYes }]);
  }
}

export default function SettingsScreen() {
  const { data, setDogName, setRestDays, replaceAll, reset } = useStore();
  const restDaysOn = data.restDays !== false;
  const t = useTheme();
  const [name, setName] = useState(data.dogName);
  const [msg, setMsg] = useState<string | null>(null);

  const exportBackup = async () => {
    const json = JSON.stringify({ ...data, live: null, exportedAt: new Date().toISOString() }, null, 2);
    const filename = `home-alone-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (Platform.OS !== 'web') return;
    const file = new File([json], filename, { type: 'application/json' });
    // On iPhone the share sheet lets you save to Files / iCloud Drive
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Home alone training backup' });
        setMsg('Backup shared.');
        return;
      } catch {
        /* cancelled: fall back to download */
      }
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setMsg('Backup downloaded.');
  };

  const importBackup = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const parsed = parseBackup(await f.text());
        confirmAction(`Replace all current data with ${parsed.attempts.length} attempts from the backup?`, () => {
          replaceAll(parsed);
          setName(parsed.dogName);
          setMsg(`Restored ${parsed.attempts.length} attempts.`);
        });
      } catch (e: any) {
        setMsg(`Could not read the file: ${e?.message ?? e}`);
      }
    };
    input.click();
  };

  return (
    <Screen>
      <H1>Settings</H1>
      <Card>
        <Label>Dog’s name</Label>
        <Input value={name} onChangeText={setName} onBlur={() => setDogName(name.trim())} placeholder="e.g. Luna" />
        <Button title="Save name" variant="secondary" onPress={() => { setDogName(name.trim()); setMsg('Name saved.'); }} />
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <View style={{ flex: 1 }}>
            <H2>Rest days</H2>
          </View>
          <Switch
            accessibilityLabel="Plan rest days"
            value={restDaysOn}
            onValueChange={setRestDays}
            trackColor={{ true: t.accent, false: t.border }}
          />
        </Row>
        <Body muted>
          {restDaysOn
            ? 'On: after 5 training days in a week, the app plans 2 days off. Malena DeMartini trains 5 days a week with 2 days off and says rest helps the dog keep what it has learned.'
            : 'Off: the app plans sessions every day. The rest of the pacing still applies (a few minutes between absences, about 30 minutes of training a day, and stopping for the day after stress signs). DeMartini recommends 2 days off a week, so watch for signs of fatigue or regression.'}
        </Body>
      </Card>

      <Card>
        <H2>Backup</H2>
        <Body muted>
          All data is stored only on this phone, inside this app. Nothing is sent anywhere. Export a backup now and then, e.g. to iCloud
          Drive. If you clear Safari’s website data or delete the app from the Home Screen, the data is gone.
        </Body>
        <Button title="Export backup" onPress={exportBackup} />
        <Button title="Import backup" variant="secondary" onPress={importBackup} />
        {msg && <Body>{msg}</Body>}
      </Card>

      <Card>
        <H2>Install on iPhone</H2>
        <Body>
          Open this page in Safari, tap the Share button, then “Add to Home Screen”. The app opens full screen. Note that the Home
          Screen app keeps its own data, separate from Safari tabs.
        </Body>
      </Card>

      <Card>
        <H2>Start over</H2>
        <Body muted>Deletes all attempts and takes you back to the setup.</Body>
        <Button
          title="Delete all data"
          variant="danger"
          onPress={() =>
            confirmAction('Delete all attempts and start over? Export a backup first if you want to keep them.', () => {
              reset();
              router.replace('/onboarding');
            })
          }
        />
      </Card>
    </Screen>
  );
}
