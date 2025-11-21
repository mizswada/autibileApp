import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DisclaimerScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header - NOT affected by ScrollView padding */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disclaimer</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Important Note for M-CHAT R/F</Text>

        <View style={styles.box}>
          <Text style={styles.bold}>Important Notice:</Text>
          <Text style={styles.text}>
            The M-CHAT-R/F is a screening tool—not a diagnostic test—for identifying children who may be at risk for autism spectrum disorder (ASD). This application is not intended to provide a medical diagnosis.
          </Text>
          <Text style={styles.text}>
            The M-CHAT-R/F should be used alongside the M-CHAT-R and is validated for screening toddlers between the ages of 16 and 30 months. However, several studies have extended its use up to 48 months of age. Therefore, this tool may be used to screen children between 16 and 48 months.
          </Text>
          <Text style={styles.text}>
            Please note that a significant number of children who screen positive on the M-CHAT-R/F may not be diagnosed with autism. Nonetheless, these children are at increased risk for other developmental delays or disorders. Any child who screens positive should be referred for further developmental evaluation.
          </Text>
          <Text style={styles.text}>
            Conversely, if your child screens normally, it does not mean the absence of ASD. If you have concerns after a normal screening, speak with your healthcare provider about additional assessments available. The M-CHAT is not 100% accurate in detecting ASD.
          </Text>
          {/* truncated for brevity */}
        </View>

        {/* Result / Interpretation of M CHAT-R */}
        <Text style={styles.sectionTitle}>Result / Interpretation of M CHAT-R</Text>
        <View style={styles.table}>

        {/* LOW RISK Row – spanning two lines in the right cell */}
        <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>
                LOW RISK{'\n'}(Total score 0–2)
            </Text>
            <Text style={styles.tableCell}>
                If child {'<'}2 years old, repeat after 2 years old.{'\n'}
                No further action is required unless surveillance indicates likelihood for autism.
            </Text>
        </View>


        {/* MODERATE RISK */}
        <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>
            MODERATE RISK{'\n'}(Total score 3–7)
            </Text>
            <Text style={styles.tableCell}>Proceed to second stage of M-CHAT R/F.</Text>
        </View>

        {/* HIGH RISK */}
        <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>
            HIGH RISK{'\n'}(Total score 8–20)
            </Text>
            <Text style={styles.tableCell}>
            Proceed to diagnostic evaluation. Highly recommended for early intervention.
            </Text>
        </View>
        </View>


        {/* Result / Interpretation of M CHAT-R/F */}
        <Text style={styles.sectionTitle}>Result / Interpretation of M CHAT-R/F</Text>
        <View style={styles.table}>
        <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>POSITIVE
            (Score ≥2)</Text>
            <Text style={styles.tableCell}>HISK RISK 
            Referred for early intervention and diagnostic testing </Text>
        </View>
        <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHeader]}>NEGATIVE
            (Score 0 or 1)</Text>
            <Text style={styles.tableCell}>LOW RISK
            However, if the parent has concerns about autism, children should be referred for evaluation regardless of the score.</Text>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
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
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '500',
      marginTop: 32,
      marginBottom: 12,
    },
    box: {
      borderWidth: 1,
      borderColor: '#aaa',
      borderRadius: 6,
      padding: 14,
      marginBottom: 20,
      backgroundColor: '#f9f9f9',
    },
    bold: {
      fontWeight: 'bold',
    },
    text: {
      marginBottom: 14,
      fontSize: 15,
      lineHeight: 22,
    },
    table: {
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 20,
      },
      
      tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#999',
      },
      
      tableCell: {
        flex: 1,
        padding: 10,
        fontSize: 14,
        lineHeight: 20,
        textAlignVertical: 'top',
      },
      
      tableHeader: {
        fontWeight: 'bold',
        backgroundColor: '#f2f2f2',
        flex: 0.7, // Make label column narrower
        borderRightWidth: 1,
        borderRightColor: '#999',
      },
      
  });
  
