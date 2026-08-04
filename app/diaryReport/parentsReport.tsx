import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import { sharePdfDocument } from "../../utils/sharePdfDocument";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore
import API from "../../api";
import { getLogoBase64 } from "../../utils/getLogoBase64";
import {
  buildDiaryReportFilename,
  buildDiaryReportHtml,
} from "./diaryReportTemplate";
import {
  DIARY_CATEGORIES,
  EMPTY_CATEGORIES,
  formatDiaryEntryLines,
  hasAnyCategoryFilled,
  OPTIONAL_NOTES_LABEL,
  type DiaryCategoryKey,
  type DiaryEntryData,
} from "./constants";
import { formatDateString } from "@/utils/formatLocalDate";

const { width: screenWidth } = Dimensions.get("window");

const daysShort = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

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

type DiaryEntry = DiaryEntryData & {
  timestamp: string;
};

function DiaryEntryContent({ entry }: { entry: DiaryEntry }) {
  const lines = formatDiaryEntryLines(entry);

  return (
    <>
      {lines.map((line, index) => (
        <Text key={index} style={styles.entryText}>
          {line}
        </Text>
      ))}
    </>
  );
}

export default function ParentsReport() {
  const [categories, setCategories] =
    useState<Record<DiaryCategoryKey, string>>(EMPTY_CATEGORIES);
  const [optionalNotes, setOptionalNotes] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"diary" | "history">("diary");
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(
    null,
  );
  const [currentHistoryMonth, setCurrentHistoryMonth] = useState(new Date());
  const [currentHistorySlide, setCurrentHistorySlide] = useState(0);
  const historyFlatListRef = useRef<FlatList>(null);

  // Child selection states
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userData");

        if (storedData) {
          const data = JSON.parse(storedData);

          // Fetch latest children data from API
          try {
            const response = await API(
              "apps/parents/displayDetails",
              {
                parentID: data.parentId,
              },
              "GET",
            );

            if (response.statusCode === 200 && response.data) {
              const parents = response.data as any[];
              const currentParent = parents[0]; // Get the first parent

              if (
                currentParent &&
                currentParent.children &&
                currentParent.children.length > 0
              ) {
                // Convert API children data to our format
                const childrenData = currentParent.children.map(
                  (child: any) => ({
                    patientId: child.childID,
                    name: child.fullname,
                    age: null, // Age not available in current data
                  }),
                );

                setChildren(childrenData);

                // If multiple children, show selector
                if (childrenData.length > 1) {
                  setShowChildSelector(true);
                } else if (childrenData.length === 1) {
                  // If only one child, auto-select
                  setSelectedChild(childrenData[0]);
                  fetchDiaryReports(childrenData[0].patientId);
                }
              } else {
                console.log("No children found in API response");
                // Fallback to stored data
                fallbackToStoredData(data);
              }
            } else {
              console.log("API response error:", response);
              // Fallback to stored data
              fallbackToStoredData(data);
            }
          } catch (apiError) {
            console.error("Error fetching from API:", apiError);
            // Fallback to stored data
            fallbackToStoredData(data);
          }
        }
      } catch (error) {
        console.error("Error initializing screen:", error);
      }
    };

    const fallbackToStoredData = (data: any) => {
      // Check if we have patientIds array (multiple children)
      if (
        data.patientIds &&
        Array.isArray(data.patientIds) &&
        data.patientIds.length > 0
      ) {
        console.log("Using stored patientIds array:", data.patientIds);

        // Convert patientIds to children format
        const childrenData = data.patientIds.map((patient: any) => ({
          patientId: patient.patient_id,
          name: patient.fullname,
          age: null, // Age not available in current data
        }));

        setChildren(childrenData);

        // If multiple children, show selector
        if (childrenData.length > 1) {
          setShowChildSelector(true);
        } else if (childrenData.length === 1) {
          // If only one child, auto-select
          setSelectedChild(childrenData[0]);
          fetchDiaryReports(childrenData[0].patientId);
        }
      } else {
        // Fallback: try to use single patientId if available
        const patientId = data.patientId || data.patient_id;
        if (patientId) {
          console.log("Using single patientId:", patientId);
          fetchDiaryReports(patientId);
        } else {
          console.error("No patient ID found in stored data");
        }
      }
    };

    initializeScreen();
  }, []);

  const fetchDiaryReports = async (patientId: string) => {
    try {
      console.log("Fetching diary reports for patientId:", patientId);
      const response = await API(
        "apps/diaryReport/listDiary",
        { patientID: patientId },
        "GET",
        false,
      );

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const fetchedEntries = (response.data as any[]).map((item: any) => ({
          description: item.description,
          two_way_communication: item.two_way_communication,
          emotional_regulation: item.emotional_regulation,
          focus_and_comprehension: item.focus_and_comprehension,
          feeding_and_sensory: item.feeding_and_sensory,
          sleep_and_daily_routines: item.sleep_and_daily_routines,
          socialisation_self_confidence: item.socialisation_self_confidence,
          timestamp: item.created_at,
        }));
        setEntries(fetchedEntries);
      } else {
        console.warn("Failed to load diary reports:", response.message);
        setEntries([]); // Set empty array if no data
      }
    } catch (error) {
      console.error("Error fetching diary reports:", error);
      setEntries([]); // Set empty array on error
    }
  };

  const handleSave = async () => {
    if (!hasAnyCategoryFilled(categories)) return;

    try {
      // Use selectedChild if available, otherwise use stored user data
      let patientId;
      if (selectedChild) {
        patientId = selectedChild.patientId;
      } else {
        const storedData = await AsyncStorage.getItem("userData");
        if (storedData) {
          const data = JSON.parse(storedData);
          patientId = data.patientId;
        }
      }

      if (!patientId) {
        alert("No patient ID available");
        return;
      }

      const response = await API("apps/diaryReport/insert", {
        patientID: patientId,
        two_way_communication: categories.two_way_communication,
        emotional_regulation: categories.emotional_regulation,
        focus_and_comprehension: categories.focus_and_comprehension,
        feeding_and_sensory: categories.feeding_and_sensory,
        sleep_and_daily_routines: categories.sleep_and_daily_routines,
        socialisation_self_confidence: categories.socialisation_self_confidence,
        description: optionalNotes,
        date: new Date().toISOString(),
      });

      if (response.statusCode === 200) {
        const newEntry: DiaryEntry = {
          ...categories,
          description: optionalNotes,
          timestamp: new Date().toISOString(),
        };
        const todayDateString = new Date(newEntry.timestamp).toDateString();

        setEntries([newEntry, ...entries]);
        setCategories({ ...EMPTY_CATEGORIES });
        setOptionalNotes("");
        // Show the new entry under History for today.
        setActiveTab("history");
        setSelectedHistoryDate(todayDateString);
        setCurrentHistoryMonth(new Date());
        setCurrentHistorySlide(0);
        setModalVisible(true);

        setTimeout(() => {
          setModalVisible(false);
        }, 1500);
      } else {
        alert(response.message || "Failed to save diary report");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while saving the report");
    }
  };

  const canSave = hasAnyCategoryFilled(categories);

  const updateCategory = (key: DiaryCategoryKey, value: string) => {
    setCategories((prev) => ({ ...prev, [key]: value }));
  };

  // Include all dates (including today) so new entries appear in History.
  const allHistoryDates = [
    ...new Set(
      entries.map((item) => new Date(item.timestamp).toDateString()),
    ),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const historyYear = currentHistoryMonth.getFullYear();
  const historyMonth = currentHistoryMonth.getMonth();
  const historyDaysInMonth = getDaysInMonth(historyYear, historyMonth);
  const historyFirstDayOfWeek = getFirstDayOfWeek(historyYear, historyMonth);

  const historyCalendarDays: (number | null)[] = [];
  for (let i = 0; i < historyFirstDayOfWeek; i++) historyCalendarDays.push(null);
  for (let d = 1; d <= historyDaysInMonth; d++) historyCalendarDays.push(d);

  const diaryEntryDates = [
    ...new Set(entries.map((entry) => toDateKey(new Date(entry.timestamp)))),
  ];

  const handleHistoryDayPress = (day: number) => {
    const calendarDate = new Date(historyYear, historyMonth, day);
    const dateString = calendarDate.toDateString();

    setSelectedHistoryDate(dateString);
    setCurrentHistorySlide(0);
    historyFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const selectedDateEntries = selectedHistoryDate
    ? entries.filter(
        (entry) =>
          new Date(entry.timestamp).toDateString() === selectedHistoryDate,
      )
    : [];

  const handleGeneratePDF = async (forAllEntries = false) => {
    if (generatingPdf) return;

    try {
      let entriesToProcess;
      let title;

      if (forAllEntries) {
        entriesToProcess = entries;
        title = "All Diary Entries";
      } else {
        entriesToProcess = entries.filter(
          (item) =>
            new Date(item.timestamp).toDateString() === selectedHistoryDate,
        );
        title = selectedHistoryDate
          ? `Diary Report for ${formatHistoryDate(selectedHistoryDate)}`
          : "Diary Report";
      }

      if (entriesToProcess.length === 0) {
        Alert.alert(
          "No Entries",
          forAllEntries
            ? "No history entries found."
            : "No entries found for selected date.",
        );
        return;
      }

      setGeneratingPdf(true);

      let logoUri: string | null = null;
      try {
        logoUri = await getLogoBase64();
      } catch (logoError) {
        console.warn("Diary report logo loading error:", logoError);
      }

      const childName =
        selectedChild?.fullname ||
        selectedChild?.patientName ||
        selectedChild?.name ||
        undefined;
      const childNickname = selectedChild?.nickname || undefined;

      const html = buildDiaryReportHtml({
        title,
        childName,
        childNickname,
        entries: entriesToProcess,
        logoUri,
        reportScope: forAllEntries ? "all" : "date",
        selectedDate: selectedHistoryDate,
      });

      const { uri } = await Print.printToFileAsync({ html });

      await sharePdfDocument(uri, {
        dialogTitle: "Share diary report",
        fileName: buildDiaryReportFilename(
          childName,
          forAllEntries,
          selectedHistoryDate,
        ),
        unavailableMessage:
          "Your diary report PDF was created, but sharing is not available on this device.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("Error", "Failed to generate PDF report. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Diary Report" />

      <View style={styles.container}>
        <View style={styles.topTabs}>
          <TouchableOpacity
            style={[
              styles.topTab,
              activeTab === "diary" && styles.topTabActive,
            ]}
            onPress={() => setActiveTab("diary")}
          >
            <Text
              style={[
                styles.topTabText,
                activeTab === "diary" && styles.topTabTextActive,
              ]}
            >
              Diary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.topTab,
              activeTab === "history" && styles.topTabActive,
            ]}
            onPress={() => {
              setActiveTab("history");
              if (!selectedHistoryDate && allHistoryDates.length > 0) {
                const firstDate = new Date(allHistoryDates[0]);
                setSelectedHistoryDate(allHistoryDates[0]);
                setCurrentHistoryMonth(
                  new Date(firstDate.getFullYear(), firstDate.getMonth(), 1),
                );
              }
            }}
          >
            <Text
              style={[
                styles.topTabText,
                activeTab === "history" && styles.topTabTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Child Selector */}
        {children.length > 1 && (
          <View style={styles.childSelectorContainer}>
            <TouchableOpacity
              style={styles.childSelectorButton}
              onPress={() => setShowChildSelector(true)}
            >
              <Text style={styles.childSelectorText}>
                {selectedChild
                  ? `Selected: ${selectedChild.name}`
                  : "Select Child"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "diary" && (
          <>
            <ScrollView
              style={styles.diaryFormScroll}
              contentContainerStyle={styles.diaryFormContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                <Text style={styles.cardTitle}>New Diary Report</Text>

                {DIARY_CATEGORIES.map(({ key, label }) => (
                  <View key={key} style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                      placeholderTextColor="#B0B0B0"
                      multiline
                      value={categories[key]}
                      onChangeText={(value) => updateCategory(key, value)}
                    />
                  </View>
                ))}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{OPTIONAL_NOTES_LABEL}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter additional notes (optional)..."
                    placeholderTextColor="#B0B0B0"
                    multiline
                    value={optionalNotes}
                    onChangeText={setOptionalNotes}
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                canSave ? styles.saveBtnActive : styles.saveBtnDisabled,
              ]}
              disabled={!canSave}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Save Report</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === "history" && (
          <>
            <View style={styles.historyHeader}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                Diary Report History
              </Text>
            </View>

            <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false}>
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
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item: entry }) => (
                          <View style={styles.pagedHistoryEntryCard}>
                            <DiaryEntryContent entry={entry} />
                            <Text style={styles.historyEntryTime}>
                              {new Date(entry.timestamp).toLocaleTimeString()}
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

                      <View style={styles.pagination}>
                        {selectedDateEntries.map((_, index) => (
                          <View
                            key={index}
                            style={[
                              styles.dot,
                              currentHistorySlide === index && styles.activeDot,
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyDateCard}>
                      <Ionicons name="document-text-outline" size={40} color="#ccc" />
                      <Text style={styles.emptyDateText}>
                        No diary report for this date.
                      </Text>
                    </View>
                  )}
                </>
              )}

              {allHistoryDates.length === 0 && (
                <Text
                  style={{ marginTop: 20, color: "#777", textAlign: "center" }}
                >
                  No history entries found.
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.generateAllBtn,
                  generatingPdf && styles.generateAllBtnDisabled,
                ]}
                onPress={() => handleGeneratePDF(true)}
                disabled={generatingPdf}
              >
                <Text style={styles.generateAllBtnText}>
                  {generatingPdf ? "Generating PDF..." : "Download Report"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </>
        )}
      </View>

      {/* Child Selection Modal */}
      <Modal
        visible={showChildSelector}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setShowChildSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Child</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Choose which child's diary reports you want to view:
              </Text>

              <View style={styles.childList}>
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.childItem}
                    onPress={() => {
                      setSelectedChild(child);
                      setShowChildSelector(false);
                      fetchDiaryReports(child.patientId);
                    }}
                  >
                    <Text style={styles.childName}>
                      {child.name || `Child ${index + 1}`}
                    </Text>
                    <Text style={styles.childAge}>
                      {child.age ? `${child.age} years old` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowChildSelector(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>Report saved successfully.</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "transparent" },
  tabContainer: { flex: 1, alignItems: "center" },
  container: { flex: 1, alignItems: "center", padding: 16 },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
    alignSelf: "center",
  },
  diaryFormScroll: {
    width: "100%",
    maxHeight: 420,
    marginTop: 30,
  },
  diaryFormContent: {
    paddingBottom: 8,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    minHeight: 80,
    backgroundColor: "#E1F5FF",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: "#1E293B",
    textAlignVertical: "top",
    borderWidth: 1.5,
    borderColor: "#E1F5FF",
  },
  saveBtn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  saveBtnActive: {
    backgroundColor: "#4db5ff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: {
    backgroundColor: "#99C5E8",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    minWidth: 180,
    alignItems: "center",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    color: "#4db5ff",
    fontWeight: "bold",
  },
  topTabs: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#E1F5FF",
    overflow: "hidden",
  },
  topTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  topTabActive: {
    backgroundColor: "#4db5ff",
  },
  topTabText: {
    fontWeight: "600",
    color: "#1E293B",
  },
  topTabTextActive: {
    color: "#fff",
  },
  pagedEntryCard: {
    width: screenWidth - 32,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 8,
    marginTop: 12,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  entryTimestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  entryText: {
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 6,
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
  activeDot: {
    backgroundColor: "#4db5ff",
  },
  entryCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  monthCard: {
    backgroundColor: "#4db5ff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  calendarCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    paddingTop: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 270,
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
  dayNum: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
  },
  dayCellEntry: {
    backgroundColor: "#4db5ff",
    borderRadius: 10,
  },
  dayNumEntry: {
    color: "#fff",
    fontWeight: "bold",
  },
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
  dayNumSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  dayNumSelectedEmpty: {
    color: "#1565A8",
    fontWeight: "bold",
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
  generateAllBtn: {
    backgroundColor: "#4db5ff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 16,
  },
  generateAllBtnDisabled: {
    opacity: 0.7,
  },
  generateAllBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  pagedHistoryEntryCard: {
    width: screenWidth - 32,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 8,
    marginTop: 12,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 200,
  },
  historyEntryText: {
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 8,
  },
  historyEntryTime: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  childSelectorCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    minWidth: 300,
    maxWidth: 350,
    alignItems: "center",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  childSelectorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
  },
  childSelectorSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 20,
  },
  childOption: {
    width: "100%",
    backgroundColor: "#E1F5FF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E1F5FF",
  },
  childName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  childSelectorScrollView: {
    maxHeight: 300,
    width: "100%",
  },
  childSelectorScrollContent: {
    paddingBottom: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
  },
  modalBody: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: "#9CA3AF",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 12,
  },
  childList: {
    marginTop: 10,
  },
  childItem: {
    backgroundColor: "#E1F5FF",
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E1F5FF",
  },
  modalButtons: {
    gap: 12,
  },
  modalButtonPrimary: {
    backgroundColor: "#4db5ff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtonSecondary: {
    backgroundColor: "#E1F5FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonTextSecondary: {
    color: "#4db5ff",
    fontSize: 16,
    fontWeight: "600",
  },
  childSelectorContainer: {
    width: "100%",
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E1F5FF",
  },
  childSelectorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  childSelectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginRight: 10,
  },
});
