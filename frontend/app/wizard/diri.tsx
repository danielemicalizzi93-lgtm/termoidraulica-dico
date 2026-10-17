import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

import {
  useCompany,
  useCreateDocument,
  useDocument,
  useInstallations,
  useUpdateDocument,
} from "@/src/api/hooks";
import type { AttachmentT } from "@/src/local/db";
import { AttachmentPicker } from "@/src/components/attachment-picker";
import { CheckRow, SectionLabel, TextField } from "@/src/components/ui";
import { WizardShell } from "@/src/components/wizard-shell";
import { DIRI_BASIS, PLANT_TYPES } from "@/src/constants/dico";
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

export default function DiRiWizard() {
  const styles = useStyles();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const { data: existing } = useDocument(id ?? "");
  const { data: installations } = useInstallations();
  const { data: company } = useCompany();
  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();

  const [step, setStep] = useState(0);
  const [tecnico, setTecnico] = useState<Record<string, string>>({});
  const [committente, setCommittente] = useState("");
  const [ub, setUb] = useState<Record<string, string>>({});
  const [tipologie, setTipologie] = useState<string[]>([]);
  const [basis, setBasis] = useState<string[]>(["sopralluogo", "esperienza"]);
  const [norme, setNorme] = useState("");
  const [note, setNote] = useState("");
  const [foto, setFoto] = useState<AttachmentT[]>([]);
  const [luogo, setLuogo] = useState("");
  const [dataIso, setDataIso] = useState(todayISO());
  const [dateText, setDateText] = useState(fmtIT(todayISO()));

  const prefilled = useRef(false);
  useEffect(() => {
    if (!editing && company) {
      setTecnico((t) =>
        t.nome
          ? t
          : {
              nome: company.responsabile_tecnico || "",
              albo_professione: company.albo_professione || "",
              albo_provincia: company.albo_provincia || "",
              albo_numero: company.albo_numero || "",
            },
      );
    }
  }, [company, editing]);

  useEffect(() => {
    if (!existing || prefilled.current) return;
    prefilled.current = true;
    const d = existing.data || {};
    setTecnico(d.tecnico ?? {});
    setCommittente(d.committente?.nome ?? "");
    setUb(d.ubicazione ?? {});
    setTipologie(d.tipologie ?? []);
    setBasis(d.basis ?? []);
    setNorme(d.norme_tecniche ?? "");
    setNote(d.note ?? "");
    setFoto(d.allegati_foto ?? []);
    setLuogo(d.luogo ?? "");
    if (d.data_dichiarazione) {
      setDataIso(d.data_dichiarazione);
      setDateText(fmtIT(d.data_dichiarazione));
    }
  }, [existing]);

  const setT = (k: string, v: string) => setTecnico((o) => ({ ...o, [k]: v }));
  const setU = (k: string, v: string) => setUb((o) => ({ ...o, [k]: v }));
  const toggle = (list: string[], set: (v: string[]) => void, key: string) =>
    set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);

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
    if (step === 2) return tipologie.length > 0;
    return true;
  }, [step, tipologie]);

  const onNext = async () => {
    if (!canNext) return;
    if (step < TOTAL - 1) {
      setStep((s) => s + 1);
      return;
    }
    const data = {
      tecnico,
      committente: { nome: committente },
      ubicazione: ub,
      tipologie,
      basis,
      norme_tecniche: norme,
      note,
      allegati_foto: foto,
      luogo,
      data_dichiarazione: dataIso,
    };
    if (editing && id) {
      await updateDoc.mutateAsync({ id, data });
      router.replace(`/document/${id}`);
    } else {
      const doc = await createDoc.mutateAsync({ tipo: "diri", data });
      router.replace(`/document/${doc.id}`);
    }
  };

  return (
    <WizardShell
      title={editing ? "Modifica DiRi" : "Dichiarazione di Rispondenza"}
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
          <SectionLabel>Tecnico dichiarante</SectionLabel>
          <TextField label="Nome e cognome" value={tecnico.nome} onChangeText={(v) => setT("nome", v)} testID="diri-tecnico" />
          <TextField label="Iscritto all'albo / collegio" value={tecnico.albo_professione} onChangeText={(v) => setT("albo_professione", v)} placeholder="es. Perito Industriale" />
          <View style={styles.row}>
            <View style={{ width: 110 }}>
              <TextField label="Provincia" value={tecnico.albo_provincia} onChangeText={(v) => setT("albo_provincia", v)} autoCapitalize="characters" />
            </View>
            <TextField label="N. iscrizione" value={tecnico.albo_numero} onChangeText={(v) => setT("albo_numero", v)} style={{ flex: 1 } as any} />
          </View>
          <SectionLabel>Proprietà / Committente</SectionLabel>
          <TextField label="Proprietà" value={committente} onChangeText={setCommittente} testID="diri-committente" />
        </>
      ) : null}

      {step === 1 ? (
        <>
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

      {step === 2 ? (
        <>
          <SectionLabel>Tipologia impianto (DM 37/08)</SectionLabel>
          <View style={styles.card}>
            {PLANT_TYPES.map((t) => (
              <CheckRow key={t.key} label={t.label} checked={tipologie.includes(t.key)} onToggle={() => toggle(tipologie, setTipologie, t.key)} testID={`plant-${t.key}`} />
            ))}
          </View>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <SectionLabel>Accertamenti effettuati</SectionLabel>
          <View style={styles.card}>
            {DIRI_BASIS.map((b) => (
              <CheckRow key={b.key} label={b.label} checked={basis.includes(b.key)} onToggle={() => toggle(basis, setBasis, b.key)} testID={`basis-${b.key}`} />
            ))}
          </View>
          <SectionLabel>Norme tecniche</SectionLabel>
          <TextField value={norme} onChangeText={setNorme} placeholder="Norme applicate" multiline style={styles.area} />
          <SectionLabel>Note</SectionLabel>
          <TextField value={note} onChangeText={setNote} placeholder="Note aggiuntive" multiline style={styles.area} />
          <SectionLabel>Foto e scansioni</SectionLabel>
          <AttachmentPicker value={foto} onChange={setFoto} />
          <SectionLabel>Luogo e data</SectionLabel>
          <TextField label="Luogo" value={luogo} onChangeText={setLuogo} testID="diri-luogo" />
          <TextField
            label="Data (GG/MM/AAAA)"
            value={dateText}
            onChangeText={(v) => {
              setDateText(v);
              const iso = parseIT(v);
              if (iso) setDataIso(iso);
            }}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
            testID="diri-data"
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
}));
