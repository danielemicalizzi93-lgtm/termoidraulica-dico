import { PencilSimpleLine, Trash } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useUpdateDocument } from "@/src/api/hooks";
import type { DocumentT } from "@/src/local/db";
import { SignatureModal, SignaturePreview, type SignatureT } from "@/src/components/signature-pad";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Slot = { key: string; label: string; who?: string; nameLabel?: string };

export function slotsFor(doc: DocumentT, company: Record<string, any>): Slot[] {
  const d = doc.data || {};
  if (doc.tipo === "dico") {
    return [
      { key: "dichiarante", label: "Il dichiarante (titolare)", who: company.titolare },
      { key: "responsabile", label: "Il responsabile tecnico", who: company.responsabile_tecnico },
      { key: "cliente", label: "Ricevuta cliente", nameLabel: "Nome e cognome del cliente", who: d.committente?.nome },
    ];
  }
  return [
    { key: "dichiarante", label: "Il dichiarante (responsabile tecnico)", who: d.tecnico?.nome || company.responsabile_tecnico },
    { key: "cliente", label: "Il committente (ricevuta)", nameLabel: "Nome e cognome del committente", who: d.committente?.nome },
  ];
}

export function SignaturesCard({ doc, company }: { doc: DocumentT; company: Record<string, any> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const update = useUpdateDocument();
  const [open, setOpen] = useState<Slot | null>(null);
  const firme: Record<string, SignatureT> = doc.data?.firme || {};

  const setSig = async (key: string, sig: SignatureT | null) => {
    const next = { ...firme };
    if (sig) next[key] = sig;
    else delete next[key];
    await update.mutateAsync({ id: doc.id, data: { ...doc.data, firme: next } });
  };

  return (
    <View style={styles.card}>
      {slotsFor(doc, company).map((s) => {
        const sig = firme[s.key];
        return (
          <View key={s.key} style={styles.slot}>
            <View style={styles.slotHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{s.label}</Text>
                <Text style={styles.who}>
                  {sig?.name || s.who || "—"}
                  {sig?.date ? ` · ${new Date(sig.date).toLocaleDateString("it-IT")}` : ""}
                </Text>
              </View>
              {sig ? (
                <Pressable testID={`sign-remove-${s.key}`} onPress={() => setSig(s.key, null)} hitSlop={10} style={styles.iconBtn}>
                  <Trash color={colors.error} size={18} weight="bold" />
                </Pressable>
              ) : null}
            </View>
            {sig ? (
              <Pressable testID={`sign-preview-${s.key}`} style={styles.preview} onPress={() => setOpen(s)}>
                <SignaturePreview sig={sig} />
              </Pressable>
            ) : (
              <Pressable testID={`sign-${s.key}`} style={styles.empty} onPress={() => setOpen(s)}>
                <PencilSimpleLine color={colors.brandPrimary} size={20} weight="bold" />
                <Text style={styles.emptyText}>Tocca per firmare</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      <SignatureModal
        visible={!!open}
        title={open?.label ?? ""}
        nameLabel={open?.nameLabel}
        initialName={open ? firme[open.key]?.name || open.who : ""}
        onClose={() => setOpen(null)}
        onSave={async (sig) => {
          const key = open!.key;
          setOpen(null);
          await setSig(key, sig);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  slot: { gap: spacing.xs },
  slotHead: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  who: { fontSize: 12, color: colors.muted, marginTop: 2 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  preview: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.xs },
  empty: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandTertiary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
}));
