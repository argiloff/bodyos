import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';

export default function MoreScreen() {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mehr</Text>
      <Link href="/import" asChild>
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>Import</Text>
          <Text style={styles.cardMeta}>JSON importieren und Daten löschen</Text>
        </Pressable>
      </Link>
      <Link href="/profile" asChild>
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>Profil</Text>
          <Text style={styles.cardMeta}>Ziele und Ausschlüsse verwalten</Text>
        </Pressable>
      </Link>
      <Link href="/settings" asChild>
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>Einstellungen</Text>
          <Text style={styles.cardMeta}>App- und Kontoeinstellungen</Text>
        </Pressable>
      </Link>
      <View style={styles.card}>
        <Text style={styles.cardMeta}>Eingeloggt als {user?.email}</Text>
        <Pressable style={styles.logout} onPress={() => void logout()}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#07090f' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: '#10172a', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardMeta: { color: '#94a3b8', marginTop: 4 },
  logout: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: { color: '#e5e7eb', fontWeight: '600' },
});
