import API from "@/api";
import { Ionicons } from "@expo/vector-icons"; // for back icon and eye icon
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginDoctor() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const result = await API(
        "apps/auth/loginDoctor",
        { username: email, password, rememberMe },
        "POST",
        false,
      );

      // Adjust based on your API response structure
      if (result.statusCode !== 200) {
        Alert.alert("Login Failed", result.message || "Invalid credentials");
      } else {
        const { data } = result as any;
        await AsyncStorage.setItem("userData", JSON.stringify(data));
        //console.log('data', data);
        Alert.alert("Success", "Login successful", [
          {
            text: "OK",
            onPress: () => {
              if (data.hasPractitionerInfo) {
                router.push("/doctorPage"); // existing user
              } else {
                router.push("/manageDetails/practitionerInformation"); // first time user
              }
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push("/auth/ForgotPassword");
  };

  const handleHomePage = () => {
    router.push("/doctorPage");
  };

  const handleSignUp = () => {
    router.push("/auth/DoctorRegister");
  };

  const isButtonDisabled = !email || !password;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Icon */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/")}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.welcome}>Welcome</Text>
      </View>

      <Text style={styles.subtitle}>Sign In</Text>
      <Text style={styles.userType}>Sign in as DOCTORS</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter Your Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color="#888"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={handleForgotPassword}
      >
        <Text style={styles.forgotPasswordText}>Forget Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.rememberMeContainer}
        onPress={() => setRememberMe(!rememberMe)}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && (
            <Ionicons name="checkmark" size={16} color="#4db5ff" />
          )}
        </View>
        <Text style={styles.checkboxText}>Remember me for 30 days</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.homePage} onPress={handleHomePage}>
        <Text style={styles.homePageText}>Home Page</Text>
      </TouchableOpacity> */}

      {loading ? (
        <ActivityIndicator size="large" color="#4db5ff" />
      ) : (
        <TouchableOpacity
          style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isButtonDisabled}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.orText}>OR</Text>

      <View style={styles.socialRow}>
        {/* <TouchableOpacity style={styles.socialButton}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png' }}
            style={styles.socialIcon}
          />
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={{
              uri: "https://developers.google.com/identity/images/g-logo.png",
            }}
            style={styles.socialIcon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleSignUp}>
        <Text style={styles.signUpLink}>
          Don&apos;t have an account?{" "}
          <Text style={styles.signUpText}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: "#E1F5FF",
  },
  headerContainer: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    position: "absolute",
    left: 0,
  },
  welcome: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4db5ff",
  },
  subtitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E293B",
    paddingTop: 20,
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    color: "#9CA3AF",
    marginBottom: 30,
    fontWeight: "500",
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 6,
    marginTop: 5,
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
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#E1F5FF",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    height: 52,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 60,
  },
  forgotPasswordText: {
    color: "#4db5ff",
    fontSize: 14,
    fontWeight: "600",
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#E1F5FF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    borderColor: "#4db5ff",
    backgroundColor: "#E1F5FF",
  },
  checkboxText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "500",
  },
  homePage: {
    alignSelf: "center",
    marginBottom: 60,
  },
  homePageText: {
    color: "#4db5ff",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
    textAlign: "center",
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
  buttonDisabled: {
    backgroundColor: "#8ccffe",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  orText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  socialButton: {
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  socialIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  signUpLink: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  signUpText: {
    color: "#4db5ff",
    fontWeight: "bold",
  },
});
