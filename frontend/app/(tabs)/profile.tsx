import { LockKey } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCompany, useSaveCompany } from "@/src/api/hooks";
import { useLock } from "@/src/local/lock-context";
import { Button, Card, CheckRow, SectionLabel, TextField } from "@/src/components/ui";
import { ScreenHeader } from "@/src/components/header";
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

  const [form, setForm] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [pinError, setPinError] = useState("");

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

        <Text style={styles.heading}>Dati impresa installatrice</Text>
        <Card>
          <View style={styles.fields}>
            <TextField label="Denominazione impresa" value={form.denominazione} onChangeText={(v) => set("denominazione", v)} testID="field-denominazione" />
            <TextField label="Responsabile tecnico" value={form.responsabile_tecnico} onChangeText={(v) => set("responsabile_tecnico", v)} />
            <TextField label="Partita IVA" value={form.partita_iva} onChangeText={(v) => set("partita_iva", v)} keyboardType="number-pad" />
            <TextField label="Codice Fiscale" value={form.codice_fiscale} onChangeText={(v) => set("codice_fiscale", v)} autoCapitalize="characters" />
            <TextField label="Indirizzo sede" value={form.indirizzo} onChangeText={(v) => set("indirizzo", v)} />
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
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  heading: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
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
}));
