import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import API from "../api";
import type { HomeAppointment } from "../components/HomeAppointmentPager";

const CANCELLED_APPOINTMENT_STATUS = 37;
const EMPTY_CHILDREN: { childID: number }[] = [];

function filterUpcomingAppointments(
  appointments: HomeAppointment[],
): HomeAppointment[] {
  const now = new Date();
  return appointments
    .filter((appt) => {
      const isFuture = new Date(appt.start) > now;
      const isCancelled =
        appt.extendedProps?.status === CANCELLED_APPOINTMENT_STATUS;
      return isFuture && !isCancelled;
    })
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
}

async function fetchParentAppointments(
  children: { childID: number }[],
): Promise<HomeAppointment[]> {
  if (children.length === 0) {
    return [];
  }

  let fetchedAppointments: HomeAppointment[] = [];

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

  return filterUpcomingAppointments(fetchedAppointments);
}

async function fetchPractitionerAppointments(): Promise<HomeAppointment[]> {
  const storedData = await AsyncStorage.getItem("userData");
  if (!storedData) {
    return [];
  }

  const data = JSON.parse(storedData);
  const practitionerId =
    data.practitionerId || data.practitioner_id || data.userID || data.id;

  if (!practitionerId) {
    console.error("No practitioner ID found in user data");
    return [];
  }

  const response = await API(
    "apps/appointment/childAppointment",
    {
      practitioner_id: practitionerId,
    },
    "GET",
    false,
  );

  let allAppointments: HomeAppointment[] = [];

  if (response && response.data) {
    allAppointments = response.data;
  } else if (Array.isArray(response)) {
    allAppointments = response;
  }

  return filterUpcomingAppointments(allAppointments);
}

type UseUpcomingAppointmentsOptions =
  | { mode: "parent"; children: { childID: number }[] }
  | { mode: "practitioner" };

export function useUpcomingAppointments(
  options: UseUpcomingAppointmentsOptions,
) {
  const mode = options.mode;
  const children =
    mode === "parent" ? options.children : EMPTY_CHILDREN;
  const childIds = children.map((child) => child.childID).join(",");
  const [appointments, setAppointments] = useState<HomeAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const result =
        mode === "parent"
          ? await fetchParentAppointments(children)
          : await fetchPractitionerAppointments();
      setAppointments(result);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [mode, childIds, children]);

  useEffect(() => {
    if (mode === "parent" && children.length === 0) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    fetchAppointments();
  }, [fetchAppointments, mode, childIds, children.length]);

  useFocusEffect(
    useCallback(() => {
      if (mode === "practitioner") {
        fetchAppointments();
      }
    }, [fetchAppointments, mode]),
  );

  return { appointments, loading, refresh: fetchAppointments };
}
