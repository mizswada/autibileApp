import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import API from '../../api';

interface TherapyPlan {
  no: number;
  id: number;
  name: string;
  description: string;
  center_name: string;
}

export default function TherapyPlanList() {
  const router = useRouter();
  const [plans, setPlans] = useState<TherapyPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTherapyPlans();
  }, []);

  const loadTherapyPlans = async () => {
    try {
      setLoading(true);
      
      const response = await API('apps/therapyPlan/list', {}, 'GET', false);
      
      if (response && Array.isArray(response)) {
        setPlans(response);
      } else {
        console.error('Invalid response format:', response);
        setPlans([]);
      }
    } catch (error) {
      console.error('Error loading therapy plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const truncateDescription = (description: string, maxWords: number = 10): string => {
    const words = description.split(' ');
    if (words.length <= maxWords) {
      return description;
    }
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const handleViewPlan = (plan: TherapyPlan) => {
    router.push({
      pathname: '/therapy/TherapyPlanDetail',
      params: { 
        id: String(plan.id),
        name: plan.name,
        description: plan.description,
        center_name: plan.center_name
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Therapy Plans</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4db5ff" />
            <Text style={styles.loadingText}>Loading therapy plans...</Text>
          </View>
        ) : plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Therapy Plans</Text>
            <Text style={styles.emptyText}>No therapy plans available at the moment</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <TouchableOpacity 
              key={plan.id} 
              style={styles.planBox}
              onPress={() => handleViewPlan(plan)}
            >
              <View style={styles.planContent}>
                {/* Plan Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={require('../../assets/images/therapyPlan.png')}
                    style={styles.planImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Plan Details */}
                <View style={styles.planDetails}>
                  <View style={styles.planHeader}>
                    <Text style={styles.planTitle}>{plan.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                  
                  <Text style={styles.planDescription}>
                    {truncateDescription(plan.description)}
                  </Text>
                  
                  <View style={styles.planInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.infoText}>{plan.center_name}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4db5ff',
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
    color: '#fff',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  planBox: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    marginRight: 16,
  },
  planImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#E1F5FF',
  },
  planDetails: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 12,
  },
  planDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
    marginBottom: 8,
  },
  planInfo: {
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#4db5ff',
    marginLeft: 8,
    fontWeight: '500',
  },
}); 