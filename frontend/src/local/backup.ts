import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import * as db from "@/src/local/db";
import { saveBase64Image, toDataUri } from "@/src/local/attachments";

export type BackupPayload = db.ArchiveT & {
  app: string;
  version: number;
  exportedAt: string;
};

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

// Build the backup JSON string with photos embedded as base64 data URIs.
async function buildJson(): Promise<string> {
  const all = await db.exportAll();
  const documents = await Promise.all(
    all.documents.map(async (doc) => {
      const foto = doc.data?.allegati_foto || [];
      const embedded = await Promise.all(
        foto.map(async (f: any) => ({
          id: f.id,
          name: f.name,
          dataUri: await toDataUri(f.uri),
        })),
      );
      return { ...doc, data: { ...doc.data, allegati_foto: embedded } };
    }),
  );
  const payload: BackupPayload = {
    app: "dicopro",
    version: 1,
    exportedAt: new Date().toISOString(),
    ...all,
    documents,
  };
  return JSON.stringify(payload);
}

export async function exportBackup(): Promise<void> {
  const json = await buildJson();
  const filename = `dicopro-backup-${stamp()}.json`;

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: "Backup archivio" });
  }
}

// Let the user pick a backup file and parse it (no changes applied yet).
export async function pickBackup(): Promise<BackupPayload | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "*/*"],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  let text: string;
  if (Platform.OS === "web") {
    const r = await fetch(asset.uri);
    text = await r.text();
  } else {
    text = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  }
  const parsed = JSON.parse(text) as BackupPayload;
  if (parsed.app !== "dicopro") throw new Error("File di backup non valido");
  return parsed;
}

// Apply a parsed backup: re-persist embedded photos to local files, then save.
export async function applyBackup(payload: BackupPayload): Promise<void> {
  const documents = await Promise.all(
    (payload.documents || []).map(async (doc) => {
      const foto = doc.data?.allegati_foto || [];
      const restored = await Promise.all(
        foto.map(async (f: any) => ({
          id: f.id,
          name: f.name,
          uri: f.dataUri ? await saveBase64Image(f.dataUri) : f.uri,
        })),
      );
      return { ...doc, data: { ...doc.data, allegati_foto: restored } };
    }),
  );
  await db.importAll({
    company: payload.company,
    clients: payload.clients,
    installations: payload.installations,
    documents,
    counters: payload.counters,
  });
}

export function backupSummary(payload: BackupPayload): string {
  const nDocs = payload.documents?.length ?? 0;
  const nClients = payload.clients?.length ?? 0;
  const nInst = payload.installations?.length ?? 0;
  const date = payload.exportedAt ? new Date(payload.exportedAt).toLocaleString("it-IT") : "";
  return `${nDocs} documenti, ${nClients} clienti, ${nInst} impianti · ${date}`;
}
