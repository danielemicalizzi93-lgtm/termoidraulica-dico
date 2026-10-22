import type { FileT } from "@/src/local/attachments";

// Company/declaration documents: visura camerale (per document), DURC and patente a crediti (company).

export function parseITDate(v?: string): Date | null {
  const m = (v || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
}

export type DurcStatus = { state: "none" | "ok" | "expiring" | "expired"; days: number };

export function durcStatus(company: Record<string, any>): DurcStatus {
  const d = parseITDate(company?.durc_scadenza);
  if (!d) return { state: "none", days: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { state: "expired", days };
  if (days <= 15) return { state: "expiring", days };
  return { state: "ok", days };
}

export type LabeledFile = { label: string; file: FileT };

// All documents to attach to a declaration (visura first).
export function declarationFiles(data: Record<string, any>, company: Record<string, any>): LabeledFile[] {
  const out: LabeledFile[] = [];
  if (data?.visura) out.push({ label: "Visura camerale", file: data.visura });
  if (company?.durc_file) out.push({ label: "DURC", file: company.durc_file });
  if (company?.patente_file) out.push({ label: "Patente a crediti", file: company.patente_file });
  return out;
}
