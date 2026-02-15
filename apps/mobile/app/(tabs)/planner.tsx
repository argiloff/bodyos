import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';

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
  const [startDate, setStartDate] = useState(INITIAL_START_DATE);
  const [endDate, setEndDate] = useState(INITIAL_END_DATE);
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('140');
  const [status, setStatus] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plan erstellen</Text>
      <TextInput value={startDate} onChangeText={setStartDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#64748b" />
      <TextInput value={endDate} onChangeText={setEndDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#64748b" />
      <TextInput value={calorieTarget} onChangeText={setCalorieTarget} style={styles.input} keyboardType="numeric" placeholder="Kalorien" placeholderTextColor="#64748b" />
      <TextInput value={proteinTarget} onChangeText={setProteinTarget} style={styles.input} keyboardType="numeric" placeholder="Protein" placeholderTextColor="#64748b" />
      <Pressable
        style={styles.button}
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
        <Text style={styles.buttonText}>Plan generieren</Text>
      </Pressable>
      <Text style={styles.status}>Pläne gesamt: {plans.length}</Text>
      <View style={styles.planList}>
        {plans.slice(0, 6).map((plan) => (
          <Link key={plan.id} href={`/plan/${plan.id}`} asChild>
            <Pressable style={styles.planCard}>
              <Text style={styles.planTitle}>{plan.startDate} bis {plan.endDate}</Text>
              <Text style={styles.planMeta}>{plan.calorieTarget} kcal · {plan.proteinTarget}g Protein</Text>
              <Text style={styles.planMeta}>{plan.meals.length} Mahlzeiten</Text>
            </Pressable>
          </Link>
        ))}
      </View>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10, backgroundColor: '#07090f' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    backgroundColor: '#10172a',
  },
  button: { backgroundColor: '#6ee7b7', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#111827', fontWeight: '700' },
  status: { color: '#94a3b8', marginTop: 8 },
  planList: { gap: 8, marginTop: 8 },
  planCard: { borderWidth: 1, borderColor: '#1f2937', borderRadius: 12, backgroundColor: '#10172a', padding: 10 },
  planTitle: { color: '#fff', fontWeight: '700' },
  planMeta: { color: '#94a3b8', marginTop: 3 },
});
