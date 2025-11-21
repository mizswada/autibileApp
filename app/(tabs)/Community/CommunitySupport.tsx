import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const topics = [
  { id: 1, topic: 'Parenting Tips', description: 'Share and learn tips for parenting children with autism.' },
  { id: 2, topic: 'Therapy Experiences', description: 'Discuss different therapy approaches and results.' },
  { id: 3, topic: 'Local Resources', description: 'Find and share resources in your area.' },
];

export default function CommunitySupport() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleViewJoin = (topic: string) => {
    // You can add specific navigation logic here
    console.log(`Joining ${topic}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack}><Text style={styles.backArrow}>{'<'}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Community Support</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {topics.map((item) => (
          <View key={item.id} style={styles.topicBox}>
            <Text style={styles.label}>Topic: <Text style={styles.value}>{item.topic}</Text></Text>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{item.description}</Text>
            <TouchableOpacity style={styles.button} onPress={() => handleViewJoin(item.topic)}>
              <Text style={styles.buttonText}>View/Join</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f3fc',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: '#e3f3fc',
    borderBottomWidth: 0,
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: 26,
    color: '#222',
    fontWeight: 'bold',
    width: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
    marginLeft: -32,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  topicBox: {
    width: '100%',
    backgroundColor: '#f1f6fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#333',
  },
  value: {
    fontWeight: 'normal',
    color: '#555',
    marginBottom: 8,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#4db5ff',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 