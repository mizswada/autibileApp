import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface TherapyPlan {
  id: number;
  name: string;
  description: string;
  center_name: string;
}

export default function TherapyPlanDetail() {
  const router = useRouter();
  const { id, name, description, center_name } = useLocalSearchParams();
  const [plan, setPlan] = useState<TherapyPlan | null>(null);

  useEffect(() => {
    if (id && name && description && center_name) {
      setPlan({
        id: Number(id),
        name: String(name),
        description: String(description),
        center_name: String(center_name)
      });
    }
  }, [id, name, description, center_name]);

  if (!plan) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Therapy Plan Details" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>Plan not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Therapy Plan Details" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Single Card with All Information */}
        <View style={styles.card}>
          {/* Round Plan Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/therapyPlan.png')}
              style={styles.planImage}
              resizeMode="cover"
            />
          </View>

          {/* Plan Title */}
          <Text style={styles.cardTitle}>{plan.name}</Text>
          
          {/* Plan Description */}
          <Text style={styles.description}>{plan.description}</Text>

          {/* Therapy Centre Info */}
          <View style={styles.centreSection}>
            <Text style={styles.sectionTitle}>Therapy Centre</Text>
            <View style={styles.centreInfo}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.centreName}>{plan.center_name}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F16742',
    marginTop: 16,
  },
  scrollContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#4db5ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 20,
  },
  planImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E1F5FF',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  centreSection: {
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  centreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  centreName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4db5ff',
    marginLeft: 8,
  },
}); 