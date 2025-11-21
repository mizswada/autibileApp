import { Stack } from 'expo-router';

export default function manageDetailsLayout() {
  return (
    <Stack>
      <Stack.Screen name="parentsInformation" options={{ headerShown: false }} />
      <Stack.Screen name="practitionerInformation" options={{ headerShown: false }} />
    </Stack>
  );
} 