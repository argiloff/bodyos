import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { useThemePalette } from '../src/theme';

export default function ProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const theme = useThemePalette();
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('140');
  const [excludedProducts, setExcludedProducts] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!profile) return;
    if (profile.calorieTarget) setCalorieTarget(String(profile.calorieTarget));
    if (profile.proteinTarget) setProteinTarget(String(profile.proteinTarget));
    if (profile.excludedProducts) setExcludedProducts(profile.excludedProducts.join(','));
  }, [profile]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Profil</Text>
      <TextInput value={calorieTarget} onChangeText={setCalorieTarget} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} keyboardType="numeric" placeholder="Kalorienziel" placeholderTextColor={theme.muted} />
      <TextInput value={proteinTarget} onChangeText={setProteinTarget} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} keyboardType="numeric" placeholder="Proteinziel" placeholderTextColor={theme.muted} />
      <TextInput value={excludedProducts} onChangeText={setExcludedProducts} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} placeholder="Ausgeschlossene IDs: id1,id2" placeholderTextColor={theme.muted} />
      <Pressable
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={async () => {
          try {
            setStatus('Speichere...');
            await updateProfile({
              calorieTarget: Number(calorieTarget),
              proteinTarget: Number(proteinTarget),
              excludedProducts: excludedProducts.split(',').map((s) => s.trim()).filter(Boolean),
            });
            setStatus('Gespeichert');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Fehler');
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.accentText }]}>Speichern</Text>
      </Pressable>
      {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
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
