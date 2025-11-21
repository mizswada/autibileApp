import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import API from '../../api';

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
        router.push('/'); // or any page you want after completion
      } else {
        alert(response.message || 'Failed to save parent details');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving parent details');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Parent Details</Text>

      <TextInput
        style={styles.input}
        placeholder="Relationship"
        value={relationship}
        onChangeText={setRelationship}
      />

      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={gender}
        onChangeText={setGender}
      />

      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
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
  button: { backgroundColor: '#4db5ff', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
