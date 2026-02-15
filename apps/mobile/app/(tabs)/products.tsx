import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';

export default function ProductsScreen() {
  const { products } = useAuth();

  return (
    <FlatList
      style={styles.list}
      data={products}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.category}</Text>
          <Text style={styles.meta}>{item.kcal_per_100g} kcal / {item.protein_per_100g}g P</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#07090f' },
  card: { backgroundColor: '#10172a', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  name: { color: '#fff', fontWeight: '700', fontSize: 16 },
  meta: { color: '#94a3b8', marginTop: 4 },
});
