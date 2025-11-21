import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';

const questions = [
  'Does your child respond to their name when called in a noisy environment?',
  'Does your child follow simple instructions without repeated prompts?',
  'Does your child make eye contact when communicating?',
  'Does your child show interest in playing with other children?',
  'Does your child use gestures to communicate needs (e.g., pointing, waving)?',
];

export default function MChatRNextLevel() {
  const router = useRouter();
  const [answers, setAnswers] = useState<(null | 'yes' | 'no')[]>(Array(5).fill(null));
  const [showScore, setShowScore] = useState(false);

  const handleAnswer = (idx: number, ans: 'yes' | 'no') => {
    setAnswers(prev => prev.map((a, i) => (i === idx ? ans : a)));
  };

  const handleSubmit = () => {
    setShowScore(true);
  };

  const score = answers.filter(a => a === 'yes').length;
  const total = questions.length;
  const wrong = answers.filter(a => a === 'no').length;

  let level = '';
  let levelColor = '';
  if (wrong <= 1) {
    level = 'Low';
    levelColor = '#4CAF50'; // green
  } else if (wrong <= 3) {
    level = 'Average';
    levelColor = '#FFD600'; // yellow
  } else {
    level = 'High';
    levelColor = '#F44336'; // red
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>M-Chat-R Next Level</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {questions.map((q, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.qTitle}>Question {idx + 1}</Text>
            <Text style={styles.qText}>{q}</Text>
            <View style={styles.ansRow}>
              <TouchableOpacity
                style={[styles.ansBtn, answers[idx] === 'yes' && styles.ansBtnSelected]}
                onPress={() => handleAnswer(idx, 'yes')}
              >
                <Text style={[styles.ansText, answers[idx] === 'yes' && styles.ansTextSelected]}>yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ansBtn, answers[idx] === 'no' && styles.ansBtnSelected]}
                onPress={() => handleAnswer(idx, 'no')}
              >
                <Text style={[styles.ansText, answers[idx] === 'no' && styles.ansTextSelected]}>no</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        visible={showScore}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScore(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Next Level Score</Text>
            <Text style={styles.modalScoreText}>Correct answers (yes): <Text style={{fontWeight:'bold'}}>{score}/{total}</Text></Text>
            <Text style={styles.modalScoreText}>Wrong answers (no): <Text style={{fontWeight:'bold'}}>{wrong}</Text></Text>
            <Text style={[styles.modalScoreText, {color: levelColor, fontWeight: 'bold', fontSize: 20}]}>Level: {level}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowScore(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#99DBFD',
    paddingTop: 36,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 8,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  backArrow: {
    fontSize: 28,
    color: '#2A2A2A',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  qTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A2A2A',
    marginBottom: 6,
  },
  qText: {
    fontSize: 15,
    color: '#2A2A2A',
    marginBottom: 12,
  },
  ansRow: {
    flexDirection: 'row',
    gap: 16,
  },
  ansBtn: {
    backgroundColor: '#E1F5FF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#BFE6F7',
  },
  ansBtnSelected: {
    backgroundColor: '#48B2E8',
    borderColor: '#48B2E8',
  },
  ansText: {
    color: '#2A2A2A',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  ansTextSelected: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#48B2E8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitText: {
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
  modalContent: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  modalScoreText: {
    fontSize: 18,
    color: '#2A2A2A',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#4db5ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 