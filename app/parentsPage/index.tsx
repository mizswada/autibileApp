import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import API from "../../api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_HORIZONTAL_PADDING = 24;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2;

interface Appointment {
  id: number;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    patient_id: number;
    patient_name: string;
    [key: string]: any;
  };
}

const notifications = [
  {
    message: "You have a visit on June 15th at 10 AM. We will see you soon!",
  },
];

const features = [
  {
    key: "mchat",
    label: "Screening",
    icon: require("@/assets/images/passFail.png"),
    color: "#20B2AA",
  },
  {
    key: "appointment",
    label: "Appointment",
    icon: require("@/assets/images/calendar.png"),
    color: "#FBAB33",
  },
  {
    key: "therapy",
    label: "Therapy Plan",
    icon: require("@/assets/images/medicalBag.png"),
    color: "#F16742",
  },
  {
    key: "progress",
    label: "Diary Report",
    icon: require("@/assets/images/report.png"),
    color: "#1C8ADB",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [showNoChildrenModal, setShowNoChildrenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChildSelectorModal, setShowChildSelectorModal] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [activeAppointmentIndex, setActiveAppointmentIndex] = useState(0);
  const [userName, setUserName] = useState("Parent");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUserName(parsedData.username || "Parent");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  const fetchAppointments = async () => {
    try {
      if (children.length === 0) {
        setAllAppointments([]);
        return;
      }

      let fetchedAppointments: Appointment[] = [];

      // Fetch appointments for each child
      for (const child of children) {
        try {
          const response = await API(
            "apps/appointment/childAppointment",
            {
              patient_id: child.childID,
            },
            "GET",
            false,
          );

          if (response && response.data && Array.isArray(response.data)) {
            fetchedAppointments = [...fetchedAppointments, ...response.data];
          } else if (Array.isArray(response)) {
            fetchedAppointments = [...fetchedAppointments, ...response];
          }
        } catch (error) {
          console.error(
            `Error fetching appointments for child ${child.childID}:`,
            error,
          );
        }
      }

      // Filter only upcoming appointments (future dates)
      const now = new Date();
      const upcomingAppointments = fetchedAppointments
        .filter((appt: any) => new Date(appt.start) > now)
        .sort(
          (a: any, b: any) =>
            new Date(a.start).getTime() - new Date(b.start).getTime(),
        );

      setAllAppointments(upcomingAppointments);
      setActiveAppointmentIndex(0);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const checkForChildren = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) {
        const data = JSON.parse(storedData);
        const parentId =
          data.parentId || data.parent_id || data.userID || data.id;

        if (parentId) {
          try {
            // Try the same API endpoint as questionnaire index
            const response = await API(
              "apps/parents/displayDetails",
              {
                parentID: parentId,
              },
              "GET",
              false,
            );

            let childrenData: any[] = [];
            if (response && response.statusCode === 200 && response.data) {
              const parents = response.data as any[];
              const currentParent = parents[0];

              if (
                currentParent &&
                currentParent.children &&
                currentParent.children.length > 0
              ) {
                childrenData = currentParent.children;
              }
            }

            // Set children state
            setChildren(childrenData);

            // Update stored user data with fresh children data
            if (childrenData.length > 0) {
              const validChildren = childrenData.filter(
                (c: any) => c && c.childID,
              );
              const updatedUserData = {
                ...data,
                patientIds: validChildren.map((c: any) => ({
                  patient_id: c.childID,
                  fullname: c.fullname,
                })),
              };

              // Only update selectedChildId if the current one is no longer valid
              if (data.selectedChildId) {
                const childStillExists = validChildren.some(
                  (c: any) => c.childID === data.selectedChildId,
                );
                if (!childStillExists) {
                  // Selected child was deleted, clear the selection
                  updatedUserData.selectedChildId = null;
                  setSelectedChild(null);
                } else {
                  // Keep the current selection
                  updatedUserData.selectedChildId = data.selectedChildId;
                  const currentSelectedChild = validChildren.find(
                    (c: any) => c.childID === data.selectedChildId,
                  );
                  setSelectedChild(currentSelectedChild);
                }
              } else if (validChildren.length === 1) {
                // Auto-select if only one child and no current selection
                updatedUserData.selectedChildId = validChildren[0].childID;
                setSelectedChild(validChildren[0]);
              }

              // Update stored data
              await AsyncStorage.setItem(
                "userData",
                JSON.stringify(updatedUserData),
              );
            } else {
              // No children, clear stored data
              const updatedUserData = {
                ...data,
                selectedChildId: null,
                patientIds: [],
              };
              await AsyncStorage.setItem(
                "userData",
                JSON.stringify(updatedUserData),
              );
              setSelectedChild(null);
            }

            // Check if there are any children
            if (!childrenData || childrenData.length === 0) {
              // If no children found, show the modal
              setShowNoChildrenModal(true);
            } else if (childrenData.length === 1) {
              // If only one child, select it automatically
              setSelectedChild(childrenData[0]);
            }
          } catch (error) {
            console.error("Error checking for children:", error);
            // If API fails, still show modal to be safe
            setShowNoChildrenModal(true);
          }
        }
      }
    } catch (error) {
      console.error("Error in checkForChildren:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMchatrPress = async () => {
    // Wait for children to load
    if (loading) {
      return;
    }

    // Ensure we have fresh children data
    if (children.length === 0) {
      await checkForChildren();
      return;
    }

    if (children.length > 1) {
      setShowChildSelectorModal(true);
    } else if (children.length === 1) {
      // If only one child, select it automatically and navigate
      const child = children[0];

      // Verify the child data is valid
      if (!child || !child.childID) {
        // Refresh children data and try again
        await checkForChildren();
        return;
      }

      await updateSelectedChild(child);
      router.push(`/questionnaire/${1}` as any);
    } else {
      // No children, show the no children modal
      setShowNoChildrenModal(true);
    }
  };

  const updateSelectedChild = async (child: any) => {
    // Validate child data
    if (!child || !child.childID) {
      return;
    }

    setSelectedChild(child);

    // Update user data with the selected child ID
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) {
        const data = JSON.parse(storedData);

        // Ensure we have valid children data
        const validChildren = children.filter((c: any) => c && c.childID);

        const updatedUserData = {
          ...data,
          selectedChildId: child.childID,
          patientIds: validChildren.map((c: any) => ({
            patient_id: c.childID,
            fullname: c.fullname,
          })),
        };

        await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      }
    } catch (error) {
      console.error("Error updating selected child:", error);
    }
  };

  useEffect(() => {
    checkForChildren();
  }, []);

  useEffect(() => {
    if (children.length > 0) {
      fetchAppointments();
    }
  }, [children]);

  // Refresh children data when user returns to this page
  useFocusEffect(
    useCallback(() => {
      checkForChildren();
    }, []),
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <LinearGradient
        colors={["#E1F5FF", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logoBox}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Autibile</Text>
              <Text style={styles.headerSubtitle}>
                Good morning, {userName}!
              </Text>
            </View>
          </View>
        </View>

        {/* Notification Card Carousel */}
        <View style={styles.notificationSection}>
          {allAppointments.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={{ alignItems: "flex-start" }}
                onScroll={(event) => {
                  const scrollPosition = event.nativeEvent.contentOffset.x;
                  const index = Math.round(scrollPosition / CARD_WIDTH);
                  setActiveAppointmentIndex(
                    Math.max(0, Math.min(index, allAppointments.length - 1)),
                  );
                }}
                scrollEventThrottle={16}
              >
                {allAppointments.map((appointment) => {
                  const name = appointment.extendedProps?.patient_name;
                  const date = new Date(appointment.start).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  );
                  const time = new Date(appointment.start).toLocaleTimeString(
                    "en-US",
                    { hour: "2-digit", minute: "2-digit", hour12: true },
                  );
                  const dateTime = `${date} at ${time}`;

                  return (
                    <View
                      key={appointment.id}
                      style={[styles.notificationCard, styles.carouselCard]}
                    >
                      <View
                        style={[
                          styles.notificationIcon,
                          { backgroundColor: "#FBAB33" },
                        ]}
                      >
                        <Image
                          source={require("@/assets/images/calendar.png")}
                          style={styles.calendarIcon}
                        />
                      </View>

                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationLabel}>UPDATE</Text>
                        <Text style={styles.notificationTitle}>
                          Upcoming Appointment
                        </Text>
                        <Text style={styles.notificationMessage}>
                          {name ? (
                            <>
                              <Text style={styles.highlightText}>{name}</Text>
                              {" has a visit on "}
                              <Text style={styles.highlightText}>
                                {dateTime}
                              </Text>
                              {". We will see you soon!"}
                            </>
                          ) : (
                            <>
                              {"You have a visit on "}
                              <Text style={styles.highlightText}>
                                {dateTime}
                              </Text>
                              {". We will see you soon!"}
                            </>
                          )}
                        </Text>
                      </View>

                      <View style={styles.paginationDots}>
                        {allAppointments.map((_, index) => {
                          const distance = Math.abs(
                            index - activeAppointmentIndex,
                          );
                          let size = 6;
                          let opacity = 0.5;
                          if (distance === 0) {
                            size = 10;
                            opacity = 1;
                          } else if (distance === 1) {
                            size = 8;
                            opacity = 0.8;
                          } else if (distance === 2) {
                            size = 7;
                            opacity = 0.6;
                          }
                          return (
                            <View
                              key={index}
                              style={[
                                styles.dotActive,
                                { width: size, height: size, opacity },
                              ]}
                            />
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <View style={styles.notificationCard}>
              <View
                style={[
                  styles.notificationIcon,
                  { backgroundColor: "#FBAB33" },
                ]}
              >
                <Image
                  source={require("@/assets/images/calendar.png")}
                  style={styles.calendarIcon}
                />
              </View>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationLabel}>UPDATE</Text>
                <Text style={styles.notificationTitle}>
                  No Appointments Scheduled
                </Text>
                <Text style={styles.notificationMessage}>
                  No appointments scheduled. Book one to get started!
                </Text>
              </View>

              <View style={styles.paginationDots}>
                <View style={styles.dotInactive} />
              </View>
            </View>
          )}
        </View>

        {/* Features Grid */}
        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            {features.slice(0, 2).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.featureBtn,
                  { backgroundColor: f.color },
                  f.key === "mchat" &&
                    children.length === 0 &&
                    styles.disabledFeatureBtn,
                ]}
                onPress={
                  f.key === "appointment"
                    ? () =>
                        router.push("/appointment/parentsAppointment" as any)
                    : f.key === "mchat"
                      ? () => router.push("/questionnaire" as any)
                      : f.key === "therapy"
                        ? () => router.push("/therapy/TherapyPlanList" as any)
                        : f.key === "progress"
                          ? () =>
                              router.push("/diaryReport/parentsReport" as any)
                          : undefined
                }
                disabled={false}
                activeOpacity={0.8}
              >
                <View style={styles.featureIconBg}>
                  <Image
                    source={f.icon}
                    style={[
                      styles.featureIcon,
                      { tintColor: f.color },
                      f.key === "mchat" &&
                        children.length === 0 &&
                        styles.disabledFeatureIcon,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.featureLabel,
                    f.key === "mchat" &&
                      children.length === 0 &&
                      styles.disabledFeatureLabel,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.gridRow}>
            {features.slice(2, 4).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.featureBtn,
                  { backgroundColor: f.color },
                  f.key === "mchat" &&
                    children.length === 0 &&
                    styles.disabledFeatureBtn,
                ]}
                onPress={
                  f.key === "appointment"
                    ? () =>
                        router.push("/appointment/parentsAppointment" as any)
                    : f.key === "mchat"
                      ? () => router.push("/questionnaire" as any)
                      : f.key === "therapy"
                        ? () => router.push("/therapy/TherapyPlanList" as any)
                        : f.key === "progress"
                          ? () =>
                              router.push("/diaryReport/parentsReport" as any)
                          : undefined
                }
                disabled={false}
                activeOpacity={0.8}
              >
                <View style={styles.featureIconBg}>
                  <Image
                    source={f.icon}
                    style={[
                      styles.featureIcon,
                      { tintColor: f.color },
                      f.key === "mchat" &&
                        children.length === 0 &&
                        styles.disabledFeatureIcon,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.featureLabel,
                    f.key === "mchat" &&
                      children.length === 0 &&
                      styles.disabledFeatureLabel,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* No Children Modal */}
      <Modal
        visible={showNoChildrenModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoChildrenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Welcome to Autible!</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                We noticed you don't have any children registered in your
                profile yet. To get the most out of Autible, please add your
                child's information.
              </Text>

              <Text style={styles.modalSubMessage}>
                This will help us provide personalized services and track your
                child's progress.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowNoChildrenModal(false);
                  router.push("/profilePage/childProfile");
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  Add Child Information
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowNoChildrenModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Child Selector Modal */}
      <Modal
        visible={showChildSelectorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChildSelectorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Child</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Please select which child you want to take the M-CHAT-R
                screening for:
              </Text>

              <View style={styles.childList}>
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={child.childID}
                    style={styles.childItem}
                    onPress={async () => {
                      await updateSelectedChild(child);
                      setShowChildSelectorModal(false);
                      // Small delay to ensure AsyncStorage is fully updated before navigation
                      setTimeout(() => {
                        router.push(`/questionnaire/${1}` as any);
                      }, 100);
                    }}
                  >
                    <Text style={styles.childName}>{child.fullname}</Text>
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
                onPress={() => setShowChildSelectorModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F0FDFD",
  } as ViewStyle,
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  } as ViewStyle,
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    gap: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4db5ff",
    marginTop: 4,
  },
  profileBox: {
    width: 80,
    height: 80,
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInner: {
    width: 60,
    height: 60,
    backgroundColor: "#F0FDFD",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  profileIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    tintColor: "#4db5ff",
  },
  notificationSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 16,
    alignItems: "flex-start",
    alignSelf: "stretch",
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  carouselCard: {
    width: CARD_WIDTH,
    flexShrink: 0,
  },
  notificationIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
    marginTop: 4,
  },
  calendarIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    tintColor: "#fff",
  },
  notificationContent: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FBAB33",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 6,
  },
  notificationMessage: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    lineHeight: 20,
    flexShrink: 1,
  },
  highlightText: {
    color: "#4db5ff",
    fontWeight: "700",
  },
  paginationDots: {
    flexDirection: "column",
    gap: 6,
    justifyContent: "center",
    alignSelf: "center",
    marginLeft: 8,
  },
  dotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4db5ff",
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
  },
  gridSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  featureBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 36,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  featureIconBg: {
    width: 70,
    height: 70,
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  disabledFeatureBtn: {
    backgroundColor: "#f5f5f5",
    opacity: 0.6,
    borderColor: "#f5f5f5",
  },
  disabledFeatureIcon: {
    tintColor: "#ccc",
  },
  disabledFeatureLabel: {
    color: "#999",
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
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A2A2A",
    textAlign: "center",
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
  modalSubMessage: {
    fontSize: 14,
    color: "#777",
    lineHeight: 20,
    textAlign: "center",
  },
  modalButtons: {
    gap: 12,
  },
  modalButtonPrimary: {
    backgroundColor: "#4db5ff",
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
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonTextSecondary: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  childList: {
    marginTop: 10,
  },
  childItem: {
    backgroundColor: "#f0f0f0",
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
});
