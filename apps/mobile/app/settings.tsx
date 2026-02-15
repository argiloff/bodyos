import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useThemePalette } from '../src/theme';

export default function SettingsScreen() {
  const theme = useThemePalette();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Einstellungen</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.key, { color: theme.muted }]}>Design</Text>
        <Text style={[styles.value, { color: theme.text }]}>Automatisch (hell/dunkel nach System)</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.key, { color: theme.muted }]}>App-Version</Text>
        <Text style={[styles.value, { color: theme.text }]}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  card: { borderRadius: 14, borderWidth: 1, padding: 12 },
  key: { fontSize: 13 },
  value: { marginTop: 4 },
});
