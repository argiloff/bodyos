import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import {
  ChefHat,
  CalendarDays,
  ShoppingCart,
  Plus,
  UtensilsCrossed,
} from "lucide-react-native";
import { useData } from "../../db/DataProvider";
import {
  useThemePalette,
  spacing,
  typography,
  mealTypeLabel,
  mealTypeColor,
} from "../../theme";
import { Card, Button, MacroBadge } from "../../components";

export default function DashboardScreen() {
  const { products, recipes, plans, profile } = useData();
  const theme = useThemePalette();
  const router = useRouter();
  const latestPlan = plans[0] ?? null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
    >
      {/* ── Hero ──────────────────────────────────────────── */}
      <View style={styles.hero}>
        <UtensilsCrossed size={32} color={theme.accent} />
        <Text
          style={[
            typography.hero,
            { color: theme.text, marginTop: spacing.sm },
          ]}
        >
          Willkommen zurück
        </Text>
        <Text style={[typography.body, { color: theme.muted }]}>
          Dein Überblick auf einen Blick
        </Text>
      </View>

      {/* ── Quick Actions ────────────────────────────────── */}
      <Text
        style={[
          typography.subtitle,
          { color: theme.text, marginBottom: spacing.sm },
        ]}
      >
        Schnellzugriff
      </Text>
      <View style={styles.actionsRow}>
        <Card
          variant="elevated"
          onPress={() => router.push("/(tabs)/planner")}
          style={styles.actionCard}
        >
          <ChefHat size={22} color={theme.accent} />
          <Text
            style={[
              typography.captionBold,
              { color: theme.text, marginTop: spacing.xs },
            ]}
          >
            Heute kochen
          </Text>
        </Card>
        <Card
          variant="elevated"
          onPress={() => router.push("/(tabs)/planner")}
          style={styles.actionCard}
        >
          <CalendarDays size={22} color={theme.accent} />
          <Text
            style={[
              typography.captionBold,
              { color: theme.text, marginTop: spacing.xs },
            ]}
          >
            Plan erstellen
          </Text>
        </Card>
        <Card
          variant="elevated"
          onPress={() =>
            latestPlan &&
            router.push({
              pathname: "/(tabs)/planner",
              params: { planId: latestPlan.id },
            })
          }
          style={[
            styles.actionCard,
            !latestPlan ? { opacity: 0.4 } : undefined,
          ]}
        >
          <ShoppingCart size={22} color={theme.accent} />
          <Text
            style={[
              typography.captionBold,
              { color: theme.text, marginTop: spacing.xs },
            ]}
          >
            Einkaufsliste
          </Text>
        </Card>
      </View>

      {/* ── Stats ────────────────────────────────────────── */}
      <Card style={{ marginTop: spacing.lg }}>
        <Text
          style={[
            typography.subtitle,
            { color: theme.text, marginBottom: spacing.md },
          ]}
        >
          Datenbestand
        </Text>
        <View style={styles.statsRow}>
          {[
            { label: "Produkte", value: products.length },
            { label: "Rezepte", value: recipes.length },
            { label: "Pläne", value: plans.length },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[typography.title, { color: theme.accent }]}>
                {s.value}
              </Text>
              <Text style={[typography.caption, { color: theme.muted }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* ── Latest Plan ──────────────────────────────────── */}
      {latestPlan && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text
            style={[
              typography.subtitle,
              { color: theme.text, marginBottom: spacing.xs },
            ]}
          >
            Aktueller Plan
          </Text>
          <Text
            style={[
              typography.caption,
              { color: theme.muted, marginBottom: spacing.md },
            ]}
          >
            {latestPlan.start_date} – {latestPlan.end_date}
          </Text>
          <MacroBadge
            compact
            macros={{
              kcal: latestPlan.calorie_target,
              protein: latestPlan.protein_target,
              fat: 0,
              carbs: 0,
              fiber: 0,
            }}
          />
          <Text
            style={[
              typography.body,
              { color: theme.textSecondary, marginTop: spacing.md },
            ]}
          >
            {latestPlan.meals.length} Mahlzeiten geplant
          </Text>
        </Card>
      )}

      {/* ── Macro Targets ────────────────────────────────── */}
      {(profile.calorie_target > 0 || profile.protein_target > 0) && (
        <Card style={{ marginTop: spacing.lg }}>
          <Text
            style={[
              typography.subtitle,
              { color: theme.text, marginBottom: spacing.md },
            ]}
          >
            Ziel-Makros
          </Text>
          <MacroBadge
            macros={{
              kcal: profile.calorie_target,
              protein: profile.protein_target,
              fat: 0,
              carbs: 0,
              fiber: 0,
            }}
          />
        </Card>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  hero: { marginBottom: spacing.xl },
  actionsRow: { flexDirection: "row", gap: spacing.sm },
  actionCard: { flex: 1, alignItems: "center", paddingVertical: spacing.lg },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
});
