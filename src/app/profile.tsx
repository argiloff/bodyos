import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useData } from "../db/DataProvider";
import { useThemePalette, spacing, radii, typography } from "../theme";

export default function ProfileScreen() {
  const { profile, updateProfile, products } = useData();
  const theme = useThemePalette();

  const [calorieTarget, setCalorieTarget] = useState(
    String(profile.calorie_target),
  );
  const [proteinTarget, setProteinTarget] = useState(
    String(profile.protein_target),
  );
  const [excludedProducts, setExcludedProducts] = useState(
    profile.excluded_product_ids.join(", "),
  );
  const [status, setStatus] = useState("");

  useEffect(() => {
    setCalorieTarget(String(profile.calorie_target));
    setProteinTarget(String(profile.protein_target));
    setExcludedProducts(profile.excluded_product_ids.join(", "));
  }, [profile]);

  const excludedList = excludedProducts
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.title, { color: theme.text }]}>Profil</Text>
      <Text
        style={[
          typography.caption,
          { color: theme.muted, marginBottom: spacing.sm },
        ]}
      >
        Passe deine Ernährungsziele und Ausschlüsse an.
      </Text>

      {/* Calorie target */}
      <View style={styles.field}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>
          Kalorienziel (kcal/Tag)
        </Text>
        <TextInput
          value={calorieTarget}
          onChangeText={setCalorieTarget}
          style={[
            styles.input,
            {
              borderColor: theme.inputBorder,
              color: theme.text,
              backgroundColor: theme.inputBackground,
            },
          ]}
          keyboardType="numeric"
          placeholder="z. B. 2000"
          placeholderTextColor={theme.placeholder}
        />
      </View>

      {/* Protein target */}
      <View style={styles.field}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>
          Proteinziel (g/Tag)
        </Text>
        <TextInput
          value={proteinTarget}
          onChangeText={setProteinTarget}
          style={[
            styles.input,
            {
              borderColor: theme.inputBorder,
              color: theme.text,
              backgroundColor: theme.inputBackground,
            },
          ]}
          keyboardType="numeric"
          placeholder="z. B. 140"
          placeholderTextColor={theme.placeholder}
        />
      </View>

      {/* Excluded products */}
      <View style={styles.field}>
        <Text style={[typography.captionBold, { color: theme.textSecondary }]}>
          Ausgeschlossene Produkte (IDs, kommagetrennt)
        </Text>
        <TextInput
          value={excludedProducts}
          onChangeText={setExcludedProducts}
          style={[
            styles.input,
            styles.inputMultiline,
            {
              borderColor: theme.inputBorder,
              color: theme.text,
              backgroundColor: theme.inputBackground,
            },
          ]}
          placeholder="z. B. milk-1-5, egg"
          placeholderTextColor={theme.placeholder}
          multiline
          numberOfLines={3}
        />
        {excludedList.length > 0 && (
          <View style={styles.chipRow}>
            {excludedList.map((id) => {
              const product = products.find((p) => p.id === id);
              return (
                <View
                  key={id}
                  style={[styles.chip, { backgroundColor: theme.dangerLight }]}
                >
                  <Text style={[typography.small, { color: theme.danger }]}>
                    {product ? product.name : id}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Save button */}
      <Pressable
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={async () => {
          try {
            setStatus("Speichere…");
            await updateProfile({
              calorie_target: Number(calorieTarget) || profile.calorie_target,
              protein_target: Number(proteinTarget) || profile.protein_target,
              excluded_product_ids: excludedList,
            });
            setStatus("Gespeichert ✓");
            setTimeout(() => setStatus(""), 2000);
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Fehler beim Speichern",
            );
          }
        }}
      >
        <Text style={[typography.button, { color: theme.accentText }]}>
          Speichern
        </Text>
      </Pressable>

      {status ? (
        <Text
          style={[
            typography.caption,
            { color: theme.muted, marginTop: spacing.xs },
          ]}
        >
          {status}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputMultiline: {
    textAlignVertical: "top",
    minHeight: 60,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: spacing.sm,
  },
});
