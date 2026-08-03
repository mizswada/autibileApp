import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function parentsAppointmentLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="parentsAppointment" />
        <Stack.Screen name="appointmentDetail" />
        <Stack.Screen name="practitionerAppointment" />
        <Stack.Screen name="therapistAppDetail" />
      </Stack>
    </AuthenticatedLayout>
  );
}
