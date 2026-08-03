import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack>
      <Stack.Screen name="CommunityFeed" options={{ headerShown: false }} />
      <Stack.Screen name="CommunitySupport" options={{ headerShown: false }} />
    </Stack>
  );
} 