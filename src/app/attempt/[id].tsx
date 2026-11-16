import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Alert } from 'react-native';
import { AttemptForm } from '../../components/AttemptForm';
import { Body, Card, Screen } from '../../components/ui';
import { useStore } from '../../lib/store';

function confirm(msg: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert(msg, undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: onYes }]);
  }
}

export default function EditAttempt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, saveAttempt, deleteAttempt } = useStore();
  const attempt = data.attempts.find((a) => a.id === id);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/progress'));

  if (!attempt) {
    return (
      <Screen>
        <Card>
          <Body>This attempt no longer exists.</Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <AttemptForm
          initial={attempt}
          submitLabel="Save changes"
          onSubmit={(a) => {
            saveAttempt(a);
            back();
          }}
          secondary={{
            title: 'Delete this attempt',
            variant: 'danger',
            onPress: () =>
              confirm('Delete this attempt?', () => {
                deleteAttempt(attempt.id);
                back();
              }),
          }}
        />
      </Card>
    </Screen>
  );
}
