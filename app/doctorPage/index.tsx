import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeAppointmentPager from "@/components/HomeAppointmentPager";
import { useUpcomingAppointments } from "@/hooks/useUpcomingAppointments";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

const features = [
  {
    key: "appointment",
    label: "Appointment",
    icon: require("@/assets/images/calendar.png"),
    color: "#FBAB33",
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
  const [userName, setUserName] = useState("Doctor");
  const { appointments } = useUpcomingAppointments({ mode: "practitioner" });

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          const parsedData = JSON.parse(userData);
          setUserName(parsedData.username || "Doctor");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <LinearGradient
        colors={["#E1F5FF", "#F0FDFD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        <View style={styles.notificationSection}>
          <HomeAppointmentPager
            appointments={appointments}
            variant="practitioner"
            viewAllRoute="/appointment/practitionerAppointment"
          />
        </View>

        <View style={styles.gridSection}>
          <View style={styles.gridRow}>
            {features.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.featureBtn, { backgroundColor: f.color }]}
                onPress={
                  f.key === "appointment"
                    ? () =>
                        router.push(
                          "/appointment/practitionerAppointment" as any,
                        )
                    : f.key === "progress"
                      ? () =>
                          router.push("/diaryReport/practitionerReport" as any)
                      : undefined
                }
                activeOpacity={0.8}
              >
                <View style={styles.featureIconBg}>
                  <Image
                    source={f.icon}
                    style={[styles.featureIcon, { tintColor: f.color }]}
                  />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#E1F5FF",
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
  notificationSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
  },
});
