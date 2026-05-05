import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";

export default function Register() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ic, setIC] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    fullName: "",
    email: "",
    ic: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: "",
  });

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const validateAll = () => {
      const usernameValid = username.trim() !== "";
      const fullNameValid = fullName.trim() !== "";
      const emailValid = email.trim() !== "" && isValidEmail(email);
      const icValid = ic.trim() !== "";
      const phoneValid = phone.trim() !== "" && phone.length >= 8;
      const passwordValid = password.length >= 8;
      const confirmPasswordValid =
        password === confirmPassword && confirmPassword.length >= 8;
      const termsValid = acceptTerms;

      return (
        usernameValid &&
        fullNameValid &&
        emailValid &&
        icValid &&
        phoneValid &&
        passwordValid &&
        confirmPasswordValid &&
        termsValid
      );
    };

    setIsFormValid(validateAll());
  }, [
    username,
    fullName,
    email,
    ic,
    phone,
    password,
    confirmPassword,
    acceptTerms,
  ]);

  const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const validateField = (field: string, value: string) => {
    let message = "";
    switch (field) {
      case "username":
        if (!value.trim()) message = "Username is required";
        break;
      case "fullName":
        if (!value.trim()) message = "Full name is required";
        break;
      case "email":
        if (!value.trim()) message = "Email is required";
        else if (!isValidEmail(value)) message = "Invalid email format";
        break;
      case "ic":
        if (!value.trim() || value.length < 12 || value.length > 12)
          message = "IC / MyKid / Passport is required and valid";
        break;
      case "phone":
        if (!value.trim() || value.length < 10 || value.length > 11)
          message = "Phone number must be valid";
        break;
      case "password":
        if (!value || value.length < 8)
          message = "Password must be at least 8 characters";
        break;
      case "confirmPassword":
        if (value !== password) message = "Passwords do not match";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: message }));
    return message === "";
  };

  const validateForm = () => {
    const fields = [
      "username",
      "fullName",
      "email",
      "ic",
      "phone",
      "password",
      "confirmPassword",
    ];
    let valid = true;
    fields.forEach((field) => {
      const value = eval(field);
      if (!validateField(field, value)) valid = false;
    });
    if (!acceptTerms) {
      setErrors((prev) => ({
        ...prev,
        acceptTerms: "You must accept terms and conditions",
      }));
      valid = false;
    } else {
      setErrors((prev) => ({ ...prev, acceptTerms: "" }));
    }
    return valid;
  };

  const handleSignUp = async () => {
    //if (!validateForm()) return;
    try {
      console.log("Calling API...");
      const response = await API("apps/registration/registerParents", {
        username,
        fullname: fullName,
        email,
        ic,
        password,
        phone,
        role: "2",
      });

      if (response.statusCode === 200 && response.data) {
        setShowSuccessModal(true);
      } else {
        alert(response.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during registration");
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push("/auth/LoginParents");
    //router.push('/auth/parentsInformation');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.create}>Create New Account</Text>
      </View>

      {/** Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Username"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          validateField("username", text);
        }}
      />
      {errors.username ? (
        <Text style={styles.errorText}>{errors.username}</Text>
      ) : null}

      {/** Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Full Name"
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          validateField("fullName", text);
        }}
      />
      {errors.fullName ? (
        <Text style={styles.errorText}>{errors.fullName}</Text>
      ) : null}

      {/** Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          validateField("email", text);
        }}
        keyboardType="email-address"
      />
      {errors.email ? (
        <Text style={styles.errorText}>{errors.email}</Text>
      ) : null}

      {/** IC */}
      <Text style={styles.label}>IC / MyKid / Passport</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: 123456789012"
        value={ic}
        onChangeText={(text) => {
          setIC(text);
          validateField("ic", text);
        }}
      />
      {errors.ic ? <Text style={styles.errorText}>{errors.ic}</Text> : null}

      {/** Phone */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          validateField("phone", text);
        }}
      />
      {errors.phone ? (
        <Text style={styles.errorText}>{errors.phone}</Text>
      ) : null}

      {/** Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Password (Min: 8 characters)"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          validateField("password", text);
        }}
      />
      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : null}

      {/** Confirm Password */}
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Reenter Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          validateField("confirmPassword", text);
        }}
      />
      {errors.confirmPassword ? (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      ) : null}

      {/** Terms */}
      <View style={styles.termsRow}>
        <TouchableOpacity
          style={[styles.checkboxBase, acceptTerms && styles.checkboxChecked]}
          onPress={() => {
            setAcceptTerms(!acceptTerms);
            if (!acceptTerms)
              setErrors((prev) => ({ ...prev, acceptTerms: "" }));
          }}
        >
          {acceptTerms && <View style={styles.checkboxInner} />}
        </TouchableOpacity>
        <Text style={styles.termsText}>I accept terms and condition</Text>
      </View>
      {errors.acceptTerms ? (
        <Text style={styles.errorText}>{errors.acceptTerms}</Text>
      ) : null}

      {/** Sign Up button */}
      <TouchableOpacity
        style={[styles.button, !isFormValid && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={!isFormValid}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/** Sign In redirect */}
      <TouchableOpacity onPress={() => router.push("/auth/LoginParents")}>
        <Text style={styles.signInLink}>
          Already have an account?{" "}
          <Text style={styles.signInText}>Sign In</Text>
        </Text>
      </TouchableOpacity>

      {/** Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleSuccessModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Up Complete</Text>
            <Text style={styles.modalText}>
              Your account has been created successfully!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSuccessModalClose}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // [styles remain unchanged as per your latest version]
  // include your styles here
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
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
  backButton: { position: "absolute", left: 0 },
  create: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4db5ff",
    marginBottom: 20,
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
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  termsText: { marginLeft: 8, fontSize: 14, color: "#1E293B" },
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
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  signInLink: { fontSize: 14, color: "#9CA3AF" },
  signInText: { color: "#4db5ff", fontWeight: "bold" },
  checkboxBase: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#4db5ff",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#E1F5FF" },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: "#4db5ff",
    borderRadius: 3,
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 4,
    marginTop: 4,
    fontWeight: "600",
  },
  errorText: {
    color: "#F16742",
    alignSelf: "flex-start",
    marginBottom: 8,
    marginTop: -12,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "80%",
    alignItems: "center",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1E293B",
  },
  modalText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: "#4db5ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  buttonDisabled: {
    backgroundColor: "#8ccffe",
    shadowOpacity: 0.1,
  },
});
