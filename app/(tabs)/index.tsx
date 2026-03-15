import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { mealTypeLabel, useThemePalette } from '../../src/theme';

export default function HomeScreen() {
  const { user, profile, plans, products, recipes } = useAuth();
  const theme = useThemePalette();
  const latestPlan = plans[0];
  const totalMeals = plans.reduce((sum, plan) => sum + plan.meals.length, 0);
  const latestMeals = latestPlan?.meals.length ?? 0;
  const latestLunchCount = latestPlan?.meals.filter((m) => m.mealType === 'lunch').length ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Willkommen zurück</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{user?.email}</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.muted }]}>Ziel-Makros</Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>
          {profile?.calorieTarget ?? '-'} kcal / {profile?.proteinTarget ?? '-'} g Protein
        </Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.muted }]}>Pläne gesamt</Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>{plans.length}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.muted }]}>Datenbestand</Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>{products.length} Produkte / {recipes.length} Rezepte</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.muted }]}>Nächster Plan</Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>
          {latestPlan ? `${latestPlan.startDate} bis ${latestPlan.endDate}` : 'Noch kein Plan vorhanden'}
        </Text>
        {latestPlan ? (
          <Text style={[styles.cardMeta, { color: theme.muted }]}>
            {latestMeals} Mahlzeiten · {mealTypeLabel('lunch')}: {latestLunchCount}
          </Text>
        ) : null}
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.muted }]}>Aktivität</Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>{totalMeals} geplante Mahlzeiten insgesamt</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { marginTop: -8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: 14 },
  cardValue: { marginTop: 6, fontSize: 18, fontWeight: '600' },
  cardMeta: { marginTop: 4 },
});
