import { Stack } from 'expo-router';

export default function MchatLayout() {
  return (
    <Stack>
      <Stack.Screen name="MChatR" options={{ headerShown: false }} />
      <Stack.Screen name="MChatRNextLevel" options={{ headerShown: false }} />
    </Stack>
  );
} 