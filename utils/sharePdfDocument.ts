import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export type SharePdfOptions = {
  dialogTitle: string;
  /** Human readable name for the shared file, with or without the .pdf suffix. */
  fileName?: string;
  unavailableTitle?: string;
  unavailableMessage?: string;
};

const DEFAULT_UNAVAILABLE_MESSAGE =
  "Your PDF was created, but sharing is not available on this device.";

/**
 * expo-print writes to a random cache path, so Android share targets show a
 * meaningless name. Copying to a named cache file keeps both platforms aligned.
 */
async function toNamedCopy(uri: string, fileName?: string): Promise<string> {
  if (!fileName || !FileSystem.cacheDirectory) return uri;

  const safeName = fileName.replace(/[^\w\-.]+/g, "_").replace(/_+/g, "_");
  if (!safeName || safeName === ".pdf") return uri;

  const target = `${FileSystem.cacheDirectory}${
    safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`
  }`;
  if (target === uri) return uri;

  try {
    await FileSystem.deleteAsync(target, { idempotent: true });
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  } catch {
    return uri;
  }
}

/**
 * Opens the native share sheet for a PDF file URI produced by expo-print.
 * Checks Sharing availability first and sets iOS UTI for reliable PDF handoff.
 */
export async function sharePdfDocument(
  uri: string,
  options: SharePdfOptions,
): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) {
    Alert.alert(
      options.unavailableTitle ?? "PDF Generated",
      options.unavailableMessage ?? DEFAULT_UNAVAILABLE_MESSAGE,
    );
    return false;
  }

  const shareUri = await toNamedCopy(uri, options.fileName);

  await Sharing.shareAsync(shareUri, {
    mimeType: "application/pdf",
    dialogTitle: options.dialogTitle,
    ...(Platform.OS === "ios" ? { UTI: "com.adobe.pdf" } : {}),
  });

  return true;
}

/** Builds a PDF from HTML and opens the native share sheet. */
export async function printAndSharePdf(
  html: string,
  options: SharePdfOptions,
): Promise<boolean> {
  const { uri } = await Print.printToFileAsync({ html });
  return sharePdfDocument(uri, options);
}
