import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Plus, Search, Trash2, ChefHat, BookOpen } from "lucide-react-native";

import { useData } from "../../db/DataProvider";
import {
  useThemePalette,
  spacing,
  typography,
  radii,
  mealTypeLabel,
  mealTypeColor,
} from "../../theme";
import {
  Card,
  Button,
  Input,
  Chip,
  StatusMessage,
  Empty,
  Section,
  MacroBadge,
} from "../../components";
import type { MealType, RecipeWithDetails } from "../../types";
import { MEAL_TYPES, computeMacros, uid, slugify } from "../../types";

// ─── Draft types ──────────────────────────────────────────────
type IngredientDraft = { product_id: string; amount_g: number };
type StepDraft = { instruction: string; image_uri?: string };
type RecipeDraft = {
  id?: string;
  name: string;
  description: string;
  meal_type: MealType;
  tags: string[];
  ingredients: IngredientDraft[];
  steps: StepDraft[];
};

const emptyDraft: RecipeDraft = {
  name: "",
  description: "",
  meal_type: "lunch",
  tags: [],
  ingredients: [],
  steps: [],
};

// ─── Main Screen ──────────────────────────────────────────────
export default function RecipesScreen() {
  const { products, recipes, upsertRecipe, deleteRecipe } = useData();
  const theme = useThemePalette();
  const router = useRouter();

  // ── List state ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<MealType[]>([]);

  // ── Wizard state ──────────────────────────────────────────
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [draft, setDraft] = useState<RecipeDraft>({ ...emptyDraft });
  const [productSearch, setProductSearch] = useState("");
  const [ingredientAmount, setIngredientAmount] = useState("");
  const [stepText, setStepText] = useState("");
  const [status, setStatus] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  // ── Derived data ──────────────────────────────────────────
  const productsById = useMemo(() => {
    const map: Record<string, (typeof products)[number]> = {};
    for (const p of products) map[p.id] = p;
    return map;
  }, [products]);

  const filteredRecipes = useMemo(() => {
    let list = [...recipes];
    if (activeFilters.length > 0) {
      list = list.filter((r) => activeFilters.includes(r.meal_type));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [recipes, activeFilters, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 20);
    const q = productSearch.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [products, productSearch]);

  // ── Filter toggle ─────────────────────────────────────────
  const toggleFilter = useCallback((mt: MealType) => {
    setActiveFilters((prev) =>
      prev.includes(mt) ? prev.filter((f) => f !== mt) : [...prev, mt],
    );
  }, []);

  // ── Wizard helpers ────────────────────────────────────────
  const openNewRecipe = useCallback(() => {
    setDraft({ ...emptyDraft });
    setWizardStep(1);
    setShowWizard(true);
    setStatus(null);
  }, []);

  const openEditRecipe = useCallback((recipe: RecipeWithDetails) => {
    setDraft({
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      meal_type: recipe.meal_type,
      tags: [...recipe.tags],
      ingredients: recipe.ingredients.map((i) => ({
        product_id: i.product_id,
        amount_g: i.amount_g,
      })),
      steps: recipe.steps
        .sort((a, b) => a.step_number - b.step_number)
        .map((s) => ({ instruction: s.instruction, image_uri: s.image_uri })),
    });
    setWizardStep(1);
    setShowWizard(true);
    setStatus(null);
  }, []);

  const cancelWizard = useCallback(() => {
    setShowWizard(false);
    setDraft({ ...emptyDraft });
    setProductSearch("");
    setIngredientAmount("");
    setStepText("");
  }, []);

  const addIngredient = useCallback(
    (productId: string) => {
      const amount = parseFloat(ingredientAmount);
      if (!amount || amount <= 0) return;
      setDraft((prev) => {
        const existing = prev.ingredients.findIndex(
          (i) => i.product_id === productId,
        );
        const next = [...prev.ingredients];
        if (existing >= 0) {
          next[existing] = { ...next[existing], amount_g: amount };
        } else {
          next.push({ product_id: productId, amount_g: amount });
        }
        return { ...prev, ingredients: next };
      });
      setIngredientAmount("");
      setProductSearch("");
    },
    [ingredientAmount],
  );

  const removeIngredient = useCallback((productId: string) => {
    setDraft((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((i) => i.product_id !== productId),
    }));
  }, []);

  const addStep = useCallback(() => {
    const text = stepText.trim();
    if (!text) return;
    setDraft((prev) => ({
      ...prev,
      steps: [...prev.steps, { instruction: text }],
    }));
    setStepText("");
  }, [stepText]);

  const removeStep = useCallback((index: number) => {
    setDraft((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  }, []);

  const saveRecipe = useCallback(async () => {
    if (!draft.name.trim()) {
      setStatus({ message: "Bitte einen Namen eingeben.", variant: "error" });
      return;
    }
    if (draft.ingredients.length === 0) {
      setStatus({
        message: "Mindestens eine Zutat hinzufügen.",
        variant: "error",
      });
      return;
    }
    try {
      await upsertRecipe(
        {
          id: draft.id,
          name: draft.name.trim(),
          description: draft.description.trim(),
          meal_type: draft.meal_type,
          tags: draft.tags,
        },
        draft.ingredients,
        draft.steps,
      );
      setStatus({
        message: draft.id ? "Rezept aktualisiert!" : "Rezept erstellt!",
        variant: "success",
      });
      cancelWizard();
    } catch {
      setStatus({ message: "Fehler beim Speichern.", variant: "error" });
    }
  }, [draft, upsertRecipe, cancelWizard]);

  const confirmDelete = useCallback(
    (recipe: RecipeWithDetails) => {
      Alert.alert("Rezept löschen", `"${recipe.name}" wirklich löschen?`, [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              setStatus({ message: "Rezept gelöscht.", variant: "success" });
            } catch {
              setStatus({ message: "Fehler beim Löschen.", variant: "error" });
            }
          },
        },
      ]);
    },
    [deleteRecipe],
  );

  // ── Wizard Renderer ───────────────────────────────────────
  const renderWizard = () => {
    if (!showWizard) return null;

    return (
      <Card style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.title,
            { color: theme.text, marginBottom: spacing.md },
          ]}
        >
          {draft.id ? "Rezept bearbeiten" : "Neues Rezept"}
        </Text>

        {/* Step indicator */}
        <View style={s.stepIndicator}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                s.stepDot,
                {
                  backgroundColor:
                    wizardStep >= step ? theme.accent : theme.surface,
                  borderColor: wizardStep >= step ? theme.accent : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  {
                    color: wizardStep >= step ? theme.accentText : theme.muted,
                  },
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Basic info */}
        {wizardStep === 1 && (
          <Section
            title="Grunddaten"
            subtitle="Name, Beschreibung & Mahlzeittyp"
          >
            <Input
              label="Name"
              placeholder="z.B. Protein-Bowl"
              value={draft.name}
              onChangeText={(t) => setDraft((p) => ({ ...p, name: t }))}
            />
            <Input
              label="Beschreibung"
              placeholder="Kurze Beschreibung…"
              value={draft.description}
              onChangeText={(t) => setDraft((p) => ({ ...p, description: t }))}
              multiline
            />
            <Text
              style={[typography.captionBold, { color: theme.textSecondary }]}
            >
              Mahlzeittyp
            </Text>
            <View style={s.chipRow}>
              {MEAL_TYPES.map((mt) => (
                <Chip
                  key={mt}
                  label={mealTypeLabel(mt)}
                  selected={draft.meal_type === mt}
                  color={mealTypeColor(mt, theme)}
                  onPress={() => setDraft((p) => ({ ...p, meal_type: mt }))}
                />
              ))}
            </View>
          </Section>
        )}

        {/* Step 2: Ingredients */}
        {wizardStep === 2 && (
          <Section title="Zutaten" subtitle="Produkte suchen und hinzufügen">
            {/* Current ingredients */}
            {draft.ingredients.length > 0 && (
              <View style={{ gap: spacing.xs }}>
                {draft.ingredients.map((ing) => {
                  const prod = productsById[ing.product_id];
                  return (
                    <View key={ing.product_id} style={s.ingredientRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.body, { color: theme.text }]}>
                          {prod?.name ?? ing.product_id}
                        </Text>
                        <Text
                          style={[typography.caption, { color: theme.muted }]}
                        >
                          {ing.amount_g}g
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => removeIngredient(ing.product_id)}
                      >
                        <Trash2 size={18} color={theme.danger} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Search and add */}
            <Input
              placeholder="Produkt suchen…"
              value={productSearch}
              onChangeText={setProductSearch}
            />
            {productSearch.trim().length > 0 && (
              <View style={{ maxHeight: 180, gap: spacing.xs }}>
                {filteredProducts.map((p) => (
                  <View key={p.id} style={s.productPickRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: theme.text }]}>
                        {p.name}
                      </Text>
                      <Text style={[typography.small, { color: theme.muted }]}>
                        {p.kcal_per_100g} kcal · {p.protein_per_100g}g P / 100g
                      </Text>
                    </View>
                    <View style={s.amountInputRow}>
                      <Input
                        placeholder="g"
                        value={ingredientAmount}
                        onChangeText={setIngredientAmount}
                        keyboardType="numeric"
                        containerStyle={{ width: 70 }}
                      />
                      <Button
                        label="+"
                        size="sm"
                        onPress={() => addIngredient(p.id)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Section>
        )}

        {/* Step 3: Steps */}
        {wizardStep === 3 && (
          <Section title="Zubereitung" subtitle="Schritte für die Anleitung">
            {draft.steps.map((step, idx) => (
              <View key={idx} style={s.stepRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[typography.captionBold, { color: theme.accent }]}
                  >
                    Schritt {idx + 1}
                  </Text>
                  <Text style={[typography.body, { color: theme.text }]}>
                    {step.instruction}
                  </Text>
                </View>
                <Pressable onPress={() => removeStep(idx)}>
                  <Trash2 size={18} color={theme.danger} />
                </Pressable>
              </View>
            ))}
            <Input
              placeholder="Anweisung eingeben…"
              value={stepText}
              onChangeText={setStepText}
              multiline
            />
            <Button
              label="Schritt hinzufügen"
              variant="outline"
              size="sm"
              onPress={addStep}
              icon={<Plus size={16} color={theme.accent} />}
            />
          </Section>
        )}

        {/* Navigation buttons */}
        <View style={s.wizardNav}>
          <Button
            label="Abbrechen"
            variant="ghost"
            size="sm"
            onPress={cancelWizard}
          />
          <View style={{ flex: 1 }} />
          {wizardStep > 1 && (
            <Button
              label="Zurück"
              variant="secondary"
              size="sm"
              onPress={() => setWizardStep((s) => s - 1)}
            />
          )}
          {wizardStep < 3 ? (
            <Button
              label="Weiter"
              variant="primary"
              size="sm"
              onPress={() => setWizardStep((s) => s + 1)}
            />
          ) : (
            <Button
              label="Speichern"
              variant="primary"
              size="sm"
              onPress={saveRecipe}
            />
          )}
        </View>
      </Card>
    );
  };

  // ── Recipe Card Renderer ──────────────────────────────────
  const renderRecipeCard = useCallback(
    ({ item }: { item: RecipeWithDetails }) => {
      const macros = computeMacros(
        item.ingredients.map((i) => ({
          product_id: i.product_id,
          amount_g: i.amount_g,
        })),
        productsById,
      );
      const mtColor = mealTypeColor(item.meal_type, theme);

      return (
        <Card style={{ marginBottom: spacing.md }}>
          {/* Header */}
          <View style={s.cardHeader}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={[typography.subtitle, { color: theme.text }]}>
                {item.name}
              </Text>
              {item.description ? (
                <Text
                  style={[typography.caption, { color: theme.muted }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}
            </View>
            <View
              style={[
                s.mealBadge,
                { backgroundColor: mtColor + "22", borderColor: mtColor },
              ]}
            >
              <Text
                style={[
                  typography.small,
                  { color: mtColor, fontWeight: "700" },
                ]}
              >
                {mealTypeLabel(item.meal_type)}
              </Text>
            </View>
          </View>

          {/* Meta */}
          <View style={s.metaRow}>
            <Text style={[typography.caption, { color: theme.muted }]}>
              {item.ingredients.length} Zutat
              {item.ingredients.length !== 1 ? "en" : ""}
            </Text>
            <Text style={[typography.caption, { color: theme.muted }]}>·</Text>
            <Text style={[typography.caption, { color: theme.muted }]}>
              {item.steps.length} Schritt{item.steps.length !== 1 ? "e" : ""}
            </Text>
          </View>

          {/* Macros */}
          <MacroBadge macros={macros} compact />

          {/* Actions */}
          <View style={s.cardActions}>
            <Button
              label="Bearbeiten"
              variant="outline"
              size="sm"
              icon={<BookOpen size={14} color={theme.accent} />}
              onPress={() => openEditRecipe(item)}
            />
            <Button
              label="Kochen"
              variant="primary"
              size="sm"
              icon={<ChefHat size={14} color={theme.accentText} />}
              onPress={() => router.push(`/cook/${item.id}`)}
            />
            <Pressable
              onPress={() => confirmDelete(item)}
              style={s.deleteButton}
            >
              <Trash2 size={18} color={theme.danger} />
            </Pressable>
          </View>
        </Card>
      );
    },
    [productsById, theme, openEditRecipe, confirmDelete, router],
  );

  // ── Main Render ───────────────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={renderRecipeCard}
        contentContainerStyle={s.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            {/* Title row */}
            <View style={s.titleRow}>
              <Text style={[typography.hero, { color: theme.text }]}>
                Rezepte
              </Text>
              <Button
                label="Neu"
                variant="primary"
                size="sm"
                icon={<Plus size={16} color={theme.accentText} />}
                onPress={openNewRecipe}
              />
            </View>

            {/* Status */}
            {status && (
              <StatusMessage
                message={status.message}
                variant={status.variant}
              />
            )}

            {/* Wizard */}
            {renderWizard()}

            {/* Search */}
            <View style={s.searchRow}>
              <Search size={18} color={theme.muted} />
              <Input
                placeholder="Rezept suchen…"
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={{ flex: 1 }}
              />
            </View>

            {/* Filter chips */}
            <View style={s.chipRow}>
              {MEAL_TYPES.map((mt) => (
                <Chip
                  key={mt}
                  label={mealTypeLabel(mt)}
                  selected={activeFilters.includes(mt)}
                  color={mealTypeColor(mt, theme)}
                  onPress={() => toggleFilter(mt)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Empty
            icon={<ChefHat size={40} color={theme.muted} />}
            title="Keine Rezepte gefunden"
            message={
              searchQuery || activeFilters.length > 0
                ? "Versuche andere Suchbegriffe oder Filter."
                : "Erstelle dein erstes Rezept mit dem + Button oben."
            }
          />
        }
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    gap: spacing.sm,
  },
  productPickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  wizardNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  mealBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  deleteButton: {
    marginLeft: "auto",
    padding: spacing.sm,
  },
});
