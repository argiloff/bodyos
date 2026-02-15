import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { useThemePalette } from '../src/theme';

export default function LoginScreen() {
  const { login, user, loading } = useAuth();
  const theme = useThemePalette();
  const [email, setEmail] = useState('demo@bodyos.local');
  const [password, setPassword] = useState('Passw0rd!');
  const [status, setStatus] = useState('');

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>BodyOS Anmeldung</Text>
      <TextInput value={email} onChangeText={setEmail} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} keyboardType="email-address" autoCapitalize="none" placeholder="E-Mail" placeholderTextColor={theme.muted} />
      <TextInput value={password} onChangeText={setPassword} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} secureTextEntry placeholder="Passwort" placeholderTextColor={theme.muted} />
      <Pressable
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={async () => {
          try {
            setStatus('Anmeldung läuft...');
            await login(email, password);
            setStatus('Erfolgreich eingeloggt');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen');
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.accentText }]}>Einloggen</Text>
      </Pressable>
      {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontWeight: '700' },
  status: { marginTop: 8 },
});
