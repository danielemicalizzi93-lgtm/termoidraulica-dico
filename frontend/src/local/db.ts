// Fully-local data layer. All data lives on the device (AsyncStorage via the
// shared storage util). No network, works completely offline.

import { storage } from "@/src/utils/storage";

const K_COMPANY = "dico_company";
const K_CLIENTS = "dico_clients";
const K_INSTALLATIONS = "dico_installations";
const K_DOCUMENTS = "dico_documents";
const K_COUNTERS = "dico_counters";
const K_TEMPLATES = "dico_templates";

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem<string>(key, "");
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type CompanyT = Record<string, any>;

export type ClientT = {
  id: string;
  nome: string;
  codice_fiscale?: string;
  partita_iva?: string;
  telefono?: string;
  email?: string;
  indirizzo?: string;
  comune?: string;
  note?: string;
};

export type InstallationT = {
  id: string;
  descrizione: string;
  indirizzo?: string;
  comune?: string;
  provincia?: string;
  cap?: string;
  scala?: string;
  piano?: string;
  interno?: string;
  proprieta?: string;
  note?: string;
};

export type AttachmentT = { id: string; uri: string; name: string };

export type DocumentT = {
  id: string;
  numero: string;
  tipo: "dico" | "diri";
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

const DEFAULT_COMPANY: CompanyT = {
  denominazione: "",
  titolare: "",
  responsabile_tecnico: "",
  partita_iva: "",
  codice_fiscale: "",
  indirizzo: "",
  comune: "",
  provincia: "",
  cap: "",
  telefono: "",
  email: "",
  pec: "",
  cciaa_provincia: "",
  cciaa_numero: "",
  abilitazioni: [],
  albo_professione: "",
  albo_provincia: "",
  albo_numero: "",
};

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------
export async function getCompany(): Promise<CompanyT> {
  const c = await readJson<CompanyT | null>(K_COMPANY, null);
  return { ...DEFAULT_COMPANY, ...(c || {}) };
}

export async function saveCompany(company: CompanyT): Promise<CompanyT> {
  await writeJson(K_COMPANY, company);
  return company;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------
export async function listClients(): Promise<ClientT[]> {
  return readJson<ClientT[]>(K_CLIENTS, []);
}

export async function saveClient(id: string | undefined, body: Partial<ClientT>): Promise<ClientT> {
  const list = await listClients();
  if (id) {
    const idx = list.findIndex((c) => c.id === id);
    const updated = { ...list[idx], ...body, id } as ClientT;
    if (idx >= 0) list[idx] = updated;
    await writeJson(K_CLIENTS, list);
    return updated;
  }
  const created = { id: uid(), nome: "", ...body } as ClientT;
  list.push(created);
  await writeJson(K_CLIENTS, list);
  return created;
}

export async function deleteClient(id: string): Promise<void> {
  const list = (await listClients()).filter((c) => c.id !== id);
  await writeJson(K_CLIENTS, list);
}

// ---------------------------------------------------------------------------
// Installations
// ---------------------------------------------------------------------------
export async function listInstallations(): Promise<InstallationT[]> {
  return readJson<InstallationT[]>(K_INSTALLATIONS, []);
}

export async function saveInstallation(
  id: string | undefined,
  body: Partial<InstallationT>,
): Promise<InstallationT> {
  const list = await listInstallations();
  if (id) {
    const idx = list.findIndex((i) => i.id === id);
    const updated = { ...list[idx], ...body, id } as InstallationT;
    if (idx >= 0) list[idx] = updated;
    await writeJson(K_INSTALLATIONS, list);
    return updated;
  }
  const created = { id: uid(), descrizione: "", ...body } as InstallationT;
  list.push(created);
  await writeJson(K_INSTALLATIONS, list);
  return created;
}

export async function deleteInstallation(id: string): Promise<void> {
  const list = (await listInstallations()).filter((i) => i.id !== id);
  await writeJson(K_INSTALLATIONS, list);
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
async function nextNumber(tipo: "dico" | "diri"): Promise<string> {
  const year = new Date().getFullYear();
  const counters = await readJson<Record<string, number>>(K_COUNTERS, {});
  const key = `${tipo}-${year}`;
  const n = (counters[key] || 0) + 1;
  counters[key] = n;
  await writeJson(K_COUNTERS, counters);
  const prefix = tipo === "dico" ? "DICO" : "DIRI";
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

export async function listDocuments(): Promise<DocumentT[]> {
  const list = await readJson<DocumentT[]>(K_DOCUMENTS, []);
  return [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getDocument(id: string): Promise<DocumentT | null> {
  const list = await readJson<DocumentT[]>(K_DOCUMENTS, []);
  return list.find((d) => d.id === id) ?? null;
}

export async function createDocument(tipo: "dico" | "diri", data: Record<string, any>): Promise<DocumentT> {
  const list = await readJson<DocumentT[]>(K_DOCUMENTS, []);
  const doc: DocumentT = {
    id: uid(),
    numero: await nextNumber(tipo),
    tipo,
    data,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  list.push(doc);
  await writeJson(K_DOCUMENTS, list);
  return doc;
}

export async function updateDocument(id: string, data: Record<string, any>): Promise<DocumentT> {
  const list = await readJson<DocumentT[]>(K_DOCUMENTS, []);
  const idx = list.findIndex((d) => d.id === id);
  if (idx < 0) throw new Error("Documento non trovato");
  list[idx] = { ...list[idx], data, updated_at: nowIso() };
  await writeJson(K_DOCUMENTS, list);
  return list[idx];
}

export async function deleteDocument(id: string): Promise<void> {
  const list = (await readJson<DocumentT[]>(K_DOCUMENTS, [])).filter((d) => d.id !== id);
  await writeJson(K_DOCUMENTS, list);
}

// ---------------------------------------------------------------------------
// Templates (reusable materials lists and schemas)
// ---------------------------------------------------------------------------
export type TemplateKind = "materiali" | "schema" | "dico";
export type TemplateT = {
  id: string;
  kind: TemplateKind;
  nome: string;
  data: any;
  created_at: string;
};

export async function listTemplates(): Promise<TemplateT[]> {
  const list = await readJson<TemplateT[]>(K_TEMPLATES, []);
  return [...list].sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function saveTemplate(kind: TemplateKind, nome: string, data: any): Promise<TemplateT> {
  const list = await readJson<TemplateT[]>(K_TEMPLATES, []);
  const created: TemplateT = { id: uid(), kind, nome, data, created_at: nowIso() };
  list.push(created);
  await writeJson(K_TEMPLATES, list);
  return created;
}

export async function deleteTemplate(id: string): Promise<void> {
  const list = (await readJson<TemplateT[]>(K_TEMPLATES, [])).filter((t) => t.id !== id);
  await writeJson(K_TEMPLATES, list);
}

// ---------------------------------------------------------------------------
// Backup / restore (full archive)
// ---------------------------------------------------------------------------
export type ArchiveT = {
  company: CompanyT;
  clients: ClientT[];
  installations: InstallationT[];
  documents: DocumentT[];
  counters: Record<string, number>;
  templates?: TemplateT[];
};

export async function exportAll(): Promise<ArchiveT> {
  return {
    company: await getCompany(),
    clients: await readJson<ClientT[]>(K_CLIENTS, []),
    installations: await readJson<InstallationT[]>(K_INSTALLATIONS, []),
    documents: await readJson<DocumentT[]>(K_DOCUMENTS, []),
    counters: await readJson<Record<string, number>>(K_COUNTERS, {}),
    templates: await readJson<TemplateT[]>(K_TEMPLATES, []),
  };
}

export async function importAll(data: Partial<ArchiveT>): Promise<void> {
  await writeJson(K_COMPANY, { ...DEFAULT_COMPANY, ...(data.company || {}) });
  await writeJson(K_CLIENTS, data.clients || []);
  await writeJson(K_INSTALLATIONS, data.installations || []);
  await writeJson(K_DOCUMENTS, data.documents || []);
  await writeJson(K_COUNTERS, data.counters || {});
  await writeJson(K_TEMPLATES, data.templates || []);
}
