import { Ionicons } from "@expo/vector-icons";
import { AuthFormScroll } from "@/components/AuthFormScroll";
import { ScreenBackButton } from "@/components/ScreenHeader";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ModalSelector from "react-native-modal-selector";
import API from "../../api";

const ACCOUNT_TYPES = [
  { key: "Parents", label: "Parents" },
  { key: "Doctor", label: "Doctor" },
  { key: "Therapist", label: "Therapist" },
];

export default function AccountRequest() {
  const router = useRouter();
  const { authPaddingTop } = useScreenInsets();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("Parents");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert("Error", "Please enter your full name and account email.");
      return;
    }

    if (!confirmed) {
      Alert.alert(
        "Confirmation required",
        "Please confirm that you want to request account deletion.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await API(
        "apps/account-request",
        {
          requestType: "AccountDeletion",
          fullName: fullName.trim(),
          email: email.trim(),
          accountType,
          additionalInfo: additionalInfo.trim(),
          confirmed: true,
        },
        "POST",
        false,
      );

      if (result.statusCode === 200) {
        Alert.alert(
          "Request Submitted",
          result.message ||
            "Your account deletion request has been submitted. It will be processed after administrator approval.",
          [{ text: "OK", onPress: () => router.back() }],
        );
      } else {
        Alert.alert("Unable to Submit", result.message || "Please try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    !fullName.trim() || !email.trim() || !confirmed || loading;

  return (
    <AuthFormScroll
      paddingTop={authPaddingTop}
      contentContainerStyle={styles.container}
      footer={
        <>
          <TouchableOpacity
            style={styles.confirmRow}
            onPress={() => setConfirmed(!confirmed)}
          >
            <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
              {confirmed ? (
                <Ionicons name="checkmark" size={16} color="#4db5ff" />
              ) : null}
            </View>
            <Text style={styles.confirmText}>
              I understand this will request deletion of my Autibile account after
              administrator approval.
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#4db5ff" />
          ) : (
            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              <Text style={styles.buttonText}>Submit Account Request</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>
              Back to <Text style={styles.backLinkStrong}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={styles.headerContainer}>
        <View style={styles.backButton}>
          <ScreenBackButton onPress={() => router.back()} variant="surface" />
        </View>
        <Text style={styles.title}>Account Request</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Submit a request to delete your Autibile account. An administrator will review
          and process verified requests.
        </Text>
      </View>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={styles.label}>Account Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your account email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Account Type</Text>
      <ModalSelector
        data={ACCOUNT_TYPES}
        initValue="Parents"
        onChange={(option) => setAccountType(option.key)}
        style={styles.selector}
        initValueTextStyle={{ color: "#1E293B" }}
        selectTextStyle={{ fontSize: 16 }}
      >
        <View style={styles.input}>
          <Text style={styles.selectorText}>
            {ACCOUNT_TYPES.find((item) => item.key === accountType)?.label ||
              "Select account type"}
          </Text>
        </View>
      </ModalSelector>

      <Text style={styles.label}>Additional Information (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any additional details"
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
        multiline
        textAlignVertical="top"
      />
    </AuthFormScroll>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  headerContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E293B",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 6,
    marginTop: 4,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    minHeight: 52,
    borderColor: "#E1F5FF",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#1E293B",
    justifyContent: "center",
  },
  textArea: {
    minHeight: 100,
  },
  selector: {
    width: "100%",
    marginBottom: 0,
  },
  selectorText: {
    fontSize: 16,
    color: "#1E293B",
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#E1F5FF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    borderColor: "#4db5ff",
    backgroundColor: "#E1F5FF",
  },
  confirmText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#1E293B",
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#4db5ff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: "#8ccffe",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backLink: {
    alignItems: "center",
    marginTop: 4,
  },
  backLinkText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  backLinkStrong: {
    color: "#4db5ff",
    fontWeight: "700",
  },
});
