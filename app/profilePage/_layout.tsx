import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function ProfilePageLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="parentsProfile" />
        <Stack.Screen name="childProfile" />
        <Stack.Screen name="practitionerProfile" />
      </Stack>
    </AuthenticatedLayout>
  );
}
