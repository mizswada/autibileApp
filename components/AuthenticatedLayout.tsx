import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { AppGradientBackground } from "./AppGradientBackground";

type AuthenticatedLayoutProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Wraps authenticated route trees with the shared home-page gradient. */
export function AuthenticatedLayout({
  children,
  style,
}: AuthenticatedLayoutProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <AppGradientBackground />
      {children}
    </View>
  );
}

/** Stack screens should stay transparent so the layout gradient shows through. */
export const authenticatedStackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: "transparent" },
} as const;

/** Tab scenes should stay transparent so the layout gradient shows through. */
export const authenticatedTabScreenOptions = {
  sceneStyle: { backgroundColor: "transparent" },
} as const;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
