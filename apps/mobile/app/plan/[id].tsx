import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlanMeal, useAuth } from '../../src/auth/AuthContext';
import { mealTypeLabel, useThemePalette } from '../../src/theme';

const mealOrder: Record<string, number> = {
  breakfast: 0,
  lunch: 1,
  dinner: 2,
  snack: 3,
};

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, getPlanById, getResolvedRecipe, getGroceryListByPlan, deletePlan } = useAuth();
  const theme = useThemePalette();

  if (!user) return <Redirect href="/login" />;
  if (!id) return <Redirect href="/(tabs)/planner" />;

  const plan = getPlanById(id);
  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Plan nicht gefunden</Text>
      </View>
    );
  }

  const grouped = plan.meals.reduce<Record<string, PlanMeal[]>>((acc, meal) => {
    acc[meal.date] = acc[meal.date] ?? [];
    acc[meal.date].push(meal);
    return acc;
  }, {});

  const grocery = getGroceryListByPlan(plan.id);
  const days = Object.keys(grouped).sort();

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: theme.background }]} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Plan {plan.startDate} bis {plan.endDate}</Text>
      <Text style={[styles.meta, { color: theme.muted }]}>{plan.calorieTarget} kcal · {plan.proteinTarget} g Protein</Text>

      <View style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.blockTitle, { color: theme.text }]}>Mahlzeiten</Text>
        {days.map((day) => (
          <View key={day} style={[styles.dayCard, { borderColor: theme.border }]}>
            <Text style={[styles.dayTitle, { color: theme.text }]}>{day}</Text>
            {grouped[day]
              .slice()
              .sort((a, b) => mealOrder[a.mealType] - mealOrder[b.mealType])
              .map((meal) => {
                const recipe = getResolvedRecipe(meal.recipeId);
                return (
                  <Link key={`${day}-${meal.mealType}-${meal.recipeId}`} href={`/cook/${meal.recipeId}`} asChild>
                    <Pressable style={[styles.mealRow, { backgroundColor: theme.cardAlt }]}>
                      <Text style={[styles.mealType, { color: theme.accent }]}>{mealTypeLabel(meal.mealType)}</Text>
                      <Text style={[styles.mealName, { color: theme.text }]}>{recipe?.name ?? 'Rezept nicht verfügbar'}</Text>
                    </Pressable>
                  </Link>
                );
              })}
          </View>
        ))}
      </View>

      <View style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.blockTitle, { color: theme.text }]}>Einkaufsliste</Text>
        {grocery.map((item) => (
          <View key={item.productId} style={[styles.groceryRow, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.groceryName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.groceryMeta, { color: theme.muted }]}>{item.category}</Text>
            </View>
            <Text style={[styles.groceryAmount, { color: theme.text }]}>{item.amount_g} g</Text>
          </View>
        ))}
        {!grocery.length ? <Text style={[styles.meta, { color: theme.muted }]}>Keine Zutaten gefunden</Text> : null}
      </View>

      <Pressable
        style={[styles.delete, { backgroundColor: theme.danger }]}
        onPress={async () => {
          await deletePlan(plan.id);
          router.replace('/(tabs)/planner');
        }}
      >
        <Text style={[styles.deleteText, { color: theme.dangerText }]}>Plan löschen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
scroll: { flex: 1 },
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  meta: {},
  block: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  blockTitle: { fontWeight: '700', fontSize: 16 },
  dayCard: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 6 },
  dayTitle: { fontWeight: '700' },
  mealRow: { borderRadius: 10, padding: 9, gap: 2 },
  mealType: { fontSize: 12, fontWeight: '700' },
  mealName: {},
  groceryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 6 },
  groceryName: { fontWeight: '600' },
  groceryMeta: { fontSize: 12 },
  groceryAmount: { fontWeight: '700' },
  delete: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  deleteText: { fontWeight: '700' },
});
