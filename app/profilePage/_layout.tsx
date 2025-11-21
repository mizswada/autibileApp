import { Stack } from 'expo-router';

export default function profilePageLayout() {
  return (
    <Stack>
      <Stack.Screen name="parentsProfile" options={{ headerShown: false }} />
      <Stack.Screen name="childProfile" options={{ headerShown: false }} />
      <Stack.Screen name="practitionerProfile" options={{ headerShown: false }} />
    </Stack>
  );
} 