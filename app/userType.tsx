import { AuthLogo } from '@/components/AuthLogo';
import { ScreenBackButton } from '@/components/ScreenHeader';
import { useScreenInsets } from '@/hooks/useScreenInsets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API from '../api';

const userTypes = [
  { label: 'Parents', image: require('../assets/parents.png'), route: '/auth/LoginParents' },
  { label: 'Doctor', image: require('../assets/doctor.png'), route: '/auth/LoginDoctor' },
  { label: 'Therapist', image: require('../assets/therapist.png'), route: '/auth/LoginTherapist' },
];

export default function UserTypeSelect() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { height } = useWindowDimensions();
  const { bottomInset } = useScreenInsets();
  const compact = height < 760;

  const getValidationEndpoint = (role: string) => {
    if (role === 'Doctor') return 'validateDoctor';
    if (role === 'Parents') return 'validateParents';
    return 'validateTherapist';
  };

  const navigateByRole = (role: string) => {
    if (role === 'Doctor') {
      router.replace('/doctorPage');
    } else if (role === 'Parents') {
      router.replace('/parentsPage');
    } else if (role === 'Therapist') {
      router.replace('/therapistPage');
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
      try {
        // A corrupt or unreadable session must not leave the spinner up
        // forever: fall through to the user-type screen instead.
        let data = null;
        try {
          const storedData = await AsyncStorage.getItem('userData');
          data = storedData ? JSON.parse(storedData) : null;
        } catch (error) {
          console.error('Error reading stored session:', error);
          await AsyncStorage.removeItem('userData').catch(() => {});
        }

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
      } finally {
        setLoading(false);
      }
    };

    checkUserType();
  }, []);

  const goBackToSponsor = useCallback(() => {
    router.replace('/sponsor');
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android' || loading) return;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBackToSponsor();
        return true;
      });

      return () => subscription.remove();
    }, [loading, goBackToSponsor]),
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4db5ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.headerWrap}>
        <View style={styles.headerContainer}>
          <View style={styles.backButton}>
            <ScreenBackButton onPress={goBackToSponsor} variant="surface" />
          </View>
          <AuthLogo />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: Math.max(bottomInset, 16) + 16,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Select User Type</Text>
        {userTypes.map((type) => (
          <TouchableOpacity
            key={type.label}
            style={[styles.card, compact && styles.cardCompact]}
            onPress={() => {
              router.push(type.route as any);
            }}
          >
            <Image
              source={type.image}
              style={[styles.image, compact && styles.imageCompact]}
            />
            <Text style={styles.label}>{type.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => router.push('/adminWeb')}
        >
          <Text style={styles.adminLinkText}>Open as Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAccountLink}
          onPress={() => router.push('/auth/AccountRequest')}
        >
          <Text style={styles.deleteAccountText}>Account request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#E1F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerWrap: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 8,
    backgroundColor: '#E1F5FF',
  },
  headerContainer: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, marginTop: 12, color: '#1E293B', letterSpacing: 0.5 },
  card: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  cardCompact: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  image: { width: 120, height: 100, resizeMode: 'contain', marginBottom: 12 },
  imageCompact: { width: 96, height: 80, marginBottom: 8 },
  label: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  adminLink: { marginTop: 8, paddingVertical: 8 },
  adminLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  deleteAccountLink: { marginTop: 4, paddingVertical: 8 },
  deleteAccountText: {
    fontSize: 14,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
