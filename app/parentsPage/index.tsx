import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import API from '../../api';

const { width } = Dimensions.get('window');

const notifications = [
  {
    message: 'Hi Aisha, just a quick reminder! Your autism screening is scheduled for June 15th, 2025 at 10:00 AM. Please make sure to complete all necessary forms before your appointment. See you soon!',
  },
  // Add other notifications if needed
];

const features = [
  { key: 'mchat', label: 'M-CHAT-R', icon: require('@/assets/images/passFail.png') },
  { key: 'appointment', label: 'Appointment', icon: require('@/assets/images/calendar.png') },
  { key: 'therapy', label: 'Therapy Plan', icon: require('@/assets/images/medicalBag.png') },
  { key: 'progress', label: 'Diary Report', icon: require('@/assets/images/report.png') },
];

export default function HomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const [showNoChildrenModal, setShowNoChildrenModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChildSelectorModal, setShowChildSelectorModal] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (width * 0.9));
    setActiveIndex(index);
    scrollX.setValue(event.nativeEvent.contentOffset.x);
  };

    const checkForChildren = async () => {
    try {
      setLoading(true);
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const data = JSON.parse(storedData);
        const parentId = data.parentId || data.parent_id || data.userID || data.id;
        

        
        if (parentId) {
          try {
            
            // Try the same API endpoint as questionnaire index
            const response = await API('apps/parents/displayDetails', {
              parentID: parentId
            }, 'GET', false);
            

            
            let childrenData: any[] = [];
            if (response && response.statusCode === 200 && response.data) {
              const parents = response.data as any[];
              const currentParent = parents[0];

              
              if (currentParent && currentParent.children && currentParent.children.length > 0) {
                childrenData = currentParent.children;

              }
            }

            // Set children state
            setChildren(childrenData);

            // Update stored user data with fresh children data
            if (childrenData.length > 0) {
              const validChildren = childrenData.filter((c: any) => c && c.childID);
              const updatedUserData = {
                ...data,
                patientIds: validChildren.map((c: any) => ({
                  patient_id: c.childID,
                  fullname: c.fullname
                }))
              };
              
              // Only update selectedChildId if the current one is no longer valid
              if (data.selectedChildId) {
                const childStillExists = validChildren.some((c: any) => c.childID === data.selectedChildId);
                if (!childStillExists) {
                  // Selected child was deleted, clear the selection
                  updatedUserData.selectedChildId = null;
                  setSelectedChild(null);

                } else {
                  // Keep the current selection
                  updatedUserData.selectedChildId = data.selectedChildId;
                  const currentSelectedChild = validChildren.find((c: any) => c.childID === data.selectedChildId);
                  setSelectedChild(currentSelectedChild);
                }
              } else if (validChildren.length === 1) {
                // Auto-select if only one child and no current selection
                updatedUserData.selectedChildId = validChildren[0].childID;
                setSelectedChild(validChildren[0]);

              }
              
              // Update stored data
              await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
            } else {
              // No children, clear stored data
              const updatedUserData = {
                ...data,
                selectedChildId: null,
                patientIds: []
              };
              await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
              setSelectedChild(null);
            }

            // Check if there are any children
            if (!childrenData || childrenData.length === 0) {
              // If no children found, show the modal
              setShowNoChildrenModal(true);
            } else if (childrenData.length === 1) {
              // If only one child, select it automatically
              setSelectedChild(childrenData[0]);
            }
          } catch (error) {
            console.error('Error checking for children:', error);
            // If API fails, still show modal to be safe
            setShowNoChildrenModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error in checkForChildren:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMchatrPress = async () => {
    
    // Wait for children to load
    if (loading) {
      return;
    }
    
    // Ensure we have fresh children data
    if (children.length === 0) {
      await checkForChildren();
      return;
    }
    
    if (children.length > 1) {
      setShowChildSelectorModal(true);
    } else if (children.length === 1) {
      // If only one child, select it automatically and navigate
      const child = children[0];
      
      // Verify the child data is valid
      if (!child || !child.childID) {
        // Refresh children data and try again
        await checkForChildren();
        return;
      }
      
      await updateSelectedChild(child);
      router.push(`/questionnaire/${1}` as any);
    } else {
      // No children, show the no children modal
      setShowNoChildrenModal(true);
    }
  };

  const updateSelectedChild = async (child: any) => {
    // Validate child data
    if (!child || !child.childID) {
      return;
    }
    
    setSelectedChild(child);
    
    // Update user data with the selected child ID
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const data = JSON.parse(storedData);
        
        // Ensure we have valid children data
        const validChildren = children.filter((c: any) => c && c.childID);
        
        const updatedUserData = { 
          ...data, 
          selectedChildId: child.childID,
          patientIds: validChildren.map((c: any) => ({
            patient_id: c.childID,
            fullname: c.fullname
          }))
        };
        
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      }
    } catch (error) {
      console.error('Error updating selected child:', error);
    }
  };

  useEffect(() => {
    checkForChildren();
  }, []);

  // Refresh children data when user returns to this page
  useFocusEffect(
    useCallback(() => {
      checkForChildren();
    }, [])
  );



  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
                 <View style={styles.headerBg}>
           <Image source={require('../../assets/images/Autibilelogo.png')} style={styles.logo} />
         </View>

        <View style={styles.cardContainer}>
          <View style={styles.notificationCard}>
            <Image source={require('@/assets/images/puzzle.png')} style={styles.puzzleIcon} />

            <Text style={styles.notifTitle}>Hi, Parents</Text>
            <Text style={styles.notifSubtitle}>WELCOME TO AUTIBLE</Text>

            <View style={styles.notifMsgWrapper}>
              <View style={styles.notifCard}>
                <Image source={require('@/assets/images/bell.png')} style={styles.bellIcon} />
                <Text style={styles.notifMsg}>{notifications[0].message}</Text>
              </View>
            </View>

            <View style={styles.pagination}>
              <View style={styles.dot} />
              <View style={styles.dotInactive} />
              <View style={styles.dotInactive} />
            </View>
          </View>
        </View>

                 <View style={styles.grid}>
           {features.map((f) => {
             return (
               <TouchableOpacity
                 key={f.key}
                 style={[
                   styles.featureBtn,
                   f.key === 'mchat' && children.length === 0 && styles.disabledFeatureBtn
                 ]}
                 onPress={
                   f.key === 'appointment'
                     ? () => router.push('/appointment/parentsAppointment' as any)
                                         : f.key === 'mchat'
                      ? () => handleMchatrPress()
                     : f.key === 'therapy'
                     ? () => router.push('/therapy/TherapyPlanList' as any)
                     : f.key === 'progress'
                     ? () => router.push('/diaryReport/parentsReport' as any)
                     : undefined
                                  }
                                   disabled={f.key === 'mchat' && children.length === 0}
               >
                                   <Image 
                   source={f.icon} 
                   style={[
                     styles.featureIcon,
                     f.key === 'mchat' && children.length === 0 && styles.disabledFeatureIcon
                   ]} 
                 />
                 <Text style={[
                   styles.featureLabel,
                   f.key === 'mchat' && children.length === 0 && styles.disabledFeatureLabel
                 ]}>
                   {f.key === 'mchat' && children.length === 0 ? 'No Children' : 
                    f.label}
                 </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* No Children Modal */}
      <Modal
        visible={showNoChildrenModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoChildrenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Welcome to Autible!</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                We noticed you don't have any children registered in your profile yet. 
                To get the most out of Autible, please add your child's information.
              </Text>
              
              <Text style={styles.modalSubMessage}>
                This will help us provide personalized services and track your child's progress.
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  setShowNoChildrenModal(false);
                  router.push('/profilePage/childProfile');
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Add Child Information</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowNoChildrenModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Child Selector Modal */}
      <Modal
        visible={showChildSelectorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChildSelectorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Child</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Please select which child you want to take the M-CHAT-R screening for:
              </Text>
              
              <View style={styles.childList}>
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={child.childID}
                    style={styles.childItem}
                    onPress={async () => {
                      await updateSelectedChild(child);
                      setShowChildSelectorModal(false);
                      // Small delay to ensure AsyncStorage is fully updated before navigation
                      setTimeout(() => {
                        router.push(`/questionnaire/${1}` as any);
                      }, 100);
                    }}
                  >
                    <Text style={styles.childName}>{child.fullname}</Text>
                    {child.age && <Text style={styles.childAge}>Age: {child.age}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowChildSelectorModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      
    </>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  } as ViewStyle,
  headerBg: {
    backgroundColor: '#99DBFD',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 140,
    resizeMode: 'contain',
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: -60,
  },
  notificationCard: {
    width: '85%',
    backgroundColor: '#48B2E8',
    borderRadius: 30,
    padding: 20,
    position: 'relative',
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.38)', // solid teal-blue, adjust to match your design
    borderRadius: 20,
    padding: 12,
    width: '100%',
  },
  
  puzzleIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.3,
  },
  notifTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  notifSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: 1,
  },
  notifMsgWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bellIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#fff',
    marginTop: 2,
  },
  notifMsg: {
    flex: 1,
    fontSize: 11,
    color: '#fff',
    lineHeight: 12,
  },
  pagination: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 3,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A5DCEC',
    marginHorizontal: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  featureBtn: {
    width: '40%',
    height: 10,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    shadowColor: '#99DBFD',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.23,
    shadowRadius: 15.4,
    elevation: 10,
  },
  featureIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    tintColor: '#99DBFD',
    marginBottom: 10,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  disabledFeatureBtn: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  disabledFeatureIcon: {
    tintColor: '#ccc',
  },
  disabledFeatureLabel: {
    color: '#999',
  },
  completedText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
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
  modalSubMessage: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
    textAlign: 'center',
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
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  childAge: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  
});
