import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Keep the native Autibile logo splash up until this screen is ready.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function AppSplashScreen() {
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;

      // This screen has no tappable way forward, so a read failure here would
      // strand the user on the logo permanently. Treat it as "no session".
      let storedData = null;
      try {
        storedData = await AsyncStorage.getItem('userData');
      } catch (error) {
        console.error('Error reading stored session:', error);
      }
      if (cancelled) return;

      if (storedData) {
        router.replace('/userType');
        return;
      }

      router.replace('/sponsor');
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require('../assets/images/adaptive-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Autibile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: -48,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1E293B',
  },
});
