import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function DisclaimerLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="index" />
      </Stack>
    </AuthenticatedLayout>
  );
}
