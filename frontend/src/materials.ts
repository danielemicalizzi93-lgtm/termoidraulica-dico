import { uid } from "@/src/local/db";

export type MaterialRow = {
  id: string;
  tipo: "tubo" | "raccordo";
  descrizione: string;
  materiale: string;
  diametro: string;
  quantita: string;
  tenuta: string;
  marca: string;
};

export const TENUTA_OPTIONS = [
  "Canapa + pasta",
  "Teflon/PTFE",
  "O-ring",
  "Pressfitting",
  "Saldatura",
  "Brasatura",
  "Incollaggio",
  "Guarnizione",
  "Filettata",
];

export function newRow(tipo: "tubo" | "raccordo" = "tubo"): MaterialRow {
  return { id: uid(), tipo, descrizione: "", materiale: "", diametro: "", quantita: "", tenuta: "", marca: "" };
}

export function parseQty(v: string): number {
  const n = parseFloat(String(v || "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export type MaterialTotals = {
  tubiMetri: number;
  raccordiPezzi: number;
  tubiCount: number;
  raccordiCount: number;
  perMateriale: { materiale: string; metri: number; pezzi: number }[];
};

export function materialTotals(rows: MaterialRow[]): MaterialTotals {
  let tubiMetri = 0;
  let raccordiPezzi = 0;
  let tubiCount = 0;
  let raccordiCount = 0;
  const byMat: Record<string, { metri: number; pezzi: number }> = {};

  for (const r of rows || []) {
    const q = parseQty(r.quantita);
    const mat = (r.materiale || "").trim() || "Non specificato";
    if (!byMat[mat]) byMat[mat] = { metri: 0, pezzi: 0 };
    if (r.tipo === "tubo") {
      tubiMetri += q;
      tubiCount += 1;
      byMat[mat].metri += q;
    } else {
      raccordiPezzi += q;
      raccordiCount += 1;
      byMat[mat].pezzi += q;
    }
  }

  const perMateriale = Object.entries(byMat).map(([materiale, v]) => ({ materiale, ...v }));
  return { tubiMetri, raccordiPezzi, tubiCount, raccordiCount, perMateriale };
}

export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}
