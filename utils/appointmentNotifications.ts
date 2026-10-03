import type { HomeAppointment } from "@/components/HomeAppointmentPager";
import { formatDateString } from "@/utils/formatLocalDate";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

type Variant = "parent" | "practitioner";

const supported = Platform.OS === "android" || Platform.OS === "ios";

const ID_PREFIX = "appt-";
const CHANNEL_ID = "appointments";
// iOS keeps at most 64 pending local notifications; stay safely under it and
// always prefer the soonest ones. Later reminders are added on later app opens.
const MAX_NOTIFICATIONS = 60;
const MIN_LEAD_MS = 10_000;
// Cancelled, started, confirmed-start, finished and completed appointments
// (statuses 37 to 41) no longer need a reminder; only Booked (36) does.
const NO_REMINDER_STATUSES = new Set([37, 38, 39, 40, 41]);
const HOUR_MS = 60 * 60 * 1000;

const REMINDERS = [
  { kind: "24h", offsetMs: 24 * HOUR_MS, title: "Appointment tomorrow" },
  { kind: "1h", offsetMs: HOUR_MS, title: "Appointment in 1 hour" },
] as const;

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

interface PlannedNotification {
  title: string;
  body: string;
  date: Date;
}

function buildBody(
  appointment: HomeAppointment,
  variant: Variant,
  start: Date,
  kind: (typeof REMINDERS)[number]["kind"],
): string {
  const name = appointment.extendedProps?.patient_name;
  const time = start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const when =
    kind === "1h"
      ? `at ${time} today`
      : `on ${formatDateString(appointment.start)} at ${time}`;

  if (variant === "practitioner") {
    return name
      ? `You have a visit with ${name} ${when}.`
      : `You have a visit ${when}.`;
  }
  return name
    ? `${name} has a visit ${when}. We will see you soon!`
    : `You have a visit ${when}. We will see you soon!`;
}

function planNotifications(
  appointments: HomeAppointment[],
  variant: Variant,
): Map<string, PlannedNotification> {
  const candidates: { id: string; item: PlannedNotification }[] = [];
  const now = Date.now();

  for (const appointment of appointments) {
    const status = Number(appointment.extendedProps?.status);
    if (NO_REMINDER_STATUSES.has(status)) continue;

    const start = new Date(appointment.start);
    if (Number.isNaN(start.getTime())) continue;

    for (const reminder of REMINDERS) {
      const fireAt = start.getTime() - reminder.offsetMs;
      if (fireAt - now < MIN_LEAD_MS) continue;

      // Appointment id + reminder kind + start time: a reschedule changes the
      // id, so the old reminder is cancelled and a new one is scheduled.
      const id = `${ID_PREFIX}${appointment.id}-${reminder.kind}-${start.getTime()}`;
      candidates.push({
        id,
        item: {
          title: reminder.title,
          body: buildBody(appointment, variant, start, reminder.kind),
          date: new Date(fireAt),
        },
      });
    }
  }

  candidates.sort((a, b) => a.item.date.getTime() - b.item.date.getTime());
  return new Map(
    candidates.slice(0, MAX_NOTIFICATIONS).map(({ id, item }) => [id, item]),
  );
}

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Appointment reminders",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

async function ensurePermission(): Promise<boolean> {
  // Android 13+ only shows the permission prompt once a channel exists.
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function listOurScheduled() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((item) => item.identifier.startsWith(ID_PREFIX));
}

async function runSync(appointments: HomeAppointment[], variant: Variant) {
  if (!supported) return;

  const planned = planNotifications(appointments, variant);
  const existing = await listOurScheduled();
  const existingIds = new Set(existing.map((item) => item.identifier));

  // Cancelled, rescheduled, removed or switched-account reminders.
  await Promise.all(
    existing
      .filter((item) => !planned.has(item.identifier))
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );

  if (planned.size === 0) return;
  if (!(await ensurePermission())) return;

  for (const [identifier, item] of planned) {
    if (existingIds.has(identifier)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title: item.title, body: item.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.date,
        channelId: CHANNEL_ID,
      },
    });
  }
}

async function runCancelAll() {
  if (!supported) return;
  const existing = await listOurScheduled();
  await Promise.all(
    existing.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.identifier),
    ),
  );
}

// Syncs run one at a time so overlapping screen refreshes can never schedule
// the same reminder twice.
let queue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  queue = queue.then(task).catch((error) => {
    console.warn("Appointment notification sync failed:", error);
  });
  return queue;
}

/**
 * Makes the phone's scheduled reminders match the given upcoming appointments:
 * schedules missing ones, keeps existing ones, cancels the rest.
 */
export function syncAppointmentNotifications(
  appointments: HomeAppointment[],
  variant: Variant,
): Promise<void> {
  return enqueue(() => runSync(appointments, variant));
}

/** Removes every appointment reminder (call on logout). */
export function cancelAppointmentNotifications(): Promise<void> {
  return enqueue(runCancelAll);
}
