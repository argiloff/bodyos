import { useState, useMemo } from "react";
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { Plus, Search, Trash2, Edit3, Package } from "lucide-react-native";
import { useData } from "../../db/DataProvider";
import {
  useThemePalette,
  spacing,
  typography,
  radii,
  categoryLabel,
} from "../../theme";
import {
  Card,
  Button,
  Input,
  Chip,
  StatusMessage,
  Empty,
  Section,
} from "../../components";
import { MacroBadge } from "../../components/MacroBadge";
import { uid, slugify } from "../../types";
import type { Product } from "../../types";

type Draft = {
  id: string;
  name: string;
  category: string;
  image_uri?: string;
  kcal_per_100g: string;
  protein_per_100g: string;
  fat_per_100g: string;
  carbs_per_100g: string;
  fiber_per_100g: string;
};

const emptyDraft: Draft = {
  id: "",
  name: "",
  category: "",
  image_uri: undefined,
  kcal_per_100g: "",
  protein_per_100g: "",
  fat_per_100g: "",
  carbs_per_100g: "",
  fiber_per_100g: "",
};

function draftFromProduct(p: Product): Draft {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    image_uri: p.image_uri,
    kcal_per_100g: String(p.kcal_per_100g),
    protein_per_100g: String(p.protein_per_100g),
    fat_per_100g: String(p.fat_per_100g),
    carbs_per_100g: String(p.carbs_per_100g),
    fiber_per_100g: String(p.fiber_per_100g),
  };
}

export default function ProductsScreen() {
  const { products, upsertProduct, deleteProduct } = useData();
  const theme = useThemePalette();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState<{
    msg: string;
    variant: "success" | "error";
  } | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, search]);

  const openNew = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setEditing(true);
    setStatus(null);
  };

  const openEdit = (p: Product) => {
    setDraft(draftFromProduct(p));
    setEditingId(p.id);
    setEditing(true);
    setStatus(null);
  };

  const cancel = () => {
    setEditing(false);
    setEditingId(null);
    setDraft(emptyDraft);
    setStatus(null);
  };

  const save = async () => {
    if (!draft.name.trim()) {
      setStatus({ msg: "Name ist erforderlich", variant: "error" });
      return;
    }
    const id = editingId ?? (slugify(draft.name) || uid("prod"));
    try {
      await upsertProduct({
        id,
        name: draft.name.trim(),
        category: draft.category.trim(),
        image_uri: draft.image_uri,
        kcal_per_100g: Number(draft.kcal_per_100g) || 0,
        protein_per_100g: Number(draft.protein_per_100g) || 0,
        fat_per_100g: Number(draft.fat_per_100g) || 0,
        carbs_per_100g: Number(draft.carbs_per_100g) || 0,
        fiber_per_100g: Number(draft.fiber_per_100g) || 0,
      });
      setStatus({
        msg: editingId ? "Produkt aktualisiert" : "Produkt erstellt",
        variant: "success",
      });
      setEditing(false);
      setEditingId(null);
      setDraft(emptyDraft);
    } catch (e) {
      setStatus({
        msg: e instanceof Error ? e.message : "Fehler beim Speichern",
        variant: "error",
      });
    }
  };

  const confirmDelete = (p: Product) => {
    Alert.alert("Produkt löschen", `„${p.name}" wirklich löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(p.id);
            setStatus({ msg: `${p.name} gelöscht`, variant: "success" });
          } catch (e) {
            setStatus({
              msg: e instanceof Error ? e.message : "Fehler",
              variant: "error",
            });
          }
        },
      },
    ]);
  };

  const patch = (key: keyof Draft, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const renderEditForm = () => (
    <Card style={s.formCard}>
      <Section title={editingId ? "Produkt bearbeiten" : "Neues Produkt"}>
        <Input
          label="Name"
          value={draft.name}
          onChangeText={(v) => patch("name", v)}
          placeholder="z.B. Haferflocken"
        />
        <Input
          label="Kategorie"
          value={draft.category}
          onChangeText={(v) => patch("category", v)}
          placeholder="z.B. grain"
        />
        <View style={s.macroRow}>
          <Input
            label="kcal"
            value={draft.kcal_per_100g}
            onChangeText={(v) => patch("kcal_per_100g", v)}
            keyboardType="numeric"
            suffix="pro 100g"
            containerStyle={s.halfInput}
          />
          <Input
            label="Protein"
            value={draft.protein_per_100g}
            onChangeText={(v) => patch("protein_per_100g", v)}
            keyboardType="numeric"
            suffix="pro 100g"
            containerStyle={s.halfInput}
          />
        </View>
        <View style={s.macroRow}>
          <Input
            label="Fett"
            value={draft.fat_per_100g}
            onChangeText={(v) => patch("fat_per_100g", v)}
            keyboardType="numeric"
            suffix="pro 100g"
            containerStyle={s.halfInput}
          />
          <Input
            label="Carbs"
            value={draft.carbs_per_100g}
            onChangeText={(v) => patch("carbs_per_100g", v)}
            keyboardType="numeric"
            suffix="pro 100g"
            containerStyle={s.halfInput}
          />
        </View>
        <Input
          label="Ballaststoffe"
          value={draft.fiber_per_100g}
          onChangeText={(v) => patch("fiber_per_100g", v)}
          keyboardType="numeric"
          suffix="pro 100g"
        />
        <View style={s.buttonRow}>
          <Button
            label="Speichern"
            onPress={() => void save()}
            style={s.flex}
          />
          <Button
            label="Abbrechen"
            variant="secondary"
            onPress={cancel}
            style={s.flex}
          />
        </View>
      </Section>
    </Card>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <Card style={s.productCard}>
      <View style={s.productHeader}>
        {item.image_uri ? (
          <Image source={{ uri: item.image_uri }} style={s.thumb} />
        ) : null}
        <View style={s.flex}>
          <Text style={[typography.bodyBold, { color: theme.text }]}>
            {item.name}
          </Text>
          <Chip label={categoryLabel(item.category)} style={s.categoryChip} />
        </View>
      </View>
      <MacroBadge
        compact
        macros={{
          kcal: item.kcal_per_100g,
          protein: item.protein_per_100g,
          fat: item.fat_per_100g,
          carbs: item.carbs_per_100g,
          fiber: item.fiber_per_100g,
        }}
      />
      <View style={s.actionRow}>
        <Button
          label="Bearbeiten"
          variant="ghost"
          size="sm"
          icon={<Edit3 size={14} color={theme.accent} />}
          onPress={() => openEdit(item)}
        />
        <Button
          label="Löschen"
          variant="ghost"
          size="sm"
          icon={<Trash2 size={14} color={theme.danger} />}
          onPress={() => confirmDelete(item)}
        />
      </View>
    </Card>
  );

  return (
    <View style={[s.screen, { backgroundColor: theme.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={s.header}>
            {status ? (
              <StatusMessage message={status.msg} variant={status.variant} />
            ) : null}
            {editing ? renderEditForm() : null}
            <View style={s.searchRow}>
              <View style={s.flex}>
                <Input
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Produkt suchen…"
                />
              </View>
              {!editing && (
                <Button
                  label=""
                  icon={<Plus size={20} color={theme.accentText} />}
                  onPress={openNew}
                  style={s.addBtn}
                />
              )}
            </View>
          </View>
        }
        renderItem={renderProduct}
        ListEmptyComponent={
          <Empty
            icon={<Package size={40} color={theme.muted} />}
            title="Keine Produkte"
            message={
              search
                ? "Keine Treffer für diese Suche"
                : "Erstelle dein erstes Produkt"
            }
            action={
              !editing ? (
                <Button
                  label="Produkt hinzufügen"
                  onPress={openNew}
                  icon={<Plus size={16} color={theme.accentText} />}
                />
              ) : undefined
            }
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  header: { gap: spacing.md },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  formCard: { marginBottom: spacing.xs },
  macroRow: { flexDirection: "row", gap: spacing.sm },
  halfInput: { flex: 1 },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  flex: { flex: 1 },
  productCard: { gap: spacing.sm },
  productHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  thumb: { width: 48, height: 48, borderRadius: radii.sm },
  categoryChip: { alignSelf: "flex-start", marginTop: spacing.xs },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  addBtn: { width: 46, paddingHorizontal: 0 },
});
