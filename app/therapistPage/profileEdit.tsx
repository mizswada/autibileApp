import { Ionicons } from '@expo/vector-icons';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileEdit() {
  const [userData, setUserData] = useState<any>(null);
  const { bottomInset } = useScreenInsets();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const data = JSON.parse(storedData);
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'settings':
        Alert.alert('Settings', 'Settings screen will be implemented soon');
        break;
      case 'faq':
        router.push('/FAQ');
        break;
      case 'contact':
        router.push('/contactUs');
        break;
      case 'delete':
        Alert.alert(
          'Account Request',
          'Submit an account deletion request for administrator review.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              style: 'destructive',
              onPress: () => router.push('/auth/AccountRequest'),
            },
          ]
        );
        break;
      case 'logout':
        Alert.alert(
          'Log Out',
          'Are you sure you want to log out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', 
              onPress: () => {
                AsyncStorage.removeItem('userData');
                router.push('/auth/LoginTherapist')
              }
            }
          ]
        );
        break;
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: Math.max(bottomInset, 16) }}
      contentInsetAdjustmentBehavior="never"
    >
      {/* Top blue background */}
      <View style={styles.topBackground} />

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.username ? userData.username.charAt(0).toUpperCase() : 'T'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
              {userData?.username}
            </Text>
            <Text style={styles.role}>Therapist</Text>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => router.push('/profilePage/practitionerProfile')}
          >
            <Text
              style={styles.pillButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => router.push('/auth/changePassword')}
          >
            <Text
              style={styles.pillButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Change Password
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <MenuItem icon="help-circle-outline" label="FAQ" onPress={() => handleMenuPress('faq')} />
        <Divider />
        <MenuItem icon="call-outline" label="Contact Us" onPress={() => handleMenuPress('contact')} />
        <Divider />
        <MenuItem icon="log-out-outline" label="Log Out" danger onPress={() => handleMenuPress('logout')} />
        <Divider />
        <MenuItem icon="person-remove-outline" label="Request Delete" danger onPress={() => handleMenuPress('delete')} />
      </View>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  danger,
  onPress
}: {
  icon: string;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon as any} size={22} color={danger ? '#e53935' : '#222'} style={{ width: 28 }} />
      <Text style={[styles.menuLabel, danger && styles.danger]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBackground: {
    height: 200,
    backgroundColor: '#4db5ff',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginTop: -75,
    marginHorizontal: 20,
    marginBottom: 32,
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E1F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#4db5ff',
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  role: {
    fontSize: 16,
    color: '#4db5ff',
    fontWeight: '600',
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  editProfileText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 40,
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 18,
  },
  danger: {
    color: '#e53935',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    marginTop: 16,
    gap: 8,
    width: '100%',
  },
  pillButton: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 128,
    minWidth: 0,
    backgroundColor: '#E1F5FF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4db5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: {
    color: '#4db5ff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
});

