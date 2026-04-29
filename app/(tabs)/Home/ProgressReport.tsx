import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProgressReport() {
  const [diary, setDiary] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    setModalVisible(true);
    setTimeout(() => {
      setModalVisible(false);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Progress Report</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Diary Report</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your report here ..."
          placeholderTextColor="#B0B0B0"
          multiline
          value={diary}
          onChangeText={setDiary}
        />
      </View>
      <TouchableOpacity
        style={[styles.saveBtn, diary ? styles.saveBtnActive : styles.saveBtnDisabled]}
        disabled={!diary}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>Save Report</Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>Report saved.</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 0,
  },
  headerRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  card: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#F6FBFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#222',
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E1F5FF',
  },
  saveBtn: {
    width: '92%',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnActive: {
    backgroundColor: '#24A8FF',
  },
  saveBtnDisabled: {
    backgroundColor: '#E1F5FF',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
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
    padding: 32,
    minWidth: 180,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  modalText: {
    fontSize: 18,
    color: '#24A8FF',
    fontWeight: 'bold',
  },
}); 