import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import API from '../../api';

type Option = { key: string; label: string; value: string };

export default function ParentsInformation() {
  const router = useRouter();
  const { parentID } = useLocalSearchParams();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');
  const [status, setStatus] = useState('Active');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressLine3, setAddressLine3] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [state, setState] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  const [relationshipOptions, setRelationshipOptions] = useState<Option[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<Option[]>([]);
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  
  const genderOptions: Option[] = [
    { key: 'default', label: '-- Please select --', value: '' },
    { key: 'male', label: 'Male', value: 'Male' },
    { key: 'female', label: 'Female', value: 'Female' },
  ];

  const statusOptions: Option[] = [
    { key: 'active', label: 'Active', value: 'Active' },
    { key: 'inactive', label: 'Inactive', value: 'Inactive' },
  ];

  const [errors, setErrors] = useState({
    relationship: '',
    gender: '',
    dateOfBirth: '',
    nationality: '',
    addressLine1: '',
    city: '',
    postcode: '',
    state: '',
  });

  const onChangeDate = (event: any, selectedDate: any) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0];
      setDateOfBirth(formatted);
      validateField('dateOfBirth', formatted);
    }
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [relRes, natRes, stateRes] = await Promise.all([
          API("apps/parents/lookupRelationship", {}, "GET", false),
          API("apps/parents/lookupNationality", {}, "GET", false),
          API("apps/parents/lookupState", {}, "GET", false),
        ]);

        setRelationshipOptions([
          { key: 'default', label: '-- Please select --', value: '' },
          ...(Array.isArray(relRes.data) ? relRes.data : Array.isArray(relRes) ? relRes : []).map((i: any) => ({
            key: String(i.lookupID),
            label: i.title,
            value: i.lookupID
          }))
        ]);
        
        setNationalityOptions([
          { key: 'default', label: '-- Please select --', value: '' },
          ...(Array.isArray(natRes.data) ? natRes.data : Array.isArray(natRes) ? natRes : []).map((i: any) => ({
            key: String(i.lookupID),
            label: i.title,
            value: i.lookupID
          }))
        ]);
        
        setStateOptions([
          { key: 'default', label: '-- Please select --', value: '' },
          ...(Array.isArray(stateRes.data) ? stateRes.data : Array.isArray(stateRes) ? stateRes : []).map((i: any) => ({
            key: String(i.lookupID),
            label: i.title,
            value: i.lookupID
          }))
        ]);
      } catch (err) {
        console.error('Dropdown fetch error:', err);
        Alert.alert('Error', 'Failed to load dropdown options');
      } finally {
        setLoading(false);
      }
    };

    fetchDropdowns();
  }, []);

  useEffect(() => {
    const checkFormValidity = () => {
      const fieldValues = {
        relationship,
        gender,
        dateOfBirth,
        nationality,
        addressLine1,
        city,
        postcode,
        state,
      };
      
      const requiredFields = ['relationship', 'gender', 'dateOfBirth', 'nationality', 'addressLine1', 'city', 'postcode', 'state'];
      let valid = true;
      requiredFields.forEach(field => {
        const value = fieldValues[field as keyof typeof fieldValues];
        if (!String(value ?? '').trim()) valid = false;
      });
      setIsFormValid(valid);
    };

    checkFormValidity();
  }, [relationship, gender, dateOfBirth, nationality, addressLine1, city, postcode, state]);

  const validateField = (field: string, value: any) => {
    let message = '';
    if (!String(value ?? '').trim()) message = 'This field is required';
    setErrors(prev => ({ ...prev, [field]: message }));
    return message === '';
  };

  const validateForm = () => {
    const fieldValues = {
      relationship,
      gender,
      dateOfBirth,
      nationality,
      addressLine1,
      city,
      postcode,
      state,
    };
    
    const requiredFields = ['relationship', 'gender', 'dateOfBirth', 'nationality', 'addressLine1', 'city', 'postcode', 'state'];
    let valid = true;
    requiredFields.forEach(field => {
      const value = fieldValues[field as keyof typeof fieldValues];
      if (!validateField(field, value)) valid = false;
    });
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const storedData = await AsyncStorage.getItem('userData');
      let parentId = null;
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          parentId = data.parentId;
          console.log('parentId:', parentId);
        } catch (e) {
          console.log('Failed to parse storedData:', storedData);
        }
      } else {
        console.log('No data found in AsyncStorage');
      }

      const response = await API('apps/parents/details', {
        parentID: parentId || parentID,
        relationship,
        gender,
        dateOfBirth,
        nationality,
        state,
        addressLine1,
        addressLine2,
        addressLine3,
        city,
        postcode,
        status,
      }, "POST", false);

      if (response.statusCode === 200) {
        Alert.alert('Success', 'Parent details saved');
        router.push('/parentsPage');
      } else {
        Alert.alert('Error', response.message || 'Failed to save parent details');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error saving parent details');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4db5ff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Parent Details</Text>
      </View>

      {/* Relationship Picker */}
      <Text style={styles.label}>Relationship</Text>
      <ModalSelector
        data={relationshipOptions}
        initValue="-- Please select --"
        onChange={(option) => {
          setRelationship(option.value);
          validateField('relationship', option.value);
        }}
        style={styles.selector}
        initValueTextStyle={{ color: relationship ? '#000' : '#999' }}
        selectTextStyle={{ fontSize: 16 }}
      >
        <TextInput
          style={styles.input}
          editable={false}
          placeholder="-- Please select --"
          value={relationshipOptions.find(o => o.value === relationship)?.label || ''}
        />
      </ModalSelector>
      {errors.relationship ? <Text style={styles.errorText}>{errors.relationship}</Text> : null}

      {/* Gender Picker */}
      <Text style={styles.label}>Gender</Text>
      <ModalSelector
        data={genderOptions}
        initValue="-- Please select --"
        onChange={(option) => {
          setGender(option.value);
          validateField('gender', option.value);
        }}
        style={styles.selector}
        initValueTextStyle={{ color: gender ? '#000' : '#999' }}
        selectTextStyle={{ fontSize: 16 }}
      >
        <TextInput
          style={styles.input}
          editable={false}
          placeholder="-- Please select --"
          value={genderOptions.find(o => o.value === gender)?.label || ''}
        />
      </ModalSelector>
      {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

      {/* Date of Birth */}
      <Text style={styles.label}>Date of Birth</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: dateOfBirth ? '#000' : '#999', fontSize: 16 }}>
          {dateOfBirth || 'YYYY-MM-DD'}
        </Text>
      </TouchableOpacity>
      {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}

      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onChangeDate}
        />
      )}

      {/* Nationality Picker */}
      <Text style={styles.label}>Nationality</Text>
      <ModalSelector
        data={nationalityOptions}
        initValue="-- Please select --"
        onChange={(option) => {
          setNationality(option.value);
          validateField('nationality', option.value);
        }}
        style={styles.selector}
        initValueTextStyle={{ color: nationality ? '#000' : '#999' }}
        selectTextStyle={{ fontSize: 16 }}
      >
        <TextInput
          style={styles.input}
          editable={false}
          placeholder="-- Please select --"
          value={nationalityOptions.find(o => o.value === nationality)?.label || ''}
        />
      </ModalSelector>
      {errors.nationality ? <Text style={styles.errorText}>{errors.nationality}</Text> : null}

      {/* Address Line 1 */}
      <Text style={styles.label}>Address Line 1</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Address Line 1"
        value={addressLine1}
        onChangeText={(text) => {
          setAddressLine1(text);
          validateField('addressLine1', text);
        }}
      />
      {errors.addressLine1 ? <Text style={styles.errorText}>{errors.addressLine1}</Text> : null}

      {/* Address Line 2 */}
      <Text style={styles.label}>Address Line 2</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Address Line 2"
        value={addressLine2}
        onChangeText={setAddressLine2}
      />

      {/* Address Line 3 */}
      <Text style={styles.label}>Address Line 3</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Address Line 3"
        value={addressLine3}
        onChangeText={setAddressLine3}
      />

      {/* City */}
      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter City"
        value={city}
        onChangeText={(text) => {
          setCity(text);
          validateField('city', text);
        }}
      />
      {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

      {/* Postcode */}
      <Text style={styles.label}>Postcode</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Postcode"
        value={postcode}
        onChangeText={(text) => {
          setPostcode(text);
          validateField('postcode', text);
        }}
      />
      {errors.postcode ? <Text style={styles.errorText}>{errors.postcode}</Text> : null}

      {/* State Picker */}
      <Text style={styles.label}>State</Text>
      <ModalSelector
        data={stateOptions}
        initValue="-- Please select --"
        onChange={(option) => {
          setState(option.value);
          validateField('state', option.value);
        }}
        style={styles.selector}
        initValueTextStyle={{ color: state ? '#000' : '#999' }}
        selectTextStyle={{ fontSize: 16 }}
      >
        <TextInput
          style={styles.input}
          editable={false}
          placeholder="-- Please select --"
          value={stateOptions.find(o => o.value === state)?.label || ''}
        />
      </ModalSelector>
      {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}

      {/* Status Picker */}
      <Text style={styles.label}>Status</Text>
      <TextInput
        style={styles.input}
        value={statusOptions.find(o => o.value === status)?.label || ''}
        editable={false}
        placeholder="Active"
      />

      <TouchableOpacity
        style={[styles.button, !isFormValid && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!isFormValid}
      >
        <Text style={styles.buttonText}>Submit Details</Text>
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
    color: '#0B8FAC' 
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
