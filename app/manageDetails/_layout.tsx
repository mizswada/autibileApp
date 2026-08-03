import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function ManageDetailsLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="parentsInformation" />
        <Stack.Screen name="practitionerInformation" />
      </Stack>
    </AuthenticatedLayout>
  );
}
