import { DateInputField } from '@/components/DateInputField';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import API from '../../api';

type Option = { key: string; label: string; value: string };

const genderOptions: Option[] = [
  { key: 'default', label: '-- Please select --', value: '' },
  { key: 'male', label: 'Male', value: 'Male' },
  { key: 'female', label: 'Female', value: 'Female' },
];

export default function parentsInformation() {
  const router = useRouter();
  const { userID } = useLocalSearchParams();

  const [relationship, setRelationship] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nationality, setNationality] = useState('');

  const handleSubmit = async () => {
    try {
      // Call your backend API to update parent details
      const response = await API('https://YOUR_BACKEND_URL/api/parents/details', {
        userID,
        relationship,
        gender,
        dateOfBirth,
        nationality,
        // include other fields as required
      });

      if (response.statusCode === 200) {
        alert('Parent details saved');
        router.replace('/parentsPage');
      } else {
        alert(response.message || 'Failed to save parent details');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving parent details');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Parent Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Relationship"
        value={relationship}
        onChangeText={setRelationship}
      />

      <ModalSelector
        data={genderOptions}
        initValue="-- Please select --"
        onChange={(option: Option) => setGender(option.value)}
        style={styles.input}
        initValueTextStyle={{ color: gender ? '#000' : '#999' }}
        selectTextStyle={{ fontSize: 16 }}
      >
        <TextInput
          style={styles.input}
          editable={false}
          placeholder="-- Please select --"
          value={genderOptions.find((o) => o.value === gender)?.label || ''}
        />
      </ModalSelector>

      <DateInputField
        value={dateOfBirth}
        onChange={setDateOfBirth}
        maximumDate={new Date()}
        containerStyle={styles.input}
        inputStyle={styles.dateInput}
      />

      <TextInput
        style={styles.input}
        placeholder="Nationality"
        value={nationality}
        onChangeText={setNationality}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 },
  dateInput: { flex: 1, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: 'transparent' },
  button: { backgroundColor: '#4db5ff', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
