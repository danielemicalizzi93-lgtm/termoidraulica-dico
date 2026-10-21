// Shared constants for DM 37/2008 documents (DiCo & DiRi)

export const PLANT_TYPES: { key: string; label: string }[] = [
  { key: "a", label: "a) Impianti di produzione, trasformazione, trasporto, distribuzione e utilizzazione dell'energia elettrica" },
  { key: "b", label: "b) Impianti radiotelevisivi, antenne ed elettronici in genere" },
  { key: "c", label: "c) Impianti di riscaldamento, climatizzazione, condizionamento e refrigerazione (canne fumarie comprese)" },
  { key: "d", label: "d) Impianti idrici e sanitari di qualsiasi natura o specie" },
  { key: "e", label: "e) Impianti per la distribuzione e l'utilizzazione di gas di qualsiasi tipo" },
  { key: "f", label: "f) Impianti di sollevamento di persone o cose (ascensori, montacarichi, scale mobili)" },
  { key: "g", label: "g) Impianti di protezione antincendio" },
];

export const INTERVENTION_TYPES: { key: string; label: string }[] = [
  { key: "nuovo", label: "Nuovo impianto" },
  { key: "trasformazione", label: "Trasformazione" },
  { key: "ampliamento", label: "Ampliamento" },
  { key: "manutenzione", label: "Manutenzione straordinaria" },
  { key: "altro", label: "Altro" },
];

export const ABILITAZIONI = PLANT_TYPES;

export const DIRI_BASIS: { key: string; label: string }[] = [
  { key: "sopralluogo", label: "Sopralluogo e accertamento diretto dell'impianto" },
  { key: "documentazione", label: "Documentazione reperibile sull'impianto" },
  { key: "esperienza", label: "Esperienza professionale diretta ultraquinquennale" },
];

export const ATTACHMENTS: { key: string; label: string }[] = [
  { key: "progetto", label: "Progetto" },
  { key: "relazione_materiali", label: "Relazione con tipologie dei materiali utilizzati" },
  { key: "schema", label: "Schema dell'impianto realizzato" },
  { key: "riferimento_dichiarazioni", label: "Riferimento a dichiarazioni di conformità precedenti o parziali" },
  { key: "certificato_requisiti", label: "Copia del certificato di riconoscimento dei requisiti tecnico-professionali" },
  { key: "attestazione_non_normalizzati", label: "Attestazione di conformità per materiali o sistemi non normalizzati" },
];

export const USO_EDIFICIO: { key: string; label: string }[] = [
  { key: "civile", label: "Civile" },
  { key: "industriale", label: "Industriale" },
  { key: "commercio", label: "Commercio" },
  { key: "altri", label: "Altri usi" },
];

export const DIRI_ALLEGATI: { key: string; label: string }[] = [
  { key: "relazione_verifica", label: "Relazione di verifica impianto" },
  { key: "certificato_requisiti", label: "Copia del certificato di riconoscimento dei requisiti tecnico-professionali" },
];

export function plantLabelShort(key: string): string {
  const map: Record<string, string> = {
    a: "Elettrico",
    b: "Radiotelevisivo/Elettronico",
    c: "Climatizzazione/Riscaldamento",
    d: "Idrico-sanitario",
    e: "Gas",
    f: "Sollevamento",
    g: "Antincendio",
  };
  return map[key] ?? key;
}
