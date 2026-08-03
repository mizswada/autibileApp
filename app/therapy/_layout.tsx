import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function TherapyLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="TherapyPlanDetail" />
        <Stack.Screen name="TherapyPlanList" />
      </Stack>
    </AuthenticatedLayout>
  );
}
