import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

type HtmlContentProps = {
  html: string;
  style?: ViewStyle;
};

function stripUnsafeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

function toRenderableHtml(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    const escaped = trimmed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    return `<p>${escaped}</p>`;
  }

  return stripUnsafeHtml(trimmed);
}

export function HtmlContent({ html, style }: HtmlContentProps) {
  const [height, setHeight] = useState(1);

  const sourceHtml = useMemo(() => toRenderableHtml(html), [html]);

  const wrappedHtml = useMemo(
    () => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 14px;
              line-height: 1.5;
              color: #D32F2F;
              margin: 0;
              padding: 0;
              background-color: transparent;
            }
            p { margin: 0 0 12px 0; color: #D32F2F; }
            p:last-child { margin-bottom: 0; }
            strong, b { font-weight: 700; color: #D32F2F; }
            em, i { font-style: italic; }
            ul, ol { margin: 0 0 12px 18px; padding: 0; color: #D32F2F; }
            li { margin-bottom: 6px; color: #D32F2F; }
            br { line-height: 1.5; }
          </style>
        </head>
        <body>${sourceHtml}</body>
        <script>
          function postHeight() {
            var nextHeight = Math.ceil(document.body.scrollHeight || document.documentElement.scrollHeight || 1);
            window.ReactNativeWebView.postMessage(String(nextHeight));
          }
          window.onload = postHeight;
          if (window.ResizeObserver) {
            new ResizeObserver(postHeight).observe(document.body);
          } else {
            setTimeout(postHeight, 50);
            setTimeout(postHeight, 250);
          }
        </script>
      </html>
    `,
    [sourceHtml],
  );

  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    const nextHeight = Number(event.nativeEvent.data);
    if (!Number.isNaN(nextHeight) && nextHeight > 0) {
      setHeight(nextHeight);
    }
  }, []);

  if (!sourceHtml) return null;

  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: wrappedHtml }}
        opaque={false}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={[styles.webview, { height }]}
        onMessage={onMessage}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  webview: {
    width: "100%",
    backgroundColor: "transparent",
  },
});
