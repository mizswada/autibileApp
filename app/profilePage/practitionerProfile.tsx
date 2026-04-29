import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import API from '../../api';

interface PractitionerData {
  practitionerID: string;
  userID: string;
  username: string;
  fullName: string;
  email: string;
  type: string;
  registrationNo: string;
  phone: string;
  ic: string;
  specialty: string;
  department: string;
  workplace: string;
  qualification: string;
  experience: string | number;
  signature: string;
  status: string;
}

export default function PractitionerProfile() {
  const [practitionerData, setPractitionerData] = useState<PractitionerData | null>(null);
  const [isEditingPractitioner, setIsEditingPractitioner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);

  useEffect(() => {
    fetchPractitionerData();
    fetchDepartmentOptions();
  }, []);

  const pickSignatureImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.3, // Reduced quality to minimize file size
        allowsEditing: true,
        aspect: [4, 1], // Signature aspect ratio
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected image URI:', asset.uri);
        console.log('Selected image base64 length:', asset.base64?.length || 0);
        
        if (practitionerData && asset.base64) {
          // Check if base64 string is too large (> 1MB)
          const base64Size = asset.base64.length;
          const maxSize = 1000000; // 1MB limit
          
          if (base64Size > maxSize) {
            Alert.alert(
              'Image Too Large', 
              'The selected image is too large. Please choose a smaller image or reduce the quality.',
              [{ text: 'OK' }]
            );
            return;
          }
          
          // Store with data:image/png;base64, prefix for database
          const fullSignature = `data:image/png;base64,${asset.base64}`;
          setPractitionerData({...practitionerData, signature: fullSignature});
          setSignaturePreview(asset.uri);
          console.log('Signature updated successfully');
        }
      } else {
        console.log('Image selection canceled or failed');
      }
    } catch (error) {
      console.error('Error picking signature image:', error);
      Alert.alert('Error', 'Failed to select signature image');
    }
  };

  const fetchDepartmentOptions = async () => {
    try {
      const response = await API('lookup/departments', {}, 'GET', false);
      if (response && Array.isArray(response)) {
        setDepartmentOptions(response);
      }
    } catch (error) {
      console.error('Error fetching department options:', error);
    }
  };

  const getDepartmentName = (departmentId: string) => {
    if (!departmentId || !departmentOptions.length) return departmentId || 'Not specified';
    const department = departmentOptions.find(dept => dept.lookupID.toString() === departmentId.toString());
    return department ? department.title : departmentId || 'Not specified';
  };

  const fetchPractitionerData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const data = JSON.parse(storedData);
        
        // Fetch practitioner data using the practitioner API
        const response = await API('apps/practitioners/displayDetails', { 
          practitionerID: data.practitionerId 
        }, 'GET', false);
        
        if (response.statusCode === 200 && response.data) {
          const practitioners = response.data as any[];
          const currentPractitioner = practitioners.length > 0 ? practitioners[0] : null;
          
          if (currentPractitioner) {
            console.log('Current practitioner experience:', currentPractitioner.experience, typeof currentPractitioner.experience);
            setPractitionerData(currentPractitioner);
            // Set signature preview if signature exists
            if (currentPractitioner.signature) {
              console.log('Found signature:', currentPractitioner.signature.substring(0, 50) + '...');
              // Check if signature already has data:image prefix
              if (currentPractitioner.signature.startsWith('data:image')) {
                setSignaturePreview(currentPractitioner.signature);
              } else {
                // Convert base64 to displayable URI
                setSignaturePreview(`data:image/png;base64,${currentPractitioner.signature}`);
              }
            } else {
              console.log('No signature found in practitioner data');
            }
          } else {
            console.error('No practitioner data found in API response');
          }
        } else {
          console.error('Failed to fetch practitioner data:', response.message);
          
          // Fallback: Use stored data if API fails
          const fallbackPractitioner = {
            practitionerID: data.practitionerId || '',
            userID: data.userID || '',
            username: data.username || '',
            fullName: data.fullName || '',
            email: data.email || '',
            type: data.type || '',
            registrationNo: data.registrationNo || '',
            phone: data.phone || '',
            ic: data.ic || '',
            specialty: data.specialty || '',
            department: data.department || '',
            workplace: data.workplace || '',
            qualification: data.qualification || '',
            experience: data.experience || '',
            signature: data.signature || '',
            status: data.status || ''
          };
          
          setPractitionerData(fallbackPractitioner);
          if (fallbackPractitioner.signature) {
            // Check if signature already has data:image prefix
            if (fallbackPractitioner.signature.startsWith('data:image')) {
              setSignaturePreview(fallbackPractitioner.signature);
            } else {
              // Convert base64 to displayable URI
              setSignaturePreview(`data:image/png;base64,${fallbackPractitioner.signature}`);
            }
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching practitioner data:', error);
      setLoading(false);
    }
  };

  const handleSavePractitioner = async () => {
    if (!practitionerData) return;

    setSaving(true);
    try {
      // Check if signature is too large before sending
      if (practitionerData.signature && practitionerData.signature.length > 2000000) { // 2MB limit
        Alert.alert(
          'Signature Too Large', 
          'The signature image is too large. Please select a smaller image.',
          [{ text: 'OK' }]
        );
        setSaving(false);
        return;
      }

      const response = await API('apps/practitioners/updateDetails', {
        practitionerID: practitionerData.practitionerID,
        fullName: practitionerData.fullName,
        email: practitionerData.email,
        phone: practitionerData.phone,
        ic: practitionerData.ic,
        type: practitionerData.type,
        registrationNo: practitionerData.registrationNo,
        specialty: practitionerData.specialty,
        department: practitionerData.department,
        workplace: practitionerData.workplace,
        qualification: practitionerData.qualification,
        experience: practitionerData.experience,
        signature: practitionerData.signature
      }, 'PUT');

      if (response.statusCode === 200) {
        Alert.alert('Success', 'Practitioner information updated successfully');
        setIsEditingPractitioner(false);
        fetchPractitionerData(); // Refresh data
      } else {
        Alert.alert('Error', response.message || 'Failed to update practitioner information');
      }
    } catch (error: any) {
      console.error('Error updating practitioner:', error);
      if (error.name === 'AbortError') {
        Alert.alert(
          'Request Timeout', 
          'The request took too long to complete. This might be due to a large signature image. Please try with a smaller image.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to update practitioner information');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!practitionerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No practitioner data found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {/* Practitioner Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Practitioner Information</Text>
          <TouchableOpacity 
            style={[styles.editButton, isEditingPractitioner && styles.editButtonActive]}
            onPress={() => setIsEditingPractitioner(!isEditingPractitioner)}
          >
            <Text style={[styles.editButtonText, isEditingPractitioner && styles.editButtonTextActive]}>
              {isEditingPractitioner ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.fullName}
              onChangeText={(text) => setPractitionerData({...practitionerData, fullName: text})}
              editable={isEditingPractitioner}
              placeholder="Enter full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.email}
              onChangeText={(text) => setPractitionerData({...practitionerData, email: text})}
              editable={isEditingPractitioner}
              placeholder="Enter email"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.phone}
              onChangeText={(text) => setPractitionerData({...practitionerData, phone: text})}
              editable={isEditingPractitioner}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IC Number</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.ic}
              onChangeText={(text) => setPractitionerData({...practitionerData, ic: text})}
              editable={isEditingPractitioner}
              placeholder="Enter IC number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.type}
              onChangeText={(text) => setPractitionerData({...practitionerData, type: text})}
              editable={isEditingPractitioner}
              placeholder="Enter practitioner type"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Registration Number</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.registrationNo}
              onChangeText={(text) => setPractitionerData({...practitionerData, registrationNo: text})}
              editable={isEditingPractitioner}
              placeholder="Enter registration number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specialty</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.specialty}
              onChangeText={(text) => setPractitionerData({...practitionerData, specialty: text})}
              editable={isEditingPractitioner}
              placeholder="Enter specialty"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            {isEditingPractitioner ? (
              <ModalSelector
                data={departmentOptions.map((option, index) => ({ 
                  key: `dept-${index}`, 
                  label: option.title, 
                  value: option.lookupID 
                }))}
                initValue={getDepartmentName(practitionerData.department)}
                onChange={(option: any) => {
                  setPractitionerData({...practitionerData, department: option.value.toString()});
                }}
                style={styles.selector}
                initValueTextStyle={{ color: practitionerData.department ? '#000' : '#999' }}
                selectTextStyle={{ fontSize: 16 }}
              >
                <TextInput
                  style={styles.input}
                  editable={false}
                  placeholder="-- Please select --"
                  value={getDepartmentName(practitionerData.department)}
                />
              </ModalSelector>
            ) : (
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={getDepartmentName(practitionerData.department)}
                editable={false}
                placeholder="Department"
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Workplace</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.workplace}
              onChangeText={(text) => setPractitionerData({...practitionerData, workplace: text})}
              editable={isEditingPractitioner}
              placeholder="Enter workplace"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Qualification</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={practitionerData.qualification}
              onChangeText={(text) => setPractitionerData({...practitionerData, qualification: text})}
              editable={isEditingPractitioner}
              placeholder="Enter qualification"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Experience (Years)</Text>
            <TextInput
              style={[styles.input, !isEditingPractitioner && styles.inputDisabled]}
              value={String(practitionerData.experience || '')}
              onChangeText={(text) => setPractitionerData({...practitionerData, experience: text})}
              editable={isEditingPractitioner}
              placeholder="Enter years of experience"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Signature</Text>
            {isEditingPractitioner ? (
              <TouchableOpacity style={styles.signatureInput} onPress={pickSignatureImage}>
                <Text style={styles.signatureInputText}>
                  {practitionerData.signature ? 'Signature image selected' : 'Tap to select signature image'}
                </Text>
                <Ionicons name="camera-outline" size={20} color="#666" />
              </TouchableOpacity>
            ) : (
              <View style={styles.signatureDisplay}>
                <Text style={styles.signatureInputText}>
                  {practitionerData.signature ? 'Signature uploaded' : 'No signature uploaded'}
                </Text>
              </View>
            )}
            {signaturePreview && (
              <View style={styles.signatureImageContainer}>
                <Image
                  source={{ uri: signaturePreview }}
                  style={styles.signatureImage}
                  resizeMode="contain"
                  onError={(error) => console.error('Image loading error:', error)}
                  onLoad={() => console.log('Image loaded successfully')}
                />
              </View>
            )}
            {practitionerData.signature && !signaturePreview && (
              <View style={styles.signatureImageContainer}>
                <Text style={styles.signatureErrorText}>Failed to load signature image</Text>
              </View>
            )}
          </View>

          {isEditingPractitioner && (
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSavePractitioner}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Practitioner Information'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1F5FF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  editButton: {
    backgroundColor: '#F1F1F1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButtonActive: {
    backgroundColor: '#24A8FF',
    borderColor: '#24A8FF',
  },
  editButtonText: {
    color: '#222',
    fontSize: 12,
    fontWeight: '500',
  },
  editButtonTextActive: {
    color: '#fff',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#E1F5FF',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#24A8FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  signatureInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  signatureInputText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  signatureDisplay: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  signatureImage: {
    width: '100%',
    height: 100,
    marginTop: 8,
    borderRadius: 4,
  },
  signatureImageContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1F5FF',
    borderRadius: 4,
  },
  signatureErrorText: {
    fontSize: 12,
    color: '#ff0000',
    textAlign: 'center',
  },
  selector: {
    width: '100%',
    marginBottom: 0,
  },
}); 