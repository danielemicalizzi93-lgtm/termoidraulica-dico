import * as FileSystem from "expo-file-system/legacy";
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
    const mime = ext === "png" ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${base64}`;
  } catch {
    return uri;
  }
}


// Write a base64 data URI back to a persistent file and return its uri.
// Used when restoring a backup that carries embedded images.
export async function saveBase64Image(dataUri: string): Promise<string> {
  if (Platform.OS === "web") return dataUri;
  if (!dataUri.startsWith("data:")) return dataUri;
  try {
    await ensureDir();
    const match = dataUri.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) return dataUri;
    const ext = match[1] === "image/png" ? "png" : "jpg";
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
