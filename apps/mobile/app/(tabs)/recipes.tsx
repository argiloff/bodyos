import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/lib/api';

type Recipe = {
  id: string;
  name: string;
  mealType: string;
};

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    api.get<Recipe[]>('/api/recipes').then(setRecipes).catch(() => setRecipes([]));
  }, []);

  return (
    <FlatList
      style={styles.list}
      data={recipes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.mealType}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#07090f' },
  card: { backgroundColor: '#10172a', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12 },
  name: { color: '#fff', fontWeight: '700', fontSize: 16 },
  meta: { color: '#94a3b8', marginTop: 4, textTransform: 'capitalize' },
});
