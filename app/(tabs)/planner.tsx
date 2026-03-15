import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { useThemePalette } from '../../src/theme';

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const INITIAL_START_DATE = formatDate(new Date());
const INITIAL_END_DATE = (() => {
  const date = new Date();
  date.setDate(date.getDate() + 6);
  return formatDate(date);
})();

export default function PlannerScreen() {
  const { generatePlan, plans } = useAuth();
  const theme = useThemePalette();
  const router = useRouter();
  const [startDate, setStartDate] = useState(INITIAL_START_DATE);
  const [endDate, setEndDate] = useState(INITIAL_END_DATE);
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('140');
  const [status, setStatus] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Planung</Text>
      <TextInput value={startDate} onChangeText={setStartDate} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted} />
      <TextInput value={endDate} onChangeText={setEndDate} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.muted} />
      <TextInput value={calorieTarget} onChangeText={setCalorieTarget} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} keyboardType="numeric" placeholder="Kalorienziel" placeholderTextColor={theme.muted} />
      <TextInput value={proteinTarget} onChangeText={setProteinTarget} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} keyboardType="numeric" placeholder="Proteinziel" placeholderTextColor={theme.muted} />
      <Pressable
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={async () => {
          try {
            setStatus('Erstelle Plan...');
            await generatePlan({
              startDate,
              endDate,
              calorieTarget: Number(calorieTarget),
              proteinTarget: Number(proteinTarget),
            });
            setStatus('Plan gespeichert');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Fehler');
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.accentText }]}>Plan generieren</Text>
      </Pressable>
      <Text style={[styles.status, { color: theme.muted }]}>Pläne gesamt: {plans.length}</Text>
      <View style={styles.planList}>
        {plans.slice(0, 6).map((plan) => (
          <Pressable
            key={plan.id}
            style={[styles.planCard, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={() => router.push(`/plan/${plan.id}`)}
          >
            <Text style={[styles.planTitle, { color: theme.text }]}>{plan.startDate} bis {plan.endDate}</Text>
            <Text style={[styles.planMeta, { color: theme.muted }]}>{plan.calorieTarget} kcal · {plan.proteinTarget} g Protein</Text>
            <Text style={[styles.planMeta, { color: theme.muted }]}>{plan.meals.length} Mahlzeiten</Text>
          </Pressable>
        ))}
      </View>
      {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { fontWeight: '700' },
  status: { marginTop: 8 },
  planList: { gap: 8, marginTop: 8 },
  planCard: { borderWidth: 1, borderRadius: 12, padding: 10 },
  planTitle: { fontWeight: '700' },
  planMeta: { marginTop: 3 },
});
