import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack>
      <Stack.Screen name="CommunityFeed" options={{ headerShown: true }} />
      <Stack.Screen name="CommunitySupport" options={{ headerShown: false }} />
    </Stack>
  );
} 