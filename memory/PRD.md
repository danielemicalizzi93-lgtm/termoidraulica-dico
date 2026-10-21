# PRD — DiCo Pro (Dichiarazioni termoidrauliche DM 37/2008)

## Problem statement (original)
"Vorrei creare un'app che mi permetta di stilare DiCo per impianti idraulici, gas, climatizzazione e tutto ciò che riguarda la termoidraulica che mi dia la possibilità di stilare anche dichiarazioni di rispondenza."

Iterazione 2 (richiesta utente): modifica di un documento salvato; allegati foto nei documenti e nel PDF; funzionamento 100% locale/offline con blocco PIN opzionale all'avvio.

## User choices
- Documenti: DiCo + DiRi.
- Anagrafica impresa salvata + clienti/impianti riutilizzabili.
- Export PDF conforme DM 37/2008, condivisibile, con foto allegate in fondo.
- Architettura: 100% LOCALE sul dispositivo, nessun server, nessun login.
- Protezione accesso: PIN locale opzionale all'avvio.
- Stile: professionale/pulito (terracotta #C54B3C).

## Architecture (iterazione 2)
- 100% on-device. Nessun backend usato dall'app. Tutto offline.
- Dati persistiti localmente via `@/src/utils/storage` (AsyncStorage / localStorage su web):
  chiavi `dico_company`, `dico_clients`, `dico_installations`, `dico_documents`, `dico_counters`.
- Layer dati: `src/local/db.ts` (CRUD + numerazione progressiva per anno/tipo).
- Hook react-query (`src/api/hooks.ts`) ora chiamano `db.ts` invece della rete.
- Allegati foto: `expo-image-picker` (fotocamera/galleria) + copia file con `expo-file-system/legacy`;
  conversione in data URI per includere le immagini nel PDF/anteprima.
- Blocco PIN: `src/local/lock-context.tsx` (PIN in secure-store) + `LockScreen`, re-lock in background.
- PDF: `expo-print` + `expo-sharing`, HTML in `src/pdf/document-html.ts` (sezione "Allegati fotografici").
- NB: il backend FastAPI/Mongo resta nel repo ma NON è più utilizzato dall'app.

## User persona
Installatore termoidraulico / tecnico abilitato che compila dichiarazioni in cantiere, spesso senza connessione.

## Core requirements (static)
- Creare e MODIFICARE DiCo e DiRi tramite wizard multi-step.
- Numerazione automatica (DICO-ANNO-0001 / DIRI-ANNO-0001).
- Anagrafica impresa + abilitazioni + dati tecnico per DiRi.
- Clienti e impianti riutilizzabili (precompilazione wizard).
- Allegare foto/scansioni ed esportarle nel PDF.
- Tutto offline; accesso protetto da PIN opzionale.

## Implemented
- 2026-10-13: MVP (DiCo/DiRi, anagrafiche, PDF, dashboard) — con backend+auth.
- 2026-10-17: Refactor 100% locale/offline; rimosso backend/auth/login.
  - Modifica documento salvato (edit mode nei wizard).
  - Allegati foto (fotocamera/galleria) inclusi nel PDF.
  - Blocco PIN opzionale all'avvio (set/cambia/rimuovi nel Profilo).
  - Testing agent: 12/12 flussi frontend PASS.
- 2026-10-17 (b): Backup/ripristino archivio + ricerca documenti.
  - Backup: esporta tutto (impresa, clienti, impianti, documenti + foto in base64) in un file JSON
    e reimporta su altro dispositivo (src/local/backup.ts, expo-document-picker/file-system/sharing).
    Il PIN NON è incluso nel backup per sicurezza.
  - Ricerca: barra di ricerca nella tab Documenti per numero o committente (verificata).
- 2026-10-17 (c): Schema impianto + tabella relazione materiali (DiCo).
  - Editor schema (app/schema.tsx): simboli idraulici (valvole, pompa, caldaia, radiatore, accumulo,
    scambiatore, collettore, raccordi, manometro, ecc.), disegno tubazioni a polilinea, colore
    personalizzabile per OGNI simbolo e linea, ridimensiona/ruota/elimina, sfondo. Simboli definiti
    come SVG in src/schema/symbols.ts (stessi usati in editor e PDF, vettoriali).
  - Draggable su nativo (PanResponder); su web selezione via tap (niente drag) per evitare warning RNW.
  - Schema serializzato in document.data.schema; renderizzato nel PDF come SVG vettoriale (src/schema/render.ts).
  - Tabella materiali (src/components/materials-table.tsx): righe Tubo/Raccordo con descrizione,
    materiale, diametro, quantità (m per tubi / pz per raccordi), tipo di tenuta, marca.
    Salvata in document.data.materiali_rows e resa come tabella nel PDF.
- 2026-10-17 (d): Totali materiali + aggancio tubazioni ai simboli.
  - Totali automatici (src/materials.ts materialTotals): metri tubi, pezzi raccordi e breakdown per
    materiale; mostrati nella tabella (card "Totali") e nel PDF (sezione totali).
  - Port/bocchelli sui simboli (src/schema/symbols.ts PORTS: left/right/top/bottom). Le tubazioni
    agganciano al bocchello più vicino (snap, soglia 28px) e il punto viene salvato come riferimento
    {sym, port}; render.ts resolveLinePoint risolve i riferimenti, così la linea segue il simbolo
    quando viene spostato/ruotato/ridimensionato. Guide (pallini) visibili in modalità linea.
- 2026-10-17 (e): Griglia magnetica + etichette schema.
  - Griglia (GRID=20px) mostrata nel foglio editor con toggle "Griglia"; simboli, etichette e punti
    liberi delle linee fanno snap alla griglia (lo snap ai bocchelli ha priorità). La griglia è solo
    aiuto di editing: non compare nel PDF.
  - Etichette di testo (kind "label"): pulsante "Testo" aggiunge un'etichetta editabile (TextField nel
    toolbar), con colore, dimensione, trascinamento ed eliminazione; resa nel PDF come testo vettoriale.
    Toolbar avvolto in KeyboardStickyView per editare il testo sopra la tastiera.

## Backlog (prioritized)
- P1: Logo impresa + firma (immagine) nel PDF.
- P1: Duplica documento (parti da uno esistente).
- P2: Backup/export dell'archivio locale (file JSON) e ripristino, per cambio telefono.
- P2: Ricerca testuale nell'archivio; ordinamento.
- P2: Dark mode.

## Platform notes
- Allegati FOTOCAMERA richiedono dispositivo reale (non testabili su Expo Go web preview / l'upload da web non è il target).
- Numerazione e dati sono per-dispositivo (nessuna sincronizzazione cloud per scelta dell'utente).

## Next tasks
- Logo + firma nel PDF.
- Funzione di backup/ripristino dell'archivio locale.

## Branding (Jun 2026)
- Logo utente "DI.CO Impianti Certificati" usato come icona app, adaptive icon, splash, favicon e logo nella Home
- Palette aggiornata ai colori del logo: blu #0A56AC primario, verde #3A9A50 successo, arancio #E8801E avviso; PDF con accenti blu
- Nome app: DiCo Impianti
