import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";

import {
  useClients,
  useCompany,
  useCreateDocument,
  useDocument,
  useInstallations,
  useUpdateDocument,
} from "@/src/api/hooks";
import type { AttachmentT } from "@/src/local/db";
import { AttachmentPicker } from "@/src/components/attachment-picker";
import { MaterialsTable, type MaterialRow } from "@/src/components/materials-table";
import { CheckRow, SectionLabel, TextField } from "@/src/components/ui";
import { WizardShell } from "@/src/components/wizard-shell";
import { ATTACHMENTS, INTERVENTION_TYPES, PLANT_TYPES } from "@/src/constants/dico";
import { schemaDraft } from "@/src/schema/draft";
import { buildSchemaSvg, emptySchema, isEmptySchema, type SchemaT } from "@/src/schema/render";
import { makeStyles, radius, spacing } from "@/src/theme";

const TOTAL = 4;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtIT(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("it-IT");
}
function parseIT(s: string): string | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  return isNaN(new Date(iso).getTime()) ? null : iso;
}

export default function DiCoWizard() {
  const styles = useStyles();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const { data: existing } = useDocument(id ?? "");
  const { data: clients } = useClients();
  const { data: installations } = useInstallations();
  const { data: company } = useCompany();
  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();

  const [step, setStep] = useState(0);
  const [committente, setCommittente] = useState("");
  const [ub, setUb] = useState<Record<string, string>>({});
  const [intervento, setIntervento] = useState("nuovo");
  const [tipologie, setTipologie] = useState<string[]>([]);
  const [descrizione, setDescrizione] = useState("");
  const [norme, setNorme] = useState("");
  const [materialiRows, setMaterialiRows] = useState<MaterialRow[]>([]);
  const [schema, setSchema] = useState<SchemaT | null>(null);
  const [allegati, setAllegati] = useState<string[]>(["progetto", "relazione_materiali", "schema"]);
  const [allegatiFac, setAllegatiFac] = useState("");
  const [foto, setFoto] = useState<AttachmentT[]>([]);
  const [luogo, setLuogo] = useState("");
  const [dataIso, setDataIso] = useState(todayISO());
  const [dateText, setDateText] = useState(fmtIT(todayISO()));

  const editorOpened = useRef(false);
  const openSchema = () => {
    schemaDraft.set(schema ?? emptySchema());
    editorOpened.current = true;
    router.push("/schema");
  };
  useFocusEffect(
    useCallback(() => {
      if (editorOpened.current) {
        setSchema(schemaDraft.get());
        editorOpened.current = false;
      }
    }, []),
  );

  const prefilled = useRef(false);
  useEffect(() => {
    if (!existing || prefilled.current) return;
    prefilled.current = true;
    const d = existing.data || {};
    setCommittente(d.committente?.nome ?? "");
    setUb(d.ubicazione ?? {});
    setIntervento(d.intervento ?? "nuovo");
    setTipologie(d.tipologie ?? []);
    setDescrizione(d.descrizione_impianto ?? "");
    setNorme(d.norme_tecniche ?? "");
    setMaterialiRows(d.materiali_rows ?? []);
    setSchema(d.schema ?? null);
    setAllegati(d.allegati ?? []);
    setAllegatiFac(d.allegati_facoltativi ?? "");
    setFoto(d.allegati_foto ?? []);
    setLuogo(d.luogo ?? "");
    if (d.data_dichiarazione) {
      setDataIso(d.data_dichiarazione);
      setDateText(fmtIT(d.data_dichiarazione));
    }
  }, [existing]);

  const setU = (k: string, v: string) => setUb((o) => ({ ...o, [k]: v }));
  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

  const applyClient = (c: any) => {
    setCommittente(c.nome);
    if (!luogo && c.comune) setLuogo(c.comune);
  };
  const applyInstallation = (i: any) => {
    setUb({
      indirizzo: i.indirizzo ?? "",
      comune: i.comune ?? "",
      provincia: i.provincia ?? "",
      cap: i.cap ?? "",
      scala: i.scala ?? "",
      piano: i.piano ?? "",
      interno: i.interno ?? "",
      proprieta: i.proprieta ?? "",
    });
    if (!luogo && i.comune) setLuogo(i.comune);
  };

  const canNext = useMemo(() => {
    if (step === 1) return tipologie.length > 0;
    return true;
  }, [step, tipologie]);

  const onNext = async () => {
    if (!canNext) return;
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
      return;
    }
    const data = {
      impresa: editing ? existing?.data?.impresa ?? company ?? {} : company ?? {},
      committente: { nome: committente },
      ubicazione: ub,
      intervento,
      tipologie,
      descrizione_impianto: descrizione,
      norme_tecniche: norme,
      materiali_rows: materialiRows,
      schema,
      allegati,
      allegati_facoltativi: allegatiFac,
      allegati_foto: foto,
      luogo,
      data_dichiarazione: dataIso,
    };
    if (editing && id) {
      await updateDoc.mutateAsync({ id, data });
      router.replace(`/document/${id}`);
    } else {
      const doc = await createDoc.mutateAsync({ tipo: "dico", data });
      router.replace(`/document/${doc.id}`);
    }
  };

  return (
    <WizardShell
      title={editing ? "Modifica DiCo" : "Dichiarazione di Conformità"}
      step={step}
      total={TOTAL}
      onClose={() => router.back()}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={onNext}
      nextLabel={step === TOTAL - 1 ? (editing ? "Salva modifiche" : "Genera documento") : "Avanti"}
      nextLoading={createDoc.isPending || updateDoc.isPending}
    >
      {step === 0 ? (
        <>
          <SectionLabel>Committente</SectionLabel>
          {clients && clients.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
              {clients.map((c) => (
                <Pressable key={c.id} testID={`pick-client-${c.id}`} style={styles.pill} onPress={() => applyClient(c)}>
                  <Text style={styles.pillText}>{c.nome}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <TextField label="Committente / Proprietà" value={committente} onChangeText={setCommittente} testID="dico-committente" />

          <SectionLabel>Ubicazione impianto</SectionLabel>
          {installations && installations.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
              {installations.map((i) => (
                <Pressable key={i.id} testID={`pick-inst-${i.id}`} style={styles.pill} onPress={() => applyInstallation(i)}>
                  <Text style={styles.pillText}>{i.descrizione}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <TextField label="Indirizzo" value={ub.indirizzo} onChangeText={(v) => setU("indirizzo", v)} />
          <View style={styles.row}>
            <TextField label="Comune" value={ub.comune} onChangeText={(v) => setU("comune", v)} style={{ flex: 1 } as any} />
            <View style={{ width: 80 }}>
              <TextField label="Prov." value={ub.provincia} onChangeText={(v) => setU("provincia", v)} autoCapitalize="characters" />
            </View>
          </View>
          <View style={styles.row}>
            <TextField label="Scala" value={ub.scala} onChangeText={(v) => setU("scala", v)} style={{ flex: 1 } as any} />
            <TextField label="Piano" value={ub.piano} onChangeText={(v) => setU("piano", v)} style={{ flex: 1 } as any} />
            <TextField label="Interno" value={ub.interno} onChangeText={(v) => setU("interno", v)} style={{ flex: 1 } as any} />
          </View>
          <TextField label="Proprietà / Condominio" value={ub.proprieta} onChangeText={(v) => setU("proprieta", v)} />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <SectionLabel>Tipo di intervento</SectionLabel>
          <View style={styles.card}>
            {INTERVENTION_TYPES.map((t) => (
              <CheckRow key={t.key} mode="radio" label={t.label} checked={intervento === t.key} onToggle={() => setIntervento(t.key)} testID={`interv-${t.key}`} />
            ))}
          </View>
          <SectionLabel>Tipologia impianto (DM 37/08)</SectionLabel>
          <View style={styles.card}>
            {PLANT_TYPES.map((t) => (
              <CheckRow key={t.key} label={t.label} checked={tipologie.includes(t.key)} onToggle={() => toggle(tipologie, setTipologie, t.key)} testID={`plant-${t.key}`} />
            ))}
          </View>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <SectionLabel>Descrizione impianto</SectionLabel>
          <TextField value={descrizione} onChangeText={setDescrizione} placeholder="Descrizione schematica dell'impianto realizzato" multiline style={styles.area} />
          <SectionLabel>Norme tecniche applicate</SectionLabel>
          <TextField value={norme} onChangeText={setNorme} placeholder="es. UNI 7129, UNI 11137, CEI 64-8…" multiline style={styles.area} />
          <SectionLabel>Relazione materiali</SectionLabel>
          <MaterialsTable value={materialiRows} onChange={setMaterialiRows} />
          <SectionLabel>Schema dell'impianto</SectionLabel>
          <Pressable testID="open-schema" style={styles.schemaBox} onPress={openSchema}>
            {schema && !isEmptySchema(schema) ? (
              <View style={styles.schemaThumbWrap}>
                <SvgXml xml={buildSchemaSvg(schema)} width="100%" height={140} />
                <Text style={styles.schemaEdit}>Tocca per modificare lo schema</Text>
              </View>
            ) : (
              <View style={styles.schemaEmpty}>
                <Text style={styles.schemaEmptyTitle}>Disegna schema impianto</Text>
                <Text style={styles.schemaEmptySub}>Simboli idraulici e tubazioni con colori personalizzabili</Text>
              </View>
            )}
          </Pressable>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <SectionLabel>Allegati obbligatori</SectionLabel>
          <View style={styles.card}>
            {ATTACHMENTS.map((a) => (
              <CheckRow key={a.key} label={a.label} checked={allegati.includes(a.key)} onToggle={() => toggle(allegati, setAllegati, a.key)} testID={`att-${a.key}`} />
            ))}
          </View>
          <TextField label="Altri allegati (facoltativi)" value={allegatiFac} onChangeText={setAllegatiFac} multiline style={styles.area} />
          <SectionLabel>Foto e scansioni</SectionLabel>
          <AttachmentPicker value={foto} onChange={setFoto} />
          <SectionLabel>Luogo e data</SectionLabel>
          <TextField label="Luogo" value={luogo} onChangeText={setLuogo} testID="dico-luogo" />
          <TextField
            label="Data (GG/MM/AAAA)"
            value={dateText}
            onChangeText={(v) => {
              setDateText(v);
              const iso = parseIT(v);
              if (iso) setDataIso(iso);
            }}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
            testID="dico-data"
          />
        </>
      ) : null}
    </WizardShell>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pills: { gap: spacing.sm, paddingVertical: spacing.xs },
  pill: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pillText: { color: colors.onBrandTertiary, fontWeight: "600", fontSize: 13 },
  area: { minHeight: 90, textAlignVertical: "top" },
  schemaBox: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", backgroundColor: colors.surfaceSecondary },
  schemaThumbWrap: { padding: spacing.sm, gap: spacing.xs },
  schemaEdit: { fontSize: 12, color: colors.brandPrimary, fontWeight: "600", textAlign: "center" },
  schemaEmpty: { padding: spacing.lg, alignItems: "center", gap: spacing.xs, borderStyle: "dashed", borderWidth: 1, borderColor: colors.brandPrimary, borderRadius: radius.lg, margin: -1 },
  schemaEmptyTitle: { fontSize: 15, fontWeight: "700", color: colors.brandPrimary },
  schemaEmptySub: { fontSize: 12, color: colors.muted, textAlign: "center" },
}));
