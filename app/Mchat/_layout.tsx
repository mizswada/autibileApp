import { Stack } from 'expo-router';
import {
  AuthenticatedLayout,
  authenticatedStackScreenOptions,
} from '@/components/AuthenticatedLayout';

export default function MchatLayout() {
  return (
    <AuthenticatedLayout>
      <Stack screenOptions={authenticatedStackScreenOptions}>
        <Stack.Screen name="MChatR" />
        <Stack.Screen name="MChatRNextLevel" />
      </Stack>
    </AuthenticatedLayout>
  );
}
