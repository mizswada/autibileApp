import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';

interface ChildData {
  fullname: string;
  ic: string;
  age: string;
}

export default function ManageChildScreen() {
  const router = useRouter();
  // Simulate fetching child data (replace with real API call)
  const [child, setChild] = useState<ChildData | null>(null); // null = no child yet
  const [form, setForm] = useState<ChildData>({ fullname: '', ic: '', age: '' });
  const [editing, setEditing] = useState(false);

  // Handle Add Child button
  const handleAddChild = () => {
    setEditing(true);
  };

  // Handle Save Changes
  const handleSave = () => {
    setChild({ ...form });
    setEditing(false);
    router.replace('/(tabs)'); // Go to parents dashboard after saving
  };

  // Handle input changes
  const handleChange = (field: keyof ChildData, value: string) => {
    setForm({ ...form, [field]: value });
  };

  // If no child and not editing, show "Add Child" card
  if (!child && !editing) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Manage Child</Text>
          <Text style={styles.subtitle}>You have not add any child yet</Text>
          <TouchableOpacity style={styles.button} onPress={handleAddChild}>
            <Text style={styles.buttonText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show form for adding or editing child
  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Child</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Fullname</Text>
        <TextInput
          style={styles.input}
          placeholder="enter your child's fullname"
          value={editing ? form.fullname : (child?.fullname || '')}
          editable={editing}
          onChangeText={text => handleChange('fullname', text)}
        />
        <Text style={styles.label}>MyKad/IC Number</Text>
        <TextInput
          style={styles.input}
          placeholder="enter your child's MyKad/IC number"
          value={editing ? form.ic : (child?.ic || '')}
          editable={editing}
          onChangeText={text => handleChange('ic', text)}
        />
        <Text style={styles.label}>Age</Text>
        <TextInput
          style={styles.input}
          placeholder="enter your child's age"
          value={editing ? form.age : (child?.age || '')}
          editable={editing}
          onChangeText={text => handleChange('age', text)}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              editing && form.fullname && form.ic && form.age
                ? '#22A7F0'
                : '#D6F0FF',
          },
        ]}
        disabled={!(editing && form.fullname && form.ic && form.age)}
        onPress={handleSave}
      >
        <Text style={[styles.buttonText, { color: editing && form.fullname && form.ic && form.age ? '#fff' : '#A0A0A0' }]}>Save Changes</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D6F0FF', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  subtitle: { color: '#888', marginBottom: 24 },
  button: { backgroundColor: '#22A7F0', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, marginTop: 16, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  header: { width: '100%', backgroundColor: '#B3E5FC', padding: 24, alignItems: 'flex-start' },
  headerTitle: { fontWeight: 'bold', fontSize: 22 },
  form: { width: '90%', marginTop: 24 },
  label: { fontWeight: 'bold', marginBottom: 4, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 4 },
}); 