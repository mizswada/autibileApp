import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import API from '../../api';

interface TechSupport {
  no: number;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
}

export default function ContactUs() {
  const [techSupportList, setTechSupportList] = useState<TechSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTechSupportList = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API('apps/contactUs/list', {}, 'GET', false);

      // Handle direct array response from API
      if (Array.isArray(response)) {
        setTechSupportList(response);
      } else if (response.statusCode === 200) {
        // Handle wrapped response
        setTechSupportList(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch contact list');
      }
    } catch (error) {
      console.error('Error fetching tech support list:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechSupportList();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTechSupportList();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#4CAF50';
      case 'inactive':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const handleContactPress = (contact: TechSupport) => {
    Alert.alert(
      contact.name,
      `Email: ${contact.email}\nPhone: ${contact.phoneNumber}\nStatus: ${getStatusText(contact.status)}`,
      [
        { text: 'Copy Email', onPress: () => console.log('Copy email:', contact.email) },
        { text: 'Copy Phone', onPress: () => console.log('Copy phone:', contact.phoneNumber) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4db5ff" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTechSupportList}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4db5ff']} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Support Team</Text>
          <Text style={styles.cardDescription}>
            Get in touch with our technical support team for assistance with any issues or questions.
          </Text>

          {techSupportList.length > 0 ? (
            techSupportList.map((contact, index) => (
              <TouchableOpacity
                key={contact.no}
                style={styles.contactCard}
                onPress={() => handleContactPress(contact)}
              >
                <View style={styles.contactHeader}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <View style={styles.statusContainer}>
                      <View 
                        style={[
                          styles.statusDot, 
                          { backgroundColor: getStatusColor(contact.status) }
                        ]} 
                      />
                      <Text style={styles.statusText}>
                        {getStatusText(contact.status)}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>

                <View style={styles.contactDetails}>
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={16} color="#4db5ff" />
                    <Text style={styles.contactText}>{contact.email}</Text>
                  </View>
                  <View style={styles.contactItem}>
                    <Ionicons name="call-outline" size={16} color="#4db5ff" />
                    <Text style={styles.contactText}>{contact.phoneNumber}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No contacts available</Text>
              <Text style={styles.emptySubtext}>
                Technical support contacts will appear here when available.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#99DBFD',
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
  container: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  contactDetails: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4db5ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
