import { Stack } from 'expo-router';

export default function profilePageLayout() {
  return (
    <Stack>
      <Stack.Screen name="parentsReport" options={{ headerShown: false }} />
      <Stack.Screen name="practitionerReport" options={{ headerShown: false }} />
    </Stack>
  );
} 