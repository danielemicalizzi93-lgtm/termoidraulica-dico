import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useClients, useDeleteClient, useSaveClient } from "@/src/api/hooks";
import { Button, TextField } from "@/src/components/ui";
import { makeStyles, spacing, useTheme } from "@/src/theme";

export default function ClientForm() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";

  const { data: clients } = useClients();
  const existing = clients?.find((c) => c.id === id);
  const save = useSaveClient();
  const del = useDeleteClient();

  const [form, setForm] = useState<Record<string, any>>(existing ?? { nome: "" });
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.nome?.trim()) {
      setError("Il nome è obbligatorio");
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
        <Text style={styles.title}>{isNew ? "Nuovo cliente" : "Modifica cliente"}</Text>
        <Pressable testID="close-button" onPress={() => router.back()} style={styles.close}>
          <X color={colors.onSurface} size={22} weight="bold" />
        </Pressable>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        bottomOffset={20}
      >
        <TextField label="Nome / Ragione sociale *" value={form.nome} onChangeText={(v) => set("nome", v)} testID="client-nome" />
        <TextField label="Codice Fiscale" value={form.codice_fiscale} onChangeText={(v) => set("codice_fiscale", v)} autoCapitalize="characters" />
        <TextField label="Partita IVA" value={form.partita_iva} onChangeText={(v) => set("partita_iva", v)} keyboardType="number-pad" />
        <TextField label="Telefono" value={form.telefono} onChangeText={(v) => set("telefono", v)} keyboardType="phone-pad" />
        <TextField label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Indirizzo" value={form.indirizzo} onChangeText={(v) => set("indirizzo", v)} />
        <TextField label="Comune" value={form.comune} onChangeText={(v) => set("comune", v)} />
        <TextField label="Note" value={form.note} onChangeText={(v) => set("note", v)} multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button testID="save-client-button" title="Salva cliente" onPress={onSave} loading={save.isPending} />
        {!isNew ? (
          <Button testID="delete-client-button" title="Elimina" variant="danger" onPress={onDelete} loading={del.isPending} />
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
  error: { color: colors.error, fontSize: 13 },
}));
