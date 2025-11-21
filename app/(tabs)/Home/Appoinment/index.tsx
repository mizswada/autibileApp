import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


type Appointment = {
  id: number;
  date: string;
  title: string;
  summary: string;
};

const appointments: Appointment[] = [
  { id: 1, date: '2025-05-05', title: 'Appointment 1', summary: 'you have an appointment booked with Dr. Aznan' },
  { id: 2, date: '2025-05-08', title: 'Appointment 2', summary: 'you have an appointment booked with Dr. Aznan' },
  { id: 3, date: '2025-05-16', title: 'Appointment 3', summary: 'you have an appointment booked with Dr. Aznan' },
  { id: 4, date: '2025-05-25', title: 'Appointment 4', summary: 'you have an appointment booked with Dr. Aznan' },
];

const daysShort = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  // Returns 0 (Mon) to 6 (Sun)
  const d = new Date(year, month, 1);
  return (d.getDay() + 6) % 7;
}

export default function AppointmentManagement() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const year = 2025;
  const month = 4; // May (0-indexed)
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  const appointmentDates = appointments.map(a => a.date);

  const handleDayPress = (day: number) => {
    const dateStr = `${year}-05-${day.toString().padStart(2, '0')}`;
    const appt = appointments.find(a => a.date === dateStr);
    if (appt) {
      setSelectedDate(appt);
      setModalVisible(true);
    }
  };

  const handleModalPress = () => {
    setModalVisible(false);
    if (selectedDate) {
      router.push({ pathname: '/(tabs)/Home/Appoinment/AppointmentDetail', params: { id: String(selectedDate.id) } });
    }
  };

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#2A2A2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
      </View>


      <View style={styles.calendarCard}>
        <Text style={styles.monthTitle}>May 2025</Text>
        <View style={styles.daysRow}>
          {daysShort.map((d, i) => (
            <Text key={i} style={styles.dayShort}>{d}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {calendarDays.map((day, idx) => {
            if (!day) return <View key={idx} style={styles.dayCell} />;
            const dateStr = `${year}-05-${day.toString().padStart(2, '0')}`;
            const isAppt = appointmentDates.includes(dateStr);
            return (
              <Pressable
                key={idx}
                style={[styles.dayCell, isAppt && styles.dayCellAppt]}
                onPress={() => isAppt && handleDayPress(day)}
              >
                <Text style={[styles.dayNum, isAppt && styles.dayNumAppt]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {/* Modal for appointment summary */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={handleModalPress}>
            <Text style={styles.modalDate}>5 June 2025</Text>
            <Text style={styles.modalTitle}>{selectedDate?.title}</Text>
            <Text style={styles.modalSummary}>{selectedDate?.summary}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
    alignItems: 'center',
    paddingTop: 80,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row', // ✅ add this line
    alignItems: 'center', // ✅ vertically center items within the row
    paddingHorizontal: 16, // optional for spacing
    marginBottom: 8,
  },
  backBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  calendarCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#48B2E8',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  dayShort: {
    width: '14.2%',
    textAlign: 'center',
    color: '#2A2A2A',
    fontWeight: '600',
    fontSize: 13,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: '14.2%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayNum: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  dayCellAppt: {
    backgroundColor: '#48B2E8',
    borderRadius: 8,
  },
  dayNumAppt: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modalDate: {
    fontSize: 15,
    color: '#48B2E8',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  modalSummary: {
    fontSize: 14,
    color: '#2A2A2A',
    textAlign: 'center',
  },
}); 