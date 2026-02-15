import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Product, useAuth } from '../../src/auth/AuthContext';
import { useThemePalette } from '../../src/theme';

const emptyProduct: Product = {
  id: '',
  name: '',
  category: '',
  kcal_per_100g: 0,
  protein_per_100g: 0,
  fat_per_100g: 0,
  carbs_per_100g: 0,
  fiber_per_100g: 0,
  allowed_substitutes: [],
};

export default function ProductsScreen() {
  const { products, upsertProduct, deleteProduct } = useAuth();
  const theme = useThemePalette();
  const [draft, setDraft] = useState<Product>(emptyProduct);
  const [status, setStatus] = useState('');

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  const save = async () => {
    try {
      if (!draft.id.trim() || !draft.name.trim()) throw new Error('Produkt-ID und Name sind erforderlich');
      await upsertProduct({ ...draft, id: draft.id.trim() });
      setStatus('Produkt gespeichert');
      setDraft(emptyProduct);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Fehler');
    }
  };

  const startEdit = (product: Product) => {
    setDraft(product);
    setStatus(`Bearbeite ${product.name}`);
  };

  const pickProductImage = async () => {
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
      setDraft((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
      setStatus('Produktbild hinzugefügt');
    }
  };

  return (
    <FlatList
      style={[styles.list, { backgroundColor: theme.background }]}
      data={sortedProducts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 140 }}
      ListHeaderComponent={
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Produkt bearbeiten</Text>
          <TextInput value={draft.id} onChangeText={(v) => setDraft((d) => ({ ...d, id: v }))} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]} placeholder="id (slug)" placeholderTextColor={theme.muted} />
          <TextInput value={draft.name} onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]} placeholder="Name" placeholderTextColor={theme.muted} />
          <TextInput value={draft.category} onChangeText={(v) => setDraft((d) => ({ ...d, category: v }))} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]} placeholder="Kategorie" placeholderTextColor={theme.muted} />
          <View style={styles.row}>
            <TextInput
              value={draft.imageUri ?? ''}
              onChangeText={(v) => setDraft((d) => ({ ...d, imageUri: v }))}
              style={[styles.input, styles.flex, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
              placeholder="Bild-URL (optional)"
              placeholderTextColor={theme.muted}
            />
            <Pressable style={[styles.smallButton, { backgroundColor: theme.cardAlt }]} onPress={() => void pickProductImage()}>
              <Text style={[styles.smallButtonText, { color: theme.text }]}>Foto</Text>
            </Pressable>
          </View>
          {draft.imageUri ? <Image source={{ uri: draft.imageUri }} style={styles.preview} /> : null}
          <TextInput
            value={String(draft.kcal_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, kcal_per_100g: Number(v) || 0 }))}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="kcal pro 100g"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.protein_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, protein_per_100g: Number(v) || 0 }))}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="protein pro 100g"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.fat_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, fat_per_100g: Number(v) || 0 }))}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="fett pro 100g"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.carbs_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, carbs_per_100g: Number(v) || 0 }))}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="kohlenhydrate pro 100g"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.fiber_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, fiber_per_100g: Number(v) || 0 }))}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="ballaststoffe pro 100g"
            placeholderTextColor={theme.muted}
            keyboardType="numeric"
          />
          <TextInput
            value={draft.allowed_substitutes.join(',')}
            onChangeText={(v) =>
              setDraft((d) => ({
                ...d,
                allowed_substitutes: v.split(',').map((item) => item.trim()).filter(Boolean),
              }))
            }
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardAlt }]}
            placeholder="substitutes: id1,id2"
            placeholderTextColor={theme.muted}
          />
          <View style={styles.row}>
            <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => void save()}>
              <Text style={[styles.buttonText, { color: theme.accentText }]}>Speichern</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.secondary, { backgroundColor: theme.cardAlt }]}
              onPress={() => {
                setDraft(emptyProduct);
                setStatus('Neues Produkt');
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
          {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.previewSmall} /> : null}
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>{item.id} · {item.category}</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>{item.kcal_per_100g} kcal / {item.protein_per_100g} g Protein</Text>
          <View style={styles.row}>
            <Pressable style={[styles.smallButton, { backgroundColor: theme.cardAlt }]} onPress={() => startEdit(item)}>
              <Text style={[styles.smallButtonText, { color: theme.text }]}>Bearbeiten</Text>
            </Pressable>
            <Pressable style={[styles.smallButton, styles.delete, { backgroundColor: theme.danger }]} onPress={() => void deleteProduct(item.id)}>
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
  card: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  name: { fontWeight: '700', fontSize: 16 },
  meta: {},
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  flex: { flex: 1 },
  button: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondary: {},
  buttonText: { fontWeight: '700' },
  smallButton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  smallButtonText: { fontWeight: '600' },
  delete: {},
  status: { marginTop: 4 },
  preview: { width: '100%', height: 130, borderRadius: 10, marginTop: 4 },
  previewSmall: { width: '100%', height: 100, borderRadius: 10, marginBottom: 4 },
});
