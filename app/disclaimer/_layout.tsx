import { Stack } from 'expo-router';

export default function DisclaimerLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 