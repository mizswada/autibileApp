import React, { useEffect, useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthFormScrollProps = {
  children: React.ReactNode;
  /** Sign Up + Sign In — pinned above keyboard */
  footer: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  paddingTop?: number;
};

/**
 * Auth registration layout: fields scroll, actions stay visible above the keyboard.
 */
export function AuthFormScroll({
  children,
  footer,
  contentContainerStyle,
  backgroundColor = "#E1F5FF",
  paddingTop = 0,
}: AuthFormScrollProps) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const footerBottomPadding =
    keyboardHeight > 0
      ? Math.max(keyboardHeight - insets.bottom, 0) + 12
      : Math.max(insets.bottom, 16);

  return (
    <View style={[styles.screen, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          contentContainerStyle,
          { paddingTop },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: footerBottomPadding, backgroundColor },
        ]}
      >
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "stretch",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },
});
