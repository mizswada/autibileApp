import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../api";
import { MchatImportanceNoteModal } from "../../components/MchatImportanceNoteModal";

export default function QuestionnaireForm() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [textAnswers, setTextAnswers] = useState<{
    [questionId: string]: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [result, setResult] = useState<{
    score: number;
    interpretation: string;
    recommendation: string;
    aiAnalysis: { result: string; explanation: string } | null;
  }>({
    score: 0,
    interpretation: "",
    recommendation: "",
    aiAnalysis: null,
  });
  const [showMchatImportanceNote, setShowMchatImportanceNote] = useState(true);

  useEffect(() => {
    setShowMchatImportanceNote(id === "1");
  }, [id]);

  useEffect(() => {
    // Initialize child selection when component mounts
    initializeChildSelection();
  }, [id]);

  const initializeChildSelection = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem("userData");

      if (storedData) {
        const data = JSON.parse(storedData);

        // Use the selectedChildId that was set from the parents page
        if (data.selectedChildId) {
          // Create a simple selectedChild object from stored data
          const selectedChildData = {
            patientId: data.selectedChildId,
            name:
              data.patientIds?.find(
                (c: any) => c.patient_id === data.selectedChildId,
              )?.fullname || "Selected Child",
            age: null,
          };

          setSelectedChild(selectedChildData);
          setChildren(
            data.patientIds?.map((c: any) => ({
              patientId: c.patient_id,
              name: c.fullname,
              age: null,
            })) || [],
          );
        } else {
          // No selected child, show selector
          setShowChildSelector(true);
        }
      }
    } catch (error) {
      console.error("Error in initializeChildSelection:", error);
      setError("Failed to initialize questionnaire");
    } finally {
      setLoading(false);
    }
  };

  // Handle child selection from modal
  useEffect(() => {
    if (selectedChild) {
      // Fetch questionnaire data when child is selected
      const fetchQuestionnaireData = async () => {
        try {
          setLoadingQuestionnaire(true);

          const response = await API(
            "apps/questionnaire/mobile",
            {
              questionnaireID: id,
              patientID: selectedChild.patientId,
            },
            "GET",
            false,
          );

          if (response.statusCode === 200 && response.data) {
            const questionnaireData = response.data as any;

            // Check MCHAT-R eligibility from the API response
            if (questionnaireData.mchatr_eligibility) {
              const eligibility = questionnaireData.mchatr_eligibility;

              if (id === "1") {
                // For M-CHAT-R questionnaire - only block if explicitly disabled

                // Check multiple possible values for disabled status
                const isDisabled =
                  eligibility.mchatr_status === "Disable" ||
                  eligibility.mchatr_status === "disable" ||
                  eligibility.mchatr_status === "DISABLE" ||
                  eligibility.mchatr_status === false ||
                  eligibility.mchatr_status === 0;

                if (isDisabled) {
                  Alert.alert(
                    "Access Denied",
                    "M-CHAT-R screening is currently disabled for this child.",
                    [
                      {
                        text: "OK",
                        onPress: () => router.back(),
                      },
                    ],
                  );
                  return;
                }
              } else if (id === "2") {
                // For follow-up questionnaire
                if (!eligibility.can_take_questionnaire_2) {
                  Alert.alert(
                    "Access Denied",
                    "You must complete the M-CHAT-R screening first and receive a score between 3-7 to access the follow-up questionnaire.",
                    [
                      {
                        text: "OK",
                        onPress: () => router.back(),
                      },
                    ],
                  );
                  return;
                }
              }
            }

            setQuestionnaire(questionnaireData);
          } else {
            setError(response.message || "Questionnaire not found");
          }
        } catch (error) {
          console.error("Error:", error);
          setError("Failed to fetch questionnaire");
        } finally {
          setLoadingQuestionnaire(false);
        }
      };

      fetchQuestionnaireData();
    }
  }, [selectedChild, id]);

  // Handle questionnaire data loading and fetch questions
  useEffect(() => {
    if (questionnaire && selectedChild) {
      fetchMainQuestions();
    }
  }, [questionnaire, selectedChild]);

  const fetchMainQuestions = async () => {
    try {
      // The questions are already loaded from the main API call
      // Just process them for display
      if (questionnaire && questionnaire.questions) {
        const processedQuestions = questionnaire.questions.map(
          (question: any) => {
            // Check if question has conditional logic
            const hasConditionalLogic =
              question.conditional_logic &&
              question.conditional_logic.length > 0;

            return {
              ...question,
              has_conditional_logic: hasConditionalLogic,
              sub_questions: [], // Hide sub-questions initially - they will show when options are selected
              conditional_logic: question.conditional_logic || [], // Already populated by the API
            };
          },
        );

        setQuestions(processedQuestions);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process questionnaire questions");
    }
  };

  // New simplified function that handles conditional logic from the mobile API
  const handleConditionalLogic = (
    parentQuestionId: number,
    selectedOptionValue: any,
  ) => {
    try {
      // Find the current question
      const currentQuestion = questions.find(
        (q) => q.question_id === parentQuestionId,
      );
      if (!currentQuestion) {
        return;
      }

      // Find the selected option in conditional_logic
      const conditionalLogic = currentQuestion.conditional_logic?.find(
        (logic: any) =>
          logic.option_id === selectedOptionValue ||
          logic.option_value === selectedOptionValue,
      );

      if (conditionalLogic && conditionalLogic.conditional_sub_questions) {
        // Update the question with conditional sub-questions
        setQuestions((prev) => {
          const updatedQuestions = prev.map((q) => {
            if (q.question_id === parentQuestionId) {
              return {
                ...q,
                sub_questions: conditionalLogic.conditional_sub_questions,
              };
            }
            return q;
          });
          return updatedQuestions;
        });
      } else {
        // Clear any existing sub-questions for this question
        setQuestions((prev) => {
          const updatedQuestions = prev.map((q) => {
            if (q.question_id === parentQuestionId) {
              return {
                ...q,
                sub_questions: [],
              };
            }
            return q;
          });
          return updatedQuestions;
        });
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const handleOptionSelect = async (questionId: string, optionId: any) => {
    // Find the question to determine if it's radio or checkbox
    // First check main questions, then check sub-questions
    let question = questions.find(
      (q) => q.question_id === parseInt(questionId),
    );
    let questionType = "radio";

    if (question) {
      // This is a main question
      questionType = getQuestionType(question);
    } else {
      // This might be a sub-question, search through all sub-questions
      for (const mainQ of questions) {
        if (mainQ.sub_questions && mainQ.sub_questions.length > 0) {
          const subQ = mainQ.sub_questions.find(
            (sq: any) => sq.question_id === parseInt(questionId),
          );
          if (subQ) {
            question = subQ;
            questionType = getQuestionType(subQ);
            break;
          }
        }
      }
    }

    if (questionType === "checkbox") {
      // For checkbox, toggle the option in an array
      setAnswers((prev) => {
        const currentAnswers = prev[questionId] || [];
        const newAnswers = currentAnswers.includes(optionId)
          ? currentAnswers.filter((id: any) => id !== optionId) // Remove if already selected
          : [...currentAnswers, optionId]; // Add if not selected

        // If this is a main question and we're removing an option, clear sub-questions
        if (isMainQuestion && currentAnswers.includes(optionId)) {
          setQuestions((prev) => {
            const updatedQuestions = prev.map((q) => {
              if (q.question_id === parseInt(questionId)) {
                return {
                  ...q,
                  sub_questions: [],
                };
              }
              return q;
            });
            return updatedQuestions;
          });
        }

        return { ...prev, [questionId]: newAnswers };
      });
    } else {
      // For radio, replace the answer
      setAnswers((prev) => {
        return { ...prev, [questionId]: optionId };
      });
    }

    // Only fetch conditional sub-questions for main questions (not sub-questions themselves)
    // Check if this is a main question by looking for it in the main questions array
    const isMainQuestion = questions.some(
      (q) => q.question_id === parseInt(questionId),
    );

    if (isMainQuestion) {
      // Always clear existing sub-questions first when a new option is selected
      setQuestions((prev) => {
        const updatedQuestions = prev.map((q) => {
          if (q.question_id === parseInt(questionId)) {
            return {
              ...q,
              sub_questions: [],
            };
          }
          return q;
        });
        return updatedQuestions;
      });

      // Handle conditional logic from the mobile API
      try {
        handleConditionalLogic(parseInt(questionId), optionId);
      } catch (error) {
        // Continue without sub-questions - this is not a critical error
      }
    }
  };

  const handleTextInput = (questionId: string, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getQuestionType = (question: any) => {
    // Check if question has options to determine type
    if (question.options && question.options.length > 0) {
      const firstOption = question.options[0];
      if (
        firstOption.option_title &&
        firstOption.option_title.startsWith("[text]")
      ) {
        return "text";
      } else if (
        firstOption.option_title &&
        firstOption.option_title.startsWith("[textarea]")
      ) {
        return "textarea";
      } else if (
        firstOption.option_title &&
        firstOption.option_title.startsWith("[checkbox]")
      ) {
        return "checkbox";
      } else if (
        firstOption.option_title &&
        firstOption.option_title.startsWith("[scale]")
      ) {
        return "scale";
      }
    }

    // If no options, check if it's a text question based on question properties
    if (question.answer_type === 33 || question.question_type === "text") {
      return "text";
    }

    return "radio"; // Default to radio
  };

  // Helper function to check if a question has conditional logic (using mobile API structure)
  const hasConditionalLogic = (question: any) => {
    const hasLogic =
      question.conditional_logic && question.conditional_logic.length > 0;
    return hasLogic;
  };

  const cleanOptionTitle = (optionTitle: string) => {
    if (!optionTitle) return "";
    return optionTitle
      .replace(/^\[(radio|checkbox|scale|text|textarea)\]/, "")
      .trim();
  };

  const calculateScore = (answers: { [questionId: string]: any }) => {
    // Calculate score based on 'yes' answers or positive responses
    const yesCount = Object.values(answers).filter(
      (a) => a === "yes" || a === 1,
    ).length;
    const totalQuestions = Object.keys(answers).length;

    if (totalQuestions === 0) return 0;

    return Math.round((yesCount / totalQuestions) * 100);
  };

  const getInterpretation = (score: number) => {
    if (score < 30) {
      return "Low risk";
    } else if (score < 70) {
      return "Moderate risk";
    } else {
      return "High risk";
    }
  };

  const getRecommendation = (score: number) => {
    if (score < 30) {
      return "Continue regular observation and screening.";
    } else if (score < 70) {
      return "Consider discussing with a pediatrician for further assessment.";
    } else {
      return "Strongly recommended to consult a specialist as soon as possible.";
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered (including sub-questions)
    const allQuestions: any[] = [];

    // Add main questions
    questions.forEach((q: any) => {
      allQuestions.push(q);
      // Add sub-questions if they exist
      if (q.sub_questions && q.sub_questions.length > 0) {
        q.sub_questions.forEach((subQ: any) => {
          allQuestions.push(subQ);
        });
      }
    });

    const unansweredQuestions = allQuestions.filter((q: any) => {
      const questionType = getQuestionType(q);
      if (questionType === "text" || questionType === "textarea") {
        return !textAnswers[q.question_id];
      } else {
        return !answers[q.question_id];
      }
    });

    if (unansweredQuestions.length > 0) {
      Alert.alert(
        "Incomplete",
        "Please answer all questions before submitting.",
      );
      return;
    }

    try {
      setSubmitting(true);

      // Format answers for the API (including sub-questions)
      const formattedAnswers: any[] = [];

      // Process main questions
      questions.forEach((q: any) => {
        const questionType = getQuestionType(q);

        if (questionType === "text" || questionType === "textarea") {
          formattedAnswers.push({
            question_id: q.question_id,
            parent_question_id: null, // Main question has no parent
            text_answer: textAnswers[q.question_id] || "",
          });
        } else if (questionType === "scale") {
          formattedAnswers.push({
            question_id: q.question_id,
            parent_question_id: null, // Main question has no parent
            numeric_answer: answers[q.question_id] || 0,
          });
        } else {
          // radio/checkbox - find the selected option to get option_value
          const selectedOptionId = answers[q.question_id];

          if (questionType === "checkbox" && Array.isArray(selectedOptionId)) {
            // Handle multiple checkbox selections
            selectedOptionId.forEach((optionId: any) => {
              const selectedOption = q.options?.find(
                (opt: any) => opt.option_id === optionId,
              );
              formattedAnswers.push({
                question_id: q.question_id,
                parent_question_id: null, // Main question has no parent
                option_id: optionId,
                option_value: selectedOption?.option_value || 0,
              });
            });
          } else {
            // Handle single radio selection
            const selectedOption = q.options?.find(
              (opt: any) => opt.option_id === selectedOptionId,
            );
            formattedAnswers.push({
              question_id: q.question_id,
              parent_question_id: null, // Main question has no parent
              option_id: selectedOptionId || null,
              option_value: selectedOption?.option_value || 0,
            });
          }
        }

        // Process sub-questions
        if (q.sub_questions && q.sub_questions.length > 0) {
          q.sub_questions.forEach((subQ: any) => {
            const subQuestionType = getQuestionType(subQ);

            if (subQuestionType === "text" || subQuestionType === "textarea") {
              formattedAnswers.push({
                question_id: subQ.question_id,
                parent_question_id: q.question_id, // Link to parent question
                text_answer: textAnswers[subQ.question_id] || "",
              });
            } else if (subQuestionType === "scale") {
              formattedAnswers.push({
                question_id: subQ.question_id,
                parent_question_id: q.question_id, // Link to parent question
                numeric_answer: answers[subQ.question_id] || 0,
              });
            } else {
              // radio/checkbox - find the selected option to get option_value
              const selectedOptionId = answers[subQ.question_id];

              if (
                subQuestionType === "checkbox" &&
                Array.isArray(selectedOptionId)
              ) {
                // Handle multiple checkbox selections for sub-questions
                selectedOptionId.forEach((optionId: any) => {
                  const selectedOption = subQ.options?.find(
                    (opt: any) => opt.option_id === optionId,
                  );
                  formattedAnswers.push({
                    question_id: subQ.question_id,
                    parent_question_id: q.question_id, // Link to parent question
                    option_id: optionId,
                    option_value: selectedOption?.option_value || 0,
                  });
                });
              } else {
                // Handle single radio selection for sub-questions
                const selectedOption = subQ.options?.find(
                  (opt: any) => opt.option_id === selectedOptionId,
                );
                formattedAnswers.push({
                  question_id: subQ.question_id,
                  parent_question_id: q.question_id, // Link to parent question
                  option_id: selectedOptionId || null,
                  option_value: selectedOption?.option_value || 0,
                });
              }
            }
          });
        }
      });

      // Submit response to backend with timeout and retry logic
      let response: any = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // Use the API function instead of hardcoded fetch
          // Server may run AI (OpenRouter etc.) after saving answers — allow up to 90s
          console.log("=== SUBMITTING QUESTIONNAIRE ===");
          console.log("Questionnaire ID:", id);
          console.log("Patient ID:", selectedChild?.patientId);
          console.log("Formatted Answers:", JSON.stringify(formattedAnswers, null, 2));

          const apiResponse = await API(
            "apps/questionnaire/submit",
            {
              questionnaireId: id,
              patientId: selectedChild ? selectedChild.patientId : null,
              answers: formattedAnswers,
            },
            "POST",
            false,
            null,
            90000,
          );

          console.log("=== API RESPONSE RECEIVED ===");
          console.log("Status Code:", apiResponse.statusCode);
          console.log("Raw Response:", JSON.stringify(apiResponse, null, 2));

          if (apiResponse.statusCode === 200) {
            response = apiResponse;
            break; // Success, exit retry loop
          } else {
            throw new Error(
              apiResponse.message || "Failed to submit questionnaire",
            );
          }
        } catch (error: any) {
          retryCount++;

          if (error.message && error.message.includes("timeout")) {
            if (retryCount >= maxRetries) {
              throw new Error(
                "Request timed out after multiple attempts. Please check your connection and try again.",
              );
            }
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else if (retryCount >= maxRetries) {
            throw error;
          } else {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }

      if (response && response.statusCode === 200) {
        const resultData = response.data as any;
        const score = resultData?.total_score || 0;

        // Debug: Log the full response
        console.log("=== SUBMISSION RESPONSE ===");
        console.log("Full Response:", JSON.stringify(resultData, null, 2));
        console.log("Score:", score);
        console.log("Threshold:", resultData?.threshold);
        console.log("AI Analysis:", resultData?.ai_analysis);
        console.log("=========================");

        setResult({
          score: score,
          interpretation:
            resultData?.threshold?.interpretation || "No prediction available",
          recommendation:
            resultData?.threshold?.recommendation ||
            "No recommendation available",
          aiAnalysis: resultData?.ai_analysis ?? null,
        });

        // Check if this is questionnaire ID = 1 and score is between 3-7
        // Use eligibility info from API if available
        const eligibility = questionnaire?.mchatr_eligibility;
        const canTakeFollowUp =
          eligibility?.is_eligible_for_questionnaire_2 ||
          (id === "1" && score >= 3 && score <= 7);

        if (id === "1" && canTakeFollowUp) {
          // Show result with option to go to follow-up questionnaire
          setShowResult(true);
        } else {
          // Normal behavior - show result and let user close manually
          setShowResult(true);
        }
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to submit questionnaire",
        );
      }
    } catch (error: any) {
      let errorMessage = "Failed to submit questionnaire";
      if (error.message) {
        if (error.message.includes("timed out")) {
          errorMessage =
            "Request timed out. Please check your connection and try again.";
        } else if (error.message.includes("HTTP")) {
          errorMessage = `Server error: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Submission Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text style={styles.loadingText}>Initializing questionnaire...</Text>
      </View>
    );
  }

  if (loadingQuestionnaire) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text style={styles.loadingText}>Loading questionnaire data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoadingQuestionnaire(true);
            // Retry by refreshing the page
            router.replace(`/questionnaire/${id}`);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!questionnaire) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4db5ff" />
        <Text style={styles.loadingText}>Preparing questionnaire...</Text>
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
        <Text style={styles.headerTitle}>{questionnaire.title}</Text>

        {id === "1" && questionnaire?.mchatr_eligibility && (
          <View style={styles.statusIndicator}>
            {(() => {
              const status = questionnaire.mchatr_eligibility.mchatr_status;
              const isEnabled = status === "Enable" || status === null;

              return (
                <Text
                  style={[
                    styles.statusText,
                    { color: isEnabled ? "#4CAF50" : "#F44336" },
                  ]}
                >
                  {isEnabled ? "✓ Enabled" : "✗ Disabled"}
                </Text>
              );
            })()}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {questionnaire.header && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Instructions:</Text>
            <Text style={styles.notesText}>
              <Text style={styles.important}>{questionnaire.header}</Text>
            </Text>
          </View>
        )}

        {questions && questions.length ? (
          questions.map((q: any, idx: number) => {
            const questionType = getQuestionType(q);

            return (
              <View key={q.question_id}>
                {/* Main Question */}
                <View style={styles.questionBlock}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>
                      Question {idx + 1}
                    </Text>
                  </View>
                  <Text style={styles.questionText}>
                    {q.question_text_bi}
                  </Text>
                  {q.question_text_bm && (
                    <Text style={styles.questionTextBm}>
                      {q.question_text_bm}
                    </Text>
                  )}

                  {/* Radio/Checkbox Options */}
                  {(questionType === "radio" ||
                    questionType === "checkbox") && (
                    <View style={styles.optionContainer}>
                      {q.options && q.options.length > 0 ? (
                        <View style={styles.optionsRow}>
                          {q.options.map((option: any, optionIndex: number) => (
                            <TouchableOpacity
                              key={`${q.question_id}-${option.option_id || optionIndex}`}
                              style={[
                                styles.optionButton,
                                (questionType === "checkbox"
                                  ? Array.isArray(answers[q.question_id])
                                    ? answers[q.question_id].includes(
                                        option.option_id,
                                      )
                                    : false
                                  : answers[q.question_id] ===
                                    option.option_id) && styles.optionSelected,
                              ]}
                              onPress={() =>
                                handleOptionSelect(
                                  q.question_id,
                                  option.option_id,
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.optionText,
                                  (questionType === "checkbox"
                                    ? Array.isArray(answers[q.question_id])
                                      ? answers[q.question_id].includes(
                                          option.option_id,
                                        )
                                      : false
                                    : answers[q.question_id] ===
                                      option.option_id) &&
                                    styles.optionSelectedText,
                                ]}
                              >
                                {cleanOptionTitle(option.option_title)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noOptionsText}>
                          No options available for this question
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Range/Scale Options */}
                  {questionType === "scale" && (
                    <View style={styles.rangeContainer}>
                      <View style={styles.rangeOptions}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <TouchableOpacity
                            key={value}
                            style={[
                              styles.rangeButton,
                              answers[q.question_id] === value &&
                                styles.rangeButtonSelected,
                            ]}
                            onPress={() =>
                              handleOptionSelect(q.question_id, value)
                            }
                          >
                            <Text
                              style={[
                                styles.rangeButtonText,
                                answers[q.question_id] === value &&
                                  styles.rangeButtonTextSelected,
                              ]}
                            >
                              {value}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.rangeLabels}>
                        <Text style={styles.rangeLabel}>Strongly Disagree</Text>
                        <Text style={styles.rangeLabel}>Strongly Agree</Text>
                      </View>
                    </View>
                  )}

                  {/* Text Input */}
                  {questionType === "text" && (
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={styles.textInput}
                        value={textAnswers[q.question_id] || ""}
                        onChangeText={(text) =>
                          handleTextInput(q.question_id, text)
                        }
                        placeholder="Enter your answer here"
                        multiline={false}
                      />
                    </View>
                  )}

                  {/* Textarea */}
                  {questionType === "textarea" && (
                    <View style={styles.textInputContainer}>
                      <TextInput
                        style={[styles.textInput, styles.textArea]}
                        value={textAnswers[q.question_id] || ""}
                        onChangeText={(text) =>
                          handleTextInput(q.question_id, text)
                        }
                        placeholder="Enter your answer here"
                        multiline={true}
                        numberOfLines={4}
                      />
                    </View>
                  )}
                </View>

                {/* Conditional Sub-Questions */}
                {q.sub_questions && q.sub_questions.length > 0 && (
                  <View style={styles.subQuestionsContainer}>
                    {q.sub_questions.map((subQ: any, subIdx: number) => {
                      const subQuestionType = getQuestionType(subQ);

                      return (
                        <View
                          key={subQ.question_id}
                          style={styles.subQuestionBlock}
                        >
                          <View style={styles.subQuestionIndicator}>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color="#4db5ff"
                            />
                            <Text style={styles.subQuestionText}>
                              Follow-up Question {subIdx + 1}
                            </Text>
                          </View>

                          <Text style={styles.questionText}>
                            {subQ.question_text_bi}
                          </Text>
                          {subQ.question_text_bm && (
                            <Text style={styles.questionTextBm}>
                              {subQ.question_text_bm}
                            </Text>
                          )}

                          {/* Sub-question options */}
                          {(subQuestionType === "radio" ||
                            subQuestionType === "checkbox") && (
                            <View style={styles.optionContainer}>
                              {subQ.options && subQ.options.length > 0 ? (
                                <View style={styles.optionsRow}>
                                  {subQ.options.map(
                                    (option: any, optionIndex: number) => (
                                      <TouchableOpacity
                                        key={`${subQ.question_id}-${option.option_id || optionIndex}`}
                                        style={[
                                          styles.optionButton,
                                          (subQuestionType === "checkbox"
                                            ? Array.isArray(
                                                answers[subQ.question_id],
                                              )
                                              ? answers[
                                                  subQ.question_id
                                                ].includes(option.option_id)
                                              : false
                                            : answers[subQ.question_id] ===
                                              option.option_id) &&
                                            styles.optionSelected,
                                        ]}
                                        onPress={() =>
                                          handleOptionSelect(
                                            subQ.question_id,
                                            option.option_id,
                                          )
                                        }
                                        activeOpacity={0.7}
                                      >
                                        <Text
                                          style={[
                                            styles.optionText,
                                            (subQuestionType === "checkbox"
                                              ? Array.isArray(
                                                  answers[subQ.question_id],
                                                )
                                                ? answers[
                                                    subQ.question_id
                                                  ].includes(option.option_id)
                                                : false
                                              : answers[subQ.question_id] ===
                                                option.option_id) &&
                                              styles.optionSelectedText,
                                          ]}
                                        >
                                          {cleanOptionTitle(
                                            option.option_title,
                                          )}
                                        </Text>
                                      </TouchableOpacity>
                                    ),
                                  )}
                                </View>
                              ) : (
                                <Text style={styles.noOptionsText}>
                                  No options available
                                </Text>
                              )}
                            </View>
                          )}

                          {/* Sub-question text input */}
                          {subQuestionType === "text" && (
                            <View style={styles.textInputContainer}>
                              <TextInput
                                style={styles.textInput}
                                value={textAnswers[subQ.question_id] || ""}
                                onChangeText={(text) =>
                                  handleTextInput(subQ.question_id, text)
                                }
                                placeholder="Enter your answer here"
                                multiline={false}
                              />
                            </View>
                          )}

                          {/* Sub-question textarea */}
                          {subQuestionType === "textarea" && (
                            <View style={styles.textInputContainer}>
                              <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={textAnswers[subQ.question_id] || ""}
                                onChangeText={(text) =>
                                  handleTextInput(subQ.question_id, text)
                                }
                                placeholder="Enter your answer here"
                                multiline={true}
                                numberOfLines={4}
                              />
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                {/* Show expected conditional sub-questions indicator */}
                {hasConditionalLogic(q) && !q.sub_questions && (
                  <View style={styles.expectedSubQuestionsContainer}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.expectedSubQuestionsText}>
                      {answers[q.question_id]
                        ? "No follow-up questions for this answer"
                        : "This question may have follow-up questions based on your answer"}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={styles.noQuestions}>
            No questions for this questionnaire.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Answers</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showResult}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultModalContent}>
            {/* Header with icon and title */}
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.resultModalTitle}>Screening Complete!</Text>
              <Text style={styles.resultSubtitle}>Here are your results</Text>
            </View>

            <ScrollView style={styles.resultScrollContainer}>
              {/* Show MCHAT-R status if available */}
              {id === "1" && questionnaire.mchatr_eligibility && (
                <View style={styles.statusBoxResult}>
                  <Text style={styles.statusLabel}>MCHAT-R Status:</Text>
                  {(() => {
                    const status =
                      questionnaire.mchatr_eligibility.mchatr_status;
                    const isEnabled = status === "Enable" || status === null;

                    return (
                      <Text
                        style={[
                          styles.statusValueLarge,
                          { color: isEnabled ? "#4CAF50" : "#F44336" },
                        ]}
                      >
                        {isEnabled ? "✓ Enabled" : "✗ Disabled"}
                      </Text>
                    );
                  })()}
                </View>
              )}

              {/* Score Box */}
              <View style={styles.scoreBoxContainer}>
                <Text style={styles.scoreLabel}>Your Score</Text>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreValue}>{result.score}</Text>
                </View>
              </View>

              {/* Prediction Box */}
              <View style={styles.predictionBoxContainer}>
                <View style={styles.predictionHeader}>
                  <Ionicons name="bulb" size={24} color="#FFA500" />
                  <Text style={styles.predictionLabel}>Prediction</Text>
                </View>
                <View style={styles.predictionBox}>
                  {/* Threshold Interpretation (from scoring rules) */}
                  {result.interpretation && result.interpretation !== "No prediction available" && (
                    <>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#333",
                          fontWeight: "600",
                          marginBottom: 8,
                        }}
                      >
                        Based on Score ({result.score}):
                      </Text>
                      <Text style={styles.predictionText}>
                        {result.interpretation}
                      </Text>
                    </>
                  )}

                  {/* AI Response */}
                  {result.aiAnalysis ? (
                    <>
                      <View
                        style={{
                          height: 1,
                          backgroundColor: "#ddd",
                          marginVertical: 12,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#666",
                          fontWeight: "600",
                          marginBottom: 8,
                        }}
                      >
                        AI Analysis:
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#999",
                          lineHeight: 16,
                        }}
                      >
                        {result.aiAnalysis.explanation}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>

              {/* Recommendation Box */}
              <View style={styles.recommendationBoxContainer}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Text style={styles.recommendationLabel}>
                    Recommendation
                  </Text>
                </View>
                <View style={styles.recommendationBox}>
                  {/* Threshold Recommendation (from scoring rules) */}
                  {result.recommendation && result.recommendation !== "No recommendation available" && (
                    <>
                      <Text style={styles.recommendationText}>
                        {result.recommendation}
                      </Text>
                    </>
                  )}

                  {/* AI Recommendation (from AI response result field) */}
                  {result.aiAnalysis && result.aiAnalysis.result && (
                    <>
                      {result.recommendation && result.recommendation !== "No recommendation available" && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: "#ddd",
                            marginVertical: 12,
                          }}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#666",
                          fontWeight: "600",
                          marginBottom: 8,
                        }}
                      >
                        AI Recommendation:
                      </Text>
                      <Text style={styles.recommendationText}>
                        {result.aiAnalysis.result}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* Show message for intermediate score (3-7) */}
              {(() => {
                const eligibility = questionnaire?.mchatr_eligibility;
                const canTakeFollowUp =
                  eligibility?.is_eligible_for_questionnaire_2 ||
                  (id === "1" && result.score >= 3 && result.score <= 7);

                if (id === "1" && canTakeFollowUp) {
                  return (
                    <View style={styles.nextStepsBox}>
                      <View style={styles.nextStepsHeader}>
                        <Ionicons
                          name="arrow-forward"
                          size={24}
                          color="#0B8FAC"
                        />
                        <Text style={styles.nextStepsLabel}>Next Steps</Text>
                      </View>
                      <Text style={styles.nextStepsText}>
                        Based on your score, the patient needs to take the next
                        level questionnaire (MCHATRF).{"\n\n"}
                        Please contact our administrator for the next process.
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.resultModalButton}
              onPress={() => {
                setShowResult(false);
                // Pass a refresh flag to parent if M-CHAT-R was completed
                if (id === "1") {
                  // Store a flag in AsyncStorage to signal parent to refresh
                  AsyncStorage.setItem("refreshQuestionnaires", "true").then(() => {
                    router.back();
                  });
                } else {
                  router.back();
                }
              }}
            >
              <Text style={styles.resultModalButtonText}>Done</Text>
            </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Select Child</Text>
            <Text style={styles.modalSubtitle}>
              Please select which child this questionnaire is for:
            </Text>

            <ScrollView style={styles.childList}>
              {children.map((child, index) => (
                <TouchableOpacity
                  key={child.patientId}
                  style={styles.childItem}
                  onPress={async () => {
                    // Check eligibility using the new mobile API
                    try {
                      const eligibilityResponse = await API(
                        "apps/questionnaire/mobile",
                        {
                          questionnaireID: id,
                          patientID: child.patientId,
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

                        if (id === "1") {
                          // For M-CHAT-R questionnaire
                          if (!eligibility.can_take_mchatr) {
                            Alert.alert(
                              "Access Denied",
                              "M-CHAT-R screening is currently disabled for this child.",
                              [{ text: "OK" }],
                            );
                            setShowChildSelector(false);
                            return;
                          }

                          // If status is Enable, allow access regardless of completion
                          // Only block if explicitly disabled
                          if (eligibility.mchatr_status === "Disable") {
                            Alert.alert(
                              "Access Denied",
                              "M-CHAT-R screening is currently disabled for this child.",
                              [{ text: "OK" }],
                            );
                            setShowChildSelector(false);
                            return;
                          }
                        } else if (id === "2") {
                          // For follow-up questionnaire
                          if (!eligibility.can_take_questionnaire_2) {
                            Alert.alert(
                              "Access Denied",
                              "You must complete the M-CHAT-R screening first and receive a score between 3-7 to access the follow-up questionnaire.",
                              [{ text: "OK" }],
                            );
                            setShowChildSelector(false);
                            return;
                          }
                        }
                      }
                    } catch (error) {
                      // If error, continue with child selection
                    }

                    setSelectedChild(child);
                    // Update user data with the selected child ID and ensure all children are stored
                    const storedData = await AsyncStorage.getItem("userData");
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
                  }}
                >
                  <Text style={styles.childName}>{child.name}</Text>
                  {child.age && (
                    <Text style={styles.childAge}>Age: {child.age}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <MchatImportanceNoteModal
        visible={
          id === "1" &&
          showMchatImportanceNote &&
          !showChildSelector &&
          !!questionnaire &&
          !loadingQuestionnaire
        }
        onContinue={() => setShowMchatImportanceNote(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#E1F5FF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
    paddingTop: 70, // For status bar spacing
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  container: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  questionBlock: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subQuestionsContainer: {
    marginLeft: 20,
  },
  subQuestionBlock: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4db5ff",
  },
  subQuestionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  subQuestionText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#4db5ff",
    fontWeight: "bold",
  },
  questionNumber: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  questionText: { fontSize: 14, color: "#333", marginBottom: 4 },
  questionTextBm: { fontSize: 12, color: "#666", marginTop: 4 },
  requiredStar: { color: "red", fontSize: 16 },
  optionsContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#D32F2F",
    marginBottom: 10,
  },

  noQuestions: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    paddingVertical: 20,
  },
  noOptionsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  rangeContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  rangeOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  rangeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  rangeButtonSelected: {
    borderColor: "#4db5ff",
    backgroundColor: "#4db5ff",
  },
  rangeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  rangeButtonTextSelected: {
    color: "#fff",
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  rangeLabel: {
    fontSize: 12,
    color: "#666",
  },
  textInputContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  button: {
    backgroundColor: "#4db5ff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.7,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  progressContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#333",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4db5ff",
    borderRadius: 4,
  },
  questionsContainer: {
    // No specific styles needed here, questions will be handled by map
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  modalButton: {
    marginTop: 16,
    backgroundColor: "#4db5ff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  resultContainer: {
    width: "100%",
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: "#333",
    textAlign: "left",
  },
  modalScore: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D32F2F", // red highlight for score
  },
  notesContainer: {
    backgroundColor: "#FFF7E6",
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500", // orange note highlight
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
    color: "#D32F2F", // red
    fontWeight: "bold",
  },
  optionContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    marginBottom: 8,
    marginHorizontal: 4,
    minWidth: 80,
  },
  optionSelected: {
    borderColor: "#4db5ff",
    backgroundColor: "#4db5ff20",
  },
  optionSelectedText: {
    fontWeight: "bold",
    color: "#4db5ff",
  },
  optionText: {
    fontSize: 14,
    color: "#333",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  childList: {
    width: "100%",
    maxHeight: 200, // Limit height for scrolling
  },
  childItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  childName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  childAge: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  autoRedirectText: {
    fontSize: 14,
    color: "#4db5ff",
    textAlign: "center",
    marginBottom: 12,
    fontStyle: "italic",
  },
  intermediateScoreText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
    padding: 12,
    backgroundColor: "#E1F5FF",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  conditionalLogicIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f7fa",
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  conditionalLogicText: {
    fontSize: 12,
    color: "#00796b",
    marginLeft: 5,
  },
  retrySubQuestionsContainer: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 10,
  },
  retrySubQuestionsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  expectedSubQuestionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E1F5FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  expectedSubQuestionsText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  statusIndicator: {
    marginLeft: "auto",
    backgroundColor: "#E1F5FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  retryButton: {
    backgroundColor: "#4db5ff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  /* Enhanced Result Modal Styles */
  resultModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: "95%",
    maxHeight: "85%",
    alignItems: "center",
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    width: "100%",
  },
  resultModalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0B8FAC",
    marginTop: 12,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
  },
  resultScrollContainer: {
    width: "100%",
    marginBottom: 16,
  },
  scoreBoxContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  scoreBox: {
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4db5ff",
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  predictionBoxContainer: {
    marginBottom: 20,
  },
  predictionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  predictionBox: {
    backgroundColor: "#FFF8E1",
    borderLeftWidth: 4,
    borderLeftColor: "#FFA500",
    padding: 14,
    borderRadius: 8,
  },
  predictionText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  recommendationBoxContainer: {
    marginBottom: 20,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  recommendationLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  recommendationBox: {
    backgroundColor: "#F0F4FF",
    borderLeftWidth: 4,
    borderLeftColor: "#4db5ff",
    padding: 14,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  nextStepsBox: {
    backgroundColor: "#E0F2F1",
    borderLeftWidth: 4,
    borderLeftColor: "#0B8FAC",
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  nextStepsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  nextStepsLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B8FAC",
    marginLeft: 8,
  },
  nextStepsText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  statusBoxResult: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  statusValueLarge: {
    fontSize: 18,
    fontWeight: "bold",
  },
  resultModalButton: {
    backgroundColor: "#4db5ff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  resultModalButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
