import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const appointmentDetails = {
  1: {
    doctor: 'Dr Norazman Bin Idris',
    patient: 'Adham Bin Azman',
    status: 'Confirmed',
    type: 'Initial Autism Diagnostic Assessment',
    date: 'Monday, June 10, 2025',
    time: '10:00 AM – 11:30 AM',
    duration: '1 Hour 30 Minutes',
    location: 'ABC Autism Center – Kelana Jaya Branch',
    room: 'Room 3 – Sensory-Friendly Room',
  },
  // Add more static details for other IDs if needed
};

export default function AppointmentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [feedback, setFeedback] = useState('');

  // Ensure id is a string and convert to number for lookup
  const idNum = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id as string, 10);
  const details = appointmentDetails[idNum as keyof typeof appointmentDetails] || appointmentDetails[1];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backArrow}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>APPOINTMENT 1</Text>
        <View style={styles.detailRow}><Text style={styles.label}>Appointment with </Text><Text style={styles.value}>{details.doctor}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Patient's Name : </Text><Text style={styles.value}>{details.patient}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Status : </Text><Text style={styles.value}>{details.status}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Type: </Text><Text style={styles.value}>{details.type}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Date: </Text><Text style={styles.value}>{details.date}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Time: </Text><Text style={styles.value}>{details.time}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Duration: </Text><Text style={styles.value}>{details.duration}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Location: </Text><Text style={styles.value}>{details.location}</Text></View>
        <View style={styles.detailRow}><Text style={styles.label}>Room: </Text><Text style={styles.value}>{details.room}</Text></View>
      </View>
      <TextInput
        style={styles.feedbackBox}
        placeholder="give your feedback..."
        value={feedback}
        onChangeText={setFeedback}
        multiline
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E1F5FF',
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginLeft: 2,
  },
  backArrow: {
    fontSize: 28,
    color: '#2A2A2A',
    fontWeight: 'bold',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    backgroundColor: '#48B2E8',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 12,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  label: {
    color: '#2A2A2A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  value: {
    color: '#2A2A2A',
    fontSize: 14,
    fontWeight: '400',
  },
  feedbackBox: {
    width: '100%',
    minHeight: 70,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 18,
    borderColor: '#D9D9D9',
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
    gap: 12,
  },
  submitBtn: {
    backgroundColor: '#48B2E8',
    borderRadius: 8,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  cancelText: {
    color: '#2A2A2A',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 