import { MchatImportanceNoteModal } from '@/components/MchatImportanceNoteModal';
import { Ionicons } from '@expo/vector-icons'; // ✅ use icons
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const questions = [
  'Does your child enjoy being swung, bounced on your knee, etc.?',
  'Does your child take an interest in other children?',
  'Does your child like climbing on things, such as up stairs?',
  'Does your child enjoy playing peek-a-boo/hide-and-seek?',
  'Does your child ever pretend, for example, to talk on the phone or take care of dolls, or pretend other things?',
  'Does your child ever use his/her index finger to point, to ask for something?',
  'Does your child ever use his/her index finger to point, to indicate interest in something?',
  'Can your child play properly with small toys (e.g., cars or bricks) without just mouthing, fiddling, or dropping them?',
  'Does your child ever bring objects over to you (parent) to show you something?',
  'Does your child look you in the eye for more than a second or two?',
  'Does your child ever seem oversensitive to noise? (e.g., plugging ears)',
  'Does your child smile in response to your face or your smile?',
  'Does your child imitate you? (e.g., you make a face—will your child imitate it?)',
  'Does your child respond to his/her name when you call?',
  'If you point at a toy across the room, does your child look at it?',
  'Does your child walk?',
  'Does your child look at things you are looking at?',
  'Does your child make unusual finger movements near his/her face?',
  'Does your child try to attract your attention to his/her own activity?',
  'Have you ever wondered if your child is deaf?'
];

export default function MChatR() {
  const router = useRouter();
  const [answers, setAnswers] = useState<(null | 'yes' | 'no')[]>(Array(questions.length).fill(null));
  const [showScore, setShowScore] = useState(false);
  const [showMchatImportanceNote, setShowMchatImportanceNote] = useState(true);

  const handleAnswer = (idx: number, ans: 'yes' | 'no') => {
    setAnswers(prev => prev.map((a, i) => (i === idx ? ans : a)));
  };

  const handleSubmit = () => {
    if (wrong > 3) {
      router.push('/Mchat/MChatRNextLevel');
    } else {
      setShowScore(true);
    }
  };

  const score = answers.filter(a => a === 'yes').length;
  const wrong = answers.filter(a => a === 'no').length;
  const total = questions.length;

  return (
    <View style={styles.container}>
      <MchatImportanceNoteModal
        visible={showMchatImportanceNote}
        onContinue={() => setShowMchatImportanceNote(false)}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/parentsPage')}>
          <Ionicons name="chevron-back" size={28} color="#2A2A2A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>M-CHAT-R</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {questions.map((q, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.qTitle}>Question {idx + 1}</Text>
            <Text style={styles.qText}>{q}</Text>
            <View style={styles.ansRow}>
              {['yes', 'no'].map(ans => (
                <TouchableOpacity
                  key={ans}
                  style={[
                    styles.ansBtn,
                    answers[idx] === ans && styles.ansBtnSelected
                  ]}
                  onPress={() => handleAnswer(idx, ans as 'yes' | 'no')}
                >
                  <Text style={[
                    styles.ansText,
                    answers[idx] === ans && styles.ansTextSelected
                  ]}>
                    {ans}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Score Modal */}
      <Modal visible={showScore} transparent animationType="fade" onRequestClose={() => setShowScore(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>M-CHAT-R Score</Text>
            <Text style={styles.modalScoreText}>
              Correct answers (yes): <Text style={{ fontWeight: 'bold' }}>{score}/{total}</Text>
            </Text>
            <Text style={styles.modalScoreText}>
              Wrong answers (no): <Text style={{ fontWeight: 'bold' }}>{wrong}</Text>
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setShowScore(false);
              if (wrong > 3) {
                router.push('/Mchat/MChatRNextLevel');
              }
            }}>
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
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E1F5FF',
    paddingTop: 36,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#48B2E8',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
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
