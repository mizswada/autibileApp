import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API from "../api";

interface FAQ {
  no: number;
  id: number;
  faq_language: string;
  faq_question: string;
  faq_answer: string;
  faq_status: string;
}

export default function FAQ() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API("apps/faq/list", {}, "GET", false);

      if (Array.isArray(response)) {
        setFaqs(response);
      } else {
        console.error("Invalid response format:", response);
        setFaqs([]);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setError("Failed to load FAQs. Please try again.");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.mainContainer}>
      {/* Header */}
      <View style={{ backgroundColor: "#E1F5FF", justifyContent: "flex-end" }}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>FAQ</Text>
          </View>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#48B2E8" />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFAQs}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text style={styles.notesText}>
              Below are some frequently asked questions to guide you in
              understanding the screening process.
            </Text>
          </View>

          {faqs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="help-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No FAQs available</Text>
              <Text style={styles.emptySubtext}>
                Check back later for updates
              </Text>
            </View>
          ) : (
            faqs.map((faq) => (
              <View key={faq.id} style={styles.faqBox}>
                <Text style={styles.question}>Q: {faq.faq_question}</Text>
                <Text style={styles.answer}>A: {faq.faq_answer}</Text>
                {faq.faq_language && (
                  <Text style={styles.languageTag}>{faq.faq_language}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#E1F5FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
  },
  scrollContainer: {
    padding: 16,
  },
  notesContainer: {
    backgroundColor: "#FFF7E6",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },
  notesTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 16,
    color: "#333",
  },
  notesText: {
    fontSize: 14,
    color: "#333",
  },
  faqBox: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  question: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    color: "#333",
  },
  answer: {
    fontSize: 15,
    color: "#555",
    marginBottom: 8,
  },
  languageTag: {
    fontSize: 12,
    color: "#48B2E8",
    backgroundColor: "#E3F3FC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#48B2E8",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
