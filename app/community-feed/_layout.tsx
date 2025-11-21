

import { Stack } from 'expo-router';

export default function CommunityLayout() {

    return (
        <Stack>
          <Stack.Screen name="addFeed" options={{ headerShown: false }} />
          <Stack.Screen name="editFeed" options={{ headerShown: false }} />
        </Stack>
    );
  }