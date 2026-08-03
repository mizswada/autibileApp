import { Ionicons } from "@expo/vector-icons";
import { ScreenBackButton } from "@/components/ScreenHeader";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";

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
  const [techSupportList, setTechSupportList] = useState<TechSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTechSupportList = async () => {
    try {
      setError(null);
      const response = await API("apps/contactUs/list", {}, "GET", false);

      if (Array.isArray(response)) {
        setTechSupportList(response);
      } else if (response.statusCode === 200) {
        setTechSupportList(response.data || []);
      } else {
        setError(response.message || "Failed to load support contacts");
      }
    } catch {
      setError("Unable to load support contacts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechSupportList();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTechSupportList();
    setRefreshing(false);
  };

  const openEmail = async (email: string) => {
    const url = `mailto:${email}?subject=${encodeURIComponent("Password reset request")}`;
    try {
      await Linking.openURL(url);
    } catch {
      // No mail client available
    }
  };

  const openPhone = async (phoneNumber: string) => {
    const url = `tel:${phoneNumber.replace(/\s/g, "")}`;
    try {
      await Linking.openURL(url);
    } catch {
      // No dialer available
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: authPaddingTop }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4db5ff"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View style={styles.backButton}>
            <ScreenBackButton onPress={() => router.back()} variant="surface" />
          </View>
          <Text style={styles.title}>Forgot Password</Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="help-circle-outline" size={40} color="#4db5ff" />
          <Text style={styles.infoTitle}>Contact Administrator</Text>
          <Text style={styles.infoText}>
            Password reset via email is not available at the moment. Please
            contact our technical support team to reset your password.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color="#4db5ff" />
            <Text style={styles.loadingText}>Loading support contacts...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBlock}>
            <Ionicons name="alert-circle-outline" size={40} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTechSupportList}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : techSupportList.length > 0 ? (
          <View style={styles.supportSection}>
            <Text style={styles.sectionTitle}>Technical Support</Text>
            {techSupportList.map((contact) => (
              <View key={contact.no} style={styles.contactCard}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openEmail(contact.email)}
                >
                  <Ionicons name="mail-outline" size={18} color="#4db5ff" />
                  <Text style={styles.contactText}>{contact.email}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => openPhone(contact.phoneNumber)}
                >
                  <Ionicons name="call-outline" size={18} color="#4db5ff" />
                  <Text style={styles.contactText}>{contact.phoneNumber}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.centerBlock}>
            <Ionicons name="people-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>No support contacts available</Text>
            <Text style={styles.emptySubtext}>
              Please try again later or visit autibile.my for assistance.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.backToLogin} onPress={() => router.back()}>
          <Text style={styles.backToLoginText}>
            Back to <Text style={styles.backToLoginLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#E1F5FF",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
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
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  infoText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  supportSection: {
    width: "100%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E1F5FF",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  contactText: {
    fontSize: 14,
    color: "#4db5ff",
    flex: 1,
    lineHeight: 20,
    ...(Platform.OS === "android"
      ? { includeFontPadding: false, textAlignVertical: "center" as const }
      : {}),
  },
  centerBlock: {
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
  },
  errorText: {
    fontSize: 15,
    color: "#F44336",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#4db5ff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  backToLogin: {
    marginTop: 24,
    alignItems: "center",
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
