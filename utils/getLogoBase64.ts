import { Asset } from "expo-asset";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { LOGO_PDF_DATA_URI } from "./logoPdfDataUri";

// Bundled logo. require() forces Metro to include it in the release binary,
// so it is reachable via the asset pipeline in a standalone APK (unlike the
// large inline base64 below, which the Android print WebView fails to render).
const LOGO_MODULE = require("../assets/images/neurspatherapy_logo.png");

let cachedLogo: string | null = null;

/**
 * Returns the NeuroSpa Therapy logo as a data URI for embedding in PDF HTML
 * (expo-print).
 *
 * The logo is loaded from the bundled asset and re-encoded to a small,
 * resized PNG at runtime. A downscaled image is essential: the original
 * 1080x806 (~268 KB) base64 renders in Expo Go but NOT in release APK builds,
 * where the print WebView silently drops oversized inline images.
 *
 * Falls back to the pre-generated (larger) data URI only if runtime
 * manipulation fails.
 */
export async function getLogoBase64(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;

  try {
    const asset = Asset.fromModule(LOGO_MODULE);
    await asset.downloadAsync();
    const sourceUri = asset.localUri || asset.uri;

    if (sourceUri) {
      const result = await manipulateAsync(sourceUri, [{ resize: { width: 320 } }], {
        compress: 1,
        format: SaveFormat.PNG,
        base64: true,
      });

      if (result.base64) {
        cachedLogo = `data:image/png;base64,${result.base64}`;
        return cachedLogo;
      }
    }
  } catch (error) {
    console.warn("getLogoBase64: runtime manipulation failed, using fallback", error);
  }

  cachedLogo = LOGO_PDF_DATA_URI;
  return cachedLogo;
}
