import { formatDateString } from "@/utils/formatLocalDate";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const APPOINTMENT_CARD_HEIGHT = 140;
const MAX_HOME_APPOINTMENTS = 10;
const MAX_DOT_INDICATORS = 5;

export interface HomeAppointment {
  id: number;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    patient_id: number;
    patient_name: string;
    [key: string]: unknown;
  };
}

interface HomeAppointmentPagerProps {
  appointments: HomeAppointment[];
  viewAllRoute: string;
  variant: "parent" | "practitioner";
  emptyStateMessage?: string;
}

export default function HomeAppointmentPager({
  appointments,
  viewAllRoute,
  variant,
  emptyStateMessage = "No appointments scheduled. Book one to get started!",
}: HomeAppointmentPagerProps) {
  const router = useRouter();
  const appointmentPagerRef = useRef<ScrollView>(null);
  const [activeAppointmentIndex, setActiveAppointmentIndex] = useState(0);

  const totalAppointmentCount = appointments.length;
  const visibleAppointments = useMemo(
    () => appointments.slice(0, MAX_HOME_APPOINTMENTS),
    [appointments],
  );
  const hasMoreAppointments = totalAppointmentCount > MAX_HOME_APPOINTMENTS;
  const useDotIndicator = visibleAppointments.length <= MAX_DOT_INDICATORS;

  useEffect(() => {
    setActiveAppointmentIndex(0);
    appointmentPagerRef.current?.scrollTo({ y: 0, animated: false });
  }, [appointments]);

  const scrollToAppointment = (index: number) => {
    const nextIndex = Math.max(
      0,
      Math.min(index, visibleAppointments.length - 1),
    );
    appointmentPagerRef.current?.scrollTo({
      y: nextIndex * APPOINTMENT_CARD_HEIGHT,
      animated: true,
    });
    setActiveAppointmentIndex(nextIndex);
  };

  const renderAppointmentCard = (
    appointment: HomeAppointment,
    inPager = false,
  ) => {
    const name = appointment.extendedProps?.patient_name;
    const date = formatDateString(appointment.start);
    const time = new Date(appointment.start).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const dateTime = `${date} at ${time}`;

    const message =
      variant === "practitioner" ? (
        name ? (
          <>
            {"You have a visit with "}
            <Text style={styles.highlightText}>{name}</Text>
            {" on "}
            <Text style={styles.highlightText}>{dateTime}</Text>
            {"."}
          </>
        ) : (
          <>
            {"You have a visit on "}
            <Text style={styles.highlightText}>{dateTime}</Text>
            {"."}
          </>
        )
      ) : name ? (
        <>
          <Text style={styles.highlightText}>{name}</Text>
          {" has a visit on "}
          <Text style={styles.highlightText}>{dateTime}</Text>
          {". We will see you soon!"}
        </>
      ) : (
        <>
          {"You have a visit on "}
          <Text style={styles.highlightText}>{dateTime}</Text>
          {". We will see you soon!"}
        </>
      );

    return (
      <View
        style={[
          styles.notificationCard,
          inPager && styles.notificationCardInPager,
        ]}
      >
        <View
          style={[styles.notificationIcon, { backgroundColor: "#FBAB33" }]}
        >
          <Image
            source={require("@/assets/images/calendar.png")}
            style={styles.calendarIcon}
          />
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationLabel}>UPDATE</Text>
          <Text style={styles.notificationTitle}>Upcoming Appointment</Text>
          <Text style={styles.notificationMessage}>{message}</Text>
        </View>
      </View>
    );
  };

  const renderPagerIndicator = () => {
    if (visibleAppointments.length <= 1) {
      return null;
    }

    if (useDotIndicator) {
      return (
        <View style={styles.paginationDots}>
          {visibleAppointments.map((_, index) => {
            const isActive = index === activeAppointmentIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: isActive ? 10 : 6,
                    height: isActive ? 10 : 6,
                    opacity: isActive ? 1 : 0.5,
                    backgroundColor: isActive ? "#4db5ff" : "#E5E7EB",
                  },
                ]}
              />
            );
          })}
        </View>
      );
    }

    return (
      <View style={styles.paginationNumeric}>
        <TouchableOpacity
          style={[
            styles.pagerNavButton,
            activeAppointmentIndex === 0 && styles.pagerNavButtonDisabled,
          ]}
          onPress={() => scrollToAppointment(activeAppointmentIndex - 1)}
          disabled={activeAppointmentIndex === 0}
          accessibilityLabel="Previous appointment"
        >
          <Ionicons name="chevron-up" size={16} color="#4db5ff" />
        </TouchableOpacity>

        <View style={styles.paginationNumericText}>
          <Text style={styles.paginationCurrent}>
            {activeAppointmentIndex + 1}
          </Text>
          <View style={styles.paginationDivider} />
          <Text style={styles.paginationTotal}>
            {hasMoreAppointments
              ? `${totalAppointmentCount}+`
              : totalAppointmentCount}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                height: `${((activeAppointmentIndex + 1) / visibleAppointments.length) * 100}%`,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.pagerNavButton,
            activeAppointmentIndex >= visibleAppointments.length - 1 &&
              styles.pagerNavButtonDisabled,
          ]}
          onPress={() => scrollToAppointment(activeAppointmentIndex + 1)}
          disabled={activeAppointmentIndex >= visibleAppointments.length - 1}
          accessibilityLabel="Next appointment"
        >
          <Ionicons name="chevron-down" size={16} color="#4db5ff" />
        </TouchableOpacity>
      </View>
    );
  };

  if (appointments.length === 0) {
    return (
      <View style={styles.notificationCard}>
        <View
          style={[styles.notificationIcon, { backgroundColor: "#FBAB33" }]}
        >
          <Image
            source={require("@/assets/images/calendar.png")}
            style={styles.calendarIcon}
          />
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationLabel}>UPDATE</Text>
          <Text style={styles.notificationTitle}>No Appointments Scheduled</Text>
          <Text style={styles.notificationMessage}>{emptyStateMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.appointmentPager}>
      {visibleAppointments.length === 1 ? (
        renderAppointmentCard(visibleAppointments[0])
      ) : (
        <>
          <View style={styles.appointmentPagerShell}>
            <ScrollView
              ref={appointmentPagerRef}
              pagingEnabled
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={APPOINTMENT_CARD_HEIGHT}
              style={styles.appointmentPagerScroll}
              contentContainerStyle={styles.appointmentPagerContent}
              onScroll={(event) => {
                const scrollPosition = event.nativeEvent.contentOffset.y;
                const index = Math.round(
                  scrollPosition / APPOINTMENT_CARD_HEIGHT,
                );
                setActiveAppointmentIndex(
                  Math.max(
                    0,
                    Math.min(index, visibleAppointments.length - 1),
                  ),
                );
              }}
              scrollEventThrottle={16}
            >
              {visibleAppointments.map((appointment) => (
                <View
                  key={appointment.id}
                  style={styles.appointmentPagerPage}
                >
                  {renderAppointmentCard(appointment, true)}
                </View>
              ))}
            </ScrollView>

            {renderPagerIndicator()}
          </View>

          {hasMoreAppointments && (
            <TouchableOpacity
              style={styles.viewAllAppointmentsButton}
              onPress={() => router.push(viewAllRoute as any)}
            >
              <Text style={styles.viewAllAppointmentsText}>
                View all {totalAppointmentCount} appointments
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#4db5ff" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appointmentPager: {
    width: "100%",
  },
  appointmentPagerShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 32,
    shadowColor: "#4db5ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  appointmentPagerScroll: {
    flex: 1,
    height: APPOINTMENT_CARD_HEIGHT,
  },
  appointmentPagerContent: {
    flexGrow: 1,
  },
  appointmentPagerPage: {
    height: APPOINTMENT_CARD_HEIGHT,
    justifyContent: "center",
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
  notificationCardInPager: {
    borderRadius: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    margin: 0,
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
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  paginationNumeric: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 8,
  },
  paginationNumericText: {
    alignItems: "center",
  },
  paginationCurrent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4db5ff",
    lineHeight: 20,
  },
  paginationDivider: {
    width: 18,
    height: 1,
    backgroundColor: "#CBD5E1",
    marginVertical: 2,
  },
  paginationTotal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    lineHeight: 16,
  },
  progressTrack: {
    width: 4,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  progressFill: {
    width: "100%",
    backgroundColor: "#4db5ff",
    borderRadius: 999,
  },
  pagerNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E1F5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  pagerNavButtonDisabled: {
    opacity: 0.35,
  },
  viewAllAppointmentsButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  viewAllAppointmentsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4db5ff",
  },
  dot: {
    borderRadius: 999,
  },
});
