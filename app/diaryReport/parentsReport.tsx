import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// @ts-ignore
import API from '../../api';

const { width: screenWidth } = Dimensions.get('window');

export default function ParentsReport() {
  const [diary, setDiary] = useState('');
  const [entries, setEntries] = useState<{ text: string; timestamp: string }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'diary' | 'history'>('diary');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentHistorySlide, setCurrentHistorySlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const historyFlatListRef = useRef<FlatList>(null);
  
  // Child selection states
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        
        if (storedData) {
          const data = JSON.parse(storedData);
          
          // Fetch latest children data from API
          try {
            const response = await API('apps/parents/displayDetails', {
              parentID: data.parentId
            }, 'GET');
            
            if (response.statusCode === 200 && response.data) {
              const parents = response.data as any[];
              const currentParent = parents[0]; // Get the first parent
              
              if (currentParent && currentParent.children && currentParent.children.length > 0) {
                
                // Convert API children data to our format
                const childrenData = currentParent.children.map((child: any) => ({
                  patientId: child.childID,
                  name: child.fullname,
                  age: null // Age not available in current data
                }));
                
                setChildren(childrenData);
                
                // If multiple children, show selector
                if (childrenData.length > 1) {
                  setShowChildSelector(true);
                } else if (childrenData.length === 1) {
                  // If only one child, auto-select
                  setSelectedChild(childrenData[0]);
                  fetchDiaryReports(childrenData[0].patientId);
                }
              } else {
                console.log('No children found in API response');
                // Fallback to stored data
                fallbackToStoredData(data);
              }
            } else {
              console.log('API response error:', response);
              // Fallback to stored data
              fallbackToStoredData(data);
            }
          } catch (apiError) {
            console.error('Error fetching from API:', apiError);
            // Fallback to stored data
            fallbackToStoredData(data);
          }
        }
      } catch (error) {
        console.error('Error initializing screen:', error);
      }
    };

    const fallbackToStoredData = (data: any) => {
      // Check if we have patientIds array (multiple children)
      if (data.patientIds && Array.isArray(data.patientIds) && data.patientIds.length > 0) {
        console.log('Using stored patientIds array:', data.patientIds);
        
        // Convert patientIds to children format
        const childrenData = data.patientIds.map((patient: any) => ({
          patientId: patient.patient_id,
          name: patient.fullname,
          age: null // Age not available in current data
        }));
        
        setChildren(childrenData);
        
        // If multiple children, show selector
        if (childrenData.length > 1) {
          setShowChildSelector(true);
        } else if (childrenData.length === 1) {
          // If only one child, auto-select
          setSelectedChild(childrenData[0]);
          fetchDiaryReports(childrenData[0].patientId);
        }
      } else {
        // Fallback: try to use single patientId if available
        const patientId = data.patientId || data.patient_id;
        if (patientId) {
          console.log('Using single patientId:', patientId);
          fetchDiaryReports(patientId);
        } else {
          console.error('No patient ID found in stored data');
        }
      }
    };

    initializeScreen();
  }, []);

  const fetchDiaryReports = async (patientId: string) => {
    try {
      console.log('Fetching diary reports for patientId:', patientId);
      const response = await API('apps/diaryReport/listDiary', { patientID: patientId }, 'GET', false);

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        const fetchedEntries = (response.data as any[]).map((item: any) => ({
          text: item.description,
          timestamp: item.created_at,
        }));
        setEntries(fetchedEntries);
      } else {
        console.warn('Failed to load diary reports:', response.message);
        setEntries([]); // Set empty array if no data
      }
    } catch (error) {
      console.error('Error fetching diary reports:', error);
      setEntries([]); // Set empty array on error
    }
  };

  const handleSave = async () => {
    if (!diary) return;

    try {
      // Use selectedChild if available, otherwise use stored user data
      let patientId;
      if (selectedChild) {
        patientId = selectedChild.patientId;
      } else {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const data = JSON.parse(storedData);
          patientId = data.patientId;
        }
      }

      if (!patientId) {
        alert('No patient ID available');
        return;
      }

      const response = await API('apps/diaryReport/insert', {
        patientID: patientId,
        description: diary,
        date: new Date().toISOString(),
      });

      if (response.statusCode === 200) {
        const newEntry = {
          text: diary,
          timestamp: new Date().toISOString(),
        };

        setEntries([newEntry, ...entries]);
        setDiary('');
        setModalVisible(true);

        setTimeout(() => {
          setModalVisible(false);
        }, 1500);
      } else {
        alert(response.message || 'Failed to save diary report');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while saving the report');
    }
  };

  const isToday = (timestamp: string) => {
    const entryDate = new Date(timestamp);
    const now = new Date();
    return (
      entryDate.getDate() === now.getDate() &&
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  };

  const today = new Date();
  const todayEntries = entries.filter((entry) => isToday(entry.timestamp));

  const allHistoryDates = [...new Set(
    entries
      .filter((item) => {
        const itemDate = new Date(item.timestamp);
        return itemDate.toDateString() !== today.toDateString();
      })
      .map((item) => new Date(item.timestamp).toDateString())
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const historyDates = allHistoryDates.slice(0, 5);

  const handleGeneratePDF = async (forAllEntries = false) => {
    try {
      let entriesToProcess;
      let title;

      if (forAllEntries) {
        entriesToProcess = entries.filter(
          (item) => new Date(item.timestamp).toDateString() !== today.toDateString()
        );
        title = "All Diary Entries";
      } else {
        entriesToProcess = entries.filter(
          (item) => new Date(item.timestamp).toDateString() === selectedHistoryDate
        );
        title = `Diary entries for ${selectedHistoryDate}`;
      }

      if (entriesToProcess.length === 0) {
        Alert.alert("No Entries", forAllEntries ? "No history entries found." : "No entries found for selected date.");
        return;
      }

      const groupedEntries = entriesToProcess.reduce((acc, entry) => {
        const date = new Date(entry.timestamp).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
      }, {} as Record<string, typeof entriesToProcess>);

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            @page { margin: 1in; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            h1 { color: #24A8FF; text-align: center; margin-bottom: 30px; }
            .date-section { margin: 20px 0; page-break-inside: avoid; }
            .date-header { background-color: #f0f0f0; padding: 10px; font-weight: bold; margin-bottom: 10px; }
            .entry { margin: 10px 0; padding: 10px; border-left: 3px solid #24A8FF; }
            .entry-number { font-weight: bold; color: #24A8FF; }
            .generated-date { text-align: center; color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="generated-date">Generated on: ${new Date().toLocaleString()}</div>
      `;

      Object.entries(groupedEntries).forEach(([date, dayEntries]) => {
        htmlContent += `
          <div class="date-section">
            <div class="date-header">${date}</div>
        `;
        dayEntries.forEach((entry, index) => {
          htmlContent += `
            <div class="entry">
              <span class="entry-number">${index + 1}.</span> ${entry.text}
            </div>
          `;
        });
        htmlContent += `</div>`;
      });

      htmlContent += `</body></html>`;

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = forAllEntries ? `Diary_Report_${timestamp}.html` : `Diary_${selectedHistoryDate?.replace(/\s/g, '_')}.html`;

      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      Alert.alert(
        "PDF Report Saved Successfully",
        `Your diary report has been saved!\n\nFile: ${filename}\n\nYou can find it in your device's Files app or share it to save to Downloads.`,
        [
          {
            text: "Share File",
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                  mimeType: 'text/html',
                  dialogTitle: 'Diary Report',
                });
              }
            }
          },
          {
            text: "OK"
          }
        ]
      );

    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("Error", "Failed to generate PDF report. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.mainContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diary Report</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.topTabs}>
          <TouchableOpacity style={[styles.topTab, activeTab === 'diary' && styles.topTabActive]} onPress={() => setActiveTab('diary')}>
            <Text style={[styles.topTabText, activeTab === 'diary' && styles.topTabTextActive]}>Diary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.topTab, activeTab === 'history' && styles.topTabActive]} onPress={() => setActiveTab('history')}>
            <Text style={[styles.topTabText, activeTab === 'history' && styles.topTabTextActive]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Child Selector */}
        {children.length > 1 && (
          <View style={styles.childSelectorContainer}>
            <TouchableOpacity 
              style={styles.childSelectorButton}
              onPress={() => setShowChildSelector(true)}
            >
              <Text style={styles.childSelectorText}>
                {selectedChild ? `Selected: ${selectedChild.name}` : 'Select Child'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'diary' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>New Diary Report</Text>
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

            <Text style={{ marginTop: 24, fontWeight: 'bold' }}>Today Diary Reports</Text>

            <FlatList
              data={todayEntries}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.pagedEntryCard}>
                  <Text style={styles.entryTimestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
                  <Text style={styles.entryText}>{item.text}</Text>
                </View>
              )}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setCurrentSlide(index);
              }}
              ref={flatListRef}
            />

            <View style={styles.pagination}>
              {todayEntries.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentSlide === index && styles.activeDot]}
                />
              ))}
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <>
            <View style={styles.historyHeader}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Diary Report History</Text>
            </View>

            <ScrollView style={{ width: '100%' }}>
              {historyDates.map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.entryCard, { backgroundColor: selectedHistoryDate === date ? '#CDE' : '#fff' }]}
                  onPress={() => setSelectedHistoryDate(selectedHistoryDate === date ? null : date)}
                >
                  <Text style={{ fontWeight: 'bold' }}>{date}</Text>
                </TouchableOpacity>
              ))}

              {selectedHistoryDate && (
                <>
                  <Text style={styles.cardTitle}>Report for {selectedHistoryDate}</Text>
                  
                  <FlatList
                    data={entries.filter((entry) => new Date(entry.timestamp).toDateString() === selectedHistoryDate)}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item: entry }) => (
                      <View style={styles.pagedHistoryEntryCard}>
                        <Text style={styles.historyEntryText}>{entry.text}</Text>
                        <Text style={styles.historyEntryTime}>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                    )}
                    onScroll={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                      setCurrentHistorySlide(index);
                    }}
                    ref={historyFlatListRef}
                  />

                  <View style={styles.pagination}>
                    {entries
                      .filter((entry) => new Date(entry.timestamp).toDateString() === selectedHistoryDate)
                      .map((_, index) => (
                        <View
                          key={index}
                          style={[styles.dot, currentHistorySlide === index && styles.activeDot]}
                        />
                      ))}
                  </View>
                </>
              )}

              {allHistoryDates.length === 0 && (
                <Text style={{ marginTop: 20, color: '#777', textAlign: 'center' }}>
                  No history entries found.
                </Text>
              )}

                <TouchableOpacity style={styles.generateAllBtn} onPress={() => handleGeneratePDF(true)}>
                  <Text style={styles.generateAllBtnText}>Download Report</Text>
                </TouchableOpacity>
            </ScrollView>
          </>
        )}
      </View>

      {/* Child Selection Modal */}
      <Modal visible={showChildSelector} transparent animationType="fade">
      <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Child</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
              Choose which child's diary reports you want to view:
              </Text>
              
              <View style={styles.childList}>
              {children.map((child, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.childItem}
                  onPress={() => {
                    setSelectedChild(child);
                    setShowChildSelector(false);
                    fetchDiaryReports(child.patientId);
                  }}
                >
                  <Text style={styles.childName}>{child.name || `Child ${index + 1}`}</Text>
                  <Text style={styles.childAge}>{child.age ? `${child.age} years old` : ''}</Text>
                </TouchableOpacity>
              ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowChildSelector(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>Report saved successfully.</Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#E1F5FF' },
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
  tabContainer: { flex: 1, alignItems: 'center', },
  container: { flex: 1, alignItems: 'center', padding: 16 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    width: '100%',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnActive: {
    backgroundColor: '#24A8FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: {
    backgroundColor: '#B3E3FF',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
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
  topTabs: {
    flexDirection: 'row',
    width: '100%',
    //marginTop: 16,
    //marginBottom: 16,
    backgroundColor: '#B3E3FF',
    //borderRadius: 8,
    overflow: 'hidden',
  },
  topTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  topTabActive: {
    backgroundColor: '#24A8FF',
  },
  topTabText: {
    fontWeight: '600',
    color: '#000',
  },
  topTabTextActive: {
    color: '#fff',
  },
  pagedEntryCard: {
    width: screenWidth - 32,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  entryTimestamp: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  entryText: {
    fontSize: 14,
    color: '#222',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#24A8FF',
  },
  entryCard: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  generateAllBtn: {
    backgroundColor: '#24A8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  generateAllBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  pagedHistoryEntryCard: {
    width: screenWidth - 32,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 8,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 200,
  },
  historyEntryText: {
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
  },
  historyEntryTime: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  childSelectorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  childSelectorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  childSelectorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  childOption: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  childAge: {
    fontSize: 14,
    color: '#666',
  },
  childSelectorScrollView: {
    maxHeight: 300,
    width: '100%',
  },
  childSelectorScrollContent: {
    paddingBottom: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  childList: {
    marginTop: 10,
  },
  childItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalButtons: {
    gap: 12,
  },
  modalButtonPrimary: {
    backgroundColor: '#48B2E8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  childSelectorContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  childSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  childSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 10,
  },
});
