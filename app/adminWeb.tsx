import Ionicons from "@expo/vector-icons/Ionicons";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview";

const ADMIN_URL = "https://autibile.my/login";

// Injected into the admin website. The web app triggers file downloads with
// browser-only mechanisms (jsPDF `pdf.save()` and blob + `<a download>` clicks)
// which the Android WebView silently ignores. This interceptor captures those
// downloads and forwards them to the native layer (see onMessage) for saving /
// sharing. Blobs are grabbed synchronously from a URL.createObjectURL map so a
// same-tick `revokeObjectURL()` (used by the Excel export) can't invalidate them.
const DOWNLOAD_INTERCEPTOR_JS = `
(function () {
  if (window.__nativeDownloadPatch) return;
  window.__nativeDownloadPatch = true;

  var blobMap = {};
  var _createObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = function (obj) {
    var url = _createObjectURL(obj);
    try { if (obj instanceof Blob) blobMap[url] = obj; } catch (e) {}
    return url;
  };

  function post(filename, dataUrl) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'download',
        filename: filename || 'download',
        dataUrl: dataUrl
      }));
    } catch (e) {}
  }

  function readBlob(blob, filename) {
    try {
      var reader = new FileReader();
      reader.onloadend = function () { post(filename, reader.result); };
      reader.readAsDataURL(blob);
    } catch (e) {}
  }

  function handle(a) {
    try {
      if (!a || a.tagName !== 'A') return false;
      var href = a.getAttribute('href') || a.href || '';
      var isBlob = href.indexOf('blob:') === 0;
      var isData = href.indexOf('data:') === 0;
      if (!(a.hasAttribute('download') || isBlob || isData)) return false;
      var filename = a.getAttribute('download') || 'download';
      if (isBlob && blobMap[href]) {
        readBlob(blobMap[href], filename);
      } else if (isData) {
        post(filename, href);
      } else {
        fetch(href).then(function (r) { return r.blob(); })
          .then(function (b) { readBlob(b, filename); })
          .catch(function () {});
      }
      return true;
    } catch (e) { return false; }
  }

  var _click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (handle(this)) return;
    return _click.apply(this, arguments);
  };

  var _dispatch = HTMLAnchorElement.prototype.dispatchEvent;
  HTMLAnchorElement.prototype.dispatchEvent = function (ev) {
    if (ev && ev.type === 'click' && handle(this)) return true;
    return _dispatch.apply(this, arguments);
  };

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && handle(a)) { e.preventDefault(); e.stopPropagation(); }
  }, true);
})();
true;
`;

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

  const onMessage = useCallback(async (event: WebViewMessageEvent) => {
    let payload: { type?: string; filename?: string; dataUrl?: string };
    try {
      payload = JSON.parse(event.nativeEvent.data);
    } catch {
      return; // not a message we care about
    }
    if (!payload || payload.type !== "download" || !payload.dataUrl) return;

    try {
      const commaIndex = payload.dataUrl.indexOf(",");
      const base64 =
        commaIndex >= 0 ? payload.dataUrl.slice(commaIndex + 1) : payload.dataUrl;
      const mimeMatch = payload.dataUrl.match(/^data:([^;,]+)[;,]/);
      const mimeType = mimeMatch ? mimeMatch[1] : undefined;

      const safeName = String(payload.filename || "download").replace(
        /[^\w.\-]+/g,
        "_",
      );
      const fileUri = `${FileSystem.cacheDirectory}${safeName}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: payload.filename,
        });
      } else {
        Alert.alert("Saved", `File saved to ${fileUri}`);
      }
    } catch {
      Alert.alert("Download failed", "Could not save the file. Please try again.");
    }
  }, []);

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
          injectedJavaScript={DOWNLOAD_INTERCEPTOR_JS}
          onMessage={onMessage}
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
