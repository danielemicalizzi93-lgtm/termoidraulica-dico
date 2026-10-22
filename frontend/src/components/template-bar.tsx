import { BookmarkSimple, FolderOpen, Trash, X } from "phosphor-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeleteTemplate, useSaveTemplate, useTemplates } from "@/src/api/hooks";
import type { TemplateKind, TemplateT } from "@/src/local/db";
import { Button, TextField } from "@/src/components/ui";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

// Save the current materials list / schema as a reusable template, or load one.
export function TemplateBar({
  kind,
  canSave,
  getData,
  onApply,
}: {
  kind: TemplateKind;
  canSave: boolean;
  getData: () => any;
  onApply: (t: TemplateT) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: templates = [] } = useTemplates(kind);
  const saveT = useSaveTemplate();
  const delT = useDeleteTemplate();
  const [mode, setMode] = useState<"save" | "load" | null>(null);
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState("");

  const what = kind === "materiali" ? "materiali" : kind === "schema" ? "schema" : "DiCo completa";

  const doSave = async () => {
    if (!nome.trim()) return;
    await saveT.mutateAsync({ kind, nome: nome.trim(), data: getData() });
    setMode(null);
    setNome("");
    setMsg("Modello salvato ✓");
    setTimeout(() => setMsg(""), 2000);
  };

  const apply = (t: TemplateT) => {
    onApply(t);
    setMode(null);
    setMsg(`Modello "${t.nome}" applicato ✓`);
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          testID={`template-${kind}-load`}
          style={styles.btn}
          onPress={() => setMode("load")}
        >
          <FolderOpen color={colors.brandPrimary} size={18} weight="bold" />
          <Text style={styles.btnText}>Usa modello</Text>
        </Pressable>
        <Pressable
          testID={`template-${kind}-save`}
          style={[styles.btn, !canSave && styles.btnDisabled]}
          onPress={() => canSave && setMode("save")}
        >
          <BookmarkSimple color={canSave ? colors.brandPrimary : colors.muted} size={18} weight="bold" />
          <Text style={[styles.btnText, !canSave && { color: colors.muted }]}>Salva come modello</Text>
        </Pressable>
      </View>
      {msg ? (
        <Text testID={`template-${kind}-msg`} style={styles.msg}>
          {msg}
        </Text>
      ) : null}

      <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={() => setMode(null)}>
        <Pressable style={styles.backdrop} onPress={() => setMode(null)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>
              {mode === "save" ? `Salva ${what} come modello` : `Modelli ${what}`}
            </Text>
            <Pressable testID="template-close" onPress={() => setMode(null)} hitSlop={10}>
              <X color={colors.onSurface} size={22} weight="bold" />
            </Pressable>
          </View>

          {mode === "save" ? (
            <View style={styles.saveBox}>
              <TextField
                testID="template-name-input"
                label="Nome del modello"
                value={nome}
                onChangeText={setNome}
                placeholder={kind === "materiali" ? "es. Bagno standard multistrato" : kind === "schema" ? "es. Caldaia + radiatori" : "es. Sostituzione caldaia a metano"}
                autoFocus
              />
              <Button
                testID="template-save-confirm"
                title="Salva modello"
                onPress={doSave}
                disabled={!nome.trim()}
                loading={saveT.isPending}
              />
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={{ gap: spacing.sm }}>
              {templates.length === 0 ? (
                <Text style={styles.empty}>
                  Nessun modello salvato. Compila {kind === "materiali" ? "la relazione materiali" : kind === "schema" ? "uno schema" : "una DiCo"} e
                  tocca “Salva come modello”.
                </Text>
              ) : (
                templates.map((t, i) => (
                  <View key={t.id} style={styles.item}>
                    <Pressable testID={`template-item-${i}`} style={styles.itemMain} onPress={() => apply(t)}>
                      <Text style={styles.itemName}>{t.nome}</Text>
                      <Text style={styles.itemSub}>
                        {kind === "materiali"
                          ? `${(t.data || []).length} voci`
                          : kind === "schema"
                            ? `${(t.data?.elements || []).length} elementi`
                            : `${(t.data?.tipologie || []).length} tipologie · ${(t.data?.materiali_rows || []).length} materiali`}
                      </Text>
                    </Pressable>
                    <Pressable testID={`template-delete-${i}`} onPress={() => delT.mutate(t.id)} hitSlop={10} style={styles.del}>
                      <Trash color={colors.error} size={18} weight="bold" />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { gap: spacing.xs },
  row: { flexDirection: "row", gap: spacing.sm },
  btn: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    paddingHorizontal: spacing.sm,
  },
  btnDisabled: { backgroundColor: colors.surfaceTertiary },
  btnText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 13 },
  msg: { fontSize: 12, color: colors.success, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: "70%",
  },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  saveBox: { gap: spacing.md },
  list: { flexGrow: 0 },
  empty: { color: colors.muted, fontSize: 14, textAlign: "center", paddingVertical: spacing.lg },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemMain: { flex: 1, padding: spacing.md },
  itemName: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  itemSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  del: { padding: spacing.md },
}));
