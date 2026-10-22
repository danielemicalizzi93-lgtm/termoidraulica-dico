import { router } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing, useTheme } from "@/src/theme";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "In sintesi",
    body: "DiCo Impianti funziona interamente sul tuo dispositivo. Non richiede account, non usa server esterni e non raccoglie, trasmette o vende alcun dato personale.",
  },
  {
    title: "Dati trattati",
    body: "Dati dell'impresa, del titolare e del responsabile tecnico, anagrafiche di clienti e impianti, dichiarazioni (DiCo e DiRi), relazioni materiali, schemi, logo e foto allegate. Questi dati sono inseriti da te e restano salvati solo nella memoria del dispositivo.",
  },
  {
    title: "Fotocamera e foto",
    body: "La fotocamera viene usata solo quando tocchi “Scatta foto”, per allegare immagini alle dichiarazioni. La scelta di immagini avviene con il selettore foto di sistema: l'app accede soltanto alle immagini che selezioni. Le foto non vengono inviate a nessuno.",
  },
  {
    title: "Condivisione",
    body: "I PDF e i file di backup vengono condivisi solo quando lo scegli tu, tramite le app di condivisione del dispositivo (email, messaggi, cloud…). Da quel momento il loro trattamento dipende dal servizio che hai scelto.",
  },
  {
    title: "Sicurezza",
    body: "Puoi proteggere l'accesso all'app con un PIN locale. Il PIN è memorizzato in modo sicuro sul dispositivo.",
  },
  {
    title: "Conservazione e cancellazione",
    body: "I dati restano sul dispositivo finché non li elimini dall'app o disinstalli l'app. Disinstallando l'app tutti i dati vengono cancellati; conserva un backup se vuoi recuperarli.",
  },
  {
    title: "Analisi e pubblicità",
    body: "L'app non contiene pubblicità, strumenti di analisi, tracciamento o identificativi pubblicitari.",
  },
  {
    title: "Contatti",
    body: "Per domande su questa informativa puoi contattare il titolare dell'app tramite i recapiti indicati nella scheda dello store.",
  },
];

export default function PrivacyScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="privacy-back" onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <CaretLeft color={colors.brandPrimary} size={24} weight="bold" />
        </Pressable>
        <Text style={styles.title}>Informativa privacy</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.updated}>Ultimo aggiornamento: giugno 2026</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.h}>{s.title}</Text>
            <Text style={styles.p}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surfaceSecondary,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: colors.onSurface },
  content: { padding: spacing.lg, gap: spacing.lg },
  updated: { fontSize: 13, color: colors.muted },
  section: { gap: spacing.xs },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  p: { fontSize: 15, lineHeight: 22, color: colors.onSurface },
}));
