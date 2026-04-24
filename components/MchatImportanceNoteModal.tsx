import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** Shown before starting M-CHAT-R screening */
export const MCHAT_IMPORTANCE_NOTE =
  'M-CHAT-R is a screening tool—not a diagnostic test—used to identify children who may be at risk for autism spectrum disorder (ASD). This application is not intended to provide a medical diagnosis. M-CHAT-R is validated for screening children between 16 and 30 months of age.';

type Props = {
  visible: boolean;
  onContinue: () => void;
};

export function MchatImportanceNoteModal ({ visible, onContinue }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onContinue}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <Ionicons name="information-circle" size={28} color="#0B8FAC" />
            <Text style={styles.title}>Important note</Text>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.body}>{MCHAT_IMPORTANCE_NOTE}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={onContinue} activeOpacity={0.85}>
            <Text style={styles.btnText}>I understand, continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  scroll: {
    maxHeight: 360,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#48B2E8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
