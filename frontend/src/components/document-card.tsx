import { FileText, ShieldCheck } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";

import type { DocumentT } from "@/src/api/hooks";
import { plantLabelShort } from "@/src/constants/dico";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export function DocumentCard({ doc, onPress }: { doc: DocumentT; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isDico = doc.tipo === "dico";
  const committente = doc.data?.committente?.nome || "Senza committente";
  const tip = (doc.data?.tipologie || []).map(plantLabelShort).slice(0, 2).join(", ");

  return (
    <Pressable
      testID={`document-card-${doc.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: colors.brandTertiary }]}>
        {isDico ? (
          <FileText color={colors.brandPrimary} size={22} weight="fill" />
        ) : (
          <ShieldCheck color={colors.brandPrimary} size={22} weight="fill" />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.numero}>{doc.numero}</Text>
          <View style={[styles.badge, { backgroundColor: isDico ? colors.brandPrimary : colors.info }]}>
            <Text style={styles.badgeText}>{isDico ? "DiCo" : "DiRi"}</Text>
          </View>
        </View>
        <Text style={styles.committente} numberOfLines={1}>
          {committente}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {tip ? `${tip} · ` : ""}
          {fmt(doc.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  pressed: { opacity: 0.9 },
  icon: { width: 46, height: 46, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  numero: { fontSize: 13, fontWeight: "700", color: colors.onSurface },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontWeight: "800", color: colors.onBrandPrimary },
  committente: { fontSize: 15, fontWeight: "600", color: colors.onSurface },
  meta: { fontSize: 12, color: colors.muted },
}));
