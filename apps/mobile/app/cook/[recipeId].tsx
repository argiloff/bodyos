import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';

export default function CookModeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { user, getResolvedRecipe, products } = useAuth();
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!user) return <Redirect href="/login" />;
  if (!recipeId) return <Redirect href="/(tabs)/planner" />;

  const recipe = getResolvedRecipe(recipeId);
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Rezept nicht verfügbar</Text>
      </View>
    );
  }

  const steps = recipe.instructions.length ? recipe.instructions : ['Keine Kochschritte hinterlegt'];
  const ingredientRows = recipe.ingredients.map((ingredient) => {
    const product = products.find((entry) => entry.id === ingredient.productId);
    return {
      key: `${ingredient.productId}-${ingredient.amount_g}`,
      name: product?.name ?? ingredient.productId,
      amount: ingredient.amount_g,
    };
  });

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.meta}>{recipe.mealType}</Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Schritt {step + 1} / {steps.length}</Text>
        <Text style={styles.stepText}>{steps[step]}</Text>
        <View style={styles.row}>
          <Pressable style={[styles.button, styles.secondary]} onPress={() => setStep((s) => Math.max(0, s - 1))}>
            <Text style={styles.buttonText}>Zurück</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            <Text style={styles.buttonText}>Weiter</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Zutaten</Text>
        {ingredientRows.map((item) => (
          <Pressable
            key={item.key}
            style={[styles.ingredient, checked[item.key] ? styles.ingredientChecked : undefined]}
            onPress={() => setChecked((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
          >
            <Text style={styles.ingredientText}>{checked[item.key] ? '☑' : '☐'} {item.name}</Text>
            <Text style={styles.ingredientAmount}>{item.amount} g</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#07090f' },
  container: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  meta: { color: '#94a3b8', textTransform: 'capitalize' },
  block: { backgroundColor: '#10172a', borderWidth: 1, borderColor: '#1f2937', borderRadius: 14, padding: 12, gap: 10 },
  blockTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  stepText: { color: '#e5e7eb', fontSize: 20, lineHeight: 30 },
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, backgroundColor: '#6ee7b7', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  secondary: { backgroundColor: '#334155' },
  buttonText: { color: '#111827', fontWeight: '700' },
  ingredient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0b1220',
  },
  ingredientChecked: { borderColor: '#6ee7b7' },
  ingredientText: { color: '#e5e7eb', fontSize: 16 },
  ingredientAmount: { color: '#94a3b8', fontWeight: '700' },
});
