import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { api } from '../src/lib/api';

export default function ImportScreen() {
  const { token } = useAuth();
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import & Reset</Text>
      <TextInput
        style={styles.input}
        multiline
        numberOfLines={14}
        value={jsonText}
        onChangeText={setJsonText}
        placeholder='{"products":[],"recipes":[]}'
        placeholderTextColor="#64748b"
      />
      <Pressable
        style={styles.button}
        onPress={async () => {
          if (!token) return;
          try {
            setStatus('Import läuft...');
            const payload = JSON.parse(jsonText);
            await api.post('/api/import', payload, token);
            setStatus('Import erfolgreich');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Import fehlgeschlagen');
          }
        }}
      >
        <Text style={styles.buttonText}>Importieren</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.danger]}
        onPress={async () => {
          if (!token) return;
          try {
            setStatus('Lösche...');
            await api.delete('/api/import', token);
            setStatus('Produkt-/Rezept-/Planungsdaten gelöscht');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Löschen fehlgeschlagen');
          }
        }}
      >
        <Text style={[styles.buttonText, styles.dangerText]}>Soft Delete</Text>
      </Pressable>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#07090f' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    backgroundColor: '#10172a',
    textAlignVertical: 'top',
  },
  button: { backgroundColor: '#6ee7b7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#111827', fontWeight: '700' },
  danger: { backgroundColor: '#ef4444' },
  dangerText: { color: '#fff' },
  status: { color: '#94a3b8', marginTop: 8 },
});
