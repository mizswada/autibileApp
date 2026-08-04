import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import { sharePdfDocument } from "../../utils/sharePdfDocument";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";
import { getLogoBase64 } from "../../utils/getLogoBase64";
import {
  buildBambiDetailedHtml,
  buildIntegratedReportFilename,
  buildIntegratedScreeningReportHtml,
  buildMchatDetailedHtml,
  buildScreenDetailedHtml,
  buildSleepDetailedHtml,
} from "../../utils/screeningReportTemplate";
import { getQuestionnaireLockInfo } from "./access";
import { formatDateString, parseAnyLocalDate } from "@/utils/formatLocalDate";

function getNumericAnswerValue(answer: any): string | null {
  if (
    answer.numeric_answer !== null &&
    answer.numeric_answer !== undefined &&
    answer.numeric_answer !== ""
  ) {
    return String(answer.numeric_answer);
  }

  if (
    answer.score !== null &&
    answer.score !== undefined &&
    !answer.option_id &&
    !answer.option_title &&
    (!answer.text_answer || String(answer.text_answer).trim() === "")
  ) {
    return String(answer.score);
  }

  return null;
}

function renderAnswerContent(answer: any) {
  if (answer.option_title) {
    return (
      <View style={styles.answerDisplay}>
        <Text style={styles.answerText}>{answer.option_title}</Text>
        {answer.option_title_bm ? (
          <Text style={styles.answerTextBm}>{answer.option_title_bm}</Text>
        ) : null}
      </View>
    );
  }

  if (answer.text_answer && String(answer.text_answer).trim() !== "") {
    return (
      <View style={styles.answerDisplay}>
        <Text style={styles.answerText}>{answer.text_answer}</Text>
      </View>
    );
  }

  const numericValue = getNumericAnswerValue(answer);
  if (numericValue !== null) {
    return (
      <View style={styles.answerDisplay}>
        <Text style={styles.answerText}>{numericValue}</Text>
      </View>
    );
  }

  return <Text style={styles.noAnswerText}>No answer provided</Text>;
}

export default function QuestionnaireIndex() {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [questionnaires, setQuestionnaires] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();
  const [showDetailedAnswers, setShowDetailedAnswers] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  const initializeChildSelection = async () => {
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) {
        const data = JSON.parse(storedData);

        // Try to get children from API first
        try {
          const response = await API(
            "apps/parents/displayDetails",
            { parentID: data.parentId },
            "GET",
            false,
          );
          if (response.statusCode === 200 && response.data) {
            const parents = response.data as any[];
            const currentParent = parents[0];

            if (
              currentParent &&
              currentParent.children &&
              currentParent.children.length > 0
            ) {
              const childrenData = currentParent.children.map((child: any) => ({
                patientId: child.childID,
                name: child.fullname,
                age: null,
              }));

              // Check if children list has changed (indicating child removal/addition)
              const storedChildIds =
                data.patientIds?.map((c: any) => c.patient_id) || [];
              const newChildIds = childrenData.map((c: any) => c.patientId);
              const childrenListChanged =
                storedChildIds.length !== newChildIds.length ||
                !storedChildIds.every((id: any) => newChildIds.includes(id));

              if (childrenListChanged) {
                // Force refresh all data when children list changes
                setChildren(childrenData);

                // Update stored data with new children list
                const updatedUserData = {
                  ...data,
                  patientIds: childrenData.map((child: any) => ({
                    patient_id: child.patientId,
                    fullname: child.name,
                  })),
                  selectedChildId: childrenData[0].patientId, // Reset to first child
                };
                await AsyncStorage.setItem(
                  "userData",
                  JSON.stringify(updatedUserData),
                );

                // IMPORTANT: Reset selectedChild state to the remaining child
                setSelectedChild(childrenData[0]);

                // Force refresh questionnaires to get updated eligibility and history
                setTimeout(() => {
                  fetchQuestionnaires("current");
                  fetchQuestionnaires("history");
                }, 100);
              } else {
                // No change, just update normally
                setChildren(childrenData);

                // Check if current selectedChild is still valid
                const currentSelectedChildId = data.selectedChildId;
                const validChildIds = childrenData.map((c: any) => c.patientId);

                if (
                  currentSelectedChildId &&
                  !validChildIds.includes(currentSelectedChildId)
                ) {
                  // Current selectedChild is no longer valid, resetting to first child
                  setSelectedChild(childrenData[0]);

                  // Update stored data with corrected selectedChildId
                  const updatedUserData = {
                    ...data,
                    patientIds: childrenData.map((child: any) => ({
                      patient_id: child.patientId,
                      fullname: child.name,
                    })),
                    selectedChildId: childrenData[0].patientId,
                  };
                  await AsyncStorage.setItem(
                    "userData",
                    JSON.stringify(updatedUserData),
                  );
                } else {
                  // Normal update
                  const updatedUserData = {
                    ...data,
                    patientIds: childrenData.map((child: any) => ({
                      patient_id: child.patientId,
                      fullname: child.name,
                    })),
                    selectedChildId:
                      data.selectedChildId || childrenData[0].patientId,
                  };
                  await AsyncStorage.setItem(
                    "userData",
                    JSON.stringify(updatedUserData),
                  );
                }
              }

              if (childrenData.length > 1) {
                setShowChildSelector(true);
              } else if (childrenData.length === 1) {
                setSelectedChild(childrenData[0]);
              }
            }
          }
        } catch (apiError) {
          console.error("Error fetching children:", apiError);
        }
      }
    } catch (error) {
      console.error("Error initializing child selection:", error);
    }
  };

  const fetchQuestionnaires = async (type: "current" | "history") => {
    // Prevent multiple simultaneous fetch calls
    if (isFetching) {
      return;
    }

    setIsFetching(true);

    try {
      setLoading(true);
      setError(null);

      const storedData = await AsyncStorage.getItem("userData");
      if (!storedData) {
        setError("User data not found");
        setLoading(false);
        setIsFetching(false);
        return;
      }

      const userData = JSON.parse(storedData);

      if (type === "current") {
        // Fetch current questionnaires
        const apiParams: any = {
          parentID: userData.parentId,
          type: type,
        };

        // Only add childID if it exists
        if (userData.selectedChildId) {
          apiParams.childID = userData.selectedChildId;
        }

        // Fetch questionnaires with per-patient access info
        if (userData.selectedChildId) {
          const response = await API(
            "apps/questionnaire/listQuestionnaire",
            {
              ...apiParams,
              patientID: userData.selectedChildId,
            },
            "GET",
            false,
          );

          if (response.statusCode === 200 && response.data) {
            const data = response.data as any[];

            const questionnairesWithStatus = data
              .filter((q: any) => Number(q.questionnaire_id) !== 2)
              .map((q: any) => ({
                ...q,
                isDisabled: q.questionnaire_access
                  ? !q.questionnaire_access.can_access
                  : false,
              }))
              .sort((a: any, b: any) => {
                if (Number(a.questionnaire_id) === 1) return -1;
                if (Number(b.questionnaire_id) === 1) return 1;
                return 0;
              });

            setQuestionnaires(questionnairesWithStatus);
            return;
          }
        }

        // Fallback when no child is selected
        const response = await API(
          "apps/questionnaire/listQuestionnaire",
          apiParams,
          "GET",
          false,
        );

        if (response.statusCode === 200 && response.data) {
          const data = response.data as any[];

          // Check if questionnaire ID = 1 has been completed for this patient
          const questionnaireHistoryResponse = await API(
            "apps/questionnaire/response",
            { parentId: userData.parentId },
            "GET",
            false,
          );

          let completedQuestionnaireIds: number[] = [];
          if (
            questionnaireHistoryResponse.statusCode === 200 &&
            questionnaireHistoryResponse.data
          ) {
            const historyData = questionnaireHistoryResponse.data as any[];

            // Check for completed questionnaire ID = 1 for this specific patient/child
            // If no selectedChildId, we can't determine which child to check, so skip the completion check
            let patientResponses: any[] = [];
            if (userData.selectedChildId) {
              patientResponses = historyData.filter((response: any) => {
                // Convert both to numbers for comparison to handle type mismatches
                const responsePatientId = Number(response.patient_id);
                const selectedChildId = Number(userData.selectedChildId);
                return responsePatientId === selectedChildId;
              });
            } else {
              // No selectedChildId found, skipping completion check
            }

            completedQuestionnaireIds = patientResponses.map(
              (response: any) => response.questionnaire_id,
            );
          }

          // Mark questionnaires as disabled only when completed (fallback without access API)
          // Filter out questionnaire id = 2 from the listing
          const questionnairesWithStatus = data
            .filter((q: any) => Number(q.questionnaire_id) !== 2) // Filter out questionnaire id = 2
            .map((q: any) => {
              const questionnaireId = Number(q.questionnaire_id);
              let isDisabled = false;
              let questionnaire_access: any = null;

              if (questionnaireId === 1) {
                isDisabled = completedQuestionnaireIds.includes(1);
                if (isDisabled) {
                  questionnaire_access = {
                    can_access: false,
                    has_completed: true,
                    access_reason:
                      "This screening has already been completed for this child.",
                  };
                }
              }

              return {
                ...q,
                isDisabled,
                questionnaire_access,
              };
            })
            .sort((a: any, b: any) => {
              if (Number(a.questionnaire_id) === 1) return -1;
              if (Number(b.questionnaire_id) === 1) return 1;
              return 0;
            });

          setQuestionnaires(questionnairesWithStatus);
        } else {
          // Instead of showing error, continue with loading state
          // The system will retry or show fallback data
        }
      } else {
        // Fetch history responses using parentId filtering
        const params: any = {
          parentId: userData.parentId, // Use parentId to filter responses for this parent's children
        };

        const response = await API(
          "apps/questionnaire/response",
          params,
          "GET",
          false,
        );

        if (response.statusCode === 200 && response.data) {
          const data = response.data as any[];

          // Filter history by selected child ID
          let filteredHistory = data;
          if (userData.selectedChildId) {
            filteredHistory = data.filter((response: any) => {
              const responsePatientId = Number(response.patient_id);
              const selectedChildId = Number(userData.selectedChildId);
              return responsePatientId === selectedChildId;
            });
          } else {
          }

          setHistory(filteredHistory);
        } else {
          // If API fails, show empty history instead of error
          setHistory([]);
          // Don't set error for history as it might be normal to have no responses
        }
      }
    } catch (error: any) {
      // Instead of showing error, continue with loading state
      // The system will show fallback data or retry automatically
      console.error("Error fetching autism screening:", error);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await initializeChildSelection();
      fetchQuestionnaires("current");
      fetchQuestionnaires("history");
    };
    initialize();
  }, []);

  // Listen for refresh signal from questionnaire submission
  useEffect(() => {
    let isMounted = true;

    const checkForRefresh = async () => {
      const refreshFlag = await AsyncStorage.getItem("refreshQuestionnaires");
      if (refreshFlag === "true" && isMounted) {
        // Clear the flag first
        await AsyncStorage.removeItem("refreshQuestionnaires");
        // Then refresh the data
        setLoading(true);
        try {
          await Promise.all([
            fetchQuestionnaires("current"),
            fetchQuestionnaires("history"),
          ]);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    // Check on mount and also set up an interval to check periodically
    checkForRefresh();
    const interval = setInterval(checkForRefresh, 500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);


  const handleTabChange = (tab: "current" | "history") => {
    setActiveTab(tab);
    if (tab === "current" && questionnaires.length === 0) {
      fetchQuestionnaires("current");
    } else if (tab === "history" && history.length === 0) {
      fetchQuestionnaires("history");
    }
  };

  const onRefresh = async () => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setRefreshing(true);

    try {
      // Add a small delay to prevent rapid successive calls
      await new Promise((resolve) => setTimeout(resolve, 500));

      await Promise.all([
        fetchQuestionnaires("current"),
        fetchQuestionnaires("history"),
      ]);
    } finally {
      setRefreshing(false);
      setIsRefreshing(false);
    }
  };

  if (loading && error === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text style={styles.loadingText}>Loading autism screening...</Text>
      </View>
    );
  }

  if (error && questionnaires.length === 0 && history.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text style={styles.loadingText}>
          Preparing autism screening data...
        </Text>
      </View>
    );
  }

  const dataToRender = activeTab === "current" ? questionnaires : history;

  const showDetailedAnswersModal = (response: any) => {
    setSelectedResponse(response);
    setShowDetailedAnswers(true);
  };

  const handleGenerateReport = async (child: any) => {
    try {
      setGeneratingReport(true);

      const storedData = await AsyncStorage.getItem("userData");
      if (!storedData) {
        Alert.alert("Error", "Unable to retrieve parent information.");
        setGeneratingReport(false);
        return;
      }

      const userData = JSON.parse(storedData);
      const parentId = userData.parentId;

      // Fetch all responses for this parent
      const responsesData = await API(
        "apps/questionnaire/response",
        { parentId },
        "GET",
        false,
      );
      const allResponses = responsesData?.data || [];

      // Filter by this child's patient ID
      const childResponses = allResponses.filter(
        (r: any) => r.patient_id === child.patientId,
      );

      if (childResponses.length === 0) {
        Alert.alert("No Data", `No screening data found for ${child.name}.`);
        setGeneratingReport(false);
        return;
      }

      // Helper: find most recent response for a questionnaire ID
      const findMostRecentByQuestionnaireId = (questionnaireId: number) => {
        const matches = childResponses.filter(
          (r: any) => r.questionnaire_id === questionnaireId,
        );
        if (matches.length === 0) return null;
        matches.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        return matches[0];
      };

      // Helper: find most recent response matching keywords
      const findMostRecentByKeywords = (keywords: string[]) => {
        const matches = childResponses.filter((r: any) =>
          keywords.some((kw) =>
            r.questionnaire_title?.toLowerCase().includes(kw.toLowerCase()),
          ),
        );
        if (matches.length === 0) return null;
        matches.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        return matches[0];
      };

      // Find most recent per domain
      const mchatResponse = findMostRecentByQuestionnaireId(1);
      const bambiResponse = findMostRecentByKeywords([
        "meal",
        "bambi",
        "feeding",
      ]);
      const sleepResponse = findMostRecentByKeywords(["sleep", "cshq"]);
      const screenResponse = findMostRecentByKeywords(["screen", "seq"]);

      if (!mchatResponse) {
        Alert.alert(
          "No M-CHAT-R Data",
          `No autism screening found for ${child.name}.`,
        );
        setGeneratingReport(false);
        return;
      }

      // Fetch parent details
      const parentDetailsData = await API(
        "apps/parents/displayDetails",
        { parentID: parentId },
        "GET",
        false,
      );
      const parentDetails = parentDetailsData?.data?.[0] as any;

      if (!parentDetails) {
        Alert.alert("Error", "Unable to retrieve parent information.");
        setGeneratingReport(false);
        return;
      }

      // Find child details from parent data
      const childData = parentDetails.children?.find(
        (c: any) => c.childID === child.patientId,
      );

      console.log("Parent Details:", parentDetails);
      console.log("Child Data:", childData);

      const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        const formatted = formatDateString(dateString);
        return formatted || "N/A";
      };

      const calculateAge = (dob: string) => {
        if (!dob) return "N/A";
        const birthDate = parseAnyLocalDate(dob);
        if (!birthDate) return "N/A";
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        return age.toString();
      };

      // Extract data - use correct field names from API response
      const childName = child.name || childData?.fullname || "N/A";
      const childDOB = childData?.dateOfBirth
        ? formatDate(childData.dateOfBirth)
        : "N/A";
      const childAge = childData?.dateOfBirth
        ? calculateAge(childData.dateOfBirth)
        : "N/A";
      const childGender = childData?.gender || "N/A";
      const screeningDate = formatDate((mchatResponse as any)?.created_at);

      const parentName = parentDetails.fullName || "N/A";
      const parentRelationship = parentDetails.relationship || "N/A";

      const mchatScore = (mchatResponse as any)?.total_score ?? "N/A";
      const mchatInterpretation =
        (mchatResponse as any)?.score_analysis?.interpretation || "Not assessed";
      const bambiScore = (bambiResponse as any)?.total_score ?? "N/A";
      const bambiInterpretation =
        (bambiResponse as any)?.score_analysis?.interpretation || "Not assessed";
      const sleepScore = (sleepResponse as any)?.total_score ?? "N/A";
      const sleepInterpretation =
        (sleepResponse as any)?.score_analysis?.interpretation || "Not assessed";
      const screenScore = (screenResponse as any)?.total_score ?? "N/A";
      const screenInterpretation =
        (screenResponse as any)?.score_analysis?.interpretation || "Not assessed";
      const screenRecommendation =
        (screenResponse as any)?.score_analysis?.recommendation || "";

      let logoUri: string | null = null;
      try {
        logoUri = await getLogoBase64();
      } catch (error) {
        console.warn("Logo loading error:", error);
      }

      const detailedSectionsHtml = [
        buildMchatDetailedHtml(mchatScore),
        buildBambiDetailedHtml(bambiScore),
        buildSleepDetailedHtml(sleepScore),
        buildScreenDetailedHtml(
          screenScore,
          screenInterpretation,
          screenRecommendation,
        ),
      ].join("");

      const htmlContent = buildIntegratedScreeningReportHtml({
        logoUri,
        childName,
        childDOB,
        childAge,
        childGender,
        screeningDate,
        parentName,
        parentRelationship,
        summaryRows: [
          {
            domain: "Autism (M-CHAT-R)",
            score: `${mchatScore}/20`,
            interpretation: mchatInterpretation,
          },
          {
            domain: "Feeding (BAMBI)",
            score: String(bambiScore),
            interpretation: bambiInterpretation,
          },
          {
            domain: "Sleep (CSHQ-SF)",
            score: String(sleepScore),
            interpretation: sleepInterpretation,
          },
          {
            domain: "Screen Time (SEQ)",
            score: String(screenScore),
            interpretation: screenInterpretation,
          },
        ],
        detailedSectionsHtml,
      });

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await sharePdfDocument(uri, {
        dialogTitle: "Share Integrated Screening Report",
        fileName: buildIntegratedReportFilename(childName),
        unavailableMessage:
          "Your screening report PDF was created, but sharing is not available on this device.",
      });

      setGeneratingReport(false);
    } catch (error) {
      console.error("Report generation error:", error);
      Alert.alert("Error", "Failed to generate report. Please try again.");
      setGeneratingReport(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScreenHeader title="Autism Screening" />

      {/* Tabs */}
      <View style={styles.topTabs}>
        <TouchableOpacity
          style={[
            styles.topTab,
            activeTab === "current" && styles.topTabActive,
          ]}
          onPress={() => handleTabChange("current")}
        >
          <Text
            style={[
              styles.topTabText,
              activeTab === "current" && styles.topTabTextActive,
            ]}
          >
            Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.topTab,
            activeTab === "history" && styles.topTabActive,
          ]}
          onPress={() => handleTabChange("history")}
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

      {/* Child Selector - moved below tabs */}
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

      {/* Notes only for current tab */}
      {activeTab === "current" && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.notesText}>
            <Text style={styles.important}>
              Please answer all questions honestly.
            </Text>
          </Text>
        </View>
      )}

      {/* Child indicator for history tab */}
      {activeTab === "history" && selectedChild && (
        <View style={styles.childIndicatorContainer}>
          <Text style={styles.childIndicatorText}>
            Showing history for:{" "}
            <Text style={styles.childIndicatorName}>{selectedChild.name}</Text>
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4db5ff"]}
          />
        }
      >
        {dataToRender.length ? (
          dataToRender.map((q) => (
            <TouchableOpacity
              key={activeTab === "current" ? q.questionnaire_id : q.qr_id}
              style={[
                styles.card,
                activeTab === "current" && q.isDisabled && styles.disabledCard,
              ]}
              onPress={() => {
                if (activeTab === "current") {
                  if (q.isDisabled) {
                    const lockInfo = getQuestionnaireLockInfo(
                      Number(q.questionnaire_id),
                      q.questionnaire_access,
                    );
                    Alert.alert(lockInfo.alertTitle, lockInfo.alertMessage, [
                      { text: "OK" },
                    ]);
                    return;
                  }
                  router.push(`/questionnaire/${q.questionnaire_id}` as any);
                } else {
                  // Show quick summary for completed questionnaire
                  const response = q;
                  Alert.alert(
                    "Autism Screening Summary",
                    `Autism Screening: ${response.questionnaire_title}\nPatient: ${response.patient_name}\nScore: ${response.total_score}\nCompleted: ${formatDateString(response.created_at)}\n\nTap "View" to see detailed answers.`,
                    [{ text: "OK" }],
                  );
                }
              }}
              disabled={activeTab === "current" && q.isDisabled}
            >
              <Text
                style={[
                  styles.title,
                  activeTab === "current" &&
                    q.isDisabled &&
                    styles.disabledText,
                ]}
              >
                {activeTab === "current" ? q.title : q.questionnaire_title}
              </Text>
              <Text
                style={[
                  styles.desc,
                  activeTab === "current" &&
                    q.isDisabled &&
                    styles.disabledText,
                ]}
              >
                {activeTab === "current"
                  ? q.description
                  : `Patient: ${q.patient_name}`}
              </Text>
              {activeTab === "current" ? (
                <View>
                  <Text
                    style={[
                      styles.totalQuestions,
                      q.isDisabled && styles.disabledText,
                    ]}
                  >
                    Total Questions:{" "}
                    {q.questionnaires_questions
                      ? q.questionnaires_questions.length
                      : 0}
                  </Text>
                  {q.isDisabled && (
                    <Text style={styles.completedText}>
                      {
                        getQuestionnaireLockInfo(
                          Number(q.questionnaire_id),
                          q.questionnaire_access,
                        ).badge
                      }
                    </Text>
                  )}
                  {!q.isDisabled &&
                    q.questionnaire_access?.show_age_warning && (
                      <Text style={styles.ageWarningText}>
                        ⚠ Outside recommended age
                      </Text>
                    )}
                </View>
              ) : (
                <View style={styles.historyInfo}>
                  <View style={styles.historyRow}>
                    <Text style={styles.scoreText}>Score: {q.total_score}</Text>
                    <Text style={styles.dateText}>
                      {formatDateString(q.created_at)}
                    </Text>
                  </View>
                  {q.score_analysis?.interpretation && (
                    <Text style={styles.interpretationText}>
                      Prediction: {q.score_analysis.interpretation}
                    </Text>
                  )}
                  {q.score_analysis?.recommendation && (
                    <Text style={styles.recommendationText}>
                      Recommendation: {q.score_analysis.recommendation}
                    </Text>
                  )}
                  <View style={styles.historyButtons}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        showDetailedAnswersModal(q);
                      }}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.centered}>
            <Text style={styles.noDataText}>
              No{" "}
              {activeTab === "current" ? "current autism screening" : "history"}{" "}
              found.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Download Integrated Report Button */}
      <View style={styles.downloadButtonContainer}>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => selectedChild && handleGenerateReport(selectedChild)}
          disabled={generatingReport || !selectedChild}
        >
          {generatingReport ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.downloadButtonText}>
              Download Integrated Report
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Detailed Answers Modal */}
      <Modal
        visible={showDetailedAnswers}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowDetailedAnswers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailedAnswersModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedResponse?.questionnaire_title ||
                  "Autism Screening Answers"}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailedAnswers(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalInfoText}>
                Patient: {selectedResponse?.patient_name}
              </Text>
              <Text style={styles.modalInfoText}>
                Total score: {selectedResponse?.total_score}
              </Text>
              <Text style={styles.modalInfoText}>
                Completed:{" "}
                {selectedResponse?.created_at
                  ? formatDateString(selectedResponse.created_at)
                  : ""}
              </Text>
            </View>

            {Array.isArray(selectedResponse?.composite_scores) &&
              selectedResponse.composite_scores.length > 0 && (
              <View style={styles.compositeScoresSection}>
                <Text style={styles.compositeScoresTitle}>Group scores</Text>
                {selectedResponse.composite_scores.map(
                  (group: any, index: number) => (
                    <View
                      key={`${group.label}-${index}`}
                      style={styles.compositeGroupCard}
                    >
                      <View style={styles.compositeGroupText}>
                        <Text style={styles.compositeGroupLabel}>
                          {group.label}
                        </Text>
                        <Text style={styles.compositeGroupMeta}>
                          Weighted avg {Number(group.average).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={styles.compositeGroupScore}>
                        {group.score}
                      </Text>
                    </View>
                  ),
                )}
                <Text style={styles.compositeScoresNote}>
                  Total score includes these group scores plus other question
                  scores.
                </Text>
              </View>
            )}

            <ScrollView style={styles.detailedAnswersScroll}>
              {selectedResponse?.answers &&
              selectedResponse.answers.length > 0 ? (
                (() => {
                  const compositeMemberIds = new Set<number>(
                    selectedResponse.composite_member_question_ids || [],
                  );

                  // Group answers by parent question
                  const groupedAnswers: { [parentId: string | "main"]: any[] } =
                    {};

                  selectedResponse.answers.forEach((answer: any) => {
                    // Handle both new and old field names for backward compatibility
                    const parentId =
                      answer.parent_question_id || answer.parentID || "main";
                    if (!groupedAnswers[parentId]) {
                      groupedAnswers[parentId] = [];
                    }
                    groupedAnswers[parentId].push(answer);
                  });

                  // Render grouped answers
                  let questionIndex = 1;
                  const renderedQuestions: React.ReactNode[] = [];

                  // First render main questions (parent_question_id is null) in correct order
                  if (groupedAnswers["main"]) {
                    // Sort main questions by admin-defined order
                    const sortedMainQuestions = groupedAnswers["main"].sort(
                      (a: any, b: any) => {
                        const orderA =
                          a.question_order ?? Number.MAX_SAFE_INTEGER;
                        const orderB =
                          b.question_order ?? Number.MAX_SAFE_INTEGER;
                        if (orderA !== orderB) return orderA - orderB;
                        return (a.question_id || 0) - (b.question_id || 0);
                      },
                    );

                    sortedMainQuestions.forEach((answer: any) => {
                      renderedQuestions.push(
                        <View
                          key={answer.answer_id}
                          style={styles.questionBlock}
                        >
                          <Text style={styles.questionNumber}>
                            Question {questionIndex}
                          </Text>
                          <Text style={styles.questionText}>
                            {answer.question_text || answer.question_text_bm}
                          </Text>

                          {/* Display Answer */}
                          <View style={styles.answerContainer}>
                            <Text style={styles.answerLabel}>Answer:</Text>
                            {renderAnswerContent(answer)}

                            <Text
                              style={
                                compositeMemberIds.has(answer.question_id)
                                  ? styles.groupMemberScoreText
                                  : styles.scoreText
                              }
                            >
                              {compositeMemberIds.has(answer.question_id)
                                ? "Included in group score"
                                : `Score: ${answer.score ?? 0}`}
                            </Text>
                          </View>
                        </View>,
                      );
                      questionIndex++;

                      // Now render sub-questions for this parent question
                      const subQuestions = groupedAnswers[answer.question_id];
                      if (subQuestions) {
                        // Sort sub-questions by admin-defined order
                        const sortedSubQuestions = subQuestions.sort(
                          (a: any, b: any) => {
                            const orderA =
                              a.question_order ?? Number.MAX_SAFE_INTEGER;
                            const orderB =
                              b.question_order ?? Number.MAX_SAFE_INTEGER;
                            if (orderA !== orderB) return orderA - orderB;
                            return (a.question_id || 0) - (b.question_id || 0);
                          },
                        );

                        sortedSubQuestions.forEach((subAnswer: any) => {
                          renderedQuestions.push(
                            <View
                              key={subAnswer.answer_id}
                              style={[
                                styles.questionBlock,
                                styles.subQuestionBlock,
                              ]}
                            >
                              <View style={styles.subQuestionIndicator}>
                                <Ionicons
                                  name="chevron-forward"
                                  size={16}
                                  color="#4db5ff"
                                />
                                <Text style={styles.subQuestionText}>
                                  Follow-up Question
                                </Text>
                              </View>

                              <Text style={styles.questionText}>
                                {subAnswer.question_text ||
                                  subAnswer.question_text_bm}
                              </Text>

                              {/* Display Sub-Question Answer */}
                              <View style={styles.answerContainer}>
                                <Text style={styles.answerLabel}>Answer:</Text>
                                {renderAnswerContent(subAnswer)}

                                <Text
                                  style={
                                    compositeMemberIds.has(subAnswer.question_id)
                                      ? styles.groupMemberScoreText
                                      : styles.scoreText
                                  }
                                >
                                  {compositeMemberIds.has(subAnswer.question_id)
                                    ? "Included in group score"
                                    : `Score: ${subAnswer.score ?? 0}`}
                                </Text>
                              </View>
                            </View>,
                          );
                        });
                      }
                    });
                  }

                  return renderedQuestions;
                })()
              ) : (
                <Text style={styles.noAnswersText}>
                  No answers found for this autism screening.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Child Selector Modal */}
      <Modal
        visible={showChildSelector}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowChildSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Child</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Please select which child you want to take the autism screening
                for:
              </Text>

              <View style={styles.childList}>
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={child.patientId}
                    style={styles.childItem}
                    onPress={async () => {
                      try {
                        setSelectedChild(child);
                        // Update user data with the selected child ID and ensure all children are stored
                        const storedData =
                          await AsyncStorage.getItem("userData");
                        if (storedData) {
                          const data = JSON.parse(storedData);
                          const updatedUserData = {
                            ...data,
                            selectedChildId: child.patientId,
                            // Ensure all children are stored in patientIds
                            patientIds: children.map((c: any) => ({
                              patient_id: c.patientId,
                              fullname: c.name,
                            })),
                          };
                          await AsyncStorage.setItem(
                            "userData",
                            JSON.stringify(updatedUserData),
                          );
                        }
                        setShowChildSelector(false);
                        // Refresh both current questionnaires and history with new child selection
                        // Small delay to ensure AsyncStorage is updated, then fetch sequentially
                        setTimeout(async () => {
                          try {
                            await fetchQuestionnaires("current");
                            await fetchQuestionnaires("history");
                          } catch (error) {
                            console.error("Error in sequential fetch:", error);
                          }
                        }, 200);
                      } catch (error) {
                        console.error("Error in child selection:", error);
                      }
                    }}
                  >
                    <Text style={styles.childName}>{child.name}</Text>
                    {child.age && (
                      <Text style={styles.childAge}>Age: {child.age}</Text>
                    )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "transparent" },
  topTabs: {
    flexDirection: "row",
    width: "100%",
    //marginTop: 16,
    //marginBottom: 16,
    backgroundColor: "#E1F5FF",
    //borderRadius: 8,
    overflow: "hidden",
    padding: 16,
  },
  topTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  topTabActive: {
    backgroundColor: "#24A8FF",
  },
  topTabText: {
    fontWeight: "600",
    color: "#000",
  },
  topTabTextActive: {
    color: "#fff",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 0,
    shadowColor: "#99DBFD",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: "#3399ff",
  },
  inactiveTab: {
    backgroundColor: "#b3e0ff",
  },
  tabText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inactiveTabText: {
    color: "#226699",
    fontWeight: "600",
  },
  totalQuestions: { fontSize: 14, color: "#333", marginTop: 4 },
  container: { padding: 16 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  desc: { fontSize: 14, color: "#555" },
  notesContainer: {
    backgroundColor: "#FFF7E6",
    padding: 12,
    margin: 16,
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
  important: {
    color: "#D32F2F",
    fontWeight: "bold",
  },
  retryText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#D32F2F",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4db5ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  scoreText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontWeight: "bold",
  },
  noDataText: {
    fontSize: 16,
    color: "#555",
  },
  historyInfo: {
    // flexDirection: 'row', // Removed as per new structure
    // justifyContent: 'space-between', // Removed as per new structure
    marginTop: 4,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 10,
  },
  interpretationText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontStyle: "italic",
  },
  recommendationText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
    fontWeight: "bold",
  },
  historyButtons: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  resultButton: {
    backgroundColor: "#4db5ff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  resultButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailedAnswersModal: {
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 12,
  },
  modalButtons: {
    gap: 12,
  },
  modalButtonPrimary: {
    backgroundColor: "#48B2E8",
    borderRadius: 12,
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
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonTextSecondary: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalInfo: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalInfoText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  detailedAnswersScroll: {
    maxHeight: "60%",
  },
  questionBlock: {
    backgroundColor: "#E1F5FF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4db5ff",
  },
  subQuestionBlock: {
    marginLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  subQuestionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  subQuestionText: {
    fontSize: 14,
    color: "#4db5ff",
    marginLeft: 5,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  questionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  answerContainer: {
    marginTop: 5,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  answerDisplay: {
    backgroundColor: "#e0f7fa",
    borderRadius: 5,
    padding: 10,
    marginBottom: 5,
  },
  answerText: {
    fontSize: 15,
    color: "#333",
  },
  answerTextBm: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  noAnswerText: {
    fontSize: 15,
    color: "#888",
  },
  noAnswersText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
  viewButton: {
    backgroundColor: "#4db5ff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  viewButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledCard: {
    backgroundColor: "#f5f5f5",
    opacity: 0.7,
  },
  disabledText: {
    color: "#999",
  },
  completedText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "bold",
    marginTop: 4,
  },
  ageWarningText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "600",
    marginTop: 4,
  },
  childSelectorContainer: {
    width: "93%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    marginLeft: 16,
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
    color: "#000",
    marginRight: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  childList: {
    marginTop: 10,
  },
  childItem: {
    backgroundColor: "#E1F5FF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  childName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  childAge: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  childIndicatorContainer: {
    backgroundColor: "#e6f2fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#4db5ff",
  },
  childIndicatorText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  childIndicatorName: {
    fontWeight: "bold",
    color: "#4db5ff",
  },
  downloadButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  compositeScoresSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  compositeScoresTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 8,
  },
  compositeGroupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eef2ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  compositeGroupText: {
    flex: 1,
    paddingRight: 12,
  },
  compositeGroupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#312e81",
  },
  compositeGroupMeta: {
    fontSize: 12,
    color: "#4338ca",
    marginTop: 2,
  },
  compositeGroupScore: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4338ca",
  },
  compositeScoresNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  groupMemberScoreText: {
    fontSize: 12,
    color: "#4338ca",
    fontStyle: "italic",
    marginTop: 4,
  },
  downloadButton: {
    backgroundColor: "#24A8FF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
