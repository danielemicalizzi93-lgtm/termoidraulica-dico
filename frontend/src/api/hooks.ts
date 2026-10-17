import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as db from "@/src/local/db";

export type { ClientT, InstallationT, CompanyT, DocumentT, AttachmentT } from "@/src/local/db";

// Company
export function useCompany() {
  return useQuery({ queryKey: ["company"], queryFn: () => db.getCompany() });
}
export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: db.CompanyT) => db.saveCompany(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company"] }),
  });
}

// Clients
export function useClients() {
  return useQuery({ queryKey: ["clients"], queryFn: () => db.listClients() });
}
export function useSaveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Partial<db.ClientT> }) => db.saveClient(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}
export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

// Installations
export function useInstallations() {
  return useQuery({ queryKey: ["installations"], queryFn: () => db.listInstallations() });
}
export function useSaveInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: Partial<db.InstallationT> }) =>
      db.saveInstallation(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installations"] }),
  });
}
export function useDeleteInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteInstallation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installations"] }),
  });
}

// Documents
export function useDocuments() {
  return useQuery({ queryKey: ["documents"], queryFn: () => db.listDocuments() });
}
export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: () => db.getDocument(id),
    enabled: !!id,
  });
}
export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tipo, data }: { tipo: "dico" | "diri"; data: Record<string, any> }) =>
      db.createDocument(tipo, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      db.updateDocument(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["documents", vars.id] });
    },
  });
}
export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
