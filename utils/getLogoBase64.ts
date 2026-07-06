import { LOGO_PDF_DATA_URI } from "./logoPdfDataUri";

/**
 * Returns the NeuroSpa logo as a data URI for PDF HTML embedding.
 * The image is bundled as base64 so it works in release APK builds where
 * runtime asset paths (e.g. /assets/...?hash=...) are not readable.
 */
export async function getLogoBase64(): Promise<string | null> {
  return LOGO_PDF_DATA_URI;
}
