// Faithful re-creation of the CNA DiCo (Rev 01-2023) and DiRi models, filled with app data.

import { ATTACHMENTS } from "@/src/constants/dico";
import { buildSchemaSvg, isEmptySchema } from "@/src/schema/render";
import { fmtNum, materialTotals } from "@/src/materials";

type AnyData = Record<string, any>;

function esc(s: any): string {
  if (s === undefined || s === null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Underlined fill-in field
function f(v: any, w = 80, flex = false): string {
  const val = esc(v);
  return `<span class="f${flex ? " fx" : ""}" style="min-width:${w}px">${val || "&nbsp;"}</span>`;
}

function cb(checked: boolean): string {
  return `<span class="cb">${checked ? "✓" : ""}</span>`;
}

// Inline SVG of a hand-drawn signature (or empty space)
function sig(s: AnyData | undefined, h = 34): string {
  if (!s?.paths?.length) return `<div style="height:${h}px"></div>`;
  return `<svg class="sig" viewBox="0 0 ${s.w} ${s.h}" preserveAspectRatio="xMidYMid meet" style="height:${h}px;width:100%">${s.paths
    .map((d: string) => `<path d="${esc(d)}" stroke="#0B2F5E" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join("")}</svg>`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? esc(iso) : d.toLocaleDateString("it-IT");
}

function usoRow(uso: string): string {
  const opts = [
    ["industriale", "industriale"],
    ["civile", "civile"],
    ["commercio", "commercio"],
    ["altri", "altri usi"],
  ];
  return opts.map(([k, l]) => `<span class="opt">${cb(uso === k)} ${l}</span>`).join("");
}

const STYLE = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Calibri, Arial, Helvetica, sans-serif; color: #000; font-size: 11px; margin: 0; }
  .page { border: 1px solid #555; padding: 14px 20px; min-height: 271mm; position: relative; }
  .pb { page-break-before: always; }
  .head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
  .head .logo { max-height: 54px; max-width: 110px; object-fit: contain; }
  .head .titles { flex: 1; }
  .head h1 { font-size: 15px; font-style: italic; margin: 0; font-weight: 800; }
  .head .sub { font-size: 10.5px; margin-top: 2px; }
  .head .prot { border: 1px solid #000; padding: 8px 10px; font-size: 12px; white-space: nowrap; }
  .diri .head h1 { font-style: normal; font-family: Arial, Helvetica, sans-serif; }
  p, .ln { margin: 0 0 5px; line-height: 1.6; }
  .f { display: inline-block; border-bottom: 1px solid #000; padding: 0 4px; line-height: 1.3; font-weight: 600; color: #0B2F5E; vertical-align: bottom; }
  .fx { width: 58%; }
  .full { display: block; border-bottom: 1px solid #000; min-height: 18px; padding: 0 4px; font-weight: 600; color: #0B2F5E; margin-bottom: 6px; }
  .cb { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; text-align: center; line-height: 11px; font-size: 11px; font-weight: 800; margin-right: 3px; vertical-align: -1px; }
  .opt { margin-right: 12px; white-space: nowrap; }
  .note { font-size: 9.5px; margin: 4px 0 6px; line-height: 1.3; }
  .center { text-align: center; font-weight: 800; font-size: 13px; margin: 6px 0 4px; }
  .ind { margin-left: 70px; }
  .list div { margin-bottom: 2px; }
  .h2 { font-weight: 800; font-size: 12.5px; margin: 5px 0 3px; }
  .u { text-decoration: underline; font-weight: 800; margin: 10px 0 6px; }
  .signs { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 10px; }
  .signbox { border: 1px solid #000; padding: 8px 14px; text-align: center; width: 36%; }
  .sign { text-align: center; width: 34%; }
  .sline { border-top: 1px solid #000; margin-top: 24px; }
  .small { font-size: 9.5px; }
  .warn { font-size: 9.5px; margin-top: 8px; line-height: 1.4; }
  .foot { position: absolute; bottom: 8px; left: 22px; font-size: 9px; color: #333; }
  .sec-title { font-weight: 800; font-size: 13px; border-bottom: 2px solid #0A56AC; padding-bottom: 4px; margin: 0 0 10px; }
  table.mat { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  table.mat td { border: 1px solid #999; padding: 4px 5px; font-size: 10px; }
  table.mat tr.mh td { background: #EEF2F7; font-weight: 700; }
  table.mat tr.tot td { background: #E3EDF9; font-weight: 800; }
  .schema svg { width: 100%; height: auto; display: block; border: 1px solid #999; }
  .foto-grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .foto { width: 31%; } .foto img { width: 100%; height: 150px; object-fit: cover; border: 1px solid #999; }
  .foto-cap { font-size: 9px; text-align: center; }
`;

function head(title: string, sub: string, numLabel: string, numero: string, logo: string): string {
  return `<div class="head">
    ${logo}
    <div class="titles"><h1>${title}</h1><div class="sub">${sub}</div></div>
    <div class="prot">${numLabel} ${f(numero, 90)}</div>
  </div>`;
}

function annexes(d: AnyData, tipo: string, c: AnyData = {}): string {
  const parts: string[] = [];
  const rows = d.materiali_rows || [];
  if (rows.length) {
    const t = materialTotals(rows as any);
    const body = rows
      .map(
        (r: AnyData) =>
          `<tr><td>${r.tipo === "tubo" ? "Tubo" : "Raccordo"}</td><td>${esc(r.descrizione)}</td><td>${esc(r.materiale)}</td><td>${esc(r.diametro)}</td><td>${esc(r.quantita)} ${r.tipo === "tubo" ? "m" : "pz"}</td><td>${esc(r.tenuta)}</td><td>${esc(r.marca)}</td></tr>`,
      )
      .join("");
    const perMat = t.perMateriale
      .map((m) => `<tr><td colspan="4">${esc(m.materiale)}</td><td colspan="3">${m.metri > 0 ? fmtNum(m.metri) + " m" : ""} ${m.pezzi > 0 ? fmtNum(m.pezzi) + " pz" : ""}</td></tr>`)
      .join("");
    parts.push(`<div class="sec-title">Relazione con tipologie dei materiali utilizzati</div>
      <table class="mat"><tr class="mh"><td>Tipo</td><td>Descrizione</td><td>Materiale</td><td>Ø</td><td>Q.tà</td><td>Tenuta</td><td>Marca</td></tr>${body}
      ${perMat}<tr class="tot"><td colspan="4">TOTALE</td><td colspan="3">Tubi ${fmtNum(t.tubiMetri)} m · Raccordi ${fmtNum(t.raccordiPezzi)} pz</td></tr></table>`);
  }
  if (tipo === "dico" && d.schema && !isEmptySchema(d.schema)) {
    parts.push(`<div class="sec-title">Schema di impianto realizzato</div><div class="schema">${buildSchemaSvg(d.schema)}</div>`);
  }
  const foto = d.allegati_foto || [];
  if (foto.length) {
    parts.push(`<div class="sec-title" style="margin-top:14px">Allegati fotografici</div><div class="foto-grid">${foto
      .map((x: AnyData) => `<div class="foto"><img src="${esc(x.dataUri || x.uri)}" /><div class="foto-cap">${esc(x.name || "")}</div></div>`)
      .join("")}</div>`);
  }
  const out = parts.length ? `<div class="page pb">${parts.join("")}</div>` : "";
  return out + companyDocsPages(d, c);
}

// Visura / DURC / Patente: info line + one page per image document.
function companyDocsPages(d: AnyData, c: AnyData): string {
  const info: string[] = [];
  if (c.patente_numero) info.push(`Patente a crediti n. ${esc(c.patente_numero)}${c.patente_punteggio ? ` — punteggio ${esc(c.patente_punteggio)}` : ""}`);
  if (c.durc_scadenza) info.push(`DURC valido fino al ${esc(c.durc_scadenza)}`);
  const imgs: AnyData[] = d.docs_img || [];
  if (!info.length && !imgs.length) return "";
  const infoHtml = info.length ? `<div class="sec-title">Documenti dell'impresa</div>${info.map((x) => `<p>${x}</p>`).join("")}` : "";
  if (!imgs.length) return `<div class="page pb">${infoHtml}</div>`;
  return imgs
    .map(
      (x, i) =>
        `<div class="page pb">${i === 0 ? infoHtml : ""}<div class="sec-title">${esc(x.label)}</div><img src="${esc(x.dataUri)}" style="width:100%;max-height:235mm;object-fit:contain" /></div>`,
    )
    .join("");
}

export function generateCnaHtml(
  doc: { tipo: string; numero: string; data: AnyData },
  company: AnyData,
  logoDataUri?: string,
): string {
  const d = doc.data || {};
  const c = company || {};
  const u = d.ubicazione || {};
  const logo = logoDataUri ? `<img class="logo" src="${esc(logoDataUri)}" />` : "";
  const proprieta = u.proprieta || d.committente?.nome || "";
  const fi: AnyData = d.firme || {};

  if (doc.tipo === "dico") {
    const att: string[] = d.allegati || [];
    const iv = d.intervento;
    const prog = d.progetto_da || "";
    const attLabel = (k: string) => ATTACHMENTS.find((a) => a.key === k);
    const attRows = [
      ["progetto", "progetto (ai sensi dell’art. 5 e 7);"],
      ["relazione_materiali", "relazione con tipologie dei materiali utilizzati;"],
      ["schema", "schema di impianto realizzato;"],
      ["riferimento_dichiarazioni", "riferimento a dichiarazioni di conformità precedenti o parziali già esistenti;"],
      ["certificato_requisiti", "copia del certificato di riconoscimento dei requisiti tecnico-professionali;"],
      ["attestazione_non_normalizzati", "attestazione di conformità per impianto realizzato con materiali o sistemi non normalizzati."],
    ]
      .filter(([k]) => attLabel(k))
      .map(([k, l]) => `<div>${cb(att.includes(k))} ${l}</div>`)
      .join("");

    return `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}</style></head><body>
    <div class="page">
      ${head("DICHIARAZIONE DI CONFORMITA’ DELL’IMPIANTO ALLA REGOLA DELL’ARTE", "Decreto Ministeriale 22 Gennaio 2008, n° 37", "Prot. n.", doc.numero, logo)}
      <p>Il Sottoscritto ${f(c.titolare, 150)}, titolare o legale rappresentante dell’impresa ${f(c.denominazione, 200)},</p>
      <p>operante nel settore ${f(c.settore, 140)} con sede in via ${f(c.indirizzo, 220)} n. ${f(c.civico, 50)}</p>
      <p>Comune ${f(c.comune, 200)} (prov. ${f(c.provincia, 30)}) tel. ${f(c.telefono, 110)} P.IVA ${f(c.partita_iva, 110)}.</p>
      <p>${cb(!!c.cciaa_numero)} iscritta nel registro delle ditte (DPR 07/12/1995, n° 581) della camera C.I.A.A. di ${f(c.cciaa_provincia, 110)} n. ${f(c.cciaa_numero, 90)}</p>
      <p>${cb(!!c.artigiani_numero)} iscritta all’Albo Provinciale delle Imprese Artigiane (L: 8/8/1985, n° 443) di ${f(c.artigiani_provincia, 110)} n. ${f(c.artigiani_numero, 90)}</p>
      <p>Esecutrice dell’impianto <span class="small">(2)</span>:</p>
      <span class="full">${esc(d.descrizione_impianto)}</span>
      <div class="note">Nota – <b>Per gli impianti a gas</b> specificare il tipo di gas distribuito: canalizzato 1°, 2°, 3° famiglia: GPL da serbatoio fisso.<br/><b>Per gli impianti elettrici</b> specificare la potenza massima impiegabile</div>
      <div>Inteso come:</div>
      <p><span class="opt">${cb(iv === "nuovo")}nuovo impianto;</span><span class="opt">${cb(iv === "trasformazione")}trasformazione;</span><span class="opt">${cb(iv === "ampliamento")}ampliamento;</span><span class="opt">${cb(iv === "manutenzione")}manutenzione straordinaria:</span>${cb(iv === "altro")}altro <span class="small">(3)</span> ${f(iv === "altro" ? d.intervento_altro : "", 80)}</p>
      <p>Commissionato da: ${f(d.committente?.nome, 200)} Installato nei locali siti nel Comune di: ${f(u.comune, 120)}</p>
      <p>(prov. ${f(u.provincia, 30)}) Via ${f(u.indirizzo, 200)} n. ${f(u.civico, 50)} scala ${f(u.scala, 40)} piano ${f(u.piano, 40)} Interno ${f(u.interno, 50)}</p>
      <p>di proprietà di ${f(proprieta, 0, true)} <span class="small">(4)</span></p>
      <p>in edificio adibito ad uso: &nbsp; ${usoRow(d.uso_edificio)}</p>
      <div class="center">DICHIARA</div>
      <p style="line-height:1.4">sotto la propria personale responsabilità, che l’impianto è stato realizzato in modo conforme alla regola dell’arte, secondo quanto previsto dall’art. 6, tenuto conto delle condizioni di esercizio e degli usi a cui è destinato l’edificio, avendo in particolare:</p>
      <div>${cb(!!prog)} rispettato il progetto redatto ai sensi dell’art. 5 dal<span class="small">(5)</span>:</div>
      <p class="ind">${cb(prog === "progettista")} Progettista ${f(prog === "progettista" ? d.progettista_nome : "", 200)} nr. Iscrizione Albo ${f(prog === "progettista" ? d.progettista_albo : "", 90)};</p>
      <p class="ind">${cb(prog === "responsabile")} Responsabile Tecnico dell’impresa ${f(prog === "responsabile" ? c.responsabile_tecnico : "", 230)};</p>
      <p>${cb(!!d.norme_tecniche)} seguito la norma tecnica applicabile all’impiego: <span class="small">(6)</span> ${f(d.norme_tecniche, 260)};</p>
      <div>${cb(true)} installato componenti e materiali adatti al luogo di installazione;</div>
      <div style="margin-bottom:6px">${cb(true)} controllato l’impianto ai fini della sicurezza e della funzionalità con esito positivo, avendo eseguito le verifiche richieste dalle norme e dalle disposizioni di legge;</div>
      <div class="h2">Allegati obbligatori:</div>
      <div class="list">${attRows}</div>
      <div class="h2">Allegati facoltativi: <span class="small">(12)</span></div>
      <span class="full">${esc(d.allegati_facoltativi)}</span>
      <div class="center">DECLINA</div>
      <div>Ogni responsabilità per sinistri a persone o a cose derivanti da manomissione dell’impianto da parte di terzi ovvero da carenza di manutenzione o riparazione.</div>
      <div class="signs">
        <div>Data ${f(fmtDate(d.data_dichiarazione), 90)}</div>
        <div class="signbox">Il responsabile tecnico<div class="small">(Firma Leggibile senza timbro) (13)</div>${sig(fi.responsabile)}<div class="sline" style="margin-top:0"></div></div>
        <div class="sign">Il dichiarante<div class="small">(Timbro e Firma Leggibile)</div>${sig(fi.dichiarante)}<div class="sline" style="margin-top:0"></div></div>
      </div>
      <div class="warn"><b>AVVERTENZE PER IL COMMITTENTE:</b> il committente o proprietario è tenuto ad affidare i lavori di installazione, di trasformazione, di ampliamento e di manutenzione degli impianti ad imprese abilitate</div>
      <p style="margin-top:6px">il sottoscritto <span class="small">(14)</span> ${f(fi.cliente?.name, 220)}<br/>committente dei lavori, dichiara di aver ricevuto copia della presente, corredata degli allegati indicati in data <span class="small">(15)</span> ${f(fi.cliente ? fmtDate(fi.cliente.date) : "", 90)}</p>
      <div style="text-align:right;margin-right:40px">Il Cliente <span class="small">(16)</span><div style="width:170px;margin-left:auto">${sig(fi.cliente, 30)}<div class="sline" style="margin-top:0"></div></div><div class="small">(firma per ricevuta)</div></div>
      <div class="foot">Confederazione Nazionale Artigianato e delle piccole medie imprese - Rev 01-2023</div>
    </div>
    ${annexes(d, "dico", c)}
    </body></html>`;
  }

  // DiRi
  const t = d.tecnico || {};
  const da: string[] = d.diri_allegati || [];
  const anno = String(d.anno_realizzazione || "").padEnd(4, " ").slice(0, 4).split("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${STYLE}</style></head><body class="diri">
  <div class="page">
    ${head("DICHIARAZIONE DI RISPONDENZA DELL’IMPIANTO ALLA REGOLA DELL’ARTE", "( D.M. 22 GENNAIO 2008 N.37 ART.7)", "Nr.:", doc.numero, logo)}
    <p>Il sottoscritto ${f(t.nome, 220)} in qualità di responsabile tecnico da almeno cinque anni di una impresa abilitata operante nel settore impiantistico a cui si riferisce la presente dichiarazione e attualmente responsabile tecnico dell’impresa installatrice,</p>
    <p>(ragione sociale) ${f(c.denominazione, 0, true)}</p>
    <p>operante nel settore ${f(c.settore, 130)} con sede in via ${f(c.indirizzo, 200)} N° ${f(c.civico, 50)}</p>
    <p>comune ${f(c.comune, 190)} (prov. ${f(c.provincia, 30)}) tel. ${f(c.telefono, 150)}</p>
    <p>part. I.V.A. ${f(c.partita_iva, 180)}</p>
    <p>${cb(!!c.cciaa_numero)} iscritta al registro delle imprese (d.P.R 7/12/1995, n.581) della Camera C.I.A.A. di ${f(c.cciaa_provincia, 90)} n° ${f(c.cciaa_numero, 90)}</p>
    <p>${cb(!!c.artigiani_numero)} iscritta all’Albo Provinciale delle Imprese Artigiane (L. 8.8.1985 n° 443) di ${f(c.artigiani_provincia, 90)} n° ${f(c.artigiani_numero, 90)}</p>
    <p>in esito a sopralluogo ed accertamenti dell’impianto</p>
    <span class="full">${esc(d.descrizione_impianto)}</span>
    <p>realizzato indicativamente nell’anno ${anno.map((ch) => `<span class="cb" style="width:18px;height:16px;line-height:15px">${esc(ch.trim())}</span>`).join("")}</p>
    <p>installato nei locali siti nel Comune di ${f(u.comune, 180)} (prov. ${f(u.provincia, 30)})</p>
    <p>via ${f(u.indirizzo, 220)} n.° ${f(u.civico, 40)} scala ${f(u.scala, 40)} piano ${f(u.piano, 40)} interno ${f(u.interno, 40)}</p>
    <p>di proprietà di (nome, cognome, indirizzo) ${f(proprieta, 0, true)}</p>
    <p>in edificio ad uso: &nbsp; ${usoRow(d.uso_edificio)}</p>
    <p>a seguito della richiesta di: ${f(d.richiesta_di || d.committente?.nome, 0, true)}</p>
    <div class="center">DICHIARA</div>
    <p style="line-height:1.4">sotto la propria personale responsabilità e per quanto materialmente verificabile, la <b>rispondenza dell’impianto</b> alla norma tecnica vigente all’epoca della costruzione, secondo quanto previsto dall'art. 7 del DM 37/08, tenuto conto delle condizioni di esercizio e degli usi a cui è destinato l'edificio.</p>
    ${d.norme_tecniche ? `<p>Norme tecniche di riferimento: ${f(d.norme_tecniche, 0, true)}</p>` : ""}
    <div class="u">Allega, come documentazione facente parte integrante della presente dichiarazione:</div>
    <div class="list"><div>${cb(da.includes("relazione_verifica"))} relazione di verifica impianto</div><div>${cb(!!d.allegati_altro)} altro ${f(d.allegati_altro, 0, true)}</div></div>
    <div class="u">Allegati relativi al possesso dei requisiti:</div>
    <div class="list"><div>${cb(da.includes("certificato_requisiti"))} copia del certificato di riconoscimento dei requisiti tecnico-professionali.</div></div>
    ${d.note ? `<p style="margin-top:6px">Note: ${f(d.note, 0, true)}</p>` : ""}
    <div class="center">DECLINA</div>
    <div>ogni responsabilità per sinistri a persone o a cose successivi alla presente dichiarazione e derivanti da manomissione dell’impianto da parte di terzi ovvero da carenze di manutenzione o riparazione.</div>
    <div class="signs" style="margin-top:14px">
      <div>data ${f(fmtDate(d.data_dichiarazione), 120)}</div>
      <div class="sign"><b>il dichiarante</b>${sig(fi.dichiarante)}<div class="sline" style="margin-top:0"></div><div>(timbro e firma)</div></div>
    </div>
    <div class="warn">Avvertenze per il committente: il proprietario dell’impianto ha l’obbligo di mantenere la sicurezza e l’efficienza dell’impianto, tenendo conto delle istruzioni per l’uso e manutenzione fornite dall’installatore ed affidando i lavori esclusivamente ad imprese abilitate.</div>
    <div style="margin-top:18px;display:flex;align-items:flex-end;gap:8px"><b>Il committente</b> (firma per ricevuta) <div style="width:190px">${sig(fi.cliente, 30)}<div class="sline" style="margin-top:0"></div></div>${fi.cliente ? `<span class="small">${esc(fi.cliente.name || "")} · ${fmtDate(fi.cliente.date)}</span>` : ""}</div>
  </div>
  ${annexes(d, "diri", c)}
  </body></html>`;
}
