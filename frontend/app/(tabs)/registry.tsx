import { useRouter } from "expo-router";
import { CaretRight, Plus } from "phosphor-react-native";
import { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClients, useInstallations } from "@/src/api/hooks";
import { ScreenHeader } from "@/src/components/header";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function RegistryScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<"clients" | "installations">("clients");

  const { data: clients } = useClients();
  const { data: installations } = useInstallations();

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const rows =
    tab === "clients"
      ? (clients ?? []).map((c) => ({
          id: c.id,
          title: c.nome,
          sub: [c.comune, c.telefono].filter(Boolean).join(" · ") || "Cliente",
        }))
      : (installations ?? []).map((i) => ({
          id: i.id,
          title: i.descrizione,
          sub: [i.indirizzo, i.comune].filter(Boolean).join(", ") || "Impianto",
        }));

  const addRoute = tab === "clients" ? "/client/new" : "/installation/new";
  const detailBase = tab === "clients" ? "/client" : "/installation";

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Anagrafiche"
        subtitle="Clienti e impianti riutilizzabili"
        right={
          <Pressable
            testID="add-registry-button"
            style={styles.addBtn}
            onPress={() => router.push(addRoute as any)}
          >
            <Plus color={colors.onBrandPrimary} size={22} weight="bold" />
          </Pressable>
        }
      />

      <View style={styles.segment}>
        <Pressable
          testID="segment-clients"
          style={[styles.segTab, tab === "clients" && styles.segActive]}
          onPress={() => setTab("clients")}
        >
          <Text style={[styles.segText, tab === "clients" && styles.segTextActive]}>Clienti</Text>
        </Pressable>
        <Pressable
          testID="segment-installations"
          style={[styles.segTab, tab === "installations" && styles.segActive]}
          onPress={() => setTab("installations")}
        >
          <Text style={[styles.segText, tab === "installations" && styles.segTextActive]}>Impianti</Text>
        </Pressable>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xl, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Pressable
            testID={`registry-row-${item.id}`}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
            onPress={() => router.push(`${detailBase}/${item.id}` as any)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.title.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {item.sub}
              </Text>
            </View>
            <CaretRight color={colors.muted} size={18} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty} testID="registry-empty">
            <Text style={styles.emptyTitle}>
              {tab === "clients" ? "Nessun cliente" : "Nessun impianto"}
            </Text>
            <Text style={styles.emptyText}>
              Tocca + per aggiungere {tab === "clients" ? "un cliente" : "un impianto"}.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flexDirection: "row",
    margin: spacing.lg,
    marginBottom: 0,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  segTab: { flex: 1, paddingVertical: spacing.md, alignItems: "center", borderRadius: radius.sm },
  segActive: { backgroundColor: colors.surfaceSecondary },
  segText: { fontSize: 15, fontWeight: "600", color: colors.muted },
  segTextActive: { color: colors.onSurface },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: colors.brandPrimary },
  rowTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  rowSub: { fontSize: 12, color: colors.muted },
  empty: { alignItems: "center", padding: spacing["2xl"], gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: "center" },
}));
