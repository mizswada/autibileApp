import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import API from '../../api';

interface Appointment {
  id: number;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    patient_id: number;
    patient_name: string;
    practitioner_id: number;
    practitioner_name: string;
    service_id: number;
    service_name: string;
    status: number;
    booked_by: string;
    time_slot: string;
    parent_comment: string;
    therapist_doctor_comment: string;
    parent_rate: number;
    slot_ID: number;
    session_number: number;
  };
}

const daysShort = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1);
  return (d.getDay() + 6) % 7;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

function formatTime(startTime: string, endTime: string): string {
  const start = new Date(startTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const end = new Date(endTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  return `${start} - ${end}`;
}

export default function ParentsAppointment() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Start with current month

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const data = JSON.parse(storedData);
        
                 // Get appointments for the current month
         const startDate = new Date(year, month, 1).toISOString().split('T')[0];
         const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
         
         
        
        // Get parent ID from user data
        const parentId = data.parentId || data.parent_id || data.userID || data.id;
        
        if (!parentId) {
          console.error('No parent ID found in user data');
          Alert.alert('Error', 'Unable to identify parent. Please log in again.');
          setAppointments([]);
          return;
        }

        // Try to get patients associated with this parent
        // If the patient list API doesn't exist, we'll try a different approach
        let patientIds: number[] = [];
        
        try {
          const patientsResponse = await API('apps/children/listChildren', {
            parentID: parentId
          }, 'GET', false);



          if (Array.isArray(patientsResponse)) {
            patientIds = patientsResponse.map((patient: any) => patient.id || patient.patient_id);
          } else if (patientsResponse && patientsResponse.statusCode === 200) {
            const patients = patientsResponse.data || [];
            patientIds = patients.map((patient: any) => patient.id || patient.patient_id);
          }
        } catch (error) {

          // If patient list API fails, try to get appointments directly with parent_id
          patientIds = [parentId]; // Use parent ID as fallback
        }

                 // Get appointments for each child
         let allAppointments: Appointment[] = [];
         
         if (patientIds.length > 0) {
           for (const patientId of patientIds) {
             try {
               const appointmentResponse = await API('apps/appointment/childAppointment', {
                 patient_id: patientId
               }, 'GET', false);

 

               if (appointmentResponse && appointmentResponse.data) {
                 allAppointments = [...allAppointments, ...appointmentResponse.data];
               } else if (Array.isArray(appointmentResponse)) {
                 allAppointments = [...allAppointments, ...appointmentResponse];
               }
             } catch (error) {
               console.error(`Error fetching appointments for patient ${patientId}:`, error);
             }
           }
         }


        setAppointments(allAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [currentMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const [selectedAppointments, setSelectedAppointments] = useState<Appointment[]>([]);
  const [showAppointmentList, setShowAppointmentList] = useState(false);

  const handleDayPress = (day: number) => {
    // Use the same date format as the calendar
    const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const appointmentsForDay = appointments.filter(a => a.start.startsWith(selectedDateStr));
    

    
    if (appointmentsForDay.length > 0) {
      if (appointmentsForDay.length === 1) {
        // Single appointment - show modal directly
        setSelectedDate(appointmentsForDay[0]);
        setModalVisible(true);
      } else {
        // Multiple appointments - show list to choose from
        setSelectedAppointments(appointmentsForDay);
        setShowAppointmentList(true);
      }
    }
  };

  const handleModalPress = () => {
    setModalVisible(false);
    if (selectedDate) {
      router.push({ 
        pathname: '/appointment/appointmentDetail', 
        params: { id: String(selectedDate.id) } 
      });
    }
  };

  const handleAppointmentSelect = (appointment: Appointment) => {
    setShowAppointmentList(false);
    setSelectedDate(appointment);
    setModalVisible(true);
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const appointmentDates = appointments.map(a => a.start.split('T')[0]);
  
  

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4db5ff']} />
        }
      >
        {/* Month Card */}
        <View style={styles.monthCard}>
          <TouchableOpacity 
            onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}
            style={styles.monthNavButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity 
            onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}
            style={styles.monthNavButton}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.daysRow}>
            {daysShort.map((d, i) => (
              <Text key={i} style={styles.dayShort}>{d}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
                                      {calendarDays.map((day, idx) => {
               if (!day) return <View key={idx} style={styles.dayCell} />;
               
               // Fix: Use proper date construction for the calendar
               const calendarDate = new Date(year, month, day);
               const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

        {/* Appointment List */}
        <Text style={styles.appointmentListTitle}>Your Appointments</Text>
        {appointments.length > 0 ? (
          appointments.map((appt) => (
            <View key={appt.id} style={styles.appointmentRow}>
              <View style={styles.dateBox}>
                <Text style={styles.dateText}>{formatDate(appt.start)}</Text>
              </View>
              <View style={styles.appointmentDetails}>
                <Text style={styles.title}>{appt.title}</Text>
                <Text style={styles.time}>{formatTime(appt.start, appt.end)}</Text>
                <Text style={styles.practitioner}>{appt.extendedProps.practitioner_name}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push({ 
                pathname: '/appointment/appointmentDetail', 
                params: { id: String(appt.id) } 
              })}>
                <Ionicons name="ellipsis-vertical" size={20} color="#888" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No appointments found</Text>
            <Text style={styles.emptySubtext}>
              You don't have any appointments scheduled for this month.
            </Text>
          </View>
        )}
      </ScrollView>

             {/* Modal */}
       <Modal
         visible={modalVisible}
         transparent
         animationType="fade"
         onRequestClose={() => setModalVisible(false)}
       >
         <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
           <Pressable style={styles.modalCard}>
             <Text style={styles.modalDate}>{selectedDate ? formatDate(selectedDate.start) : ''}</Text>
             <Text style={styles.modalTitle}>{selectedDate?.title}</Text>
             <Text style={styles.modalSummary}>
               {selectedDate ? formatTime(selectedDate.start, selectedDate.end) : ''}
             </Text>
             <Text style={styles.modalPractitioner}>
               {selectedDate?.extendedProps.practitioner_name}
             </Text>
                           <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleModalPress}
              >
                <Text style={styles.modalButtonText}>See Details</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Multiple Appointments List Modal */}
        <Modal
          visible={showAppointmentList}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAppointmentList(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAppointmentList(false)}>
            <Pressable style={styles.appointmentListModal}>
              <Text style={styles.appointmentListTitle}>Select Appointment</Text>
              <ScrollView style={styles.appointmentListScroll}>
                {selectedAppointments.map((appointment, index) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.appointmentListItem}
                    onPress={() => handleAppointmentSelect(appointment)}
                  >
                    <Text style={styles.appointmentItemTitle}>{appointment.title}</Text>
                    <Text style={styles.appointmentItemTime}>
                      {formatTime(appointment.start, appointment.end)}
                    </Text>
                    <Text style={styles.appointmentItemPractitioner}>
                      {appointment.extendedProps.practitioner_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAppointmentList(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E1F5FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#99DBFD',
    paddingTop: 70,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 30 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: { padding: 16 },
  monthCard: {
    backgroundColor: '#32ADE6',
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  calendarCard: {
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
    height: 270,
  },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 4 },
  dayShort: { width: '14.2%', textAlign: 'center', color: '#2A2A2A', fontWeight: '600', fontSize: 13 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  dayCell: { width: '14.2%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  dayNum: { fontSize: 16, color: '#2A2A2A', fontWeight: '500' },
  dayCellAppt: { backgroundColor: '#48B2E8', borderRadius: 8 },
  dayNumAppt: { color: '#fff', fontWeight: 'bold' },
  appointmentListTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', marginVertical: 12 },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateBox: {
    backgroundColor: '#32ADE6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  dateText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  appointmentDetails: { flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  time: { fontSize: 12, color: '#555', marginTop: 4 },
  practitioner: { fontSize: 11, color: '#666', marginTop: 2 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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
  modalDate: { fontSize: 15, color: '#48B2E8', fontWeight: 'bold', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#2A2A2A', marginBottom: 4 },
  modalSummary: { fontSize: 14, color: '#2A2A2A', textAlign: 'center', marginBottom: 8 },
  modalPractitioner: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 16 },
  modalButton: {
    backgroundColor: '#48B2E8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  appointmentListModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
    maxHeight: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentListScroll: {
    maxHeight: 250,
    width: '100%',
  },
  appointmentListItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '100%',
  },
  appointmentItemTitle: { fontSize: 14, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  appointmentItemTime: { fontSize: 12, color: '#555', marginBottom: 2 },
  appointmentItemPractitioner: { fontSize: 11, color: '#666' },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
