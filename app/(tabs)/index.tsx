import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

const { width } = Dimensions.get('window');

const notifications = [
  {
    message: 'Hi Aisha, just a quick reminder! Your autism screening is scheduled for June 15th, 2025 at 10:00 AM. Please make sure to complete all necessary forms before your appointment. See you soon!',
  },
  // Add other notifications if needed
];

const features = [
  { key: 'mchat', label: 'M-CHAT-R', icon: require('@/assets/images/passFail.png') },
  { key: 'appointment', label: 'Appointment', icon: require('@/assets/images/calendar.png') },
  { key: 'therapy', label: 'Therapy Plan', icon: require('@/assets/images/medicalBag.png') },
  { key: 'progress', label: 'Progress Report', icon: require('@/assets/images/report.png') },
];

export default function HomeScreen() {
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
      {/* Header background */}
      <View style={styles.headerBg}>
        <Image source={require('../../assets/images/Autibilelogo.png')} style={styles.logo} />
      </View>

      {/* Notification Card */}
      <View style={styles.cardContainer}>
        <View style={styles.notificationCard}>
          <Image source={require('@/assets/images/puzzle.png')} style={styles.puzzleIcon} />

          <Text style={styles.notifTitle}>Hi, Parents</Text>
          <Text style={styles.notifSubtitle}>WELCOME TO AUTIBLE</Text>

          <View style={styles.notifMsgWrapper}>
            <View style={styles.notifCard}>
              <Image source={require('@/assets/images/bell.png')} style={styles.bellIcon} />
              <Text style={styles.notifMsg}>{notifications[0].message}</Text>
            </View>
          </View>

          <View style={styles.pagination}>
            <View style={styles.dot} />
            <View style={styles.dotInactive} />
            <View style={styles.dotInactive} />
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
                : f.key === 'mchat'
                ? () => router.push('/Mchat/MChatR' as any)
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
    backgroundColor: '#E1F5FF',
  } as ViewStyle,
  headerBg: {
    backgroundColor: '#99DBFD',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 140,
    resizeMode: 'contain',
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: -60,
  },
  notificationCard: {
    width: '85%',
    backgroundColor: '#48B2E8',
    borderRadius: 30,
    padding: 20,
    position: 'relative',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.38)', // solid teal-blue, adjust to match your design
    borderRadius: 20,
    padding: 12,
    width: '100%',
  },
  
  puzzleIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.3,
  },
  notifTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  notifSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: 1,
  },
  notifMsgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bellIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#fff',
    marginTop: 2,
  },
  notifMsg: {
    flex: 1,
    fontSize: 11,
    color: '#fff',
    lineHeight: 12,
  },
  pagination: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 3,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A5DCEC',
    marginHorizontal: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  featureBtn: {
    width: '40%',
    height: 10,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    shadowColor: '#99DBFD',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.23,
    shadowRadius: 15.4,
    elevation: 10,
  },
  featureIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    tintColor: '#99DBFD',
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
  },
});
