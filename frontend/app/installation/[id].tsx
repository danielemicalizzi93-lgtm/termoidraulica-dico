import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDeleteInstallation, useInstallations, useSaveInstallation } from "@/src/api/hooks";
import { Button, TextField } from "@/src/components/ui";
import { makeStyles, spacing, useTheme } from "@/src/theme";

export default function InstallationForm() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";

  const { data: installations } = useInstallations();
  const existing = installations?.find((i) => i.id === id);
  const save = useSaveInstallation();
  const del = useDeleteInstallation();

  const [form, setForm] = useState<Record<string, any>>(existing ?? { descrizione: "" });
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.descrizione?.trim()) {
      setError("La descrizione è obbligatoria");
      return;
    }
    await save.mutateAsync({ id: isNew ? undefined : id, body: form });
    router.back();
  };

  const onDelete = async () => {
    await del.mutateAsync(id);
    router.back();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>{isNew ? "Nuovo impianto" : "Modifica impianto"}</Text>
        <Pressable testID="close-button" onPress={() => router.back()} style={styles.close}>
          <X color={colors.onSurface} size={22} weight="bold" />
        </Pressable>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        bottomOffset={20}
      >
        <TextField label="Descrizione impianto *" value={form.descrizione} onChangeText={(v) => set("descrizione", v)} placeholder="es. Appartamento Rossi" testID="inst-descrizione" />
        <TextField label="Indirizzo" value={form.indirizzo} onChangeText={(v) => set("indirizzo", v)} />
        <View style={styles.rowFields}>
          <TextField label="Comune" value={form.comune} onChangeText={(v) => set("comune", v)} style={{ flex: 1 } as any} />
          <View style={{ width: 80 }}>
            <TextField label="Prov." value={form.provincia} onChangeText={(v) => set("provincia", v)} autoCapitalize="characters" />
          </View>
          <View style={{ width: 90 }}>
            <TextField label="CAP" value={form.cap} onChangeText={(v) => set("cap", v)} keyboardType="number-pad" />
          </View>
        </View>
        <View style={styles.rowFields}>
          <TextField label="Scala" value={form.scala} onChangeText={(v) => set("scala", v)} style={{ flex: 1 } as any} />
          <TextField label="Piano" value={form.piano} onChangeText={(v) => set("piano", v)} style={{ flex: 1 } as any} />
          <TextField label="Interno" value={form.interno} onChangeText={(v) => set("interno", v)} style={{ flex: 1 } as any} />
        </View>
        <TextField label="Proprietà / Condominio" value={form.proprieta} onChangeText={(v) => set("proprieta", v)} />
        <TextField label="Note" value={form.note} onChangeText={(v) => set("note", v)} multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button testID="save-inst-button" title="Salva impianto" onPress={onSave} loading={save.isPending} />
        {!isNew ? (
          <Button testID="delete-inst-button" title="Elimina" variant="danger" onPress={onDelete} loading={del.isPending} />
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.onSurface },
  close: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  rowFields: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" },
  error: { color: colors.error, fontSize: 13 },
}));
