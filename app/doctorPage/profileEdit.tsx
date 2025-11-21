import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileEdit() {
  const [userData, setUserData] = useState<any>(null);

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
          'Delete Account',
          'Are you sure you want to delete your account? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account') }
          ]
        );
        break;
      case 'logout':
        
        Alert.alert(
          'Log Out',
          'Are you sure you want to log out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => {
              AsyncStorage.removeItem('userData');
              router.push('/auth/LoginDoctor')
             } 
            }
          ]
        );
        break;
    }
  };

  return (
    <ScrollView style={styles.scroll}>
      {/* Top blue background */}
      <View style={styles.topBackground} />

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userData?.username ? userData.username.charAt(0).toUpperCase() : 'D'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{userData?.username}</Text>
          <Text style={styles.role}>Doctor</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.pillButton}
              onPress={() => router.push('/profilePage/practitionerProfile')}
            >
              <Text style={styles.pillButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pillButton} onPress={() => router.push('/auth/changePassword')}>
              <Text style={styles.pillButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        <MenuItem icon="help-circle-outline" label="FAQ" onPress={() => handleMenuPress('faq')} />
        <Divider />
        <MenuItem icon="call-outline" label="Contact Us" onPress={() => handleMenuPress('contact')} />
        <Divider />
        <MenuItem icon="person-remove-outline" label="Delete Account" danger onPress={() => handleMenuPress('delete')} />
        <Divider />
        <MenuItem icon="log-out-outline" label="Log Out" danger onPress={() => handleMenuPress('logout')} />
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
      <Text style={[styles.menuLabel, danger && styles.danger]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#f7fbff',
  },
  topBackground: {
    height: 200,
    backgroundColor: '#99DBFD',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: -40,
    marginHorizontal: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  avatarText: {
    fontSize: 70,
    fontWeight: 'bold',
    color: '#000000',
  },
  name: {
    fontSize: 20,
    fontWeight: 900,
    color: '#000000',
  },
  role: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 500,
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  editProfileText: {
    color: '#888',
    fontSize: 13,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  menuLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#989898',
    marginTop: 10,
    marginBottom: 10,
  },
  danger: {
    color: '#e53935',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
    // Removed flexWrap to keep buttons side by side
  },
  pillButton: {
    backgroundColor: '#F1F1F1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pillButtonText: {
    color: '#222',
    fontSize: 11,
    fontWeight: '400',
  },
});

