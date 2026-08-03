import { useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * Fallback hardware-back handler for release APK/AAB builds.
 * Ensures router.back() runs when the navigation stack can pop.
 */
export function AndroidHardwareBack() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (router.canGoBack()) {
          router.back();
          return true;
        }
        return false;
      },
    );

    return () => subscription.remove();
  }, [router]);

  return null;
}
