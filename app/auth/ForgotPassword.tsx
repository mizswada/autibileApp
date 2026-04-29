import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSendResetLink = () => {
    if (email) {
      Alert.alert("Success", "Password reset link has been sent to your email");
      router.back();
    } else {
      Alert.alert("Error", "Please enter your email address");
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to reset your password
      </Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleSendResetLink}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleBackToLogin}>
        <Text style={styles.loginLink}>
          Back to <Text style={styles.loginText}>Login</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#E1F5FF",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "500",
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
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#4db5ff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginLink: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  loginText: {
    color: "#4db5ff",
    fontWeight: "bold",
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 6,
    marginTop: 4,
    fontWeight: "600",
  },
});
