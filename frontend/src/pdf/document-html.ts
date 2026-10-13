// Generates print-ready HTML for DiCo / DiRi documents (DM 37/2008).

import { ATTACHMENTS, DIRI_BASIS, INTERVENTION_TYPES, PLANT_TYPES } from "@/src/constants/dico";

type AnyData = Record<string, any>;

function esc(s: any): string {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtDate(iso?: string): string {
  if (!iso) return "__________";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return esc(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function labelFor(list: { key: string; label: string }[], key: string): string {
  return list.find((x) => x.key === key)?.label ?? key;
}

function row(label: string, value: any): string {
  return `<tr><td class="lbl">${esc(label)}</td><td class="val">${esc(value) || "—"}</td></tr>`;
}

function section(title: string, inner: string): string {
  return `<div class="section"><div class="s-title">${esc(title)}</div>${inner}</div>`;
}

const STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1C1C1A; font-size: 11px; margin: 0; padding: 28px 32px; }
  .doc-head { border-bottom: 3px solid #C54B3C; padding-bottom: 10px; margin-bottom: 16px; }
  .doc-head h1 { font-size: 17px; margin: 0 0 2px; color: #1C1C1A; }
  .doc-head .law { font-size: 10px; color: #73736D; }
  .doc-head .num { float: right; font-size: 11px; font-weight: 700; color: #C54B3C; }
  .section { margin-bottom: 14px; }
  .s-title { background: #F5DFDC; color: #C54B3C; font-weight: 700; font-size: 10px; letter-spacing: .5px; text-transform: uppercase; padding: 5px 8px; border-radius: 4px; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 6px; vertical-align: top; border-bottom: 1px solid #E3E3E0; }
  td.lbl { width: 38%; color: #73736D; }
  td.val { font-weight: 600; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin-bottom: 3px; }
  .declare { background: #F9F9F8; border: 1px solid #E3E3E0; border-radius: 6px; padding: 10px; line-height: 1.5; }
  .sign { margin-top: 28px; display: flex; justify-content: space-between; }
  .sign .box { width: 45%; text-align: center; }
  .sign .line { border-top: 1px solid #1C1C1A; margin-top: 36px; padding-top: 4px; font-size: 10px; color: #73736D; }
  .place { margin-top: 18px; font-size: 11px; }
`;

function anagraficaImpresa(c: AnyData): string {
  const abil = (c.abilitazioni || [])
    .map((k: string) => k.toUpperCase())
    .join(", ");
  return section(
    "Impresa installatrice",
    `<table>
      ${row("Denominazione", c.denominazione)}
      ${row("Responsabile tecnico", c.responsabile_tecnico)}
      ${row("Partita IVA / C.F.", [c.partita_iva, c.codice_fiscale].filter(Boolean).join(" / "))}
      ${row("Sede", [c.indirizzo, c.cap, c.comune, c.provincia].filter(Boolean).join(", "))}
      ${row("Telefono / Email", [c.telefono, c.email].filter(Boolean).join(" · "))}
      ${row("Iscrizione CCIAA", c.cciaa_provincia || c.cciaa_numero ? `${c.cciaa_provincia} n. ${c.cciaa_numero}` : "")}
      ${row("Abilitata ai sensi art.1 (lettere)", abil)}
    </table>`,
  );
}

function ubicazione(u: AnyData): string {
  return section(
    "Ubicazione dell'impianto",
    `<table>
      ${row("Indirizzo", u.indirizzo)}
      ${row("Comune", [u.cap, u.comune, u.provincia].filter(Boolean).join(" "))}
      ${row("Scala / Piano / Interno", [u.scala, u.piano, u.interno].filter(Boolean).join(" / "))}
      ${row("Proprietà / Condominio", u.proprieta)}
    </table>`,
  );
}

function tipologie(data: AnyData): string {
  const items = (data.tipologie || [])
    .map((k: string) => `<li>${esc(labelFor(PLANT_TYPES, k))}</li>`)
    .join("");
  const intervento = data.intervento ? labelFor(INTERVENTION_TYPES, data.intervento) : "";
  return section(
    "Tipologia dell'impianto",
    `${intervento ? `<table>${row("Tipo di intervento", intervento)}</table>` : ""}
     <ul>${items || "<li>—</li>"}</ul>`,
  );
}

export function generateHtml(doc: { tipo: string; numero: string; data: AnyData }, company: AnyData): string {
  const d = doc.data || {};
  const committente = d.committente?.nome || "";

  if (doc.tipo === "dico") {
    const allegati = (d.allegati || [])
      .map((k: string) => `<li>${esc(labelFor(ATTACHMENTS, k))}</li>`)
      .join("");
    const declareText = `Il sottoscritto, titolare o legale rappresentante dell'impresa installatrice sopra indicata, DICHIARA sotto la propria responsabilità che l'impianto è stato realizzato in modo conforme alla regola dell'arte, secondo quanto previsto dall'art.6 del D.M. 37/2008, tenuto conto delle condizioni di esercizio, avendo:
      <ul>
        <li>rispettato il progetto redatto ai sensi dell'art.5;</li>
        <li>seguito la normativa tecnica applicabile all'impianto;</li>
        <li>installato componenti e materiali costruiti a regola d'arte e adatti al luogo di installazione;</li>
        <li>controllato l'impianto ai fini della sicurezza e della funzionalità con esito positivo.</li>
      </ul>`;

    return `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}</style></head><body>
      <div class="doc-head">
        <span class="num">N. ${esc(doc.numero)}</span>
        <h1>Dichiarazione di Conformità</h1>
        <div class="law">dell'impianto alla regola dell'arte — D.M. 22 gennaio 2008, n. 37 (art. 7)</div>
      </div>
      ${anagraficaImpresa(company)}
      ${section("Committente", `<table>${row("Committente / Proprietà", committente)}</table>`)}
      ${ubicazione(d.ubicazione || {})}
      ${tipologie(d)}
      ${d.descrizione_impianto ? section("Descrizione dell'impianto", `<div class="declare">${esc(d.descrizione_impianto)}</div>`) : ""}
      ${section("Dichiarazione", `<div class="declare">${declareText}</div>`)}
      ${
        d.norme_tecniche || d.materiali
          ? section(
              "Norme e materiali",
              `<table>${row("Norme tecniche applicate", d.norme_tecniche)}${row("Materiali e componenti", d.materiali)}</table>`,
            )
          : ""
      }
      ${section("Allegati obbligatori", `<ul>${allegati || "<li>—</li>"}</ul>${d.allegati_facoltativi ? `<div style="margin-top:6px">Facoltativi: ${esc(d.allegati_facoltativi)}</div>` : ""}`)}
      <div class="place">Luogo e data: <b>${esc(d.luogo) || "__________"}, ${fmtDate(d.data_dichiarazione)}</b></div>
      <div class="sign">
        <div class="box"><div class="line">Il responsabile tecnico</div></div>
        <div class="box"><div class="line">Il dichiarante (timbro e firma)</div></div>
      </div>
    </body></html>`;
  }

  // DiRi
  const basis = (d.basis || [])
    .map((k: string) => `<li>${esc(labelFor(DIRI_BASIS, k))}</li>`)
    .join("");
  const tec = d.tecnico || {};
  const declareText = `Il sottoscritto tecnico, in possesso dei requisiti di cui all'art.7, comma 6 del D.M. 37/2008, sulla base dell'esame della documentazione e/o del sopralluogo effettuato, DICHIARA la RISPONDENZA dell'impianto alla regola dell'arte, tenuto conto delle condizioni di esercizio e dell'uso cui l'impianto è destinato.`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}</style></head><body>
    <div class="doc-head">
      <span class="num">N. ${esc(doc.numero)}</span>
      <h1>Dichiarazione di Rispondenza</h1>
      <div class="law">D.M. 22 gennaio 2008, n. 37 — art. 7, comma 6</div>
    </div>
    ${section(
      "Tecnico dichiarante",
      `<table>
        ${row("Nome e cognome", tec.nome)}
        ${row("Iscritto all'albo", tec.albo_professione)}
        ${row("Provincia / N. iscrizione", [tec.albo_provincia, tec.albo_numero].filter(Boolean).join(" n. "))}
      </table>`,
    )}
    ${section("Proprietà / Committente", `<table>${row("Proprietà", committente)}</table>`)}
    ${ubicazione(d.ubicazione || {})}
    ${tipologie(d)}
    ${section("Dichiarazione", `<div class="declare">${declareText}</div>`)}
    ${section("Accertamenti effettuati", `<ul>${basis || "<li>—</li>"}</ul>`)}
    ${d.norme_tecniche ? section("Norme tecniche", `<table>${row("Norme applicate", d.norme_tecniche)}</table>`) : ""}
    ${d.note ? section("Note", `<div class="declare">${esc(d.note)}</div>`) : ""}
    <div class="place">Luogo e data: <b>${esc(d.luogo) || "__________"}, ${fmtDate(d.data_dichiarazione)}</b></div>
    <div class="sign">
      <div class="box"></div>
      <div class="box"><div class="line">Il tecnico (timbro e firma)</div></div>
    </div>
  </body></html>`;
}
