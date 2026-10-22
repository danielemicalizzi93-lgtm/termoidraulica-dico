import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { DownloadSimple, LockKey, ShieldCheck, UploadSimple } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCompany, useSaveCompany } from "@/src/api/hooks";
import { useLock } from "@/src/local/lock-context";
import { applyBackup, backupSummary, exportBackup, pickBackup, type BackupPayload } from "@/src/local/backup";
import { Button, Card, CheckRow, SectionLabel, TextField } from "@/src/components/ui";
import { ScreenHeader } from "@/src/components/header";
import { LogoPicker } from "@/src/components/logo-picker";
import { ABILITAZIONI } from "@/src/constants/dico";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, spacing, useTheme } from "@/src/theme";

export default function ProfileScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasPin, setPin, disablePin } = useLock();
  const { data: company } = useCompany();
  const saveCompany = useSaveCompany();
  const qc = useQueryClient();

  const [form, setForm] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinError, setPinError] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null);

  useEffect(() => {
    if (company) setForm({ abilitazioni: [], ...company });
  }, [company]);

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAbil = (key: string) => {
    const list: string[] = form.abilitazioni || [];
    set("abilitazioni", list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);
  };

  const onSave = async () => {
    await saveCompany.mutateAsync(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const savePin = async () => {
    setPinError("");
    if (pin1.length < 4) {
      setPinError("Il PIN deve avere almeno 4 cifre");
      return;
    }
    if (pin1 !== pin2) {
      setPinError("I due PIN non coincidono");
      return;
    }
    await setPin(pin1);
    setPinMode(false);
    setPin1("");
    setPin2("");
  };

  const onExportBackup = async () => {
    setBackupMsg("");
    setBackupBusy(true);
    try {
      await exportBackup();
      setBackupMsg("Backup esportato correttamente.");
    } catch (e: any) {
      setBackupMsg(e?.message || "Errore durante l'esportazione.");
    } finally {
      setBackupBusy(false);
    }
  };

  const onPickImport = async () => {
    setBackupMsg("");
    try {
      const payload = await pickBackup();
      if (payload) setPendingImport(payload);
    } catch (e: any) {
      setBackupMsg(e?.message || "File non valido.");
    }
  };

  const onConfirmImport = async () => {
    if (!pendingImport) return;
    setBackupBusy(true);
    try {
      await applyBackup(pendingImport);
      await qc.invalidateQueries();
      setPendingImport(null);
      setBackupMsg("Archivio ripristinato con successo.");
    } catch (e: any) {
      setBackupMsg(e?.message || "Errore durante il ripristino.");
    } finally {
      setBackupBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Profilo" subtitle="Dati impresa e sicurezza" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing["2xl"], gap: spacing.lg }}
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Blocco con PIN</Text>
        <Card>
          <View style={styles.pinRow}>
            <View style={styles.pinIcon}>
              <LockKey color={colors.brandPrimary} size={22} weight="fill" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pinTitle}>{hasPin ? "PIN attivo" : "PIN non impostato"}</Text>
              <Text style={styles.pinSub}>
                {hasPin
                  ? "L'app richiede il PIN all'avvio."
                  : "Proteggi l'accesso all'app con un codice numerico."}
              </Text>
            </View>
          </View>

          {pinMode ? (
            <View style={styles.pinForm}>
              <TextField
                label="Nuovo PIN (min 4 cifre)"
                value={pin1}
                onChangeText={setPin1}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                testID="pin-input-1"
              />
              <TextField
                label="Conferma PIN"
                value={pin2}
                onChangeText={setPin2}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                testID="pin-input-2"
              />
              {pinError ? <Text style={styles.pinErr}>{pinError}</Text> : null}
              <Button testID="save-pin-button" title="Salva PIN" onPress={savePin} />
            </View>
          ) : (
            <View style={styles.pinActions}>
              <Button
                testID="toggle-pin-button"
                title={hasPin ? "Cambia PIN" : "Imposta PIN"}
                variant="secondary"
                onPress={() => {
                  setPin1("");
                  setPin2("");
                  setPinError("");
                  setPinMode(true);
                }}
                style={{ flex: 1 }}
              />
              {hasPin ? (
                <Button
                  testID="remove-pin-button"
                  title="Rimuovi"
                  variant="ghost"
                  onPress={disablePin}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          )}
        </Card>

        <Text style={styles.heading}>Backup e ripristino</Text>
        <Card>
          <View style={styles.pinRow}>
            <View style={styles.pinIcon}>
              <DownloadSimple color={colors.brandPrimary} size={22} weight="fill" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pinTitle}>Archivio locale</Text>
              <Text style={styles.pinSub}>Esporta tutto in un file e ripristinalo su un altro telefono.</Text>
            </View>
          </View>

          {pendingImport ? (
            <View style={styles.pinForm}>
              <Text style={styles.importWarn}>
                Ripristinare questo backup?{"\n"}
                {backupSummary(pendingImport)}
              </Text>
              <Text style={styles.importDanger}>Sostituirà tutti i dati attuali sul dispositivo.</Text>
              <View style={styles.pinActions}>
                <Button
                  testID="cancel-import-button"
                  title="Annulla"
                  variant="ghost"
                  onPress={() => setPendingImport(null)}
                  style={{ flex: 1 }}
                />
                <Button
                  testID="confirm-import-button"
                  title="Sostituisci"
                  variant="danger"
                  onPress={onConfirmImport}
                  loading={backupBusy}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.pinActions}>
              <Button
                testID="export-backup-button"
                title="Esporta"
                variant="secondary"
                onPress={onExportBackup}
                loading={backupBusy}
                icon={<DownloadSimple color={colors.onBrandTertiary} size={20} weight="bold" />}
                style={{ flex: 1 }}
              />
              <Button
                testID="import-backup-button"
                title="Importa"
                variant="secondary"
                onPress={onPickImport}
                icon={<UploadSimple color={colors.onBrandTertiary} size={20} weight="bold" />}
                style={{ flex: 1 }}
              />
            </View>
          )}
          {backupMsg ? (
            <Text testID="backup-message" style={styles.backupMsg}>
              {backupMsg}
            </Text>
          ) : null}
        </Card>

        <Text style={styles.heading}>Logo ditta</Text>
        <Card>
          <LogoPicker
            value={form.logo_uri}
            onChange={async (uri) => {
              const next = { ...form, logo_uri: uri };
              setForm(next);
              await saveCompany.mutateAsync(next);
            }}
          />
        </Card>

        <Text style={styles.heading}>Dati impresa installatrice</Text>
        <Card>
          <View style={styles.fields}>
            <TextField label="Denominazione impresa" value={form.denominazione} onChangeText={(v) => set("denominazione", v)} testID="field-denominazione" />
            <TextField label="Titolare / legale rappresentante" value={form.titolare} onChangeText={(v) => set("titolare", v)} placeholder="Nome e cognome del titolare" testID="field-titolare" />
            <TextField label="Responsabile tecnico (anche esterno)" value={form.responsabile_tecnico} onChangeText={(v) => set("responsabile_tecnico", v)} placeholder="Nome e cognome del responsabile tecnico" testID="field-responsabile" />
            <TextField label="Partita IVA" value={form.partita_iva} onChangeText={(v) => set("partita_iva", v)} keyboardType="number-pad" />
            <TextField label="Codice Fiscale" value={form.codice_fiscale} onChangeText={(v) => set("codice_fiscale", v)} autoCapitalize="characters" />
            <TextField label="Operante nel settore" value={form.settore} onChangeText={(v) => set("settore", v)} placeholder="es. termoidraulico" testID="field-settore" />
            <View style={styles.rowFields}>
              <TextField label="Via sede" value={form.indirizzo} onChangeText={(v) => set("indirizzo", v)} style={{ flex: 1 } as any} />
              <View style={{ width: 80 }}>
                <TextField label="N." value={form.civico} onChangeText={(v) => set("civico", v)} testID="field-civico" />
              </View>
            </View>
            <View style={styles.rowFields}>
              <TextField label="Comune" value={form.comune} onChangeText={(v) => set("comune", v)} style={{ flex: 1 } as any} />
              <View style={{ width: 90 }}>
                <TextField label="Prov." value={form.provincia} onChangeText={(v) => set("provincia", v)} autoCapitalize="characters" />
              </View>
              <View style={{ width: 90 }}>
                <TextField label="CAP" value={form.cap} onChangeText={(v) => set("cap", v)} keyboardType="number-pad" />
              </View>
            </View>
            <TextField label="Telefono" value={form.telefono} onChangeText={(v) => set("telefono", v)} keyboardType="phone-pad" />
            <TextField label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="PEC" value={form.pec} onChangeText={(v) => set("pec", v)} keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.rowFields}>
              <View style={{ width: 110 }}>
                <TextField label="CCIAA prov." value={form.cciaa_provincia} onChangeText={(v) => set("cciaa_provincia", v)} autoCapitalize="characters" />
              </View>
              <TextField label="N. iscrizione CCIAA" value={form.cciaa_numero} onChangeText={(v) => set("cciaa_numero", v)} style={{ flex: 1 } as any} />
            </View>
            <View style={styles.rowFields}>
              <View style={{ width: 110 }}>
                <TextField label="Albo artigiani prov." value={form.artigiani_provincia} onChangeText={(v) => set("artigiani_provincia", v)} autoCapitalize="characters" />
              </View>
              <TextField label="N. Albo Imprese Artigiane" value={form.artigiani_numero} onChangeText={(v) => set("artigiani_numero", v)} style={{ flex: 1 } as any} testID="field-artigiani-numero" />
            </View>
          </View>
        </Card>

        <Text style={styles.heading}>Abilitazioni (art. 1 DM 37/08)</Text>
        <Card>
          {ABILITAZIONI.map((a) => (
            <CheckRow
              key={a.key}
              testID={`abil-${a.key}`}
              label={a.label}
              checked={(form.abilitazioni || []).includes(a.key)}
              onToggle={() => toggleAbil(a.key)}
            />
          ))}
        </Card>

        <Text style={styles.heading}>Dati tecnico (per DiRi)</Text>
        <Card>
          <View style={styles.fields}>
            <TextField label="Iscritto all'albo / collegio" value={form.albo_professione} onChangeText={(v) => set("albo_professione", v)} placeholder="es. Perito Industriale" />
            <View style={styles.rowFields}>
              <View style={{ width: 110 }}>
                <TextField label="Provincia" value={form.albo_provincia} onChangeText={(v) => set("albo_provincia", v)} autoCapitalize="characters" />
              </View>
              <TextField label="N. iscrizione" value={form.albo_numero} onChangeText={(v) => set("albo_numero", v)} style={{ flex: 1 } as any} />
            </View>
          </View>
        </Card>

        <Button
          testID="save-company-button"
          title={saved ? "Salvato ✓" : "Salva dati impresa"}
          onPress={onSave}
          loading={saveCompany.isPending}
        />

        <Pressable testID="privacy-link" style={styles.privacyRow} onPress={() => router.push("/privacy")}>
          <ShieldCheck color={colors.brandPrimary} size={20} weight="bold" />
          <Text style={styles.privacyText}>Informativa privacy</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  heading: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  privacyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, minHeight: 48 },
  privacyText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 15 },
  fields: { gap: spacing.md },
  rowFields: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" },
  pinRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  pinIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  pinTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  pinSub: { fontSize: 12, color: colors.muted },
  pinActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  pinForm: { gap: spacing.md, marginTop: spacing.md },
  pinErr: { color: colors.error, fontSize: 13 },
  importWarn: { fontSize: 14, fontWeight: "600", color: colors.onSurface, lineHeight: 20 },
  importDanger: { fontSize: 13, color: colors.error },
  backupMsg: { fontSize: 13, color: colors.muted, marginTop: spacing.md },
}));
