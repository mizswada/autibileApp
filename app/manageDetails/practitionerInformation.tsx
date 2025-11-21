import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import API from '../../api';

export default function PractitionerInformation() {
  const router = useRouter();
  const { practitionerID: routePractitionerID } = useLocalSearchParams();

  const [registrationNo, setRegistrationNo] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [signature, setSignature] = useState('');
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [practitionerID, setPractitionerID] = useState(routePractitionerID || '');

  // Optionally, fetch from AsyncStorage if not in route
  useEffect(() => {
    if (!practitionerID) {
      AsyncStorage.getItem('userData').then(storedData => {
        if (storedData) {
          try {
            const data = JSON.parse(storedData);
            if (data.practitionerId) setPractitionerID(data.practitionerId);
          } catch {}
        }
      });
    }
  }, []);

  const pickSignatureImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSignature(asset.base64 || '');
      setSignaturePreview(asset.uri);
    }
  };

  const handleSubmit = async () => {
    if (!practitionerID) {
      Alert.alert('Error', 'Missing practitioner ID');
      return;
    }
    setLoading(true);
    try {
      const response = await API('apps/practitioners/details', {
        practitionerID,
        registrationNo,
        specialty,
        qualification,
        experience,
        signature,
      }, 'POST', false);

      if (response.statusCode === 200) {
        Alert.alert('Success', 'Practitioner details saved successfully');
        router.push('/');
      } else {
        Alert.alert('Error', response.message || 'Failed to save practitioner details');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save practitioner details');
    } finally {
      setLoading(false);
    }
  };

  // Add a computed isFormValid
  const isFormValid = Boolean(
    practitionerID &&
    registrationNo.trim() &&
    specialty.trim() &&
    qualification.trim() &&
    experience.trim()
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Practitioner Information</Text>

      <Text style={styles.label}>Registration No</Text>
      <TextInput
        style={styles.input}
        value={registrationNo}
        onChangeText={setRegistrationNo}
        placeholder="Example: RN1234567890"
      />

      <Text style={styles.label}>Specialty</Text>
      <TextInput
        style={styles.input}
        value={specialty}
        onChangeText={setSpecialty}
        placeholder="Example: Cardiology, Neurology, etc."
      />

      <Text style={styles.label}>Qualification</Text>
      <TextInput
        style={styles.input}
        value={qualification}
        onChangeText={setQualification}
        placeholder="Example: MBBS, MD, etc."
      />

      <Text style={styles.label}>Experience</Text>
      <TextInput
        style={styles.input}
        value={experience}
        onChangeText={setExperience}
        placeholder="Example: 10"
      />

      <Text style={styles.label}>Signature</Text>
      <TouchableOpacity style={styles.input} onPress={pickSignatureImage}>
        <Text>
          {signature ? 'Signature image selected' : 'Tap to select signature image'}
        </Text>
      </TouchableOpacity>
      {signaturePreview && (
        <Image
          source={{ uri: signaturePreview }}
          style={{ width: 100, height: 100, marginVertical: 8 }}
          resizeMode="contain"
        />
      )}

      <TouchableOpacity
        style={[styles.button, (!isFormValid || loading) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!isFormValid || loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Submit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 24, 
    paddingTop: 80, 
    backgroundColor: '#fff' 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerContainer: { 
    position: 'relative', 
    width: '100%', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  backButton: { 
    position: 'absolute', 
    left: 0 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#0B8FAC',
    marginBottom: 20,
  },
  label: { 
    alignSelf: 'flex-start', 
    fontSize: 16, 
    color: '#000', 
    marginBottom: 4, 
    marginTop: 4, 
    fontWeight: '600' 
  },
  input: { 
    width: '100%', 
    height: 52, 
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    marginBottom: 16, 
    fontSize: 16, 
    backgroundColor: '#f9f9f9' 
  },
  button: { 
    width: '100%', 
    height: 48, 
    backgroundColor: '#4db5ff', 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20, 
    marginBottom: 16 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  errorText: { 
    color: 'red', 
    alignSelf: 'flex-start', 
    marginBottom: 8, 
    marginTop: -12, 
    fontSize: 13 
  },
  selector: {
    width: '100%',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});