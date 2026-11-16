import { Linking, Pressable, Text, View } from 'react-native';
import type { Reason } from '../lib/engine';
import { SOURCES } from '../lib/sources';
import { useTheme } from '../lib/theme';

export function ReasonList({ reasons }: { reasons: Reason[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {reasons.map((r, i) => (
        <View key={i} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View
              style={{
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: r.basis === 'source' ? t.sourceBadgeBg : t.appBadgeBg,
                marginTop: 1,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: r.basis === 'source' ? t.goodText : t.accent }}>
                {r.basis === 'source' ? 'SOURCE' : 'APP RULE'}
              </Text>
            </View>
            <Text style={{ flex: 1, color: t.text, fontSize: 15, lineHeight: 21 }}>{r.text}</Text>
          </View>
          {r.sources.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
              {r.sources.map((id) => (
                <Pressable key={id} onPress={() => Linking.openURL(SOURCES[id].url)} accessibilityRole="link" hitSlop={4}>
                  <Text style={{ color: t.accent, fontSize: 13, textDecorationLine: 'underline' }}>
                    {SOURCES[id].org.replace(/ \(.*\)/, '')}: {SOURCES[id].title} ↗
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
