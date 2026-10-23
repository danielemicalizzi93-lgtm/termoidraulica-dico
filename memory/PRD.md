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

## Modelli ricorrenti + Logo ditta (Jun 2026)
- Templates locali (dico_templates): salva/usa modelli per relazione materiali (append righe) e schema (sostituisce) nel wizard DiCo; inclusi nel backup
- Logo ditta in Profilo (un tocco, galleria), salvato in company.logo_uri, stampato in intestazione di tutti i PDF DiCo/DiRi; incluso nel backup

## Modelli CNA (Jun 2026)
- src/pdf/cna-html.ts ricrea fedelmente i modelli CNA DiCo (Rev 01-2023) e DiRi, compilati con i dati; allegati (materiali, schema, foto) su pagine successive
- Dettaglio documento: selettore "Modello CNA" (default) / "Modello app" per anteprima ed esportazione
- Nuovi campi: impresa (settore, civico, albo artigiani prov/n.), DiCo (n. civico, intervento altro, uso edificio, progetto redatto da + progettista/albo, allegato materiali non normalizzati), DiRi (civico, richiesta di, impianto accertato, anno realizzazione, uso edificio, allegati relazione verifica/certificato/altro)
- Profilo: campi separati "Titolare / legale rappresentante" (company.titolare) e "Responsabile tecnico (anche esterno)"; DiCo CNA usa il titolare come sottoscritto, DiRi usa il responsabile tecnico

## Play Store fixes (Jun 2026)
- Allegati: pulsante "Scatta foto" (fotocamera, permesso controllato prima di richiederlo) + Galleria via selettore di sistema senza permessi
- app.json android: solo CAMERA; blockedPermissions READ_MEDIA_IMAGES/VIDEO, READ/WRITE_EXTERNAL_STORAGE, RECORD_AUDIO; image-picker microphonePermission false
- Immagine Home locale (assets/images/home-hero.jpg)
- Pagina /privacy (Informativa privacy) con link in Profilo; URL pubblico = <url pubblicato>/privacy

## Firme + Modelli DiCo completi (Jun 2026)
- SignatureModal (PanResponder + react-native-svg), firme salvate come path SVG in doc.data.firme {dichiarante, responsabile, cliente{name,date}}
- Dettaglio documento: card Firme (DiCo: titolare, responsabile tecnico, ricevuta cliente; DiRi: dichiarante, committente); stampate nei box firma CNA e nel modello app; ricevuta cliente con nome e data automatici (campi 14-15-16)
- Wizard preservano firme in modifica
- Template kind "dico": salva/usa DiCo completa (intervento, uso, progetto, tipologie, descrizione, norme, materiali, schema, allegati) nel passo 1 e nel passo finale

## Visura / DURC / Patente a crediti (Jun 2026)
- FileField (expo-document-picker, PDF o immagini) + pickFile/shareFile in attachments.ts
- Visura camerale per ogni dichiarazione (data.visura), obbligatoria: richiesta nel passo finale dei wizard; export bloccato in dettaglio finché manca (allegabile anche dal dettaglio)
- Profilo > Documenti ditta: DURC (file + scadenza GG/MM/AAAA, stato valido/in scadenza 15gg/scaduto) e Patente a crediti (file + numero + punteggio)
- PDF: immagini allegate come pagine finali, riga info patente/DURC; file PDF inviati separatamente con "Invia PDF" nel dettaglio
- Backup include visura/DURC/patente

## PDF A4 (Jun 2026)
- printToFileAsync con width 595 / height 842 (A4, prima iOS usava Letter) + meta viewport (evita testo minuscolo su Android)
- Font e spaziature ingranditi (CNA 12.5px, modello app 14px); DiCo CNA resta su 1 pagina + allegati
