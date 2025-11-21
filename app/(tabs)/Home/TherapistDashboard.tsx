import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');

const notifications = [
  {
    message: 'Hi Therapist, you have 2 therapy sessions scheduled today. Please review your patient progress and prepare your therapy plans.',
  },
  {
    message: 'Therapist, the progress report for Patient Aisha is ready for your review. Please update the therapy plan accordingly.',
  },
  {
    message: 'Hi Therapist, your next therapy session with Patient Aisha is confirmed for June 15th, 2025 at 2:00 PM.',
  },
];

const features = [
  { key: 'therapy', label: 'Therapy Plan', icon: require('@/assets/images/icon.png') },
  { key: 'progress', label: 'Progress Report', icon: require('@/assets/images/icon.png') },
  { key: 'appointment', label: 'Appointment', icon: require('@/assets/images/icon.png') },
];

export default function TherapistDashboard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.9));
    setActiveIndex(index);
    scrollX.setValue(event.nativeEvent.contentOffset.x);
  };

  return (
    <View style={styles.container}>
      {/* Notification Cards Carousel with Header Background */}
      <View style={styles.notificationHeaderWrapper}>
        {/* Header background */}
        <View style={styles.headerBg} />
        {/* Logo */}
        <Image source={require('../../../assets/images/Autibilelogo.png')} style={styles.logo} />
        {/* Hi, Therapist Card */}
        <View style={styles.cardContainer}>
          <View style={styles.notificationCardCustom}>
            {/* Puzzle icon placeholder */}
            <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.puzzleIcon} />
            <Text style={styles.notifTitle}>Hi, Therapist</Text>
            <Text style={styles.notifSubtitle}>WELCOME TO AUTIBLE</Text>
            <Text style={styles.notifMsg}>{notifications[0].message}</Text>
          </View>
        </View>
      </View>
      {/* Features Grid */}
      <View style={styles.grid}>
        {features.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={styles.featureBtn}
            onPress={
              f.key === 'appointment'
                ? () => router.push('/Home/Appoinment' as any)
                : f.key === 'therapy'
                ? () => router.push('/TherapyActivityPlans' as any)
                : f.key === 'progress'
                ? () => router.push('/Home/ProgressReport' as any)
                : undefined
            }
          >
            <Image source={f.icon} style={styles.featureIcon} />
            <Text style={styles.featureLabel}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF', // light blue background
    alignItems: 'center',
    paddingTop: 200,
  } as ViewStyle,
  notificationHeaderWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
    minHeight: 159, // enough to fit bg and card
    justifyContent: 'flex-start',
  },
  headerBg: {
    position: 'absolute',
    top: -200,
    left: 0,
    width: '100%',
    height: 230,
    backgroundColor: '#99DBFD',
    borderRadius: 0,
    zIndex: 0,
  },
  logo: {
    position: 'absolute',
    top: -180,
    left: 140,
    width: 120,
    height: 110,
    resizeMode: 'contain',
    zIndex: 3,
    backgroundColor: 'transparent',
  },
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: -90,
  },
  notificationCardCustom: {
    width: '90%',
    height: 220,
    backgroundColor: '#48B2E8',
    borderRadius: 40,
    alignItems: 'flex-start',
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'visible',
  },
  puzzleIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    opacity: 0.18,
    marginLeft: 8,
  },
  notifTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  notifSubtitle: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  notifMsg: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 2,
    fontWeight: '400',
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
    gap: 0,
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  featureBtn: {
    width: '42%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '4%',
    marginVertical: 12,
    // Drop shadow effect
    shadowColor: '#99DBFD',
    shadowOffset: { width: 0, height: 17 },
    shadowOpacity: 0.23,
    shadowRadius: 15.4,
    elevation: 10, // for Android
  },
  featureIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
    resizeMode: 'contain',
    tintColor: '#99DBFD',
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
}); 