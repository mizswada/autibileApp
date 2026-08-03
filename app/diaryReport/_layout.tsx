import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function DiaryReportLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="parentsReport" />
        <Stack.Screen name="practitionerReport" />
        <Stack.Screen name="practitionerPatientReport" />
      </Stack>
    </AuthenticatedLayout>
  );
}
