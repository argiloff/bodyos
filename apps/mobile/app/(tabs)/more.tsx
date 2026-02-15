import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { useThemePalette } from '../../src/theme';

export default function MoreScreen() {
  const { logout, user } = useAuth();
  const theme = useThemePalette();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mehr</Text>
      <Link href="/import" asChild>
        <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Import</Text>
          <Text style={[styles.cardMeta, { color: theme.muted }]}>JSON importieren und Daten löschen</Text>
        </Pressable>
      </Link>
      <Link href="/profile" asChild>
        <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Profil</Text>
          <Text style={[styles.cardMeta, { color: theme.muted }]}>Ziele und Ausschlüsse verwalten</Text>
        </Pressable>
      </Link>
      <Link href="/settings" asChild>
        <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Einstellungen</Text>
          <Text style={[styles.cardMeta, { color: theme.muted }]}>App- und Kontoeinstellungen</Text>
        </Pressable>
      </Link>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardMeta, { color: theme.muted }]}>Eingeloggt als {user?.email}</Text>
        <Pressable style={[styles.logout, { borderColor: theme.border }]} onPress={() => void logout()}>
          <Text style={[styles.logoutText, { color: theme.text }]}>Abmelden</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  card: { borderRadius: 14, borderWidth: 1, padding: 12 },
  cardTitle: { fontWeight: '700', fontSize: 16 },
  cardMeta: { marginTop: 4 },
  logout: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: { fontWeight: '600' },
});
