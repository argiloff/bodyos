import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MealType, Recipe, RecipeIngredient, useAuth } from '../../src/auth/AuthContext';
import { mealTypeLabel, useThemePalette } from '../../src/theme';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const emptyRecipe: Recipe = {
  id: '',
  name: '',
  description: '',
  mealType: 'lunch',
  tags: [],
  instructions: [],
  ingredients: [],
};

function serializeIngredients(ingredients: RecipeIngredient[]) {
  return ingredients.map((entry) => `${entry.productId}:${entry.amount_g}`).join('\n');
}

function parseIngredients(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [productIdRaw, amountRaw] = line.split(':');
      return {
        productId: (productIdRaw ?? '').trim(),
        amount_g: Number(amountRaw) || 0,
      };
    })
    .filter((entry) => entry.productId && entry.amount_g > 0);
}

export default function RecipesScreen() {
  const { recipes, upsertRecipe, deleteRecipe } = useAuth();
  const theme = useThemePalette();
  const [draft, setDraft] = useState<Recipe>(emptyRecipe);
  const [ingredientsRaw, setIngredientsRaw] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const [stepsRaw, setStepsRaw] = useState('');
  const [status, setStatus] = useState('');

  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.name.localeCompare(b.name)),
    [recipes]
  );

  const startEdit = (recipe: Recipe) => {
    setDraft(recipe);
    setIngredientsRaw(serializeIngredients(recipe.ingredients));
    setTagsRaw(recipe.tags.join(','));
    setStepsRaw(recipe.instructions.join('\n'));
    setStatus(`Bearbeite ${recipe.name}`);
  };

  const save = async () => {
    try {
      const ingredients = parseIngredients(ingredientsRaw);
      if (!draft.id.trim() || !draft.name.trim()) throw new Error('Rezept-ID und Name sind erforderlich');
      if (!ingredients.length) throw new Error('Mindestens eine gültige Zutat erforderlich');
      await upsertRecipe({
        ...draft,
        id: draft.id.trim(),
        ingredients,
        tags: tagsRaw.split(',').map((item) => item.trim()).filter(Boolean),
        instructions: stepsRaw.split('\n').map((step) => step.trim()).filter(Boolean),
      });
      setDraft(emptyRecipe);
      setIngredientsRaw('');
      setTagsRaw('');
      setStepsRaw('');
      setStatus('Rezept gespeichert');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Fehler');
    }
  };

  return (
    <FlatList
      style={[styles.list, { backgroundColor: theme.background }]}
      data={sortedRecipes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 140 }}
      ListHeaderComponent={
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Rezept bearbeiten</Text>
          <TextInput value={draft.id} onChangeText={(v) => setDraft((d) => ({ ...d, id: v }))} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]} placeholder="id" placeholderTextColor={theme.muted} />
          <TextInput value={draft.name} onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]} placeholder="Name" placeholderTextColor={theme.muted} />
          <TextInput value={draft.description} onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]} placeholder="Beschreibung" placeholderTextColor={theme.muted} />
          <View style={styles.typeRow}>
            {mealTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeChip,
                  { borderColor: theme.border },
                  draft.mealType === type ? [styles.typeChipActive, { backgroundColor: theme.cardAlt }] : undefined,
                ]}
                onPress={() => setDraft((d) => ({ ...d, mealType: type }))}
              >
                <Text style={[styles.typeChipText, { color: theme.text }]}>{mealTypeLabel(type)}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={tagsRaw} onChangeText={setTagsRaw} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]} placeholder="Tags: proteinreich,alltag" placeholderTextColor={theme.muted} />
          <TextInput
            value={ingredientsRaw}
            onChangeText={setIngredientsRaw}
            style={[styles.input, styles.area, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder={'Zutaten je Zeile:\nproduct-id:150'}
            placeholderTextColor={theme.muted}
            multiline
          />
          <TextInput
            value={stepsRaw}
            onChangeText={setStepsRaw}
            style={[styles.input, styles.area, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder={'Schritte je Zeile:\n1. Schritt'}
            placeholderTextColor={theme.muted}
            multiline
          />
          <View style={styles.row}>
            <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => void save()}>
              <Text style={[styles.buttonText, { color: theme.accentText }]}>Speichern</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.secondary, { backgroundColor: theme.cardAlt }]}
              onPress={() => {
                setDraft(emptyRecipe);
                setIngredientsRaw('');
                setTagsRaw('');
                setStepsRaw('');
                setStatus('Neues Rezept');
              }}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Neu</Text>
            </Pressable>
          </View>
          {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>{item.id} · {mealTypeLabel(item.mealType)}</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>{item.ingredients.length} Zutaten · {item.instructions.length} Schritte</Text>
          <View style={styles.row}>
            <Pressable style={[styles.smallButton, { backgroundColor: theme.cardAlt }]} onPress={() => startEdit(item)}>
              <Text style={[styles.smallButtonText, { color: theme.text }]}>Bearbeiten</Text>
            </Pressable>
            <Pressable style={[styles.smallButton, styles.delete, { backgroundColor: theme.danger }]} onPress={() => void deleteRecipe(item.id)}>
              <Text style={[styles.smallButtonText, { color: theme.dangerText }]}>Löschen</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12, gap: 8 },
  title: { fontWeight: '700', fontSize: 18, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  area: { minHeight: 88, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  typeChipActive: {},
  typeChipText: { fontSize: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  name: { fontWeight: '700', fontSize: 16 },
  meta: {},
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  button: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondary: {},
  buttonText: { fontWeight: '700' },
  smallButton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { fontWeight: '600' },
  delete: {},
  status: { marginTop: 4 },
});
