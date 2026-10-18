// Appointment statuses. Only Booked, Cancelled and Completed are in use.
// 38 (Started), 39 (Confirmed Start) and 40 (Finished) were retired: old rows
// are shown as the status they became, and the server saves them the same way.
export const APPOINTMENT_STATUS_BOOKED = 36;
export const APPOINTMENT_STATUS_CANCELLED = 37;
export const APPOINTMENT_STATUS_COMPLETED = 41;

const LEGACY_STATUS_MAP: Record<number, number> = {
  38: APPOINTMENT_STATUS_BOOKED,
  39: APPOINTMENT_STATUS_BOOKED,
  40: APPOINTMENT_STATUS_COMPLETED,
};

export function normalizeAppointmentStatus(status: number): number {
  return LEGACY_STATUS_MAP[status] ?? status;
}

export const STATUS_INFO: Record<number, { label: string; color: string }> = {
  [APPOINTMENT_STATUS_BOOKED]: { label: 'Booked', color: '#1976D2' }, // Blue
  [APPOINTMENT_STATUS_CANCELLED]: { label: 'Cancelled', color: '#EF4444' }, // Red
  [APPOINTMENT_STATUS_COMPLETED]: { label: 'Completed', color: '#2E7D32' }, // Green
};

// Order of the status buttons on the therapist screen.
export const STATUS_BUTTON_ORDER = [
  APPOINTMENT_STATUS_BOOKED,
  APPOINTMENT_STATUS_COMPLETED,
  APPOINTMENT_STATUS_CANCELLED,
];

export function getStatusText(status: number): string {
  return STATUS_INFO[normalizeAppointmentStatus(status)]?.label || 'Unknown';
}

export function getStatusColor(status: number): string {
  return STATUS_INFO[normalizeAppointmentStatus(status)]?.color || '#666';
}
