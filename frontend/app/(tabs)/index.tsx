import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { CaretRight, FileText, Plus, ShieldCheck } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/src/components/header";
import { DocumentCard } from "@/src/components/document-card";
import { useCompany, useDocuments } from "@/src/api/hooks";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function Dashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: company } = useCompany();
  const { data: documents, isLoading } = useDocuments();

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const recent = (documents ?? []).slice(0, 5);
  const impresa = company?.denominazione?.trim();

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={impresa || "Le tue dichiarazioni"}
        subtitle="Crea una nuova dichiarazione"
        left={
          <Image
            testID="home-logo"
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xl, gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quickRow}>
          <Pressable
            testID="create-dico-card"
            style={({ pressed }) => [styles.quick, styles.quickPrimary, pressed && styles.pressed]}
            onPress={() => router.push("/wizard/dico")}
          >
            <View style={[styles.quickIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <FileText color={colors.onBrandPrimary} size={26} weight="fill" />
            </View>
            <Text style={styles.quickTitlePrimary}>Nuova DiCo</Text>
            <Text style={styles.quickSubPrimary}>Dichiarazione di Conformità</Text>
          </Pressable>

          <Pressable
            testID="create-diri-card"
            style={({ pressed }) => [styles.quick, styles.quickSecondary, pressed && styles.pressed]}
            onPress={() => router.push("/wizard/diri")}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.brandTertiary }]}>
              <ShieldCheck color={colors.brandPrimary} size={26} weight="fill" />
            </View>
            <Text style={styles.quickTitle}>Nuova DiRi</Text>
            <Text style={styles.quickSub}>Dichiarazione di Rispondenza</Text>
          </Pressable>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Documenti recenti</Text>
          {recent.length > 0 ? (
            <Pressable onPress={() => router.push("/(tabs)/documents")} testID="see-all-documents">
              <Text style={styles.link}>Vedi tutti</Text>
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Caricamento…</Text>
          </View>
        ) : recent.length === 0 ? (
          <View style={styles.empty} testID="dashboard-empty">
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1542621334-a254cf47733d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHxibHVlcHJpbnQlMjB0ZWNobmljYWwlMjBkcmF3aW5nfGVufDB8fHx8MTc5MTkyMzEzMXww&ixlib=rb-4.1.0&q=85",
              }}
              style={styles.emptyImg}
              contentFit="cover"
            />
            <Text style={styles.emptyTitle}>Nessun documento</Text>
            <Text style={styles.emptyText}>Crea la tua prima dichiarazione con i pulsanti qui sopra.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {recent.map((d) => (
              <DocumentCard key={d.id} doc={d} onPress={() => router.push(`/document/${d.id}`)} />
            ))}
          </View>
        )}

        <Pressable
          testID="manage-company-row"
          style={({ pressed }) => [styles.manageRow, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.surfaceTertiary, width: 40, height: 40 }]}>
            <Plus color={colors.brandPrimary} size={20} weight="bold" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.manageTitle}>Dati impresa</Text>
            <Text style={styles.manageSub}>Configura l'anagrafica usata nei documenti</Text>
          </View>
          <CaretRight color={colors.muted} size={18} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  logo: { width: 52, height: 52, borderRadius: radius.pill },
  quickRow: { flexDirection: "row", gap: spacing.md },
  quick: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    minHeight: 140,
    justifyContent: "space-between",
  },
  quickPrimary: { backgroundColor: colors.brandPrimary },
  quickSecondary: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  quickIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  quickTitlePrimary: { fontSize: 18, fontWeight: "800", color: colors.onBrandPrimary },
  quickSubPrimary: { fontSize: 12, color: colors.onBrandPrimary, opacity: 0.9 },
  quickTitle: { fontSize: 18, fontWeight: "800", color: colors.onSurface },
  quickSub: { fontSize: 12, color: colors.muted },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  link: { fontSize: 14, fontWeight: "600", color: colors.brandPrimary },
  empty: { alignItems: "center", padding: spacing.xl, gap: spacing.sm },
  emptyImg: { width: 120, height: 120, borderRadius: radius.lg, marginBottom: spacing.sm, opacity: 0.9 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: "center" },
  manageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  manageSub: { fontSize: 12, color: colors.muted },
}));
