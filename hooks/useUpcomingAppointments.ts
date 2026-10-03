import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import API from "../api";
import type { HomeAppointment } from "../components/HomeAppointmentPager";
import { syncAppointmentNotifications } from "../utils/appointmentNotifications";

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

interface FetchResult {
  appointments: HomeAppointment[];
  /** False when any request failed, so the list may be missing appointments. */
  complete: boolean;
}

async function fetchParentAppointments(
  children: { childID: number }[],
): Promise<FetchResult> {
  if (children.length === 0) {
    return { appointments: [], complete: false };
  }

  let fetchedAppointments: HomeAppointment[] = [];
  let complete = true;

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
      } else {
        complete = false;
      }
    } catch (error) {
      complete = false;
      console.error(
        `Error fetching appointments for child ${child.childID}:`,
        error,
      );
    }
  }

  return {
    appointments: filterUpcomingAppointments(fetchedAppointments),
    complete,
  };
}

async function fetchPractitionerAppointments(): Promise<FetchResult> {
  const storedData = await AsyncStorage.getItem("userData");
  if (!storedData) {
    return { appointments: [], complete: false };
  }

  const data = JSON.parse(storedData);
  const practitionerId =
    data.practitionerId || data.practitioner_id || data.userID || data.id;

  if (!practitionerId) {
    console.error("No practitioner ID found in user data");
    return { appointments: [], complete: false };
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
  let complete = true;

  if (response && Array.isArray(response.data)) {
    allAppointments = response.data;
  } else if (Array.isArray(response)) {
    allAppointments = response;
  } else {
    complete = false;
  }

  return {
    appointments: filterUpcomingAppointments(allAppointments),
    complete,
  };
}

/** Identifies the logged-in account, or null when nobody is logged in. */
async function getSessionKey(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem("userData");
    if (!stored) return null;
    const data = JSON.parse(stored);
    const id = data.userID ?? data.userId ?? data.parentId ?? data.practitionerId;
    return id != null ? String(id) : "session";
  } catch {
    return null;
  }
}

type UseUpcomingAppointmentsOptions =
  | {
      mode: "parent";
      children: { childID: number }[];
      /** True once the children list was fetched successfully (even if empty). */
      childrenLoaded?: boolean;
    }
  | { mode: "practitioner" };

export function useUpcomingAppointments(
  options: UseUpcomingAppointmentsOptions,
) {
  const mode = options.mode;
  const children =
    mode === "parent" ? options.children : EMPTY_CHILDREN;
  const childrenLoaded =
    options.mode === "parent" && options.childrenLoaded === true;
  const childIds = children.map((child) => child.childID).join(",");
  const [appointments, setAppointments] = useState<HomeAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const latestRequest = useRef(0);
  const sessionKey = useRef<string | null>(null);

  // Home screens stay mounted underneath the login screen after a logout, so a
  // stale screen must never show or remind from a previous account's data.
  // True only while the logged-in account is the one this screen started with.
  const isSessionCurrent = useCallback(async () => {
    const key = await getSessionKey();
    if (!key) return false;
    if (sessionKey.current === null) sessionKey.current = key;
    return sessionKey.current === key;
  }, []);

  const fetchAppointments = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      setLoading(true);
      if (!(await isSessionCurrent())) return;
      const { appointments: result, complete } =
        mode === "parent"
          ? await fetchParentAppointments(children)
          : await fetchPractitionerAppointments();
      // A newer refresh started meanwhile, or the user logged out or switched
      // accounts while this one was loading: drop this result.
      if (requestId !== latestRequest.current) return;
      if (!(await isSessionCurrent())) return;
      setAppointments(result);
      // Only sync reminders from a complete list; a failed request must not
      // cancel reminders that are still valid.
      if (complete) {
        syncAppointmentNotifications(
          result,
          mode === "parent" ? "parent" : "practitioner",
        );
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [mode, childIds, children, isSessionCurrent]);

  useEffect(() => {
    if (mode === "parent" && children.length === 0) {
      setAppointments([]);
      setLoading(false);
      // A parent whose children list loaded and is empty has nothing to be
      // reminded about, so clear any reminders left from removed children.
      // Skipped until the list has really loaded, so the initial empty state
      // never wipes valid reminders.
      if (childrenLoaded) {
        isSessionCurrent().then((current) => {
          if (current) syncAppointmentNotifications([], "parent");
        });
      }
      return;
    }
    fetchAppointments();
  }, [
    fetchAppointments,
    mode,
    childIds,
    children.length,
    childrenLoaded,
    isSessionCurrent,
  ]);

  // Re-fetch whenever this screen regains focus, not just on mount — Expo
  // Router keeps tab screens alive in the background, so without this the
  // Home card can keep showing a stale appointment time (e.g. before a
  // reschedule) even after the Appointment tab already reflects the update.
  useFocusEffect(
    useCallback(() => {
      if (mode === "practitioner" || mode === "parent") {
        fetchAppointments();
      }
    }, [fetchAppointments, mode]),
  );

  // The app can stay in memory for days; resync reminders every time it comes
  // back to the foreground, not only when this screen regains focus.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        fetchAppointments();
      }
    });
    return () => subscription.remove();
  }, [fetchAppointments]);

  return { appointments, loading, refresh: fetchAppointments };
}
