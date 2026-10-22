import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { uid } from "@/src/local/db";

const DIR = FileSystem.documentDirectory ? `${FileSystem.documentDirectory}attachments/` : "";

async function ensureDir() {
  if (!DIR) return;
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

// Copy a picked image into the app's persistent storage and return the new uri.
export async function persistImage(srcUri: string): Promise<string> {
  if (Platform.OS === "web") return srcUri; // web: keep the (blob/data) uri as-is
  try {
    await ensureDir();
    const ext = srcUri.split(".").pop()?.split("?")[0] || "jpg";
    const dest = `${DIR}${uid()}.${ext}`;
    await FileSystem.copyAsync({ from: srcUri, to: dest });
    return dest;
  } catch {
    return srcUri;
  }
}

export async function removeImage(uri: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

// Read an image file and return a data URI usable inside PDF/preview HTML.
export async function toDataUri(uri: string): Promise<string> {
  if (uri.startsWith("data:")) return uri;
  if (Platform.OS === "web") {
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return uri;
    }
  }
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = uri.split(".").pop()?.toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "pdf" ? "application/pdf" : "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch {
    return uri;
  }
}

// A picked document file (image or PDF), persisted locally.
export type FileT = { uri: string; name: string; mime: string };

export function isPdf(f?: FileT | null): boolean {
  return !!f && (f.mime === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
}

// Let the user pick an image or PDF and copy it to persistent storage.
export async function pickFile(): Promise<FileT | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["application/pdf", "image/*"],
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const mime = a.mimeType || (a.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
  if (Platform.OS === "web") {
    // keep as data URI so it survives reloads
    return { uri: await toDataUri(a.uri), name: a.name, mime };
  }
  try {
    await ensureDir();
    const ext = a.name.split(".").pop() || (mime === "application/pdf" ? "pdf" : "jpg");
    const dest = `${DIR}${uid()}.${ext}`;
    await FileSystem.copyAsync({ from: a.uri, to: dest });
    return { uri: dest, name: a.name, mime };
  } catch {
    return { uri: a.uri, name: a.name, mime };
  }
}

// Share a single stored file (used for PDF attachments sent alongside the declaration).
export async function shareFile(f: FileT): Promise<void> {
  if (Platform.OS === "web") {
    const w = window.open();
    if (w) w.document.write(`<iframe src="${f.uri}" style="border:0;width:100%;height:100%"></iframe>`);
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(f.uri, { mimeType: f.mime, dialogTitle: f.name, UTI: isPdf(f) ? "com.adobe.pdf" : undefined });
  }
}

// Backup helpers for FileT
export async function embedFile(f?: FileT | null): Promise<FileT | null | undefined> {
  if (!f) return f;
  return { ...f, uri: await toDataUri(f.uri) };
}
export async function restoreFile(f?: FileT | null): Promise<FileT | null | undefined> {
  if (!f) return f;
  return { ...f, uri: await saveBase64Image(f.uri) };
}


// Write a base64 data URI back to a persistent file and return its uri.
// Used when restoring a backup that carries embedded images.
export async function saveBase64Image(dataUri: string): Promise<string> {
  if (Platform.OS === "web") return dataUri;
  if (!dataUri.startsWith("data:")) return dataUri;
  try {
    await ensureDir();
    const match = dataUri.match(/^data:([\w.+-]+\/[\w.+-]+);base64,(.*)$/);
    if (!match) return dataUri;
    const ext = match[1] === "image/png" ? "png" : match[1] === "application/pdf" ? "pdf" : "jpg";
    const base64 = match[2];
    const dest = `${DIR}${uid()}.${ext}`;
    await FileSystem.writeAsStringAsync(dest, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return dest;
  } catch {
    return dataUri;
  }
}
