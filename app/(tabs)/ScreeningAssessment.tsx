import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ScreeningAssessment() {
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Screening & Assessment</Text>
      <Text style={styles.label}>Child's Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter child's name"
        value={childName}
        onChangeText={setChildName}
      />
      <Text style={styles.label}>Child's Age</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter child's age"
        keyboardType="numeric"
        value={childAge}
        onChangeText={setChildAge}
      />
      <Text style={styles.label}>Does your child respond to their name?</Text>
      <TextInput
        style={styles.input}
        placeholder="Yes or No"
        value={q1}
        onChangeText={setQ1}
      />
      <Text style={styles.label}>Does your child make eye contact?</Text>
      <TextInput
        style={styles.input}
        placeholder="Yes or No"
        value={q2}
        onChangeText={setQ2}
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    marginTop: 4,
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
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#4db5ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 