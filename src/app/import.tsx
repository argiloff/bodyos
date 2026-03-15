import { useState } from "react";
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

let sampleImport: any = null;
try {
  sampleImport = require("../../assets/data/import-100-recipes.json");
} catch {
  // sample file may not exist
}

export default function ImportScreen() {
  const {
    importJson,
    exportJson,
    clearData,
    clearAll,
    products,
    recipes,
    reload,
  } = useData();
  const theme = useThemePalette();
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState("");

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.title, { color: theme.text }]}>
        Import & Zurücksetzen
      </Text>

      <Text style={[typography.caption, { color: theme.muted }]}>
        Aktuell: {products.length} Produkte / {recipes.length} Rezepte
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.inputBorder,
            color: theme.text,
            backgroundColor: theme.inputBackground,
          },
        ]}
        multiline
        numberOfLines={10}
        value={jsonText}
        onChangeText={setJsonText}
        placeholder='{"products":[],"recipes":[]}'
        placeholderTextColor={theme.placeholder}
        textAlignVertical="top"
      />

      {/* Load sample data */}
      {sampleImport ? (
        <Pressable
          style={[styles.button, { backgroundColor: theme.cardAlt }]}
          onPress={() => {
            setJsonText(JSON.stringify(sampleImport));
            setStatus(
              "Beispieldaten geladen – jetzt auf 'Importieren' tippen.",
            );
          }}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            100 Rezepte laden
          </Text>
        </Pressable>
      ) : null}

      {/* Import */}
      <Pressable
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={async () => {
          try {
            setStatus("Import läuft...");
            const payload = JSON.parse(jsonText);
            const result = await importJson(payload);
            setStatus(
              `Import erfolgreich: ${result.products} Produkte, ${result.recipes} Rezepte`,
            );
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Import fehlgeschlagen",
            );
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.accentText }]}>
          Importieren
        </Text>
      </Pressable>

      {/* Export */}
      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
          },
        ]}
        onPress={async () => {
          try {
            setStatus("Export wird erstellt...");
            const json = await exportJson();
            setJsonText(json);
            setStatus("Export in Textfeld geladen – kopieren oder teilen.");
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Export fehlgeschlagen",
            );
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>
          Exportieren
        </Text>
      </Pressable>

      {/* Soft reset */}
      <Pressable
        style={[styles.button, { backgroundColor: theme.dangerLight }]}
        onPress={async () => {
          try {
            setStatus("Lösche Daten...");
            await clearData();
            setStatus("Produkt-/Rezept-/Planungsdaten gelöscht.");
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Löschen fehlgeschlagen",
            );
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.danger }]}>
          Teil-Reset
        </Text>
      </Pressable>

      {/* Hard reset */}
      <Pressable
        style={[styles.button, { backgroundColor: theme.danger }]}
        onPress={async () => {
          try {
            setStatus("Vollständiger Reset läuft...");
            await clearAll();
            setStatus("Alles gelöscht.");
          } catch (error) {
            setStatus(
              error instanceof Error
                ? error.message
                : "Vollständiger Reset fehlgeschlagen",
            );
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.dangerText }]}>
          Vollständiger Reset
        </Text>
      </Pressable>

      {status ? (
        <Text
          style={[
            typography.body,
            { color: theme.muted, marginTop: spacing.sm },
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
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 160,
    fontSize: 13,
    fontFamily: "monospace",
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonText: {
    ...typography.button,
  },
});
