import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { mealTypeLabel, useThemePalette } from '../../src/theme';

export default function CookModeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { user, getResolvedRecipe, products } = useAuth();
  const theme = useThemePalette();
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!user) return <Redirect href="/login" />;
  if (!recipeId) return <Redirect href="/(tabs)/planner" />;

  const recipe = getResolvedRecipe(recipeId);
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Rezept nicht verfügbar</Text>
      </View>
    );
  }

  const steps = recipe.instructions.length ? recipe.instructions : ['Keine Kochschritte hinterlegt'];
  const stepProgress = ((step + 1) / steps.length) * 100;
  const ingredientRows = recipe.ingredients.map((ingredient) => {
    const product = products.find((entry) => entry.id === ingredient.productId);
    return {
      key: `${ingredient.productId}-${ingredient.amount_g}`,
      name: product?.name ?? ingredient.productId,
      amount: ingredient.amount_g,
      imageUri: product?.imageUri,
    };
  });

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: theme.background }]} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{recipe.name}</Text>
      <Text style={[styles.meta, { color: theme.muted }]}>{mealTypeLabel(recipe.mealType)}</Text>

      <View style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.blockTitle, { color: theme.text }]}>Schritt {step + 1} / {steps.length}</Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.cardAlt }]}>
          <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${stepProgress}%` }]} />
        </View>
        <Text style={[styles.stepText, { color: theme.text }]}>{steps[step]}</Text>
        {recipe.stepImageUris?.[step] ? <Image source={{ uri: recipe.stepImageUris[step] }} style={styles.stepImage} /> : null}
        <View style={styles.row}>
          <Pressable style={[styles.button, styles.secondary, { backgroundColor: theme.cardAlt }]} onPress={() => setStep((s) => Math.max(0, s - 1))}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Zurück</Text>
          </Pressable>
          <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            <Text style={[styles.buttonText, { color: theme.accentText }]}>{step + 1 === steps.length ? 'Fertig' : 'Weiter'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.block, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.blockTitle, { color: theme.text }]}>Zutaten</Text>
        {ingredientRows.map((item) => (
          <Pressable
            key={item.key}
            style={[
              styles.ingredient,
              { borderColor: theme.border, backgroundColor: theme.cardAlt },
              checked[item.key] ? [styles.ingredientChecked, { borderColor: theme.accent }] : undefined,
            ]}
            onPress={() => setChecked((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
          >
            <Text style={[styles.ingredientText, { color: theme.text }]}>{checked[item.key] ? '☑' : '☐'} {item.name}</Text>
            <View style={styles.ingredientRight}>
              {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.ingredientImage} /> : null}
              <Text style={[styles.ingredientAmount, { color: theme.muted }]}>{item.amount} g</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700' },
  meta: { textTransform: 'capitalize' },
  block: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  blockTitle: { fontSize: 17, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  stepText: { fontSize: 20, lineHeight: 30 },
  stepImage: { width: '100%', height: 170, borderRadius: 10 },
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  secondary: {},
  buttonText: { fontWeight: '700' },
  ingredient: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientChecked: {},
  ingredientText: { fontSize: 16 },
  ingredientRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ingredientImage: { width: 36, height: 36, borderRadius: 8 },
  ingredientAmount: { fontWeight: '700' },
});
