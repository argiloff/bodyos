import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MealType, Recipe, RecipeIngredient, useAuth } from '../../src/auth/AuthContext';
import { mealTypeLabel, useThemePalette } from '../../src/theme';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const stepTemplates = [
  'Zutaten vorbereiten und abwiegen.',
  'Proteinquelle garen und dabei regelmäßig wenden.',
  'Gemüse/Beilage separat zubereiten und zusammenführen.',
  'Abschmecken, anrichten und servieren.',
];

type StepDraft = {
  text: string;
  imageUri?: string;
};

const emptyRecipe: Recipe = {
  id: '',
  name: '',
  description: '',
  mealType: 'lunch',
  tags: [],
  instructions: [],
  stepImageUris: [],
  ingredients: [],
};

const quickTags = ['proteinreich', 'alltag', 'vegetarisch', 'schnell', 'mealprep'];

export default function RecipesScreen() {
  const { products, recipes, upsertRecipe, deleteRecipe } = useAuth();
  const theme = useThemePalette();

  const [draft, setDraft] = useState<Recipe>(emptyRecipe);
  const [stepDraft, setStepDraft] = useState<StepDraft>({ text: '' });
  const [ingredientProductId, setIngredientProductId] = useState('');
  const [ingredientAmount, setIngredientAmount] = useState('120');
  const [productSearch, setProductSearch] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [status, setStatus] = useState('');

  const sortedRecipes = useMemo(() => [...recipes].sort((a, b) => a.name.localeCompare(b.name)), [recipes]);
  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const base = query
      ? products.filter((p) => p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query))
      : products;
    return base.slice(0, 12);
  }, [products, productSearch]);

  const recipeSteps: StepDraft[] = useMemo(
    () =>
      draft.instructions.map((text, index) => ({
        text,
        imageUri: draft.stepImageUris?.[index],
      })),
    [draft.instructions, draft.stepImageUris]
  );
  const selectedProduct = ingredientProductId ? productMap[ingredientProductId] : undefined;
  const recipeMacro = useMemo(() => {
    return draft.ingredients.reduce(
      (acc, ingredient) => {
        const product = productMap[ingredient.productId];
        if (!product) return acc;
        const factor = ingredient.amount_g / 100;
        return {
          kcal: acc.kcal + product.kcal_per_100g * factor,
          protein: acc.protein + product.protein_per_100g * factor,
        };
      },
      { kcal: 0, protein: 0 }
    );
  }, [draft.ingredients, productMap]);

  const startEdit = (recipe: Recipe) => {
    setDraft({
      ...recipe,
      stepImageUris: recipe.stepImageUris ?? [],
    });
    setStepDraft({ text: '' });
    setIngredientProductId('');
    setIngredientAmount('120');
    setProductSearch('');
    setCustomTag('');
    setStatus(`Bearbeite: ${recipe.name}`);
  };

  const resetComposer = () => {
    setDraft(emptyRecipe);
    setStepDraft({ text: '' });
    setIngredientProductId('');
    setIngredientAmount('120');
    setProductSearch('');
    setCustomTag('');
    setStatus('Neues Rezept');
  };

  const addIngredient = () => {
    const productId = ingredientProductId.trim();
    const amount = Number(ingredientAmount);
    if (!productId || !productMap[productId] || amount <= 0) {
      setStatus('Bitte Produkt und gültige Grammzahl wählen');
      return;
    }
    const existingIndex = draft.ingredients.findIndex((entry) => entry.productId === productId);
    const nextIngredients = [...draft.ingredients];
    if (existingIndex >= 0) {
      nextIngredients[existingIndex] = {
        ...nextIngredients[existingIndex],
        amount_g: nextIngredients[existingIndex].amount_g + amount,
      };
    } else {
      nextIngredients.push({ productId, amount_g: amount });
    }
    setDraft((prev) => ({ ...prev, ingredients: nextIngredients }));
    setIngredientAmount('120');
    setStatus('Zutat hinzugefügt');
  };

  const removeIngredient = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const pickStepImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatus('Medienzugriff wurde nicht erlaubt');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setStepDraft((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const addStep = () => {
    const text = stepDraft.text.trim();
    if (!text) {
      setStatus('Schritttext fehlt');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      instructions: [...prev.instructions, text],
      stepImageUris: [...(prev.stepImageUris ?? []), stepDraft.imageUri ?? ''],
    }));
    setStepDraft({ text: '' });
    setStatus('Schritt hinzugefügt');
  };

  const removeStep = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
      stepImageUris: (prev.stepImageUris ?? []).filter((_, i) => i !== index),
    }));
  };

  const toggleQuickTag = (tag: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const addCustomTag = () => {
    const normalized = customTag.trim().toLowerCase();
    if (!normalized) return;
    if (!draft.tags.includes(normalized)) {
      setDraft((prev) => ({ ...prev, tags: [...prev.tags, normalized] }));
    }
    setCustomTag('');
  };

  const addTemplateSteps = () => {
    if (draft.instructions.length) {
      setStatus('Vorlagen werden nur bei leeren Schritten eingefügt');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      instructions: [...stepTemplates],
      stepImageUris: ['', '', '', ''],
    }));
    setStatus('Vorlagen-Schritte eingefügt');
  };

  const save = async () => {
    try {
      if (!draft.name.trim()) throw new Error('Bitte einen Rezeptnamen eingeben');
      if (!draft.ingredients.length) throw new Error('Bitte mindestens eine Zutat hinzufügen');
      if (!draft.instructions.length) throw new Error('Bitte mindestens einen Kochschritt hinzufügen');
      await upsertRecipe({
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
      });
      setStatus('Rezept gespeichert');
      resetComposer();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Fehler beim Speichern');
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
          <Text style={[styles.title, { color: theme.text }]}>Rezept-Assistent</Text>
          <Text style={[styles.hint, { color: theme.muted }]}>Schnell erfassen: Name → Produkt wählen → Schritte hinzufügen</Text>

          <TextInput
            value={draft.name}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, name: v }))}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="Rezeptname"
            placeholderTextColor={theme.muted}
          />
          <TextInput
            value={draft.description}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, description: v }))}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="Kurzbeschreibung (optional)"
            placeholderTextColor={theme.muted}
          />

          <View style={styles.typeRow}>
            {mealTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeChip,
                  { borderColor: theme.border },
                  draft.mealType === type ? [styles.typeChipActive, { backgroundColor: theme.accent }] : undefined,
                ]}
                onPress={() => setDraft((prev) => ({ ...prev, mealType: type }))}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: draft.mealType === type ? theme.accentText : theme.text },
                  ]}
                >
                  {mealTypeLabel(type)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.tagWrap}>
            {quickTags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleQuickTag(tag)}
                style={[
                  styles.tagChip,
                  { borderColor: theme.border },
                  draft.tags.includes(tag) ? { backgroundColor: theme.cardAlt } : undefined,
                ]}
              >
                <Text style={{ color: theme.text, fontSize: 12 }}>{tag}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <TextInput
              value={customTag}
              onChangeText={setCustomTag}
              style={[styles.input, styles.flex, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
              placeholder="Eigenes Tag"
              placeholderTextColor={theme.muted}
            />
            <Pressable style={[styles.smallAction, { backgroundColor: theme.cardAlt }]} onPress={addCustomTag}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Tag +</Text>
            </Pressable>
          </View>

          <View style={[styles.section, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Zutaten hinzufügen</Text>
            <View style={styles.row}>
              <View style={[styles.macroBadge, { backgroundColor: theme.card }]}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{Math.round(recipeMacro.kcal)} kcal</Text>
              </View>
              <View style={[styles.macroBadge, { backgroundColor: theme.card }]}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{Math.round(recipeMacro.protein)} g Protein</Text>
              </View>
            </View>
            <TextInput
              value={productSearch}
              onChangeText={setProductSearch}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
              placeholder="Produkt suchen (Name oder ID)"
              placeholderTextColor={theme.muted}
            />
            <View style={styles.productList}>
              {filteredProducts.map((product) => (
                <Pressable
                  key={product.id}
                  style={[
                    styles.productPick,
                    { borderColor: theme.border, backgroundColor: theme.card },
                    ingredientProductId === product.id ? { borderColor: theme.accent } : undefined,
                  ]}
                  onPress={() => setIngredientProductId(product.id)}
                >
                  <Text style={{ color: theme.text, fontWeight: '600' }}>{product.name}</Text>
                  <Text style={{ color: theme.muted, fontSize: 11 }}>{product.id}</Text>
                </Pressable>
              ))}
            </View>
            {selectedProduct ? (
              <View style={[styles.selectedProductCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
                {selectedProduct.imageUri ? <Image source={{ uri: selectedProduct.imageUri }} style={styles.selectedProductImage} /> : null}
                <View style={styles.flex}>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{selectedProduct.name}</Text>
                  <Text style={{ color: theme.muted, fontSize: 12 }}>
                    {selectedProduct.kcal_per_100g} kcal / 100 g · {selectedProduct.protein_per_100g} g Protein
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={styles.row}>
              <TextInput
                value={ingredientAmount}
                onChangeText={setIngredientAmount}
                style={[styles.input, styles.flex, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                keyboardType="numeric"
                placeholder="Gramm"
                placeholderTextColor={theme.muted}
              />
              <Pressable style={[styles.smallAction, { backgroundColor: theme.accent }]} onPress={addIngredient}>
                <Text style={{ color: theme.accentText, fontWeight: '700' }}>Hinzufügen</Text>
              </Pressable>
            </View>
            {draft.ingredients.map((ingredient, index) => {
              const product = productMap[ingredient.productId];
              return (
                <View key={`${ingredient.productId}-${index}`} style={[styles.entryRow, { borderBottomColor: theme.border }]}>
                  <Text style={{ color: theme.text }}>{product?.name ?? ingredient.productId} · {ingredient.amount_g} g</Text>
                  <Pressable onPress={() => removeIngredient(index)}>
                    <Text style={{ color: theme.danger, fontWeight: '700' }}>Entfernen</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <View style={[styles.section, { borderColor: theme.border, backgroundColor: theme.cardAlt }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Kochschritte</Text>
            <Pressable style={[styles.smallAction, { backgroundColor: theme.card }]} onPress={addTemplateSteps}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Vorlagen-Schritte einfügen</Text>
            </Pressable>
            <TextInput
              value={stepDraft.text}
              onChangeText={(v) => setStepDraft((prev) => ({ ...prev, text: v }))}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
              placeholder="Schrittbeschreibung"
              placeholderTextColor={theme.muted}
            />
            <View style={styles.row}>
              <TextInput
                value={stepDraft.imageUri ?? ''}
                onChangeText={(v) => setStepDraft((prev) => ({ ...prev, imageUri: v }))}
                style={[styles.input, styles.flex, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                placeholder="Bild-URL (optional)"
                placeholderTextColor={theme.muted}
              />
              <Pressable style={[styles.smallAction, { backgroundColor: theme.card }]} onPress={() => void pickStepImage()}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Foto</Text>
              </Pressable>
            </View>
            {stepDraft.imageUri ? <Image source={{ uri: stepDraft.imageUri }} style={styles.preview} /> : null}
            <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={addStep}>
              <Text style={[styles.buttonText, { color: theme.accentText }]}>Schritt hinzufügen</Text>
            </Pressable>
            {recipeSteps.map((step, index) => (
              <View key={`${step.text}-${index}`} style={[styles.stepCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <Text style={{ color: theme.text, fontWeight: '700' }}>Schritt {index + 1}</Text>
                <Text style={{ color: theme.text, marginTop: 4 }}>{step.text}</Text>
                {step.imageUri ? <Image source={{ uri: step.imageUri }} style={styles.previewSmall} /> : null}
                <Pressable onPress={() => removeStep(index)}>
                  <Text style={{ color: theme.danger, fontWeight: '700', marginTop: 6 }}>Schritt entfernen</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => void save()}>
              <Text style={[styles.buttonText, { color: theme.accentText }]}>Rezept speichern</Text>
            </Pressable>
            <Pressable style={[styles.button, { backgroundColor: theme.cardAlt }]} onPress={resetComposer}>
              <Text style={[styles.buttonText, { color: theme.text }]}>Zurücksetzen</Text>
            </Pressable>
          </View>
          {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card }]}>
          {item.stepImageUris?.[0] ? <Image source={{ uri: item.stepImageUris[0] }} style={styles.cover} /> : null}
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={{ color: theme.muted }}>{mealTypeLabel(item.mealType)} · {item.ingredients.length} Zutaten · {item.instructions.length} Schritte</Text>
          <View style={styles.row}>
            <Pressable style={[styles.smallAction, { backgroundColor: theme.cardAlt }]} onPress={() => startEdit(item)}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Bearbeiten</Text>
            </Pressable>
            <Pressable style={[styles.smallAction, { backgroundColor: theme.danger }]} onPress={() => void deleteRecipe(item.id)}>
              <Text style={{ color: theme.dangerText, fontWeight: '700' }}>Löschen</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 12, gap: 10 },
  title: { fontWeight: '800', fontSize: 20 },
  hint: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  flex: { flex: 1 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  typeChipActive: {},
  typeChipText: { fontWeight: '700' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  section: { borderWidth: 1, borderRadius: 14, padding: 10, gap: 8 },
  sectionTitle: { fontWeight: '800', fontSize: 15 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  productList: { gap: 6, maxHeight: 190 },
  productPick: { borderWidth: 1, borderRadius: 10, padding: 8 },
  macroBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  selectedProductCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedProductImage: { width: 44, height: 44, borderRadius: 10 },
  smallAction: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  button: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  buttonText: { fontWeight: '800' },
  stepCard: { borderWidth: 1, borderRadius: 12, padding: 10 },
  preview: { width: '100%', height: 140, borderRadius: 10, marginTop: 4 },
  previewSmall: { width: '100%', height: 120, borderRadius: 10, marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  cover: { width: '100%', height: 120, borderRadius: 10, marginBottom: 2 },
  name: { fontWeight: '800', fontSize: 16 },
  status: { marginTop: 4 },
});
