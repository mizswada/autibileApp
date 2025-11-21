import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="Register" options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />
      <Stack.Screen name="LoginParents" options={{ headerShown: false }} />
      <Stack.Screen name="LoginTherapist" options={{ headerShown: false }} />
      <Stack.Screen name="LoginDoctor" options={{ headerShown: false }} />
      <Stack.Screen name="TherapistRegister" options={{ headerShown: false }} />
      <Stack.Screen name="DoctorRegister" options={{ headerShown: false }} />
      <Stack.Screen name="changePassword" options={{ headerShown: false }} />
      <Stack.Screen name="parentsInformation" options={{ headerShown: false }} />
    </Stack>
  );
} 