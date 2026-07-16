import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";

const ADMIN_URL = "https://autibile.my/login";

export default function AdminWeb() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const hasLoadedOnce = useRef(false);

  const goBackToUserType = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/userType");
    }
  }, [router]);

  const handleBack = useCallback(() => {
    if (canGoBack && webviewRef.current) {
      webviewRef.current.goBack();
    } else {
      goBackToUserType();
    }
  }, [canGoBack, goBackToUserType]);

  useFocusHardwareBack(handleBack);

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerWrapper}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.webviewContainer}>
        <WebView
          ref={webviewRef}
          source={{ uri: ADMIN_URL }}
          originWhitelist={["*"]}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          onNavigationStateChange={onNavigationStateChange}
          onLoadStart={() => {
            // Only block with the overlay on the very first load. The site is a
            // SPA, so client-side route changes fire onLoadStart but often not
            // onLoadEnd, which would otherwise leave the overlay stuck.
            if (!hasLoadedOnce.current) setLoading(true);
          }}
          onLoadProgress={({ nativeEvent }) => {
            if (nativeEvent.progress >= 0.9) setLoading(false);
          }}
          onLoadEnd={() => {
            hasLoadedOnce.current = true;
            setLoading(false);
          }}
        />
        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#48B2E8" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function useFocusHardwareBack(handler: () => void) {
  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handler();
        return true;
      }
    );
    return () => subscription.remove();
  }, [handler]);
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#E1F5FF" },
  headerWrapper: { backgroundColor: "#E1F5FF", justifyContent: "flex-end" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 18,
  },
  backButton: { marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#222" },
  webviewContainer: { flex: 1, backgroundColor: "#fff" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
  },
  loadingText: { fontSize: 16, color: "#666", marginTop: 12 },
});
