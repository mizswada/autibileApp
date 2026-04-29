import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import API from '../../api';

export default function ChangePassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Get user role from stored data or params
    const getUserRole = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          
          // Determine role from user data
          if (parsedData.roles && parsedData.roles.length > 0) {
            // Use the first role from the roles array
            setUserRole(parsedData.roles[0]);
          } else if (parsedData.userType) {
            setUserRole(parsedData.userType);
          } else if (parsedData.role) {
            setUserRole(parsedData.role);
          } else if (parsedData.userRole) {
            setUserRole(parsedData.userRole);
          }
        }
        
        // If no stored data, check URL params
        if (params.role) {
          setUserRole(params.role as string);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };

    getUserRole();
  }, [params.role]);

  const getApiEndpoint = () => {
    // Use the same API endpoint for all roles
    return 'apps/auth/resetPassword';
  };

  const getLoginRoute = () => {
    if (userData) {
        console.log('User role:', userRole);
      if (userRole?.toLowerCase() === 'doctor') {
        return '/auth/LoginDoctor';
      } else if (userRole?.toLowerCase() === 'therapist') {
        return '/auth/LoginTherapist';
      } else {
        return '/auth/LoginParents';
      }
    }
    
    // Default to parent login
    return '/auth/LoginParents';
  };

  const getRoleDisplayName = () => {
    if (userRole?.toLowerCase() === 'doctor') {
      return 'DOCTOR';
    } else if (userRole?.toLowerCase() === 'therapist') {
      return 'THERAPIST';
    } else {
      return 'PARENT';
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const apiEndpoint = getApiEndpoint();
      console.log('Using API endpoint:', apiEndpoint);
      
      const result = await API(apiEndpoint, { 
        email, 
        password, 
        confirmPassword 
      }, "POST", false);

      if (result.status === 200) {
        Alert.alert('Success', result.message || 'Password changed successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Clear form
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              // Navigate back to appropriate login
              router.push(getLoginRoute());
            },
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to change password');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push(getLoginRoute());
  };

  const isButtonDisabled = !email || !password || !confirmPassword || loading;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reset Your Password</Text>
          {userRole && (
            <Text style={styles.userType}>Reset password for {getRoleDisplayName()}</Text>
          )}
          <Text style={styles.description}>
            Enter your email and new password to reset your account password
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter new password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={isButtonDisabled}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Change Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.loginLink}>
              Back to <Text style={styles.loginText}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FF',
    paddingTop: 70,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  userType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4db5ff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#E1F5FF',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#E1F5FF',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#4db5ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  loginText: {
    color: '#4db5ff',
    fontWeight: 'bold',
  },
});
