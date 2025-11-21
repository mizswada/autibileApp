import { Stack } from 'expo-router';

export default function parentsAppointmentLayout() {
  return (
    <Stack>
      <Stack.Screen name="parentsAppointment" options={{ headerShown: false }} />
      <Stack.Screen name="appointmentDetail" options={{ headerShown: false }} />
      <Stack.Screen name="practitionerAppointment" options={{ headerShown: false }} />
      <Stack.Screen name="therapistAppDetail" options={{ headerShown: false }} />
    </Stack>
  );
} 