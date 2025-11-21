import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import API from '../../api';

interface AppointmentDetail {
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
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
  return `${start} – ${end}`;
}

const statusMapping = {
  36: { label: 'Booked', color: '#FCD34D' }, // Yellow
  37: { label: 'Cancelled', color: '#EF4444' }, // Red
  38: { label: 'Start', color: '#3B82F6' }, // Blue
  39: { label: 'Confirm Start', color: '#10B981' }, // Green
  40: { label: 'Finish', color: '#8B5CF6' }, // Purple
  41: { label: 'Completed', color: '#6366F1' }, // Indigo
};

function getStatusText(status: number): string {
  return statusMapping[status as keyof typeof statusMapping]?.label || 'Unknown';
}

function getStatusColor(status: number): string {
  return statusMapping[status as keyof typeof statusMapping]?.color || '#666';
}

export default function TherapistAppDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [practitionerComment, setPractitionerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const data = JSON.parse(storedData);
        
        // Get practitioner ID from user data
        const practitionerId = data.practitionerId || data.practitioner_id || data.userID || data.id;
        
        if (!practitionerId) {
          console.error('No practitioner ID found in user data');
          Alert.alert('Error', 'Unable to identify practitioner. Please log in again.');
          return;
        }

        // Fetch all appointments for this practitioner
        const appointmentResponse = await API('apps/appointment/childAppointment', {
          practitioner_id: practitionerId
        }, 'GET', false);

        let allAppointments: AppointmentDetail[] = [];

        if (appointmentResponse && appointmentResponse.data) {
          allAppointments = appointmentResponse.data;
        } else if (Array.isArray(appointmentResponse)) {
          allAppointments = appointmentResponse;
        }

        // Find the specific appointment by ID
        const appointmentId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id as string, 10);
        const foundAppointment = allAppointments.find((appt: AppointmentDetail) => appt.id === appointmentId);
        
        if (foundAppointment) {
          setAppointment(foundAppointment);
          // Pre-fill practitioner comment if it exists
          if (foundAppointment.extendedProps.therapist_doctor_comment) {
            setPractitionerComment(foundAppointment.extendedProps.therapist_doctor_comment);
          }
        } else {
          console.error('Appointment not found:', { appointmentId, allAppointments });
          Alert.alert('Error', 'Appointment not found');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      Alert.alert('Error', 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetail();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!practitionerComment.trim()) {
      Alert.alert('Error', 'Please provide a comment');
      return;
    }

    if (!appointment) {
      Alert.alert('Error', 'No appointment data available');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await API('apps/appointment/updateFeedback', {
        appointment_id: appointment.id,
        therapist_doctor_comment: practitionerComment.trim()
      }, 'POST');

      if (response && (response as any).success === true) {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        Alert.alert('Success', 'Your comment has been submitted successfully!');
        
        // Update the appointment object with the new comment
        setAppointment(prev => prev ? {
          ...prev,
          extendedProps: {
            ...prev.extendedProps,
            therapist_doctor_comment: practitionerComment.trim()
          }
        } : null);
      } else {
        const errorMessage = response?.message || (response as any)?.error || 'Failed to submit comment';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: number) => {
    if (!appointment) {
      Alert.alert('Error', 'No appointment data available');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await API('apps/appointment/updateAppointmentStatus', {
        appointment_id: appointment.id,
        status: newStatus
      }, 'POST');

      if (response && (response as any).success === true) {
        Alert.alert('Success', 'Appointment status updated successfully!');
        
        // Update the appointment object with the new status
        setAppointment(prev => prev ? {
          ...prev,
          extendedProps: {
            ...prev.extendedProps,
            status: newStatus
          }
        } : null);
      } else {
        const errorMessage = response?.message || (response as any)?.error || 'Failed to update status';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Detail</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={styles.loadingText}>Loading appointment details...</Text>
        </View>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Detail</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Appointment not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Standardised Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Detail</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Appointment Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>APPOINTMENT {appointment.extendedProps.session_number}</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Patient Name: </Text>
            <Text style={styles.value}>{appointment.extendedProps.patient_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Practitioner: </Text>
            <Text style={styles.value}>{appointment.extendedProps.practitioner_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status: </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.extendedProps.status) }]} />
              <Text style={[styles.value, { color: getStatusColor(appointment.extendedProps.status) }]}>
                {getStatusText(appointment.extendedProps.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Service: </Text>
            <Text style={styles.value}>{appointment.extendedProps.service_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Date: </Text>
            <Text style={styles.value}>{formatDate(appointment.start)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Time: </Text>
            <Text style={styles.value}>{formatTime(appointment.start, appointment.end)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Time Slot: </Text>
            <Text style={styles.value}>{appointment.extendedProps.time_slot}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Session Number: </Text>
            <Text style={styles.value}>{appointment.extendedProps.session_number}</Text>
          </View>
          
          {appointment.extendedProps.parent_comment && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Parent Comment: </Text>
              <Text style={styles.value}>{appointment.extendedProps.parent_comment}</Text>
            </View>
          )}
          
          {appointment.extendedProps.therapist_doctor_comment && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Your Comment: </Text>
              <Text style={styles.value}>{appointment.extendedProps.therapist_doctor_comment}</Text>
            </View>
          )}
          
          {/* Parent Rating Section */}
          {appointment.extendedProps.parent_rate && (
            <View style={styles.feedbackSectionInCard}>
              <Text style={styles.feedbackTitleInCard}>Parent Rating</Text>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Rating: </Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={appointment.extendedProps.parent_rate >= star ? "star" : "star-outline"}
                      size={16}
                      color={appointment.extendedProps.parent_rate >= star ? "#FFD700" : "#ccc"}
                    />
                  ))}
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}></Text>
                <Text style={styles.ratingText}>{appointment.extendedProps.parent_rate} out of 5 stars</Text>
              </View>
            </View>
          )}
        </View>

        {/* Status Update Section */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusButtons}>
            {Object.entries(statusMapping).map(([statusId, statusInfo]) => (
              <TouchableOpacity
                key={statusId}
                style={[
                  styles.statusButton,
                  appointment.extendedProps.status === parseInt(statusId) && styles.statusButtonActive,
                  { borderColor: statusInfo.color }
                ]}
                onPress={() => handleUpdateStatus(parseInt(statusId))}
                disabled={submitting}
              >
                <Text style={[
                  styles.statusButtonText,
                  appointment.extendedProps.status === parseInt(statusId) && styles.statusButtonTextActive,
                  { color: statusInfo.color }
                ]}>
                  {statusInfo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Practitioner Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Add/Update Comment</Text>
          <TextInput
            style={styles.commentBox}
            placeholder="Add your comment about this session..."
            value={practitionerComment}
            onChangeText={setPractitionerComment}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
            onPress={handleSubmitComment}
            disabled={submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Submitting...' : 'Submit Comment'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Submission Message */}
        {submitted && (
          <Text style={styles.submittedMsg}>Your comment has been submitted!</Text>
        )}
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 16,
  },
  scrollContainer: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 16 },
  detailRow: { flexDirection: 'row', marginBottom: 12, flexWrap: 'wrap' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', minWidth: 120 },
  value: { fontSize: 14, color: '#555', flex: 1 },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusButtonTextActive: {
    fontWeight: 'bold',
  },
  commentSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  commentBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  submitBtn: {
    flex: 1,
    backgroundColor: '#24A8FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { color: '#666', fontSize: 16, fontWeight: 'bold' },
  submittedMsg: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  feedbackSectionInCard: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  feedbackTitleInCard: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
});
