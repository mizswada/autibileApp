import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import API from '../api';

const userTypes = [
  { label: 'Parents', image: require('../assets/parents.png'), route: '/auth/LoginParents' },
  { label: 'Doctor', image: require('../assets/doctor.png'), route: '/auth/LoginDoctor' },
  { label: 'Therapist', image: require('../assets/therapist.png'), route: '/auth/LoginTherapist' },
];

export default function UserTypeSelect() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUserType = async () => {
      setLoading(true);
      const storedData = await AsyncStorage.getItem('userData');
      const data = storedData ? JSON.parse(storedData) : null;

      if (data && data.accessToken) {
        try {
          let endpoint;
          if (data.roles[0] === 'Doctor') {
            endpoint = 'validateDoctor';
          } else if (data.roles[0] === 'Parents') {
            endpoint = 'validateParents';
          } else {
            endpoint = 'validateTherapist';
          }

          const result = await API(`apps/auth/${endpoint}`, {}, "GET", true, data.accessToken);
          //console.log('Validation result:', result);

          if (result.statusCode === 200) {
            if (data.roles[0] === 'Doctor') {
              router.push('/doctorPage');
            } else if (data.roles[0] === 'Parents') {
              router.push('/parentsPage');
            } else if (data.roles[0] === 'Therapist') {
              router.push('/therapistPage');
            }
          } else {
            console.log('User validation failed');
          }
        } catch (error) {
          console.error('Error checking user type:', error);
        }
      }

      setLoading(false);
    };

    checkUserType();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select User Type</Text>
      {userTypes.map((type) => (
        <TouchableOpacity
          key={type.label}
          style={styles.card}
          onPress={() => {
            router.push(type.route as any)}}
        >
          <Image source={type.image} style={styles.image} />
          <Text style={styles.label}>{type.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, color: '#222' },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: { width: 120, height: 100, resizeMode: 'contain', marginBottom: 12 },
  label: { fontSize: 18, fontWeight: '500', color: '#222' },
});
