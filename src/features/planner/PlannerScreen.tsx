import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { CalendarDays, Plus, ChevronRight, Trash2 } from "lucide-react-native";
import { useData } from "../../db/DataProvider";
import {
  useThemePalette,
  spacing,
  typography,
  radii,
  mealTypeLabel,
} from "../../theme";
import {
  Card,
  Button,
  Input,
  StatusMessage,
  Empty,
  Section,
} from "../../components";
import { today, daysFromNow } from "../../utils/helpers";

export default function PlannerScreen() {
  const theme = useThemePalette();
  const router = useRouter();
  const { plans, profile, generatePlan, deletePlan } = useData();

  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(daysFromNow(6));
  const [calorieTarget, setCalorieTarget] = useState(
    String(profile.calorie_target),
  );
  const [proteinTarget, setProteinTarget] = useState(
    String(profile.protein_target),
  );
  const [status, setStatus] = useState("");
  const [statusVariant, setStatusVariant] = useState<
    "success" | "error" | "info"
  >("info");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setStatus("Plan wird generiert…");
    setStatusVariant("info");
    try {
      await generatePlan({
        startDate,
        endDate,
        calorieTarget: Number(calorieTarget),
        proteinTarget: Number(proteinTarget),
      });
      setStatus("Plan erfolgreich erstellt!");
      setStatusVariant("success");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Fehler beim Erstellen");
      setStatusVariant("error");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Plan löschen", "Möchtest du diesen Plan wirklich löschen?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: () => deletePlan(id),
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Section
        title="Neuen Plan erstellen"
        subtitle="Zeitraum und Ziele festlegen"
      >
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Startdatum"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Enddatum"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Kalorien (kcal)"
              value={calorieTarget}
              onChangeText={setCalorieTarget}
              keyboardType="numeric"
              placeholder="z.B. 2000"
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Protein (g)"
              value={proteinTarget}
              onChangeText={setProteinTarget}
              keyboardType="numeric"
              placeholder="z.B. 140"
            />
          </View>
        </View>
        <Button
          label="Plan generieren"
          onPress={handleGenerate}
          variant="primary"
          size="lg"
          fullWidth
          loading={generating}
          disabled={generating}
          icon={<Plus size={18} color={theme.accentText} />}
        />
        {status ? (
          <StatusMessage message={status} variant={statusVariant} />
        ) : null}
      </Section>

      <Section
        title="Deine Pläne"
        subtitle={`${plans.length} Plan${plans.length !== 1 ? "e" : ""} vorhanden`}
      >
        {plans.length === 0 ? (
          <Empty
            icon={<CalendarDays size={40} color={theme.muted} />}
            title="Keine Pläne"
            message="Erstelle deinen ersten Ernährungsplan oben."
          />
        ) : (
          <View style={styles.list}>
            {plans.map((plan) => (
              <Card
                key={plan.id}
                onPress={() => router.push(`/plan/${plan.id}`)}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardBody}>
                    <Text style={[typography.subtitle, { color: theme.text }]}>
                      {plan.start_date} bis {plan.end_date}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: theme.muted, marginTop: spacing.xs },
                      ]}
                    >
                      {plan.calorie_target} kcal · {plan.protein_target} g
                      Protein
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: theme.muted, marginTop: spacing.xs },
                      ]}
                    >
                      {plan.meals.length} Mahlzeit
                      {plan.meals.length !== 1 ? "en" : ""}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => handleDelete(plan.id)}
                      hitSlop={8}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={18} color={theme.danger} />
                    </Pressable>
                    <ChevronRight size={20} color={theme.muted} />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  row: { flexDirection: "row", gap: spacing.md },
  halfInput: { flex: 1 },
  list: { gap: spacing.md },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardBody: { flex: 1 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  deleteBtn: { padding: spacing.xs },
});
