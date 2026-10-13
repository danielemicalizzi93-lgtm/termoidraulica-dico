import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/api/client";

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

export type CompanyT = Record<string, any>;

export type DocumentT = {
  id: string;
  numero: string;
  tipo: "dico" | "diri";
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// Company
export function useCompany() {
  return useQuery({ queryKey: ["company"], queryFn: () => api<CompanyT>("/company") });
}
export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CompanyT) => api<CompanyT>("/company", { method: "PUT", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company"] }),
  });
}

// Clients
export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: () => api<ClientT[]>("/clients") });
}
export function useSaveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Partial<ClientT> }) =>
      id
        ? api<ClientT>(`/clients/${id}`, { method: "PUT", body })
        : api<ClientT>("/clients", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/clients/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// Installations
export function useInstallations() {
  return useQuery({ queryKey: ["installations"], queryFn: () => api<InstallationT[]>("/installations") });
}
export function useSaveInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Partial<InstallationT> }) =>
      id
        ? api<InstallationT>(`/installations/${id}`, { method: "PUT", body })
        : api<InstallationT>("/installations", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installations"] }),
  });
}
export function useDeleteInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/installations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installations"] }),
  });
}

// Documents
export function useDocuments() {
  return useQuery({ queryKey: ["documents"], queryFn: () => api<DocumentT[]>("/documents") });
}
export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => api<DocumentT>(`/documents/${id}`),
    enabled: !!id,
  });
}
export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { tipo: string; data: Record<string, any> }) =>
      api<DocumentT>("/documents", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
