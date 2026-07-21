import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

// Keep the native splash up until this JS splash is ready, then hand off cleanly.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function AppSplashScreen() {
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      router.replace('/userType');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Main logo and title section */}
      <View style={styles.centerContent}>
        <Image
          source={require('../assets/images/adaptive-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Autibile</Text>
      </View>

      {/* Sponsor section at the bottom */}
      <View style={styles.sponsorContainer}>
        <Text style={styles.sponsorText}>Sponsor by</Text>
        <View style={styles.sponsorLogos}>
          <Image
            source={require('../assets/images/kementerian.png')}
            style={styles.sponsorLogo}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/images/upnm.png')}
            style={styles.sponsorLogo}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/images/neurospa.png')}
            style={styles.sponsorLogo}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  centerContent: {
    alignItems: 'center',
    marginTop: 100,
  },
  logo: {
    width: 280,
    height: 280,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sponsorContainer: {
    alignItems: 'center',
  },
  sponsorText: {
    fontSize: 12,
    color: '#4db5ff',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sponsorLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  sponsorLogo: {
    width: 60,
    height: 30,
  },
});
