import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import sampleImport from '../assets/data/import-100-recipes.json';
import { useThemePalette } from '../src/theme';

export default function ImportScreen() {
  const { importJson, clearSoft, clearHard, products, recipes } = useAuth();
  const theme = useThemePalette();
  const [jsonText, setJsonText] = useState('');
  const [status, setStatus] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Import & Zurücksetzen</Text>
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        multiline
        numberOfLines={14}
        value={jsonText}
        onChangeText={setJsonText}
        placeholder='{"products":[],"recipes":[]}'
        placeholderTextColor={theme.muted}
      />
      <Pressable
        style={[styles.button, styles.secondary, { backgroundColor: theme.cardAlt }]}
        onPress={() => {
          setJsonText(JSON.stringify(sampleImport));
          setStatus('Beispieldaten geladen');
        }}
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>100 Rezepte laden</Text>
      </Pressable>
      <Pressable
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={async () => {
          try {
            setStatus('Import läuft...');
            const payload = JSON.parse(jsonText);
            const result = await importJson(payload);
            setStatus(`Import erfolgreich: ${result.products} Produkte, ${result.recipes} Rezepte`);
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Import fehlgeschlagen');
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.accentText }]}>Importieren</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.danger, { backgroundColor: theme.danger }]}
        onPress={async () => {
          try {
            setStatus('Lösche...');
            await clearSoft();
            setStatus('Produkt-/Rezept-/Planungsdaten gelöscht');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Löschen fehlgeschlagen');
          }
        }}
      >
        <Text style={[styles.buttonText, styles.dangerText, { color: theme.dangerText }]}>Teil-Reset</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.danger, { backgroundColor: theme.danger }]}
        onPress={async () => {
          try {
            setStatus('Vollständiger Reset läuft...');
            await clearHard();
            setStatus('Alles gelöscht. Bitte neu einloggen.');
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Vollständiger Reset fehlgeschlagen');
          }
        }}
      >
        <Text style={[styles.buttonText, styles.dangerText, { color: theme.dangerText }]}>Vollständiger Reset</Text>
      </Pressable>
      <Text style={[styles.status, { color: theme.muted }]}>Aktuell: {products.length} Produkte / {recipes.length} Rezepte</Text>
      {status ? <Text style={[styles.status, { color: theme.muted }]}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  button: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontWeight: '700' },
  danger: {},
  secondary: {},
  dangerText: {},
  status: { marginTop: 8 },
});
