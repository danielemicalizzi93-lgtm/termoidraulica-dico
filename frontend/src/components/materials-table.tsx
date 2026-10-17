import { Plus, Trash } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { uid } from "@/src/local/db";
import { TextField } from "@/src/components/ui";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export type MaterialRow = {
  id: string;
  tipo: "tubo" | "raccordo";
  descrizione: string;
  materiale: string;
  diametro: string;
  quantita: string;
  tenuta: string;
  marca: string;
};

export const TENUTA_OPTIONS = [
  "Canapa + pasta",
  "Teflon/PTFE",
  "O-ring",
  "Pressfitting",
  "Saldatura",
  "Brasatura",
  "Incollaggio",
  "Guarnizione",
  "Filettata",
];

export function newRow(tipo: "tubo" | "raccordo" = "tubo"): MaterialRow {
  return { id: uid(), tipo, descrizione: "", materiale: "", diametro: "", quantita: "", tenuta: "", marca: "" };
}

export function MaterialsTable({
  value,
  onChange,
}: {
  value: MaterialRow[];
  onChange: (v: MaterialRow[]) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  const update = (id: string, patch: Partial<MaterialRow>) =>
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => onChange(value.filter((r) => r.id !== id));

  return (
    <View style={styles.wrap}>
      {value.map((row, idx) => {
        const unita = row.tipo === "tubo" ? "metri" : "pz";
        return (
          <View key={row.id} style={styles.card} testID={`material-row-${idx}`}>
            <View style={styles.header}>
              <View style={styles.toggle}>
                {(["tubo", "raccordo"] as const).map((t) => (
                  <Pressable
                    key={t}
                    testID={`material-${idx}-tipo-${t}`}
                    style={[styles.togBtn, row.tipo === t && styles.togActive]}
                    onPress={() => update(row.id, { tipo: t })}
                  >
                    <Text style={[styles.togText, row.tipo === t && styles.togTextActive]}>
                      {t === "tubo" ? "Tubo" : "Raccordo"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable testID={`material-${idx}-delete`} onPress={() => remove(row.id)} hitSlop={8}>
                <Trash color={colors.error} size={18} weight="bold" />
              </Pressable>
            </View>

            <TextField
              label="Descrizione"
              value={row.descrizione}
              onChangeText={(v) => update(row.id, { descrizione: v })}
              placeholder={row.tipo === "tubo" ? "es. Tubo multistrato" : "es. Gomito 90°"}
            />
            <View style={styles.rowFields}>
              <TextField
                label="Materiale"
                value={row.materiale}
                onChangeText={(v) => update(row.id, { materiale: v })}
                placeholder="rame, PPR, PEX…"
                style={{ flex: 1 } as any}
              />
              <View style={{ width: 110 }}>
                <TextField
                  label="Diametro"
                  value={row.diametro}
                  onChangeText={(v) => update(row.id, { diametro: v })}
                  placeholder={'DN / "'}
                />
              </View>
            </View>
            <View style={styles.rowFields}>
              <View style={{ width: 130 }}>
                <TextField
                  label={`Quantità (${unita})`}
                  value={row.quantita}
                  onChangeText={(v) => update(row.id, { quantita: v })}
                  keyboardType="decimal-pad"
                />
              </View>
              <TextField
                label="Marca"
                value={row.marca}
                onChangeText={(v) => update(row.id, { marca: v })}
                placeholder="produttore"
                style={{ flex: 1 } as any}
              />
            </View>

            <Text style={styles.tenutaLabel}>Tipo di tenuta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {TENUTA_OPTIONS.map((t) => {
                const active = row.tenuta === t;
                return (
                  <Pressable
                    key={t}
                    testID={`material-${idx}-tenuta-${t}`}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => update(row.id, { tenuta: active ? "" : t })}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}

      <View style={styles.addRow}>
        <Pressable testID="add-material-tubo" style={styles.addBtn} onPress={() => onChange([...value, newRow("tubo")])}>
          <Plus color={colors.brandPrimary} size={18} weight="bold" />
          <Text style={styles.addText}>Tubo</Text>
        </Pressable>
        <Pressable testID="add-material-raccordo" style={styles.addBtn} onPress={() => onChange([...value, newRow("raccordo")])}>
          <Plus color={colors.brandPrimary} size={18} weight="bold" />
          <Text style={styles.addText}>Raccordo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggle: { flexDirection: "row", backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, padding: 3 },
  togBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm },
  togActive: { backgroundColor: colors.brandPrimary },
  togText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  togTextActive: { color: colors.onBrandPrimary },
  rowFields: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" },
  tenutaLabel: { fontSize: 13, fontWeight: "600", color: colors.onSurfaceSecondary, marginTop: spacing.xs },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.onSurfaceTertiary },
  chipTextActive: { color: colors.onBrandPrimary },
  addRow: { flexDirection: "row", gap: spacing.sm },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    borderStyle: "dashed",
  },
  addText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
}));
