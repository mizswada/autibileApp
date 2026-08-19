import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScreenInsets } from '../hooks/useScreenInsets';

const SPONSOR_GAP = 12;
const SPONSOR_ASPECT = {
  kementerian: 2000 / 731,
  upnm: 1094 / 400,
  neurospa: 1080 / 806,
};

const SPONSOR_AREA = 2400;

function sponsorLogoSize(aspectRatio: number) {
  const height = Math.sqrt(SPONSOR_AREA / aspectRatio);
  return {
    height,
    width: height * aspectRatio,
  };
}

export default function SponsorScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { authPaddingTop, bottomInset } = useScreenInsets();
  const bottomPad = Math.max(bottomInset, 16) + 8;
  const logoSize = Math.min(260, Math.max(150, height - authPaddingTop - bottomPad - 220));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.centerContent}>
        <Image
          source={require('../assets/images/adaptive-icon.png')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
          resizeMode="contain"
        />
        <Text style={styles.title}>Autibile</Text>
        <Text style={styles.hintText}>Tap to Go Next</Text>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.sponsorSafeArea}>
        <View style={styles.sponsorContainer}>
          <Text style={styles.sponsorText}>Sponsored by</Text>
          <View style={styles.sponsorLogos}>
            <Image
              source={require('../assets/images/kementerian.png')}
              style={sponsorLogoSize(SPONSOR_ASPECT.kementerian)}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/images/upnm.png')}
              style={sponsorLogoSize(SPONSOR_ASPECT.upnm)}
              resizeMode="contain"
            />
            <Image
              source={require('../assets/images/neurspatherapy_logo.png')}
              style={[sponsorLogoSize(SPONSOR_ASPECT.neurospa), styles.neurospaLogo]}
              resizeMode="contain"
            />
          </View>
        </View>
      </SafeAreaView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tap to Go Next"
        onPress={() => router.replace('/userType')}
        style={styles.fullScreenHit}
      >
        <View collapsable={false} style={styles.fullScreenHitFill} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerContent: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: -72,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  hintText: {
    marginTop: 10,
    fontSize: 15,
    color: '#4db5ff',
    opacity: 0.4,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  sponsorSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sponsorContainer: {
    alignItems: 'center',
    paddingBottom: 8,
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
    alignItems: 'center',
    gap: SPONSOR_GAP,
    paddingHorizontal: 16,
  },
  neurospaLogo: {
    marginTop: -8,
  },
  fullScreenHit: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  fullScreenHitFill: {
    flex: 1,
  },
});
