import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";

interface DiaryReport {
  diary_id: number;
  patient_id: number;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
  patient: {
    patient_id: number;
    fullname: string;
    nickname: string;
    patient_ic: string;
    gender: string;
    dob: string;
    autism_diagnose: string;
    diagnosed_on: string;
    status: string;
    available_session: number;
    created_at: string;
    update_at: string;
  } | null;
}

export default function PractitionerReport() {
  const [loading, setLoading] = useState(true);
  const [diaryReports, setDiaryReports] = useState<DiaryReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDateEntries, setSelectedDateEntries] = useState<DiaryReport[]>(
    [],
  );
  const router = useRouter();

  useEffect(() => {
    fetchDiaryReports();
  }, []);

  const fetchDiaryReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (!storedData) {
        setError("User data not found");
        setLoading(false);
        return;
      }

      const userData = JSON.parse(storedData);

      // For practitioners, we need to get all diary reports
      // You might need to adjust this based on how you identify practitioners
      const response = await API(
        "apps/diaryReport/listAll",
        {
          // If you have a practitioner ID, use it here
          // For now, we'll fetch all reports (you may need to adjust this)
          limit: 100,
          offset: 0,
        },
        "GET",
        false,
      );

      if (response.statusCode === 200 && response.data) {
        setDiaryReports(response.data as DiaryReport[]);
        setPagination((response as any).pagination);
      } else {
        setError(response.message || "Failed to fetch diary reports");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Group entries by patient first, then by date
  const groupedByPatient = diaryReports.reduce(
    (acc, entry) => {
      const patientName =
        entry.patient?.fullname || `Patient ${entry.patient_id}`;
      if (!acc[patientName]) acc[patientName] = {};

      const date = new Date(entry.date || entry.created_at).toDateString();
      if (!acc[patientName][date]) acc[patientName][date] = [];
      acc[patientName][date].push(entry);

      return acc;
    },
    {} as Record<string, Record<string, DiaryReport[]>>,
  );

  const handleDatePress = (
    patientName: string,
    date: string,
    entries: DiaryReport[],
  ) => {
    setSelectedDate(`${patientName} - ${date}`);
    setSelectedDateEntries(entries);
    setShowDateModal(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text>Loading diary reports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={fetchDiaryReports}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Patient Diary Reports</Text>
      </View>

      <ScrollView style={styles.container}>
        {Object.keys(groupedByPatient).length === 0 ? (
          <Text style={styles.noDataText}>No diary reports found.</Text>
        ) : (
          Object.keys(groupedByPatient).map((patientName) => (
            <View key={patientName} style={styles.patientCard}>
              <Text style={styles.patientName}>{patientName}</Text>
              {Object.keys(groupedByPatient[patientName]).map((date) => (
                <TouchableOpacity
                  key={date}
                  style={styles.dateCard}
                  onPress={() =>
                    handleDatePress(
                      patientName,
                      date,
                      groupedByPatient[patientName][date],
                    )
                  }
                >
                  <Text style={styles.dateHeader}>{date}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Date Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Diary Reports - {selectedDate}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalScrollContent}
            >
              {selectedDateEntries.map((entry: DiaryReport) => (
                <View key={entry.diary_id} style={styles.modalEntryCard}>
                  <View style={styles.modalEntryHeader}>
                    <Text style={styles.modalPatientName}>
                      {entry.patient?.fullname || `Patient ${entry.patient_id}`}
                    </Text>
                    <Text style={styles.modalEntryTime}>
                      {new Date(
                        entry.date || entry.created_at,
                      ).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.modalEntryContent}>
                    {entry.description}
                  </Text>
                  {entry.patient && (
                    <View style={styles.modalPatientInfo}>
                      <Text style={styles.modalPatientDetail}>
                        Age:{" "}
                        {entry.patient.dob
                          ? new Date(entry.patient.dob).getFullYear()
                          : "N/A"}
                      </Text>
                      <Text style={styles.modalPatientDetail}>
                        Status: {entry.patient.status || "N/A"}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#E1F5FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4db5ff",
    paddingTop: 70,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 30 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  container: { flex: 1, padding: 16 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
  },
  errorText: { color: "#F16742", marginBottom: 10 },
  retryButton: { backgroundColor: "#4db5ff", padding: 10, borderRadius: 12 },
  retryButtonText: { color: "#fff", fontWeight: "bold" },
  noDataText: { color: "#9CA3AF", textAlign: "center", marginTop: 40 },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  patientName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#4db5ff",
  },
  dateCard: {
    backgroundColor: "#E1F5FF",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    alignItems: "center",
  },
  dateHeader: { fontSize: 16, fontWeight: "bold", color: "#4db5ff" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E1F5FF",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
  },
  modalScrollView: {
    maxHeight: "80%",
    padding: 15,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalEntryCard: {
    backgroundColor: "#E1F5FF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  modalEntryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  modalPatientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4db5ff",
  },
  modalEntryTime: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  modalEntryContent: {
    fontSize: 15,
    color: "#1E293B",
    marginBottom: 5,
  },
  modalPatientInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalPatientDetail: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
