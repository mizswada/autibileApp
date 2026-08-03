import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { appTheme } from "@/constants/appTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** primary = blue bar with white title (default stack screens) */
  variant?: "primary" | "surface";
  right?: React.ReactNode;
  showBack?: boolean;
  style?: ViewStyle;
};

export function ScreenHeader({
  title,
  onBack,
  variant = "primary",
  right,
  showBack = true,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { headerPaddingTop } = useScreenInsets();
  const palette = appTheme.header[variant];

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: palette.background, paddingTop: headerPaddingTop },
        style,
      ]}
    >
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={palette.icon} />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <Text
        style={[styles.title, { color: palette.text }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

/** Compact back control for auth / form screens that use a custom title layout. */
export function ScreenBackButton({
  onPress,
  variant = "surface",
}: {
  onPress: () => void;
  variant?: "primary" | "surface";
}) {
  const palette = appTheme.header[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.inlineBackButton}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={24} color={palette.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 24,
  },
  backPlaceholder: {
    width: 24,
    marginRight: 24,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  right: {
    marginLeft: 12,
  },
  inlineBackButton: {
    padding: 4,
    marginRight: 8,
  },
});
