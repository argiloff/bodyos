import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { api } from '../../src/lib/api';

type Plan = { id: string };

type Profile = {
  calorieTarget?: number | null;
  proteinTarget?: number | null;
};

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get<Profile | null>('/api/profile', token),
      api.get<Plan[]>('/api/plans', token),
    ])
      .then(([profileData, plansData]) => {
        setProfile(profileData);
        setPlans(plansData);
      })
      .catch(() => {
        setProfile(null);
        setPlans([]);
      });
  }, [token]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen {user?.email}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ziel Makros</Text>
        <Text style={styles.cardValue}>
          {profile?.calorieTarget ?? '-'} kcal / {profile?.proteinTarget ?? '-'} g Protein
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gespeicherte Pläne</Text>
        <Text style={styles.cardValue}>{plans.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#07090f' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: '#10172a', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', padding: 14 },
  cardTitle: { color: '#94a3b8', fontSize: 14 },
  cardValue: { color: '#fff', marginTop: 6, fontSize: 18, fontWeight: '600' },
});
