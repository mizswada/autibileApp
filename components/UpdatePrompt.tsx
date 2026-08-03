import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { appTheme } from "@/constants/appTheme";

type UpdatePromptProps = {
  visible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
};

export function UpdatePrompt({
  visible,
  onUpdate,
  onDismiss,
}: UpdatePromptProps) {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="cloud-download-outline"
              size={32}
              color={appTheme.primary}
            />
          </View>

          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.description}>
            A newer version of Autibile is available with improvements and bug
            fixes. Update now to get the latest experience.
          </Text>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={onUpdate}
            accessibilityRole="button"
          >
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            onPress={onDismiss}
            accessibilityRole="button"
          >
            <Text style={styles.laterButtonText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: appTheme.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: appTheme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  laterButton: {
    paddingVertical: 12,
    marginTop: 4,
  },
  laterButtonText: {
    color: appTheme.textMuted,
    fontSize: 15,
    fontWeight: "500",
  },
});
