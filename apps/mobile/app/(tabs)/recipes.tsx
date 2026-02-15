import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MealType, Recipe, RecipeIngredient, useAuth } from '../../src/auth/AuthContext';

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
      style={styles.list}
      data={sortedRecipes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 140 }}
      ListHeaderComponent={
        <View style={styles.formCard}>
          <Text style={styles.title}>Rezept bearbeiten</Text>
          <TextInput value={draft.id} onChangeText={(v) => setDraft((d) => ({ ...d, id: v }))} style={styles.input} placeholder="id" placeholderTextColor="#64748b" />
          <TextInput value={draft.name} onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))} style={styles.input} placeholder="Name" placeholderTextColor="#64748b" />
          <TextInput value={draft.description} onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))} style={styles.input} placeholder="Beschreibung" placeholderTextColor="#64748b" />
          <View style={styles.typeRow}>
            {mealTypes.map((type) => (
              <Pressable
                key={type}
                style={[styles.typeChip, draft.mealType === type ? styles.typeChipActive : undefined]}
                onPress={() => setDraft((d) => ({ ...d, mealType: type }))}
              >
                <Text style={styles.typeChipText}>{type}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={tagsRaw} onChangeText={setTagsRaw} style={styles.input} placeholder="tags: high-protein,quick" placeholderTextColor="#64748b" />
          <TextInput
            value={ingredientsRaw}
            onChangeText={setIngredientsRaw}
            style={[styles.input, styles.area]}
            placeholder={'Zutaten je Zeile:\nproduct-id:150'}
            placeholderTextColor="#64748b"
            multiline
          />
          <TextInput
            value={stepsRaw}
            onChangeText={setStepsRaw}
            style={[styles.input, styles.area]}
            placeholder={'Schritte je Zeile:\n1. Schritt'}
            placeholderTextColor="#64748b"
            multiline
          />
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => void save()}>
              <Text style={styles.buttonText}>Speichern</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.secondary]}
              onPress={() => {
                setDraft(emptyRecipe);
                setIngredientsRaw('');
                setTagsRaw('');
                setStepsRaw('');
                setStatus('Neues Rezept');
              }}
            >
              <Text style={styles.buttonText}>Neu</Text>
            </Pressable>
          </View>
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.id} · {item.mealType}</Text>
          <Text style={styles.meta}>{item.ingredients.length} Zutaten · {item.instructions.length} Schritte</Text>
          <View style={styles.row}>
            <Pressable style={styles.smallButton} onPress={() => startEdit(item)}>
              <Text style={styles.smallButtonText}>Bearbeiten</Text>
            </Pressable>
            <Pressable style={[styles.smallButton, styles.delete]} onPress={() => void deleteRecipe(item.id)}>
              <Text style={styles.smallButtonText}>Löschen</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#07090f' },
  formCard: { backgroundColor: '#10172a', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12, marginBottom: 12, gap: 8 },
  title: { color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: '#fff',
    backgroundColor: '#0b1220',
  },
  area: { minHeight: 88, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderRadius: 12, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 6 },
  typeChipActive: { backgroundColor: '#334155' },
  typeChipText: { color: '#e5e7eb', fontSize: 12, textTransform: 'capitalize' },
  card: { backgroundColor: '#10172a', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12, gap: 4 },
  name: { color: '#fff', fontWeight: '700', fontSize: 16 },
  meta: { color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  button: { flex: 1, backgroundColor: '#6ee7b7', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondary: { backgroundColor: '#334155' },
  buttonText: { color: '#111827', fontWeight: '700' },
  smallButton: { backgroundColor: '#334155', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { color: '#e5e7eb', fontWeight: '600' },
  delete: { backgroundColor: '#b91c1c' },
  status: { color: '#94a3b8', marginTop: 4 },
});
