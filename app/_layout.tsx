import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AndroidHardwareBack } from '../components/AndroidHardwareBack';
import { UpdatePrompt } from '../components/UpdatePrompt';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useColorScheme } from '../hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { updateAvailable, dismiss, startUpdate } = useAppUpdate();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AndroidHardwareBack />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="userType" options={{ headerShown: false }} />
        <Stack.Screen name="adminWeb" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="parentsPage" options={{ headerShown: false }} />
        <Stack.Screen name="doctorPage" options={{ headerShown: false }} />
        <Stack.Screen name="therapistPage" options={{ headerShown: false }} />
        <Stack.Screen name="appointment" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="FAQ" options={{ headerShown: false }} />
        <Stack.Screen name="Mchat" options={{ headerShown: false }} />
        <Stack.Screen name="community-feed" options={{ headerShown: false }} />
        <Stack.Screen name="manageDetails" options={{ headerShown: false }} />
        <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
        <Stack.Screen name="profilePage" options={{ headerShown: false }} />
        <Stack.Screen name="diaryReport" options={{ headerShown: false }} />
        <Stack.Screen name="contactUs" options={{ headerShown: false }} />
        <Stack.Screen name="therapy" options={{ headerShown: false }} />
        <Stack.Screen name="payment" options={{ headerShown: false }} />
        <Stack.Screen name="disclaimer" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <UpdatePrompt
        visible={updateAvailable}
        onUpdate={startUpdate}
        onDismiss={dismiss}
      />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
