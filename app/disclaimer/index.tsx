import { ScreenHeader } from "@/components/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";

type Threshold = {
  threshold_id: number;
  scoring_min: number | null;
  scoring_max: number | null;
  interpretation: string;
  recommendation: string;
};

type ThresholdSection = {
  questionnaire_id: number;
  title: string;
  thresholds: Threshold[];
};

/** The backend stores "no upper bound" as this sentinel instead of null. */
const UNBOUNDED_MAX = 999999;

function formatScoreRange(min: number | null, max: number | null): string {
  const hasMin = typeof min === "number";
  const hasMax = typeof max === "number" && max < UNBOUNDED_MAX;

  if (hasMin && hasMax) {
    if (min === max) return `Score ${min}`;
    if (min <= 0) return `Score ≤ ${max}`;
    return `Score ${min} – ${max}`;
  }
  if (hasMin) return `Score ≥ ${min}`;
  if (hasMax) return `Score ≤ ${max}`;
  return "";
}

export default function DisclaimerScreen() {
  const [sections, setSections] = useState<ThresholdSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API(
        "apps/questionnaire/thresholds",
        {},
        "GET",
        false,
      );

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        setSections(response.data as ThresholdSection[]);
      } else {
        throw new Error(response.message || "Unexpected response");
      }
    } catch (err) {
      console.error("Error fetching questionnaire thresholds:", err);
      setError("Failed to load result interpretations. Please try again.");
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <ScreenHeader title="Disclaimer" />

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Important Note</Text>

        <View style={styles.box}>
          <Text style={styles.bold}>Important Notice:</Text>
          <Text style={styles.text}>
            The questionnaires in this application are screening tools—not
            diagnostic tests—used to identify children who may be at risk for
            autism spectrum disorder (ASD) and other developmental concerns.
            This application is not intended to provide a medical diagnosis.
          </Text>
          <Text style={styles.text}>
            Each screening tool is validated for a specific age range and
            purpose, and some are designed to be used together as part of a
            staged screening process. Please follow the age guidance and any
            follow-up steps shown with each questionnaire.
          </Text>
          <Text style={styles.text}>
            Please note that a significant number of children who screen
            positive may not be diagnosed with the condition being screened for.
            Nonetheless, these children are at increased risk for other
            developmental delays or disorders. Any child who screens positive
            should be referred for further developmental evaluation.
          </Text>
          <Text style={styles.text}>
            Conversely, if your child screens normally, it does not mean the
            absence of a condition. If you have concerns after a normal
            screening, speak with your healthcare provider about additional
            assessments available. No screening tool is 100% accurate.
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#48B2E8" />
            <Text style={styles.stateText}>Loading interpretations...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchThresholds}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.stateContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.stateText}>
              No result interpretations available
            </Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.questionnaire_id}>
              <Text style={styles.sectionTitle}>
                Result / Interpretation of {section.title}
              </Text>
              <View style={styles.table}>
                {section.thresholds.map((threshold) => {
                  const range = formatScoreRange(
                    threshold.scoring_min,
                    threshold.scoring_max,
                  );

                  return (
                    <View key={threshold.threshold_id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.tableHeader]}>
                        {threshold.interpretation}
                        {range ? `\n(${range})` : ""}
                      </Text>
                      <Text style={styles.tableCell}>
                        {threshold.recommendation}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 32,
    marginBottom: 12,
  },
  box: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  bold: {
    fontWeight: "bold",
  },
  text: {
    marginBottom: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  table: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#999",
  },

  tableCell: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },

  tableHeader: {
    fontWeight: "bold",
    backgroundColor: "#f2f2f2",
    flex: 0.7, // Make label column narrower
    borderRightWidth: 1,
    borderRightColor: "#999",
  },
  stateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  stateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
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
});
