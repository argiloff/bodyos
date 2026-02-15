import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Product, useAuth } from '../../src/auth/AuthContext';

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

  return (
    <FlatList
      style={styles.list}
      data={sortedProducts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 140 }}
      ListHeaderComponent={
        <View style={styles.formCard}>
          <Text style={styles.title}>Produkt bearbeiten</Text>
          <TextInput value={draft.id} onChangeText={(v) => setDraft((d) => ({ ...d, id: v }))} style={styles.input} placeholder="id (slug)" placeholderTextColor="#64748b" />
          <TextInput value={draft.name} onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))} style={styles.input} placeholder="Name" placeholderTextColor="#64748b" />
          <TextInput value={draft.category} onChangeText={(v) => setDraft((d) => ({ ...d, category: v }))} style={styles.input} placeholder="Kategorie" placeholderTextColor="#64748b" />
          <TextInput
            value={String(draft.kcal_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, kcal_per_100g: Number(v) || 0 }))}
            style={styles.input}
            placeholder="kcal pro 100g"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.protein_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, protein_per_100g: Number(v) || 0 }))}
            style={styles.input}
            placeholder="protein pro 100g"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.fat_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, fat_per_100g: Number(v) || 0 }))}
            style={styles.input}
            placeholder="fett pro 100g"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.carbs_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, carbs_per_100g: Number(v) || 0 }))}
            style={styles.input}
            placeholder="kohlenhydrate pro 100g"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
          />
          <TextInput
            value={String(draft.fiber_per_100g)}
            onChangeText={(v) => setDraft((d) => ({ ...d, fiber_per_100g: Number(v) || 0 }))}
            style={styles.input}
            placeholder="ballaststoffe pro 100g"
            placeholderTextColor="#64748b"
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
            style={styles.input}
            placeholder="substitutes: id1,id2"
            placeholderTextColor="#64748b"
          />
          <View style={styles.row}>
            <Pressable style={styles.button} onPress={() => void save()}>
              <Text style={styles.buttonText}>Speichern</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.secondary]}
              onPress={() => {
                setDraft(emptyProduct);
                setStatus('Neues Produkt');
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
          <Text style={styles.meta}>{item.id} · {item.category}</Text>
          <Text style={styles.meta}>{item.kcal_per_100g} kcal / {item.protein_per_100g}g Protein</Text>
          <View style={styles.row}>
            <Pressable style={styles.smallButton} onPress={() => startEdit(item)}>
              <Text style={styles.smallButtonText}>Bearbeiten</Text>
            </Pressable>
            <Pressable style={[styles.smallButton, styles.delete]} onPress={() => void deleteProduct(item.id)}>
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
