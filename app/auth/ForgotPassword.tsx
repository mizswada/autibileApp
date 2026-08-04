import { Ionicons } from "@expo/vector-icons";
import { AuthFormScroll } from "@/components/AuthFormScroll";
import { ScreenBackButton } from "@/components/ScreenHeader";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";

const TEMP_RESET_PASSWORD = "12345678";

interface TechSupport {
  no: number;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
}

export default function ForgotPassword() {
  const router = useRouter();
  const { authPaddingTop } = useScreenInsets();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [supportPhone, setSupportPhone] = useState<string | null>(null);

  useEffect(() => {
    const loadSupport = async () => {
      try {
        const response = await API("apps/contactUs/list", {}, "GET", false);
        const list = Array.isArray(response)
          ? response
          : response.statusCode === 200
            ? response.data || []
            : [];
        const first = list.find((item: TechSupport) => item.phoneNumber);
        if (first?.phoneNumber) {
          setSupportPhone(first.phoneNumber);
        }
      } catch {
        // Support phone is optional
      }
    };
    loadSupport();
  }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !phoneNumber.trim()) {
      Alert.alert("Error", "Please enter your email and registered phone number.");
      return;
    }

    setLoading(true);
    try {
      const result = await API(
        "apps/account-request",
        {
          requestType: "PasswordReset",
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
        },
        "POST",
        false,
      );

      if (result.statusCode === 200) {
        Alert.alert(
          "Request Submitted",
          result.message ||
            `Your password reset request has been submitted. Once approved, your password will be reset to ${TEMP_RESET_PASSWORD}.`,
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

  const handleCallSupport = async () => {
    if (!supportPhone) {
      Alert.alert(
        "Support unavailable",
        "Please try again later or email our support team.",
      );
      return;
    }

    const url = `tel:${supportPhone.replace(/\s/g, "")}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to call", `Please call ${supportPhone} manually.`);
    }
  };

  const isDisabled = !email.trim() || !phoneNumber.trim() || loading;

  return (
    <AuthFormScroll
      paddingTop={authPaddingTop}
      contentContainerStyle={styles.container}
      footer={
        <>
          {loading ? (
            <ActivityIndicator size="large" color="#4db5ff" />
          ) : (
            <TouchableOpacity
              style={[styles.button, isDisabled && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isDisabled}
            >
              <Text style={styles.buttonText}>Request Password Reset</Text>
            </TouchableOpacity>
          )}

          {supportPhone ? (
            <TouchableOpacity style={styles.callButton} onPress={handleCallSupport}>
              <Ionicons name="call-outline" size={18} color="#4db5ff" />
              <Text style={styles.callButtonText}>
                Call support for faster help ({supportPhone})
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity onPress={() => router.back()} style={styles.backToLogin}>
            <Text style={styles.backToLoginText}>
              Back to <Text style={styles.backToLoginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={styles.headerContainer}>
        <View style={styles.backButton}>
          <ScreenBackButton onPress={() => router.back()} variant="surface" />
        </View>
        <Text style={styles.title}>Forgot Password</Text>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={28} color="#4db5ff" />
        <Text style={styles.infoText}>
          Submit your registered email and phone number. After an administrator approves
          your request, your password will be reset to{" "}
          <Text style={styles.infoStrong}>{TEMP_RESET_PASSWORD}</Text>. Please change it
          after signing in.
        </Text>
      </View>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your account email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your registered phone number"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
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
    gap: 10,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoText: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
  },
  infoStrong: {
    fontWeight: "700",
    color: "#1E293B",
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
    height: 52,
    borderColor: "#E1F5FF",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
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
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
  },
  callButtonText: {
    color: "#4db5ff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  backToLogin: {
    alignItems: "center",
    marginTop: 4,
  },
  backToLoginText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  backToLoginLink: {
    color: "#4db5ff",
    fontWeight: "700",
  },
});
