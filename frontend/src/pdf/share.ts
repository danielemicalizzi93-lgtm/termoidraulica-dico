import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export async function exportPdf(html: string) {
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }
  // A4 in points: without explicit size iOS defaults to US Letter and content shrinks
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
  } else {
    await Print.printAsync({ uri });
  }
}
