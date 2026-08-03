import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function QuestionnaireLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[id]" />
      </Stack>
    </AuthenticatedLayout>
  );
}
