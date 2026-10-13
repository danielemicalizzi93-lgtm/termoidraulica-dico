import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDocuments } from "@/src/api/hooks";
import { DocumentCard } from "@/src/components/document-card";
import { ScreenHeader } from "@/src/components/header";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, radius, spacing } from "@/src/theme";

const FILTERS = [
  { key: "all", label: "Tutti" },
  { key: "dico", label: "DiCo" },
  { key: "diri", label: "DiRi" },
];

export default function DocumentsScreen() {
  const styles = useStyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useDocuments();
  const [filter, setFilter] = useState("all");

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const docs = (data ?? []).filter((d) => filter === "all" || d.tipo === filter);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Documenti" subtitle={`${data?.length ?? 0} dichiarazioni`} />
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                testID={`filter-${f.key}`}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xl, gap: spacing.md }}
        renderItem={({ item }) => (
          <DocumentCard doc={item} onPress={() => router.push(`/document/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty} testID="documents-empty">
              <Text style={styles.emptyTitle}>Nessun documento</Text>
              <Text style={styles.emptyText}>Le dichiarazioni create appariranno qui.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  chipsWrap: {
    height: 56,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipsContent: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "center" },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: 14, fontWeight: "600", color: colors.onSurfaceTertiary },
  chipTextActive: { color: colors.onBrandPrimary },
  empty: { alignItems: "center", padding: spacing["2xl"], gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: "center" },
}));
