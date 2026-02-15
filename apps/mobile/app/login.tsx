import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';

export default function LoginScreen() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('demo@bodyos.local');
  const [password, setPassword] = useState('Passw0rd!');
  const [status, setStatus] = useState('');

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BodyOS Login</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <Pressable
        style={styles.button}
        onPress={async () => {
          try {
            setStatus('Login läuft...');
            await login(email, password);
            setStatus('Erfolgreich eingeloggt');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Login fehlgeschlagen');
          }
        }}
      >
        <Text style={styles.buttonText}>Einloggen</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', gap: 12, backgroundColor: '#07090f' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    backgroundColor: '#10172a',
  },
  button: { backgroundColor: '#6ee7b7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#111827', fontWeight: '700' },
  status: { color: '#94a3b8', marginTop: 8 },
});
