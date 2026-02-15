import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useThemePalette } from '../src/theme';

export default function NotFoundScreen() {
  const theme = useThemePalette();

  return (
    <>
      <Stack.Screen options={{ title: 'Nicht gefunden' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Diese Seite existiert nicht.</Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: theme.accent }]}>Zum Dashboard</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: { fontSize: 14 },
});
