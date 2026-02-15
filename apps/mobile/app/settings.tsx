import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Einstellungen</Text>
      <View style={styles.card}>
        <Text style={styles.key}>Modus</Text>
        <Text style={styles.value}>Offline-first (lokale Daten in App)</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.key}>App Version</Text>
        <Text style={styles.value}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#07090f' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: '#10172a', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  key: { color: '#94a3b8', fontSize: 13 },
  value: { color: '#fff', marginTop: 4 },
});
