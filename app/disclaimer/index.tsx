import { ScreenHeader } from "@/components/ScreenHeader";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DisclaimerScreen() {
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
          {/* truncated for brevity */}
        </View>

        {/* Result / Interpretation of M CHAT-R */}
        <Text style={styles.sectionTitle}>
          Result / Interpretation of M CHAT-R
        </Text>
        <View style={styles.table}>
          {/* LOW RISK Row – spanning two lines in the right cell */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>
              LOW RISK{"\n"}(Total score 0–2)
            </Text>
            <Text style={styles.tableCell}>
              If child {"<"}2 years old, repeat after 2 years old.{"\n"}
              No further action is required unless surveillance indicates
              likelihood for autism.
            </Text>
          </View>

          {/* MODERATE RISK */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>
              MODERATE RISK{"\n"}(Total score 3–7)
            </Text>
            <Text style={styles.tableCell}>
              Proceed to second stage of M-CHAT R/F.
            </Text>
          </View>

          {/* HIGH RISK */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>
              HIGH RISK{"\n"}(Total score 8–20)
            </Text>
            <Text style={styles.tableCell}>
              Proceed to diagnostic evaluation. Highly recommended for early
              intervention.
            </Text>
          </View>
        </View>
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
});
