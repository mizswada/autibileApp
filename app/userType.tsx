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

  const getValidationEndpoint = (role: string) => {
    if (role === 'Doctor') return 'validateDoctor';
    if (role === 'Parents') return 'validateParents';
    return 'validateTherapist';
  };

  const navigateByRole = (role: string) => {
    if (role === 'Doctor') {
      router.push('/doctorPage');
    } else if (role === 'Parents') {
      router.push('/parentsPage');
    } else if (role === 'Therapist') {
      router.push('/therapistPage');
    }
  };

  const refreshAccessToken = async (data: any) => {
    if (!data?.refreshToken) return null;

    if (__DEV__) console.log('[Auth] access token invalid, attempting refresh');

    const refreshResult = await API(
      'apps/auth/refresh',
      { refreshToken: data.refreshToken },
      'POST',
      false,
    );

    if (refreshResult.statusCode !== 200 || !refreshResult?.data?.accessToken) {
      if (__DEV__) console.log('[Auth] refresh failed');
      return null;
    }

    if (__DEV__) console.log('[Auth] refresh succeeded');

    const updatedData = {
      ...data,
      accessToken: refreshResult.data.accessToken,
    };
    await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
    return updatedData;
  };

  useEffect(() => {
    const checkUserType = async () => {
      setLoading(true);
      const storedData = await AsyncStorage.getItem('userData');
      const data = storedData ? JSON.parse(storedData) : null;

      if (data && data.accessToken) {
        try {
          const role = data.roles?.[0];
          const endpoint = getValidationEndpoint(role);

          let result = await API(`apps/auth/${endpoint}`, {}, 'GET', true, data.accessToken);
          if (__DEV__ && result.statusCode === 200) {
            console.log('[Auth] startup validated with existing access token');
          }

          if (result.statusCode !== 200) {
            const refreshedData = await refreshAccessToken(data);
            if (refreshedData?.accessToken) {
              result = await API(`apps/auth/${endpoint}`, {}, 'GET', true, refreshedData.accessToken);
              if (__DEV__ && result.statusCode === 200) {
                console.log('[Auth] startup validated after refresh');
              }
            } else {
              await AsyncStorage.removeItem('userData');
            }
          }

          if (result.statusCode === 200) {
            navigateByRole(role);
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E1F5FF', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 32, color: '#1E293B', letterSpacing: 0.5 },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  image: { width: 120, height: 100, resizeMode: 'contain', marginBottom: 12 },
  label: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
});
