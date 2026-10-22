import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretLeft, Export, PencilSimple, ShareNetwork, Trash, Warning } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { useCompany, useDeleteDocument, useDocument, useUpdateDocument } from "@/src/api/hooks";
import { isPdf, shareFile, toDataUri } from "@/src/local/attachments";
import { declarationFiles, durcStatus } from "@/src/local/company-docs";
import { FileField } from "@/src/components/file-field";
import { Button } from "@/src/components/ui";
import { SignaturesCard } from "@/src/components/signatures-card";
import { INTERVENTION_TYPES, PLANT_TYPES } from "@/src/constants/dico";
import { generateHtml } from "@/src/pdf/document-html";
import { generateCnaHtml } from "@/src/pdf/cna-html";
import { exportPdf } from "@/src/pdf/share";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

function labelFor(list: { key: string; label: string }[], key: string) {
  return list.find((x) => x.key === key)?.label ?? key;
}

export default function DocumentDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: doc, isLoading } = useDocument(id);
  const { data: company } = useCompany();
  const del = useDeleteDocument();
  const update = useUpdateDocument();
  const [exporting, setExporting] = useState(false);
  const [html, setHtml] = useState("");
  const [model, setModel] = useState<"cna" | "app">("cna");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!doc) return;
      const foto = doc.data?.allegati_foto || [];
      const resolved = await Promise.all(
        foto.map(async (f: any) => ({ ...f, dataUri: await toDataUri(f.uri) })),
      );
      const data = { ...doc.data, allegati_foto: resolved };
      const files = declarationFiles(doc.data || {}, company || {}).filter((x) => !isPdf(x.file));
      (data as any).docs_img = await Promise.all(files.map(async (x) => ({ label: x.label, dataUri: await toDataUri(x.file.uri) })));
      const logo = company?.logo_uri ? await toDataUri(company.logo_uri) : undefined;
      if (active) {
        const cur = company || {};
        const impresa = {
          ...cur,
          ...(doc.data?.impresa || {}),
          durc_scadenza: cur.durc_scadenza,
          patente_numero: cur.patente_numero,
          patente_punteggio: cur.patente_punteggio,
        };
        const gen = model === "cna" ? generateCnaHtml : generateHtml;
        setHtml(gen({ ...doc, data }, impresa, logo));
      }
    })();
    return () => {
      active = false;
    };
  }, [doc, company, model]);

  if (isLoading || !doc) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.loading}>Caricamento…</Text>
      </View>
    );
  }

  const d = doc.data || {};
  const isDico = doc.tipo === "dico";
  const files = declarationFiles(d, company || {});
  const pdfFiles = files.filter((x) => isPdf(x.file));
  const durc = durcStatus(company || {});
  const canSend = !!d.visura;

  const onExport = async () => {
    if (!canSend) return;
    setExporting(true);
    try {
      await exportPdf(html);
    } finally {
      setExporting(false);
    }
  };

  const onEdit = () => {
    router.push(`/wizard/${doc.tipo}?id=${doc.id}` as any);
  };

  const onDelete = async () => {
    await del.mutateAsync(id);
    router.back();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-button" onPress={() => router.back()} style={styles.iconBtn}>
          <CaretLeft color={colors.onSurface} size={22} weight="bold" />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{doc.numero}</Text>
          <Text style={styles.sub}>{isDico ? "Dichiarazione di Conformità" : "Dichiarazione di Rispondenza"}</Text>
        </View>
        <Pressable testID="edit-button" onPress={onEdit} style={styles.iconBtn}>
          <PencilSimple color={colors.brandPrimary} size={20} weight="bold" />
        </Pressable>
        <Pressable testID="delete-button" onPress={onDelete} style={styles.iconBtn}>
          <Trash color={colors.error} size={20} weight="bold" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Row label="Committente" value={d.committente?.nome} />
          <Row label="Ubicazione" value={[d.ubicazione?.indirizzo, d.ubicazione?.comune].filter(Boolean).join(", ")} />
          {isDico ? <Row label="Intervento" value={labelFor(INTERVENTION_TYPES, d.intervento)} /> : null}
          <Row
            label="Tipologie"
            value={(d.tipologie || []).map((k: string) => labelFor(PLANT_TYPES, k).split(")")[0] + ")").join(" ")}
          />
          <Row label="Data" value={d.luogo ? `${d.luogo}` : undefined} />
        </View>

        <Text style={styles.previewLabel}>Documenti allegati</Text>
        <View style={styles.card}>
          {!canSend ? (
            <View style={styles.alert} testID="visura-missing">
              <Warning color={colors.error} size={20} weight="fill" />
              <Text style={styles.alertText}>Manca la visura camerale: allegala per poter inviare la dichiarazione al cliente.</Text>
            </View>
          ) : null}
          <FileField
            label="Visura camerale"
            value={d.visura}
            onChange={(f) => update.mutate({ id: doc.id, data: { ...d, visura: f } })}
            required
            testID="detail-visura-pick"
          />
          {durc.state === "expired" || durc.state === "expiring" ? (
            <View style={styles.alert} testID="durc-alert">
              <Warning color={durc.state === "expired" ? colors.error : colors.warning} size={20} weight="fill" />
              <Text style={styles.alertText}>
                {durc.state === "expired" ? `Il DURC è scaduto da ${-durc.days} giorni: aggiornalo in Profilo.` : `Il DURC scade tra ${durc.days} giorni.`}
              </Text>
            </View>
          ) : null}
          {files.map((x) => (
            <View key={x.label} style={styles.fileRow}>
              <Text style={styles.fileLabel}>{x.label}</Text>
              {isPdf(x.file) ? (
                <Pressable testID={`share-file-${x.label}`} onPress={() => shareFile(x.file)} hitSlop={8} style={styles.shareBtn}>
                  <ShareNetwork color={colors.brandPrimary} size={18} weight="bold" />
                  <Text style={styles.shareText}>Invia PDF</Text>
                </Pressable>
              ) : (
                <Text style={styles.fileNote}>inclusa nel PDF</Text>
              )}
            </View>
          ))}
          {pdfFiles.length > 0 ? (
            <Text style={styles.fileNote}>I file PDF si inviano separatamente, subito dopo la dichiarazione.</Text>
          ) : null}
        </View>

        <Text style={styles.previewLabel}>Firme</Text>
        <SignaturesCard doc={doc} company={company || {}} />

        <Text style={styles.previewLabel}>Modello PDF</Text>
        <View style={styles.seg}>
          {(
            [
              ["cna", "Modello CNA"],
              ["app", "Modello app"],
            ] as const
          ).map(([k, l]) => (
            <Pressable
              key={k}
              testID={`model-${k}`}
              style={[styles.segBtn, model === k && styles.segActive]}
              onPress={() => setModel(k)}
            >
              <Text style={[styles.segText, model === k && styles.segTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.previewLabel}>Anteprima documento</Text>
        <View style={styles.preview} testID="document-preview">
          {Platform.OS === "web" ? (
            <Text style={styles.webHint}>Tocca "Esporta PDF" per aprire l'anteprima stampabile.</Text>
          ) : (
            <WebView originWhitelist={["*"]} source={{ html }} style={styles.webview} scalesPageToFit />
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          testID="export-pdf-button"
          title={canSend ? "Esporta PDF" : "Allega la visura per inviare"}
          onPress={onExport}
          loading={exporting}
          disabled={!canSend}
          icon={<Export color={colors.onBrandPrimary} size={20} weight="bold" />}
        />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  loading: { padding: spacing.xl, color: colors.muted },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  titleWrap: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  sub: { fontSize: 12, color: colors.muted },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, gap: spacing.md },
  infoLabel: { fontSize: 13, color: colors.muted },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.onSurface, flex: 1, textAlign: "right" },
  previewLabel: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  alert: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", paddingVertical: spacing.xs },
  alertText: { flex: 1, fontSize: 13, color: colors.onSurface, fontWeight: "600" },
  fileRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  fileLabel: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  fileNote: { fontSize: 12, color: colors.muted },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 40 },
  shareText: { color: colors.brandPrimary, fontWeight: "700", fontSize: 14 },
  seg: { flexDirection: "row", backgroundColor: colors.surfaceTertiary, borderRadius: radius.md, padding: 3 },
  segBtn: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.sm },
  segActive: { backgroundColor: colors.brandPrimary },
  segText: { fontSize: 14, fontWeight: "700", color: colors.muted },
  segTextActive: { color: colors.onBrandPrimary },
  preview: {
    height: 480,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  webview: { flex: 1, backgroundColor: colors.surfaceSecondary },
  webHint: { padding: spacing.lg, color: colors.muted, textAlign: "center" },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
}));
