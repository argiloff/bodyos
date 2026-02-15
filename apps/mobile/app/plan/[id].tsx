import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlanMeal, useAuth } from '../../src/auth/AuthContext';

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

  if (!user) return <Redirect href="/login" />;
  if (!id) return <Redirect href="/(tabs)/planner" />;

  const plan = getPlanById(id);
  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Plan nicht gefunden</Text>
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Plan {plan.startDate} bis {plan.endDate}</Text>
      <Text style={styles.meta}>{plan.calorieTarget} kcal · {plan.proteinTarget}g Protein</Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Mahlzeiten</Text>
        {days.map((day) => (
          <View key={day} style={styles.dayCard}>
            <Text style={styles.dayTitle}>{day}</Text>
            {grouped[day]
              .slice()
              .sort((a, b) => mealOrder[a.mealType] - mealOrder[b.mealType])
              .map((meal) => {
                const recipe = getResolvedRecipe(meal.recipeId);
                return (
                  <Link key={`${day}-${meal.mealType}-${meal.recipeId}`} href={`/cook/${meal.recipeId}`} asChild>
                    <Pressable style={styles.mealRow}>
                      <Text style={styles.mealType}>{meal.mealType}</Text>
                      <Text style={styles.mealName}>{recipe?.name ?? 'Rezept nicht verfügbar'}</Text>
                    </Pressable>
                  </Link>
                );
              })}
          </View>
        ))}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Einkaufsliste</Text>
        {grocery.map((item) => (
          <View key={item.productId} style={styles.groceryRow}>
            <View>
              <Text style={styles.groceryName}>{item.name}</Text>
              <Text style={styles.groceryMeta}>{item.category}</Text>
            </View>
            <Text style={styles.groceryAmount}>{item.amount_g} g</Text>
          </View>
        ))}
        {!grocery.length ? <Text style={styles.meta}>Keine Zutaten gefunden</Text> : null}
      </View>

      <Pressable
        style={styles.delete}
        onPress={async () => {
          await deletePlan(plan.id);
          router.replace('/(tabs)/planner');
        }}
      >
        <Text style={styles.deleteText}>Plan löschen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#07090f' },
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  meta: { color: '#94a3b8' },
  block: { backgroundColor: '#10172a', borderWidth: 1, borderColor: '#1f2937', borderRadius: 14, padding: 12, gap: 8 },
  blockTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dayCard: { borderWidth: 1, borderColor: '#22314d', borderRadius: 12, padding: 10, gap: 6 },
  dayTitle: { color: '#e2e8f0', fontWeight: '700' },
  mealRow: { borderRadius: 10, backgroundColor: '#0b1220', padding: 9, gap: 2 },
  mealType: { color: '#6ee7b7', textTransform: 'capitalize', fontSize: 12, fontWeight: '700' },
  mealName: { color: '#e5e7eb' },
  groceryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingVertical: 6 },
  groceryName: { color: '#fff', fontWeight: '600' },
  groceryMeta: { color: '#94a3b8', fontSize: 12 },
  groceryAmount: { color: '#e2e8f0', fontWeight: '700' },
  delete: { backgroundColor: '#b91c1c', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  deleteText: { color: '#fff', fontWeight: '700' },
});
