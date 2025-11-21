import { Stack } from 'expo-router';

export default function AppointmentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentManagement" options={{ headerShown: false }} />
      <Stack.Screen name="AppointmentDetail" options={{ headerShown: false }} />
    </Stack>
  );
} 