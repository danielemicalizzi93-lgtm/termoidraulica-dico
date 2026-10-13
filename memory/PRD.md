# PRD — DiCo Pro (Dichiarazioni termoidrauliche DM 37/2008)

## Problem statement (original)
"Vorrei creare un'app che mi permetta di stilare DiCo per impianti idraulici, gas, climatizzazione e tutto ciò che riguarda la termoidraulica che mi dia la possibilità di stilare anche dichiarazioni di rispondenza."

## User choices
- Documenti: DiCo (Dichiarazione di Conformità) + DiRi (Dichiarazione di Rispondenza)
- Anagrafica impresa salvata una volta + clienti/impianti riutilizzabili
- Export PDF conforme ai modelli DM 37/2008, condivisibile
- Auth: Google (Emergent) + email/password
- Stile: professionale/pulito deciso dall'agente (terracotta #C54B3C)

## Architecture
- Frontend: Expo Router (React Native), react-query, react-native-keyboard-controller, phosphor icons, expo-print/expo-sharing per PDF, react-native-webview per anteprima.
- Backend: FastAPI + MongoDB (motor). Sessioni Bearer a 7 giorni in `user_sessions`.
- Auth: email/password (bcrypt) + Emergent Google OAuth, unificate sullo stesso session_token.
- Collezioni: users, user_sessions, companies, clients, installations, documents (soft delete con deleted_at).

## User persona
Installatore termoidraulico / tecnico abilitato che compila dichiarazioni in cantiere dal telefono.

## Core requirements (static)
- Creare DiCo e DiRi tramite wizard multi-step.
- Numerazione automatica progressiva (DICO-ANNO-0001 / DIRI-ANNO-0001).
- Anagrafica impresa, abilitazioni art.1, dati tecnico per DiRi.
- Clienti e impianti riutilizzabili.
- Export/condivisione PDF.

## Implemented (2026-10-13)
- Auth email/password + Google, gate root-layout, logout.
- Dashboard con quick-create e documenti recenti.
- Wizard DiCo (4 step) e DiRi (4 step) con precompilazione da anagrafiche.
- Anagrafiche Clienti/Impianti (CRUD, soft delete).
- Profilo impresa + abilitazioni + dati tecnico.
- Dettaglio documento con anteprima WebView + export PDF.
- Testing agent: 23/23 backend pass, core frontend pass.

## Backlog (prioritized)
- P1: Logo impresa nel PDF (object storage) e firma digitale/immagine firma.
- P1: Modifica documento esistente (ri-apertura wizard) oltre alla creazione.
- P1: Allegati come file/foto (scansione progetto) con object storage.
- P2: Duplica documento, ricerca/filtri avanzati nell'archivio.
- P2: Esportazione elenco/registro documenti, backup/condivisione multipla.
- P2: Dark mode.

## Next tasks
- Aggiungere logo + firma al PDF.
- Abilitare editing di un documento salvato.
