import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";
import { formatDateString } from "@/utils/formatLocalDate";
import {
  DIARY_CATEGORIES,
  isLegacyDiaryEntry,
  OPTIONAL_NOTES_LABEL,
} from "./constants";

const { width: screenWidth } = Dimensions.get("window");

const daysShort = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

interface DiaryReport {
  diary_id: number;
  patient_id: number;
  description: string | null;
  two_way_communication?: string | null;
  emotional_regulation?: string | null;
  focus_and_comprehension?: string | null;
  feeding_and_sensory?: string | null;
  sleep_and_daily_routines?: string | null;
  socialisation_self_confidence?: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  patient: {
    patient_id: number;
    fullname: string;
    nickname: string;
  } | null;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1);
  return (d.getDay() + 6) % 7;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatHistoryDate(dateString: string): string {
  return formatDateString(dateString);
}

function getEntryDateString(entry: DiaryReport): string {
  return new Date(entry.date || entry.created_at).toDateString();
}

function DiaryEntryContent({ entry }: { entry: DiaryReport }) {
  if (isLegacyDiaryEntry(entry)) {
    return <Text style={styles.entryText}>{entry.description}</Text>;
  }

  return (
    <>
      {DIARY_CATEGORIES.map(({ key, label }) => {
        const value = entry[key]?.trim();
        if (!value) return null;

        return (
          <View key={key} style={styles.categoryBlock}>
            <Text style={styles.categoryLabel}>{label}</Text>
            <Text style={styles.entryText}>{value}</Text>
          </View>
        );
      })}
      {entry.description?.trim() ? (
        <View style={styles.categoryBlock}>
          <Text style={styles.categoryLabel}>{OPTIONAL_NOTES_LABEL}</Text>
          <Text style={styles.entryText}>{entry.description}</Text>
        </View>
      ) : null}
    </>
  );
}

export default function PractitionerPatientReport() {
  const params = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
    patientNickname?: string;
  }>();

  const patientId = Array.isArray(params.patientId)
    ? params.patientId[0]
    : params.patientId;
  const patientName = Array.isArray(params.patientName)
    ? params.patientName[0]
    : params.patientName || "Patient";
  const patientNickname = Array.isArray(params.patientNickname)
    ? params.patientNickname[0]
    : params.patientNickname || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryReport[]>([]);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(
    null,
  );
  const [currentHistoryMonth, setCurrentHistoryMonth] = useState(new Date());
  const [currentHistorySlide, setCurrentHistorySlide] = useState(0);
  const historyFlatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (patientId) {
      fetchPatientDiaryReports();
    }
  }, [patientId]);

  const fetchPatientDiaryReports = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await API(
        "apps/diaryReport/listAll",
        {
          patientId,
          limit: 200,
          offset: 0,
        },
        "GET",
        false,
      );

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const reports = response.data as DiaryReport[];
        setEntries(reports);

        if (reports.length > 0) {
          const latestDate = new Date(
            reports[0].date || reports[0].created_at,
          );
          setSelectedHistoryDate(latestDate.toDateString());
          setCurrentHistoryMonth(
            new Date(latestDate.getFullYear(), latestDate.getMonth(), 1),
          );
        }
      } else {
        setEntries([]);
        setError(response.message || "Failed to fetch diary reports");
      }
    } catch {
      setEntries([]);
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const historyYear = currentHistoryMonth.getFullYear();
  const historyMonth = currentHistoryMonth.getMonth();
  const historyDaysInMonth = getDaysInMonth(historyYear, historyMonth);
  const historyFirstDayOfWeek = getFirstDayOfWeek(historyYear, historyMonth);

  const historyCalendarDays: (number | null)[] = [];
  for (let i = 0; i < historyFirstDayOfWeek; i++) historyCalendarDays.push(null);
  for (let d = 1; d <= historyDaysInMonth; d++) historyCalendarDays.push(d);

  const diaryEntryDates = [
    ...new Set(
      entries.map((entry) =>
        toDateKey(new Date(entry.date || entry.created_at)),
      ),
    ),
  ];

  const handleHistoryDayPress = (day: number) => {
    const calendarDate = new Date(historyYear, historyMonth, day);
    setSelectedHistoryDate(calendarDate.toDateString());
    setCurrentHistorySlide(0);
    historyFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const selectedDateEntries = selectedHistoryDate
    ? entries.filter(
        (entry) => getEntryDateString(entry) === selectedHistoryDate,
      )
    : [];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text style={styles.loadingText}>Loading diary reports...</Text>
      </View>
    );
  }

  if (error && entries.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={fetchPatientDiaryReports}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title="Patient Diary Report" />

      <View style={styles.patientBanner}>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientAvatarText}>
            {patientName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.patientBannerText}>
          <Text style={styles.patientBannerName}>{patientName}</Text>
          {patientNickname ? (
            <Text style={styles.patientBannerNickname}>
              Nickname: {patientNickname}
            </Text>
          ) : null}
          <Text style={styles.patientBannerMeta}>
            {entries.length} diary report{entries.length === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <Text style={styles.noDataText}>
            No diary reports found for this patient.
          </Text>
        ) : (
          <>
            <View style={styles.monthCard}>
              <TouchableOpacity
                onPress={() =>
                  setCurrentHistoryMonth(
                    new Date(historyYear, historyMonth - 1, 1),
                  )
                }
                style={styles.monthNavButton}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {currentHistoryMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setCurrentHistoryMonth(
                    new Date(historyYear, historyMonth + 1, 1),
                  )
                }
                style={styles.monthNavButton}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarCard}>
              <View style={styles.daysRow}>
                {daysShort.map((day, index) => (
                  <Text key={index} style={styles.dayShort}>
                    {day}
                  </Text>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {historyCalendarDays.map((day, idx) => {
                  if (!day) {
                    return <View key={idx} style={styles.dayCell} />;
                  }

                  const calendarDate = new Date(historyYear, historyMonth, day);
                  const dateKey = toDateKey(calendarDate);
                  const hasEntry = diaryEntryDates.includes(dateKey);
                  const isSelected =
                    selectedHistoryDate === calendarDate.toDateString();

                  return (
                    <Pressable
                      key={idx}
                      style={[
                        styles.dayCell,
                        hasEntry && styles.dayCellEntry,
                        isSelected && styles.dayCellSelected,
                        isSelected && !hasEntry && styles.dayCellSelectedEmpty,
                      ]}
                      onPress={() => handleHistoryDayPress(day)}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          hasEntry && styles.dayNumEntry,
                          isSelected && !hasEntry && styles.dayNumSelectedEmpty,
                          isSelected && hasEntry && styles.dayNumSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={styles.calendarHint}>
              Blue dates have diary reports for {patientName.split(" ")[0]}.
            </Text>

            {selectedHistoryDate && (
              <View style={styles.selectedDateBanner}>
                <Ionicons name="calendar-outline" size={18} color="#1565A8" />
                <Text style={styles.selectedDateText}>
                  {formatHistoryDate(selectedHistoryDate)}
                </Text>
              </View>
            )}

            {selectedHistoryDate && (
              <>
                {selectedDateEntries.length > 0 ? (
                  <>
                    <Text style={styles.historyReportTitle}>Diary Entries</Text>

                    <FlatList
                      data={selectedDateEntries}
                      horizontal
                      pagingEnabled
                      scrollEnabled={selectedDateEntries.length > 1}
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(item) => String(item.diary_id)}
                      renderItem={({ item: entry }) => (
                        <View style={styles.pagedHistoryEntryCard}>
                          <DiaryEntryContent entry={entry} />
                          <Text style={styles.historyEntryTime}>
                            {new Date(
                              entry.date || entry.created_at,
                            ).toLocaleTimeString()}
                          </Text>
                        </View>
                      )}
                      onScroll={(e) => {
                        const index = Math.round(
                          e.nativeEvent.contentOffset.x /
                            e.nativeEvent.layoutMeasurement.width,
                        );
                        setCurrentHistorySlide(index);
                      }}
                      ref={historyFlatListRef}
                    />

                    {selectedDateEntries.length > 1 && (
                      <View style={styles.pagination}>
                        {selectedDateEntries.map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.dot,
                              currentHistorySlide === index &&
                                styles.activeDot,
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyDateCard}>
                    <Ionicons
                      name="document-text-outline"
                      size={40}
                      color="#ccc"
                    />
                    <Text style={styles.emptyDateText}>
                      No diary report for this date.
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "transparent" },
  patientBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4db5ff",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4db5ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  patientAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  patientBannerText: { flex: 1 },
  patientBannerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  patientBannerNickname: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  patientBannerMeta: {
    fontSize: 13,
    color: "#4db5ff",
    marginTop: 4,
    fontWeight: "600",
  },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
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
  monthCard: {
    backgroundColor: "#4db5ff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  monthNavButton: { padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  calendarCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    paddingTop: 20,
    marginBottom: 8,
    alignItems: "center",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  dayShort: {
    width: "14.2%",
    textAlign: "center",
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 13,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  dayCell: {
    width: "14.2%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayNum: { fontSize: 16, color: "#1E293B", fontWeight: "500" },
  dayCellEntry: { backgroundColor: "#4db5ff", borderRadius: 10 },
  dayNumEntry: { color: "#fff", fontWeight: "bold" },
  dayCellSelected: {
    backgroundColor: "#1565A8",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  dayCellSelectedEmpty: {
    backgroundColor: "#fff",
    borderColor: "#4db5ff",
  },
  dayNumSelected: { color: "#fff", fontWeight: "bold" },
  dayNumSelectedEmpty: { color: "#1565A8", fontWeight: "bold" },
  calendarHint: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 12,
  },
  selectedDateBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#4db5ff",
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1565A8",
    flexShrink: 1,
  },
  historyReportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  pagedHistoryEntryCard: {
    width: screenWidth - 32,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 8,
    marginTop: 4,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 180,
  },
  entryText: {
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 6,
    lineHeight: 20,
  },
  categoryBlock: { marginBottom: 8 },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4db5ff",
    marginBottom: 2,
  },
  historyEntryTime: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 8,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#99C5E8",
    marginHorizontal: 4,
  },
  activeDot: { backgroundColor: "#4db5ff" },
  emptyDateCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  emptyDateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
});
