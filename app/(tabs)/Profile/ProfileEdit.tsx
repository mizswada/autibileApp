import { router } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileEdit() {
  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'settings':
        // Navigate to settings (you can create a settings screen later)
        Alert.alert('Settings', 'Settings screen will be implemented soon');
        break;
      case 'faq':
        router.push('/FAQ');
        break;
      case 'contact':
        Alert.alert('Contact Us', 'Contact information will be displayed here');
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
            { text: 'Log Out', style: 'destructive', onPress: () => router.push('/auth/Login') }
          ]
        );
        break;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>H</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>HAMZAH BIN HAMID</Text>
          <Text style={styles.role}>Parents</Text>
          <TouchableOpacity style={styles.editProfileRow}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
            <Text style={styles.editProfileArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Menu */}
      <View style={styles.menu}>
        <MenuItem icon="⚙️" label="Settings & Privacy" onPress={() => handleMenuPress('settings')} />
        <Divider />
        <MenuItem icon="❓" label="FAQ" onPress={() => handleMenuPress('faq')} />
        <Divider />
        <MenuItem icon="📞" label="Contact Us" onPress={() => handleMenuPress('contact')} />
        <Divider />
        <MenuItem icon="👥" label="Delete Account" danger onPress={() => handleMenuPress('delete')} />
        <Divider />
        <MenuItem icon="↩️" label="Log Out" danger onPress={() => handleMenuPress('logout')} />
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
      <Text style={[styles.menuIcon, danger && styles.danger]}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && styles.danger]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f7fbff',
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 0,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: -30,
    marginBottom: 32,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3f3fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  role: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  editProfileText: {
    color: '#4db5ff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  editProfileArrow: {
    color: '#4db5ff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  menu: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 18,
    color: '#222',
  },
  menuLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 18,
    marginRight: 0,
  },
  danger: {
    color: '#e53935',
  },
}); 