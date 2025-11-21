import { Ionicons } from '@expo/vector-icons'; // for back icon and eye icon
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import API from '../../api';

export default function LoginTherapist() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
  
    setLoading(true);
  
    try {
      const result = await API("apps/auth/loginTherapist", { username: email, password }, "POST", false);
  
      // Adjust based on your API response structure
      if (result.statusCode !== 200) {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      } else {
        const { data } = result as any;
        await AsyncStorage.setItem('userData', JSON.stringify(data));
  
        Alert.alert('Success', 'Login successful', [
          {
            text: 'OK',
            onPress: () => {
              if (data.hasPractitionerInfo) {
                router.push('/therapistPage'); // existing user
              } else {
                router.push('/manageDetails/practitionerInformation'); // first time user
              }
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  const handleForgotPassword = () => {
    router.push('/auth/ForgotPassword');
  };

  const handleHomePage = () => {
    router.push('/therapistPage');
  };

  const handleSignUp = () => {
    router.push('/auth/TherapistRegister');
  };

  const isButtonDisabled = !email || !password;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Icon */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.welcome}>Welcome</Text>
      </View>

      <Text style={styles.subtitle}>Sign In</Text>
      <Text style={styles.userType}>Sign in as THERAPISTS</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Enter Your Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Ionicons name="eye-outline" size={20} color="#888" />
      </View>

      <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
        <Text style={styles.forgotPasswordText}>Forget Password</Text>
      </TouchableOpacity>

        {/* <TouchableOpacity style={styles.homePage} onPress={handleHomePage}>
          <Text style={styles.homePageText}>Home Page</Text>
        </TouchableOpacity> */}

      {loading ? (
        <ActivityIndicator size="large" color="#4db5ff" />
      ) : (
        <TouchableOpacity
          style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isButtonDisabled}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.orText}>OR</Text>

      <View style={styles.socialRow}>
        {/* <TouchableOpacity style={styles.socialButton}>
          <Image
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png' }}
            style={styles.socialIcon}
          />
        </TouchableOpacity> */}
        <TouchableOpacity style={styles.socialButton}>
          <Image
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
            style={styles.socialIcon}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleSignUp}>
        <Text style={styles.signUpLink}>
          Don't have an account? <Text style={styles.signUpText}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#fff',
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
  },
  welcome: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0B8FAC',
  },
  subtitle: {
    fontSize: 26,
    fontWeight: 700,
    color: '#000000',
    paddingTop: 20,
    marginBottom: 4,
  },
  userType: {
    fontSize: 18,
    color: '#858585',
    marginBottom: 30,
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 18,
    color: '#000000',
    marginBottom: 4,
    marginTop: 5,
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
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 60,
  },
  forgotPasswordText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500'
  },

  homePage: {
    alignSelf: 'center', // center horizontally
    marginBottom: 60,
  },
  homePageText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline', // adds underline
    textAlign: 'center', // centers the text inside its container
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
    backgroundColor: '#cceaff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  socialButton: {
    marginHorizontal: 12,
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#f1f1f1',
  },
  socialIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  signUpLink: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  signUpText: {
    color: '#0B8FAC',
    fontWeight: 'bold',
  },
});
