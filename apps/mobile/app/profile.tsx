import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { api } from '../src/lib/api';

type Profile = {
  calorieTarget?: number | null;
  proteinTarget?: number | null;
  excludedProducts?: string[];
};

export default function ProfileScreen() {
  const { token } = useAuth();
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('140');
  const [excludedProducts, setExcludedProducts] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get<Profile | null>('/api/profile', token)
      .then((profile) => {
        if (!profile) return;
        if (profile.calorieTarget) setCalorieTarget(String(profile.calorieTarget));
        if (profile.proteinTarget) setProteinTarget(String(profile.proteinTarget));
        if (profile.excludedProducts) setExcludedProducts(profile.excludedProducts.join(','));
      })
      .catch(() => undefined);
  }, [token]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <TextInput value={calorieTarget} onChangeText={setCalorieTarget} style={styles.input} keyboardType="numeric" placeholder="Kalorien" placeholderTextColor="#64748b" />
      <TextInput value={proteinTarget} onChangeText={setProteinTarget} style={styles.input} keyboardType="numeric" placeholder="Protein" placeholderTextColor="#64748b" />
      <TextInput value={excludedProducts} onChangeText={setExcludedProducts} style={styles.input} placeholder="excluded ids: id1,id2" placeholderTextColor="#64748b" />
      <Pressable
        style={styles.button}
        onPress={async () => {
          if (!token) return;
          try {
            setStatus('Speichere...');
            await api.post('/api/profile', {
              calorieTarget: Number(calorieTarget),
              proteinTarget: Number(proteinTarget),
              excludedProducts: excludedProducts.split(',').map((s) => s.trim()).filter(Boolean),
            }, token);
            setStatus('Gespeichert');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Fehler');
          }
        }}
      >
        <Text style={styles.buttonText}>Speichern</Text>
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
  },
  button: { backgroundColor: '#6ee7b7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#111827', fontWeight: '700' },
  status: { color: '#94a3b8', marginTop: 8 },
});
