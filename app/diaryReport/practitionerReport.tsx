import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";

interface DiaryReport {
  diary_id: number;
  patient_id: number;
  date: string;
  created_at: string;
  patient: {
    patient_id: number;
    fullname: string;
    nickname: string;
  } | null;
}

interface PatientSummary {
  patient_id: number;
  fullname: string;
  nickname: string;
  reportCount: number;
}

export default function PractitionerReport() {
  const [loading, setLoading] = useState(true);
  const [diaryReports, setDiaryReports] = useState<DiaryReport[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

      const response = await API(
        "apps/diaryReport/listAll",
        {
          limit: 200,
          offset: 0,
        },
        "GET",
        false,
      );

      if (response.statusCode === 200 && response.data) {
        setDiaryReports(response.data as DiaryReport[]);
      } else {
        setError(response.message || "Failed to fetch diary reports");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const patients = useMemo(() => {
    const map = new Map<number, PatientSummary>();

    diaryReports.forEach((entry) => {
      const id = entry.patient_id;
      const existing = map.get(id);

      if (existing) {
        existing.reportCount += 1;
        return;
      }

      map.set(id, {
        patient_id: id,
        fullname: entry.patient?.fullname || `Patient ${id}`,
        nickname: entry.patient?.nickname || "",
        reportCount: 1,
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.fullname.localeCompare(b.fullname),
    );
  }, [diaryReports]);

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter(
      (patient) =>
        patient.fullname.toLowerCase().includes(query) ||
        patient.nickname.toLowerCase().includes(query),
    );
  }, [patients, searchQuery]);

  const handlePatientPress = (patient: PatientSummary) => {
    router.push({
      pathname: "/diaryReport/practitionerPatientReport",
      params: {
        patientId: String(patient.patient_id),
        patientName: patient.fullname,
        patientNickname: patient.nickname,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text style={styles.loadingText}>Loading patients...</Text>
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Patient Diary Reports</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#64748B"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or nickname..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.listHint}>
          Select a patient to view their diary report history.
        </Text>

        {patients.length === 0 ? (
          <Text style={styles.noDataText}>No diary reports found.</Text>
        ) : filteredPatients.length === 0 ? (
          <Text style={styles.noDataText}>
            No patients match &quot;{searchQuery.trim()}&quot;.
          </Text>
        ) : (
          filteredPatients.map((patient) => (
            <TouchableOpacity
              key={patient.patient_id}
              style={styles.patientCard}
              onPress={() => handlePatientPress(patient)}
              activeOpacity={0.8}
            >
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>
                  {patient.fullname.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.fullname}</Text>
                {patient.nickname ? (
                  <Text style={styles.patientNickname}>
                    {patient.nickname}
                  </Text>
                ) : null}
                <Text style={styles.reportCount}>
                  {patient.reportCount} report
                  {patient.reportCount === 1 ? "" : "s"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#4db5ff" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff", flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4db5ff",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B",
  },
  clearButton: { marginLeft: 4 },
  listHint: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
  },
  loadingText: { marginTop: 12, color: "#64748B" },
  errorText: { color: "#F16742", marginBottom: 10, textAlign: "center" },
  retryButton: { backgroundColor: "#4db5ff", padding: 10, borderRadius: 12 },
  retryButtonText: { color: "#fff", fontWeight: "bold" },
  noDataText: { color: "#9CA3AF", textAlign: "center", marginTop: 40 },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4db5ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  patientAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  patientInfo: { flex: 1 },
  patientName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1E293B",
  },
  patientNickname: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  reportCount: {
    fontSize: 13,
    color: "#4db5ff",
    marginTop: 4,
    fontWeight: "600",
  },
});
