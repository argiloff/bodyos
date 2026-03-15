import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Download, User, Settings, Database } from "lucide-react-native";
import { useData } from "../../db/DataProvider";
import { useThemePalette, spacing, typography, radii } from "../../theme";
import { Card, Section } from "../../components";

export default function MoreScreen() {
  const theme = useThemePalette();
  const router = useRouter();
  const { products, recipes, plans } = useData();
  const version = Constants.expoConfig?.version ?? "–";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.title, { color: theme.text }]}>Mehr</Text>

      <Section title="Daten">
        <Card onPress={() => router.push("/import")}>
          <View style={styles.row}>
            <Download size={20} color={theme.accent} />
            <View style={styles.cardText}>
              <Text style={[typography.bodyBold, { color: theme.text }]}>
                Import & Export
              </Text>
              <Text style={[typography.caption, { color: theme.muted }]}>
                Daten importieren oder exportieren
              </Text>
            </View>
          </View>
        </Card>
        <Card onPress={() => router.push("/profile")}>
          <View style={styles.row}>
            <User size={20} color={theme.accent} />
            <View style={styles.cardText}>
              <Text style={[typography.bodyBold, { color: theme.text }]}>
                Profil
              </Text>
              <Text style={[typography.caption, { color: theme.muted }]}>
                Ziele und Ausschlüsse verwalten
              </Text>
            </View>
          </View>
        </Card>
      </Section>

      <Section title="App">
        <Card onPress={() => router.push("/settings")}>
          <View style={styles.row}>
            <Settings size={20} color={theme.accent} />
            <View style={styles.cardText}>
              <Text style={[typography.bodyBold, { color: theme.text }]}>
                Einstellungen
              </Text>
              <Text style={[typography.caption, { color: theme.muted }]}>
                App-Einstellungen anpassen
              </Text>
            </View>
          </View>
        </Card>
      </Section>

      <Section title="Info">
        <Card>
          <View style={styles.row}>
            <Database size={20} color={theme.accent} />
            <View style={styles.cardText}>
              <Text style={[typography.bodyBold, { color: theme.text }]}>
                Version {version}
              </Text>
              <Text style={[typography.caption, { color: theme.muted }]}>
                {products.length} Produkte · {recipes.length} Rezepte ·{" "}
                {plans.length} Pläne
              </Text>
            </View>
          </View>
        </Card>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  cardText: { flex: 1, gap: 2 },
});
