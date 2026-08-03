import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import { appTheme } from "@/constants/appTheme";

/** Full-screen gradient layer — pair with transparent screen roots. */
export function AppGradientBackground() {
  return (
    <LinearGradient
      colors={[...appTheme.gradient.colors]}
      start={appTheme.gradient.start}
      end={appTheme.gradient.end}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
