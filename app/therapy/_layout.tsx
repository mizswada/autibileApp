import { Stack } from 'expo-router';

export default function therapyPageLayout() {
  return (
    <Stack>
      <Stack.Screen name="TherapyPlanDetail" options={{ headerShown: false }} />
      <Stack.Screen name="TherapyPlanList" options={{ headerShown: false }} />
    </Stack>
  );
} 