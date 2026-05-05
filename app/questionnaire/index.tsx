import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";

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

        // Use the new mobile API to get eligibility information
        if (userData.selectedChildId) {
          try {
            // Check eligibility for questionnaire ID 1 (MCHAT-R)
            const eligibilityResponse = await API(
              "apps/questionnaire/mobile",
              {
                questionnaireID: 1,
                patientID: userData.selectedChildId,
              },
              "GET",
              false,
            );

            if (
              eligibilityResponse.statusCode === 200 &&
              eligibilityResponse.data
            ) {
              const eligibility = (eligibilityResponse.data as any)
                .mchatr_eligibility;

              // First get the questionnaire list data
              const response = await API(
                "apps/questionnaire/listQuestionnaire",
                apiParams,
                "GET",
                false,
              );

              if (response.statusCode === 200 && response.data) {
                const data = response.data as any[];

                // Check if M-CHAT-R has been completed
                const questionnaireHistoryResponse = await API(
                  "apps/questionnaire/response",
                  { parentId: userData.parentId },
                  "GET",
                  false,
                );

                let isMchatrCompleted = false;
                if (
                  questionnaireHistoryResponse.statusCode === 200 &&
                  questionnaireHistoryResponse.data
                ) {
                  const historyData = questionnaireHistoryResponse.data as any[];
                  const patientResponses = historyData.filter((response: any) => {
                    const responsePatientId = Number(response.patient_id);
                    const selectedChildId = Number(userData.selectedChildId);
                    return responsePatientId === selectedChildId;
                  });
                  isMchatrCompleted = patientResponses.some(
                    (r: any) => r.questionnaire_id === 1,
                  );
                }

                // Mark questionnaires based on new eligibility logic
                const questionnairesWithStatus = data
                  .filter((q: any) => Number(q.questionnaire_id) !== 2) // Filter out questionnaire id = 2
                  .map((q: any) => {
                    const questionnaireId = Number(q.questionnaire_id);
                    let isDisabled = false;

                    if (questionnaireId === 1) {
                      // For MCHAT-R: only disable if explicitly disabled in backend
                      // If status is null/undefined, treat as "Enable" (default behavior)
                      isDisabled = eligibility?.mchatr_status === "Disable";
                    } else {
                      // Lock all other questionnaires until M-CHAT-R is completed
                      isDisabled = !isMchatrCompleted;
                    }

                    return {
                      ...q,
                      isDisabled,
                    };
                  })
                  .sort((a: any, b: any) => {
                    if (Number(a.questionnaire_id) === 1) return -1;
                    if (Number(b.questionnaire_id) === 1) return 1;
                    return 0;
                  });

                setQuestionnaires(questionnairesWithStatus);
                return; // Exit early since we handled the logic
              }
            }
          } catch (error) {
            console.error("Error fetching eligibility:", error);
            // Continue with fallback logic if eligibility API fails
          }
        }

        // Fallback to old logic if mobile API fails or no child selected
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

          // Check if M-CHAT-R (questionnaire ID = 1) has been completed
          const isMchatrCompleted = completedQuestionnaireIds.includes(1);

          // Mark questionnaires as disabled if they've been completed or if M-CHAT-R hasn't been completed
          // Filter out questionnaire id = 2 from the listing
          const questionnairesWithStatus = data
            .filter((q: any) => Number(q.questionnaire_id) !== 2) // Filter out questionnaire id = 2
            .map((q: any) => {
              const questionnaireId = Number(q.questionnaire_id);
              let isDisabled = false;

              if (questionnaireId === 1) {
                // Only disable questionnaire ID = 1 if it has been completed for the currently selected child
                isDisabled = completedQuestionnaireIds.includes(1);
              } else {
                // Lock all other questionnaires until M-CHAT-R is completed
                isDisabled = !isMchatrCompleted;
              }

              return {
                ...q,
                isDisabled,
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

  const getLogoBase64 = async () => {
    try {
      // Step 1: Get the asset module
      const logoAsset = require("../../assets/images/neurspatherapy_logo.png");
      console.log("Logo asset loaded:", logoAsset);

      // Step 2: Resolve asset source to get URI
      let logoUri: string | null = null;

      if (typeof logoAsset === "string") {
        // Already a string URI
        logoUri = logoAsset;
        console.log("Logo is string URI:", logoUri);
      } else if (typeof logoAsset === "number") {
        // Module ID - use Image.resolveAssetSource
        try {
          const assetSource = Image.resolveAssetSource(logoAsset);
          console.log("Asset source resolved:", assetSource);
          logoUri = assetSource?.uri || null;
          if (logoUri) {
            console.log("Logo URI from resolveAssetSource:", logoUri);
          }
        } catch (resolveError) {
          console.warn("Failed to resolve asset source:", resolveError);
        }
      } else if (logoAsset && typeof logoAsset === "object" && logoAsset.uri) {
        // Already has URI property
        logoUri = logoAsset.uri;
        console.log("Logo object has uri:", logoUri);
      }

      // Step 3: If we have a URI, try to fetch and convert to base64
      if (logoUri) {
        try {
          // If it's a file:// URI or regular path, read it
          if (logoUri.startsWith("file://") || !logoUri.startsWith("data:")) {
            console.log("Attempting to read logo from URI:", logoUri);
            const base64 = await FileSystem.readAsStringAsync(logoUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const dataUri = `data:image/png;base64,${base64}`;
            console.log("Logo converted to base64, length:", dataUri.length);
            return dataUri;
          } else {
            // Already a data URI or http(s), return as-is
            console.log("Logo URI is already usable");
            return logoUri;
          }
        } catch (readError) {
          console.warn("Failed to read logo from URI:", readError);
          // Return the URI anyway - it might still work in the PDF
          return logoUri;
        }
      }

      console.warn("Could not load logo from any source");
      return null;
    } catch (error) {
      console.warn("Unexpected error in getLogoBase64:", error);
      return null;
    }
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
      const mchatResponse = childResponses.find(
        (r: any) => r.questionnaire_id === 1,
      );
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

      // Helper: format date
      const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        try {
          return new Date(dateString).toLocaleDateString("en-MY", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
        } catch {
          return "N/A";
        }
      };

      // Helper: calculate age
      const calculateAge = (dob: string) => {
        if (!dob) return "N/A";
        try {
          const birthDate = new Date(dob);
          if (isNaN(birthDate.getTime())) return "N/A";
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
        } catch {
          return "N/A";
        }
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

      // Build HTML with conditional bold for interpretations
      const getMchatDetailedText = () => {
        const score =
          typeof mchatScore === "number" ? mchatScore : parseInt(mchatScore);
        let html = `<div class="domain-section"><h3>Autism Screening (M-CHAT-R) [Score: ${mchatScore} / 20]</h3>`;
        html += "<ul>";
        if (score <= 2) {
          html += `<li><span class="highlight">LOW RISK.</span> If child &lt;2 years old, repeat after 2 years old. No further action is required unless surveillance indicates likelihood for autism.</li>`;
        } else if (score >= 3 && score <= 7) {
          html += `<li><span class="highlight">MODERATE RISK.</span> Please arrange a face-to-face consultation to continue with the M-CHAT-R Follow-Up Interview.</li>`;
        } else if (score >= 8) {
          html += `<li><span class="highlight">HIGH RISK.</span> Proceed to diagnostic evaluation. Highly recommended for early intervention.</li>`;
        }
        html += "</ul></div>";
        return html;
      };

      const getBambiDetailedText = () => {
        if (bambiScore === "N/A")
          return '<div class="domain-section"><h3>Feeding (BAMBI) [Not assessed]</h3><p>Not assessed — no screening completed</p></div>';
        const score =
          typeof bambiScore === "number" ? bambiScore : parseInt(bambiScore);
        let html = `<div class="domain-section"><h3>Feeding (BAMBI) [Score: ${bambiScore}]</h3>`;
        html += "<ul>";
        if (score <= 34) {
          html += `<li><span class="highlight">Within typical limits.</span></li>`;
        } else {
          html += `<li><span class="highlight">Feeding concerns.</span></li>`;
        }
        html +=
          "<li>Recommendation: Refer if clinically indicated.</li></ul></div>";
        return html;
      };

      const getSleepDetailedText = () => {
        if (sleepScore === "N/A")
          return '<div class="domain-section"><h3>Sleep (CSHQ-SF) [Not assessed]</h3><p>Not assessed — no screening completed</p></div>';
        const score =
          typeof sleepScore === "number" ? sleepScore : parseInt(sleepScore);
        let html = `<div class="domain-section"><h3>Sleep (CSHQ-SF) [Score: ${sleepScore}]</h3>`;
        html += "<ul>";
        if (score >= 30) {
          html += `<li><span class="highlight">Risk for sleep problems.</span></li>`;
        } else {
          html += `<li><span class="highlight">Low risk.</span></li>`;
        }
        html +=
          "<li>Recommendation: Maintain sleep hygiene or assess.</li></ul></div>";
        return html;
      };

      const getScreenDetailedText = () => {
        if (screenScore === "N/A")
          return '<div class="domain-section"><h3>Screen Time (SEQ) [Not assessed]</h3><p>Not assessed — no screening completed</p></div>';
        const score =
          typeof screenScore === "number" ? screenScore : parseInt(screenScore);
        let html = `<div class="domain-section"><h3>Screen Time (SEQ) [Score: ${screenScore}]</h3>`;
        html += "<ul>";
        if (score >= 7) {
          html += `<li><span class="highlight">Excessive.</span></li>`;
        } else {
          html += `<li><span class="highlight">Acceptable.</span></li>`;
        }
        html +=
          "<li>Recommendation: Reduce or maintain healthy habits.</li></ul></div>";
        return html;
      };

      // Load logo
      let logoHTML = "";
      try {
        const logoUri = await getLogoBase64();
        console.log(
          "Logo URI loaded:",
          logoUri ? `${logoUri.substring(0, 50)}...` : "null",
        );
        if (logoUri) {
          logoHTML = `<img src="${logoUri}" alt="NeuroSpa Therapy Logo" class="header-logo" style="max-width: 180px; height: auto; margin-bottom: 15px;">`;
        }
      } catch (error) {
        console.warn("Logo loading error:", error);
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Integrated Developmental Screening Report</title>
          <style>
            @page { margin: 20px; size: A4; }
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.7; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #1565C0; padding-bottom: 16px; margin-bottom: 16px; }
            .header-logo { max-width: 140px; height: auto; margin-bottom: 8px; }
            .header-title { font-size: 22px; font-weight: bold; color: #1565C0; margin: 0; }
            .header-subtitle { font-size: 12.5px; color: #666; margin: 5px 0 0 0; }
            .report-meta { background: #f9f9f9; padding: 12px; border-radius: 3px; margin-bottom: 14px; font-size: 11px; color: #666; }
            .report-meta-item { display: inline-block; margin-right: 30px; }
            h1 { text-align: center; font-size: 16px; margin: 14px 0 16px 0; font-weight: 600; color: #000; }
            h3 { font-size: 13px; margin-top: 14px; margin-bottom: 8px; font-weight: 600; color: #1565C0; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; }
            .section { margin: 14px 0; }
            .section-title { font-weight: 600; color: #1565C0; margin-bottom: 10px; }
            .two-col { display: flex; justify-content: space-between; gap: 30px; }
            .two-col > div { flex: 1; }
            p { margin: 6px 0; }
            .label { font-weight: 600; display: inline; color: #333; }
            .value { text-decoration: underline; display: inline; min-width: 100px; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
            th, td { border: 1px solid #999; padding: 9px; text-align: left; }
            th { background: #1565C0; color: white; font-weight: 600; }
            tr:nth-child(even) { background: #f9f9f9; }
            .highlight { font-weight: 600; color: #d9534f; }
            .domain-section { margin: 10px 0; padding: 10px; background: #fafafa; border-left: 3px solid #1565C0; font-size: 12px; }
            .domain-section h4 { margin: 0 0 7px 0; font-size: 12px; color: #1565C0; }
            .domain-section ul { margin: 7px 0; padding-left: 24px; }
            .domain-section li { margin: 5px 0; font-size: 12px; }
            .domain-section p { margin: 6px 0; font-size: 12px; color: #666; }
            .notes-box { background: #fff3cd; border-left: 3px solid #ffc107; padding: 12px; margin: 14px 0; border-radius: 2px; font-size: 12px; }
            .notes-box h4 { margin-top: 0; margin-bottom: 7px; color: #856404; font-weight: 600; font-size: 12px; }
            .notes-box ul { margin: 7px 0; padding-left: 24px; }
            .notes-box li { margin: 5px 0; color: #856404; font-size: 11.5px; }
            .bottom-section { display: flex; justify-content: space-between; gap: 30px; margin-top: 16px; }
            .assessor-block { flex: 1; }
            .assessor-block h4 { font-size: 12px; font-weight: 600; margin-bottom: 10px; color: #1565C0; }
            .assessor-block p { margin: 7px 0; font-size: 11.5px; }
            .signature-line { border-bottom: 1px solid #000; display: inline-block; min-width: 120px; }
            .footer { text-align: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e0e0e0; font-size: 9.5px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHTML}
            <h2 class="header-title">Integrated Developmental Screening Report</h2>
            <p class="header-subtitle">Comprehensive Multi-Domain Assessment</p>
          </div>

          <div class="report-meta">
            <div class="report-meta-item"><strong>Report Generated:</strong> ${new Date().toLocaleDateString("en-MY", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
            <div class="report-meta-item"><strong>Report Type:</strong> Developmental Screening</div>
          </div>

          <div class="section">
            <h3>Child Information</h3>
            <div class="two-col">
              <div>
                <p><span class="label">Child's Name:</span> <span class="value">${childName}</span></p>
                <p><span class="label">Age at Screening:</span> <span class="value">${childAge}</span></p>
              </div>
              <div>
                <p><span class="label">Date of Birth:</span> <span class="value">${childDOB}</span></p>
                <p><span class="label">Gender:</span> <span class="value">${childGender}</span></p>
                <p><span class="label">Date of Screening:</span> <span class="value">${screeningDate}</span></p>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Parent / Caregiver Information</h3>
            <div class="two-col">
              <div>
                <p><span class="label">Name:</span> <span class="value">${parentName}</span></p>
              </div>
              <div>
                <p><span class="label">Relationship to Child:</span> <span class="value">${parentRelationship}</span></p>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>Summary Table</h3>
            <table>
              <tr>
                <th>Domain</th>
                <th>Score</th>
                <th>Interpretation</th>
              </tr>
              <tr>
                <td>Autism (M-CHAT-R)</td>
                <td>${mchatScore}/20</td>
                <td>${mchatInterpretation}</td>
              </tr>
              <tr>
                <td>Feeding (BAMBI)</td>
                <td>${bambiScore}</td>
                <td>${bambiInterpretation}</td>
              </tr>
              <tr>
                <td>Sleep (CSHQ-SF)</td>
                <td>${sleepScore}</td>
                <td>${sleepInterpretation}</td>
              </tr>
              <tr>
                <td>Screen Time (SEQ)</td>
                <td>${screenScore}</td>
                <td>${screenInterpretation}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h3>Detailed Scoring Breakdowns</h3>
            ${getMchatDetailedText()}
            ${getBambiDetailedText()}
            ${getSleepDetailedText()}
            ${getScreenDetailedText()}
          </div>

          <div class="notes-box">
            <h4>Important Notes</h4>
            <ul>
              <li>This screening is not a diagnosis</li>
              <li>Further clinical evaluation required</li>
              <li>Early intervention improves outcomes</li>
            </ul>
          </div>

          <div class="bottom-section">
            <div></div>
            <div class="assessor-block">
              <h4>Assessor's Information</h4>
              <p><span class="label">Name:</span> <span class="signature-line"></span></p>
              <p><span class="label">Designation:</span> <span class="signature-line"></span></p>
              <p><span class="label">Institution:</span> <span class="signature-line"></span></p>
              <p><span class="label">Signature:</span> <span class="signature-line"></span></p>
              <p><span class="label">Date:</span> <span class="signature-line"></span></p>
            </div>
          </div>

          <div class="footer">
            <p>This report is confidential and intended for the parent/guardian and authorized healthcare providers only.</p>
            <p>© NeuroSpa Therapy. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF and share
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Integrated Screening Report",
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Autism Screening</Text>
      </View>

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
                    if (Number(q.questionnaire_id) === 1) {
                      Alert.alert(
                        "Autism Screening Completed",
                        "This autism screening has already been completed for this patient.",
                        [{ text: "OK" }],
                      );
                    } else {
                      Alert.alert(
                        "Screening Locked",
                        "Please complete the Autism Screening (M-CHAT-R) first before accessing other screenings.",
                        [{ text: "OK" }],
                      );
                    }
                    return;
                  }
                  router.push(`/questionnaire/${q.questionnaire_id}` as any);
                } else {
                  // Show quick summary for completed questionnaire
                  const response = q;
                  Alert.alert(
                    "Autism Screening Summary",
                    `Autism Screening: ${response.questionnaire_title}\nPatient: ${response.patient_name}\nScore: ${response.total_score}\nCompleted: ${new Date(response.created_at).toLocaleDateString()}\n\nTap "View" to see detailed answers.`,
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
                      {Number(q.questionnaire_id) === 1
                        ? "✓ Already completed"
                        : "🔒 Complete M-CHAT-R first"}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.historyInfo}>
                  <View style={styles.historyRow}>
                    <Text style={styles.scoreText}>Score: {q.total_score}</Text>
                    <Text style={styles.dateText}>
                      {new Date(q.created_at).toLocaleDateString()}
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
                Score: {selectedResponse?.total_score}
              </Text>
              <Text style={styles.modalInfoText}>
                Completed:{" "}
                {selectedResponse?.created_at
                  ? new Date(selectedResponse.created_at).toLocaleDateString()
                  : ""}
              </Text>
            </View>

            <ScrollView style={styles.detailedAnswersScroll}>
              {selectedResponse?.answers &&
              selectedResponse.answers.length > 0 ? (
                (() => {
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
                    // Sort main questions by question_id to maintain proper order
                    const sortedMainQuestions = groupedAnswers["main"].sort(
                      (a: any, b: any) => {
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
                            {answer.option_title ? (
                              <View style={styles.answerDisplay}>
                                <Text style={styles.answerText}>
                                  {answer.option_title}
                                </Text>
                              </View>
                            ) : answer.text_answer ? (
                              <View style={styles.answerDisplay}>
                                <Text style={styles.answerText}>
                                  {answer.text_answer}
                                </Text>
                              </View>
                            ) : answer.numeric_answer ? (
                              <View style={styles.answerDisplay}>
                                <Text style={styles.answerText}>
                                  {answer.numeric_answer}
                                </Text>
                              </View>
                            ) : (
                              <Text style={styles.noAnswerText}>
                                No answer provided
                              </Text>
                            )}

                            <Text style={styles.scoreText}>
                              Score: {answer.score || 0}
                            </Text>
                          </View>
                        </View>,
                      );
                      questionIndex++;

                      // Now render sub-questions for this parent question
                      const subQuestions = groupedAnswers[answer.question_id];
                      if (subQuestions) {
                        // Sort sub-questions by question_id to maintain proper order
                        const sortedSubQuestions = subQuestions.sort(
                          (a: any, b: any) => {
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
                                {subAnswer.option_title ? (
                                  <View style={styles.answerDisplay}>
                                    <Text style={styles.answerText}>
                                      {subAnswer.option_title}
                                    </Text>
                                  </View>
                                ) : subAnswer.text_answer ? (
                                  <View style={styles.answerDisplay}>
                                    <Text style={styles.answerText}>
                                      {subAnswer.text_answer}
                                    </Text>
                                  </View>
                                ) : subAnswer.numeric_answer ? (
                                  <View style={styles.answerDisplay}>
                                    <Text style={styles.answerText}>
                                      {subAnswer.numeric_answer}
                                    </Text>
                                  </View>
                                ) : (
                                  <Text style={styles.noAnswerText}>
                                    No answer provided
                                  </Text>
                                )}

                                <Text style={styles.scoreText}>
                                  Score: {subAnswer.score || 0}
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
  mainContainer: { flex: 1, backgroundColor: "#E1F5FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#99DBFD",
    paddingTop: 70,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
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
