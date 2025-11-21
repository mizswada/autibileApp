import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import API from '../../api';

type Option = { key: string; label: string; value: string };

interface ChildData {
  childID: string;
  fullname: string;
  nickname: string;
  icNumber: string;
  gender: string;
  dateOfBirth: string;
  autismDiagnose: string;
  diagnosedDate: string;
  availableSession: number;
  status: string;
  okuCard: string;
  treatmentType: string;
  created_at: string;
  updated_at: string;
}

export default function ChildProfile() {
  const [children, setChildren] = useState<ChildData[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildData | null>(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDiagnosedDatePicker, setShowDiagnosedDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'dateOfBirth' | 'diagnosedDate'>('dateOfBirth');
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildIC, setNewChildIC] = useState('');
  const [searchingChild, setSearchingChild] = useState(false);
  const [showNewChildDataModal, setShowNewChildDataModal] = useState(false);
  const [newChildData, setNewChildData] = useState({
    fullname: '',
    nickname: '',
    gender: '',
    dateOfBirth: '',
    autismDiagnose: '',
    diagnosedDate: '',
    okuCard: '',
    treatmentType: ''
  });

  const [okuCardOptions, setOkuCardOptions] = useState<Option[]>([]);
  const [treatmentTypeOptions, setTreatmentTypeOptions] = useState<Option[]>([]);

  useEffect(() => {
    fetchChildrenData();
    fetchDropdownOptions();
  }, []);

  // Process dropdown data after options are loaded
  useEffect(() => {
    if (children.length > 0 && okuCardOptions.length > 0 && treatmentTypeOptions.length > 0) {
      // Check if children already have text labels (to avoid reprocessing)
      const needsProcessing = children.some(child => {
        const okuIsNumeric = child.okuCard && !okuCardOptions.some(opt => opt.label === child.okuCard);
        const treatmentIsNumeric = child.treatmentType && !treatmentTypeOptions.some(opt => opt.label === child.treatmentType);
        return okuIsNumeric || treatmentIsNumeric;
      });

      if (needsProcessing) {
        // Convert numeric values to text labels for display
        const processedChildren = children.map(child => {
          const getLabelFromValue = (value: any, options: Option[]) => {
            if (!value && value !== 0) return '';
            
            // If value is already a text label, return it as is
            const isTextLabel = options.some(opt => opt.label === value);
            if (isTextLabel) {
              return value;
            }
            
            // Convert to string for comparison with numeric values
            const stringValue = String(value);
            const option = options.find(opt => opt.value === stringValue);
            return option ? option.label : stringValue;
          };

          return {
            ...child,
            okuCard: getLabelFromValue(child.okuCard, okuCardOptions),
            treatmentType: getLabelFromValue(child.treatmentType, treatmentTypeOptions)
          };
        });

        setChildren(processedChildren);
      }
    }
  }, [okuCardOptions, treatmentTypeOptions]);

  // Reprocess selectedChild when dropdown options are loaded
  useEffect(() => {
    if (selectedChild && okuCardOptions.length > 0 && treatmentTypeOptions.length > 0) {
      // Check if selectedChild needs processing (has numeric values)
      const needsProcessing = 
        (selectedChild.okuCard && !okuCardOptions.some(opt => opt.label === selectedChild.okuCard)) ||
        (selectedChild.treatmentType && !treatmentTypeOptions.some(opt => opt.label === selectedChild.treatmentType));
      
      if (needsProcessing) {
        const processedChild = processChildForDisplay(selectedChild);
        setSelectedChild(processedChild);
      }
    }
  }, [okuCardOptions, treatmentTypeOptions]);

  // Helper function to process child data for display
  const processChildForDisplay = (child: any) => {
    const getLabelFromValue = (value: any, options: Option[]) => {
      if (!value && value !== 0) return '';
      
      // If value is already a text label (like "Online"), return it as is
      const isTextLabel = options.some(opt => opt.label === value);
      if (isTextLabel) {
        return value;
      }
      
      // Convert to string for comparison with numeric values
      const stringValue = String(value);
      const option = options.find(opt => opt.value === stringValue);
      return option ? option.label : stringValue;
    };

    return {
      ...child,
      okuCard: getLabelFromValue(child.okuCard, okuCardOptions),
      treatmentType: getLabelFromValue(child.treatmentType, treatmentTypeOptions)
    };
  };

  const fetchDropdownOptions = async () => {
    try {
      // Create OKU Card options: 1 = Yes, 0 = No
      const okuOptions = [
        { key: 'default', label: '-- Please select --', value: '' },
        { key: '1', label: 'Yes', value: '1' },
        { key: '0', label: 'No', value: '0' }
      ];
      
      // Create Treatment Type options: 1 = Center, 2 = Online, 3 = In House
      const treatmentOptions = [
        { key: 'default', label: '-- Please select --', value: '' },
        { key: '1', label: 'Center', value: '1' },
        { key: '2', label: 'Online', value: '2' },
        { key: '3', label: 'In House', value: '3' }
      ];

      setOkuCardOptions(okuOptions);
      setTreatmentTypeOptions(treatmentOptions);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  };

  // Helper function to format date from ISO string to YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to handle date picker changes
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      if (datePickerMode === 'dateOfBirth') {
        if (showNewChildDataModal) {
          setNewChildData({...newChildData, dateOfBirth: formattedDate});
        } else if (selectedChild) {
          setSelectedChild({...selectedChild, dateOfBirth: formattedDate});
        }
      } else {
        if (showNewChildDataModal) {
          setNewChildData({...newChildData, diagnosedDate: formattedDate});
        } else if (selectedChild) {
          setSelectedChild({...selectedChild, diagnosedDate: formattedDate});
        }
      }
    }
    // Always hide the picker after selection or cancellation
    setShowDatePicker(false);
    setShowDiagnosedDatePicker(false);
  };

  // Helper function to open date picker
  const openDatePicker = (mode: 'dateOfBirth' | 'diagnosedDate') => {
    setDatePickerMode(mode);
    if (mode === 'dateOfBirth') {
      setShowDatePicker(true);
    } else {
      setShowDiagnosedDatePicker(true);
    }
  };

  const fetchChildrenData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const data = JSON.parse(storedData);
        
        // Use the same API as parentsProfile to get children data
        const response = await API('apps/parents/displayDetails', {
          parentID: data.parentId
        }, 'GET');
        
        if (response.statusCode === 200 && response.data) {
          const parents = response.data as any[];
          const currentParent = parents[0]; // Get the first parent
          
          if (currentParent && currentParent.children) {
            // Map the children data to ensure proper field mapping
            const mappedChildren = currentParent.children.map((child: any) => {
              // Handle OKU Card: convert numeric to string
              let okuCardValue = '';
              if (child.OKUCard !== null && child.OKUCard !== undefined) {
                okuCardValue = String(child.OKUCard);
              } else if (child.okuCard !== null && child.okuCard !== undefined) {
                okuCardValue = String(child.okuCard);
              }
              
              // Handle Treatment Type: keep as string if it's already text, convert to string if numeric
              let treatmentTypeValue = '';
              if (child.treatment_type !== null && child.treatment_type !== undefined) {
                treatmentTypeValue = String(child.treatment_type);
              } else if (child.treatmentType !== null && child.treatmentType !== undefined) {
                treatmentTypeValue = String(child.treatmentType);
              }
              
              return {
                ...child,
                childID: child.patient_id || child.childID,
                okuCard: okuCardValue,
                treatmentType: treatmentTypeValue
              };
            });
            setChildren(mappedChildren);
          } else {
            console.error('No children data found in API response');
          }
        } else {
          console.error('API response error:', response);
          // Fallback to stored data if API fails
          if (data.patientIds && Array.isArray(data.patientIds)) {
            const childrenData = data.patientIds.map((child: any) => ({
              childID: child.patient_id,
              fullname: child.fullname || '',
              nickname: child.nickname || '',
              icNumber: child.patient_ic || '',
              gender: child.gender || '',
              dateOfBirth: child.dob || '',
              autismDiagnose: child.autism_diagnose || '',
              diagnosedDate: child.diagnosed_on || '',
              availableSession: child.available_session || 0,
              status: child.status || '',
              okuCard: child.OKUCard !== null && child.OKUCard !== undefined ? String(child.OKUCard) : '',
              treatmentType: child.treatment_type !== null && child.treatment_type !== undefined ? String(child.treatment_type) : '',
              created_at: child.created_at || '',
              updated_at: child.update_at || ''
            }));
            setChildren(childrenData);
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching children data:', error);
      setLoading(false);
    }
  };

  const handleSaveChild = async () => {
    if (!selectedChild) return;

    try {
      // Convert text labels back to numeric values for API
      const getValueFromLabel = (label: string, options: Option[]) => {
        if (!label || label === '') return '';
        const option = options.find(opt => opt.label === label);
        return option ? option.value : label;
      };


      const response = await API('apps/children/updateDetails', {
        patientID: selectedChild.childID,
        fullname: selectedChild.fullname,
        nickname: selectedChild.nickname,
        gender: selectedChild.gender,
        dateOfBirth: selectedChild.dateOfBirth,
        autismDiagnose: selectedChild.autismDiagnose,
        diagnosedDate: selectedChild.diagnosedDate,
        okuCard: getValueFromLabel(selectedChild.okuCard, okuCardOptions),
        treatmentType: getValueFromLabel(selectedChild.treatmentType, treatmentTypeOptions)
      }, 'PUT');

      if (response.statusCode === 200) {
        Alert.alert('Success', 'Child information updated successfully');
        setShowChildModal(false);
        setSelectedChild(null);
        fetchChildrenData(); // Refresh data
      } else {
        Alert.alert('Error', response.message || 'Failed to update child information');
      }
    } catch (error) {
      console.error('Error updating child:', error);
      Alert.alert('Error', 'Failed to update child information');
    }
  };

  const handleAddNewChild = async () => {
    if (!newChildIC.trim()) {
      Alert.alert('Error', 'Please enter an IC number');
      return;
    }

    setSearchingChild(true);
    try {
      // First, check if the IC exists
      const searchResponse = await API('apps/children/searchIc', {
        icNumber: newChildIC.trim()
      }, 'GET');

      if (searchResponse.statusCode === 200 && searchResponse.data && Array.isArray(searchResponse.data as any[]) && (searchResponse.data as any[]).length > 0) {
        // IC exists, link the existing child
        const existingChild = (searchResponse.data as any[])[0];
        const storedData = await AsyncStorage.getItem('userData');
        const data = JSON.parse(storedData || '{}');
        
        const linkResponse = await API('apps/children/addChildren', {
          parentID: data.parentId,
          userID: data.userID,
          fullname: existingChild.fullname,
          nickname: existingChild.nickname,
          gender: existingChild.gender,
          icNumber: existingChild.icNumber,
          dateOfBirth: existingChild.dateOfBirth,
          autismDiagnose: existingChild.autismDiagnose,
          diagnosedDate: existingChild.diagnosedDate,
          availableSession: existingChild.availableSession,
          status: existingChild.status,
          okuCard: existingChild.OKUCard || '',
          treatmentType: existingChild.treatment_type || ''
        }, 'POST');

        if (linkResponse.statusCode === 200) {
          Alert.alert('Success', linkResponse.message || 'Child linked successfully to your account');
          setShowAddChildModal(false);
          setNewChildIC('');
          fetchChildrenData();
        } else if (linkResponse.statusCode === 409) {
          Alert.alert('Already Linked', 'This child is already linked to your account');
        } else {
          Alert.alert('Error', linkResponse.message || 'Failed to link child to your account');
        }
      } else {
        // IC doesn't exist, show data collection modal
        setShowAddChildModal(false);
        setShowNewChildDataModal(true);
      }
    } catch (error) {
      console.error('Error checking IC:', error);
      Alert.alert('Error', 'Failed to check IC number. Please try again.');
    } finally {
      setSearchingChild(false);
    }
  };

  const handleCreateNewChild = async () => {
    // Validate required fields
    if (!newChildData.fullname || !newChildData.nickname || !newChildData.gender || 
        !newChildData.dateOfBirth || !newChildData.autismDiagnose || !newChildData.diagnosedDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSearchingChild(true);
    try {
      const storedData = await AsyncStorage.getItem('userData');
      const data = JSON.parse(storedData || '{}');
      
      const response = await API('apps/children/addChildren', {
        parentID: data.parentId,
        userID: data.userID,
        fullname: newChildData.fullname,
        nickname: newChildData.nickname,
        gender: newChildData.gender,
        icNumber: newChildIC.trim(),
        dateOfBirth: newChildData.dateOfBirth,
        autismDiagnose: newChildData.autismDiagnose,
        diagnosedDate: newChildData.diagnosedDate,
        availableSession: 0,
        status: 'Active',
        okuCard: newChildData.okuCard,
        treatmentType: newChildData.treatmentType
      }, 'POST');

      if (response.statusCode === 200) {
        Alert.alert('Success', response.message || 'New child added successfully');
        setShowNewChildDataModal(false);
        setNewChildIC('');
        setNewChildData({
          fullname: '',
          nickname: '',
          gender: '',
          dateOfBirth: '',
          autismDiagnose: '',
          diagnosedDate: '',
          okuCard: '',
          treatmentType: ''
        });
        fetchChildrenData();
      } else {
        Alert.alert('Error', response.message || 'Failed to add new child');
      }
    } catch (error) {
      console.error('Error creating new child:', error);
      Alert.alert('Error', 'Failed to create new child. Please try again.');
    } finally {
      setSearchingChild(false);
    }
  };

  const handleDeleteChild = async (child: ChildData) => {
    Alert.alert(
      'Remove Child',
      `Are you sure you want to remove ${child.fullname} from your account? This will only remove the relationship and won't delete the child's data permanently.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedData = await AsyncStorage.getItem('userData');
              const data = JSON.parse(storedData || '{}');
                            
              // Check if parentId is undefined
              if (!data.parentId) {
                Alert.alert('Error', 'Parent ID not found. Please try again.');
                return;
              }
              
              const requestData = {
                childID: child.childID,
                parentID: data.parentId  // Use parentId (lowercase 'd')
              };
              
              const response = await API('apps/children/deleteChild', requestData, 'DELETE');

              if (response.statusCode === 200) {
                Alert.alert('Success', 'Child removed from your account successfully');
                fetchChildrenData(); // Refresh the list
              } else {
                Alert.alert('Error', response.message || 'Failed to remove child');
              }
            } catch (error) {
              console.error('Error removing child:', error);
              Alert.alert('Error', 'Failed to remove child. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading children...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Children Profile</Text>
      </View>

      {/* Children Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Children Information</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddChildModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>
        {children.length > 0 ? (
          children.map((child, index) => (
            <TouchableOpacity
              key={child.childID}
              style={styles.childCard}
              onPress={() => {
                // Process the child data to convert numeric values to text labels
                const processedChild = processChildForDisplay(child);
                setSelectedChild(processedChild);
                setShowChildModal(true);
              }}
            >
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>{child.fullname.charAt(0)}</Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.fullname}</Text>
                <Text style={styles.childDetails}>
                  {child.nickname && `(${child.nickname}) `}
                  {child.gender || 'Gender not set'} • {formatDate(child.dateOfBirth) || 'DOB not set'}
                </Text>
                <Text style={styles.childStatus}>
                  Status: {child.status || 'Not set'} • Sessions: {child.availableSession}
                </Text>
              </View>
              <View style={styles.childActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent opening edit modal
                    handleDeleteChild(child);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noChildrenText}>No children found</Text>
        )}
      </View>

      {/* Child Edit Modal */}
      <Modal visible={showChildModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Child Information</Text>
              <TouchableOpacity onPress={() => setShowChildModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedChild && (
              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedChild.fullname}
                    onChangeText={(text) => setSelectedChild({...selectedChild, fullname: text})}
                    placeholder="Enter child's full name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nickname</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedChild.nickname}
                    onChangeText={(text) => setSelectedChild({...selectedChild, nickname: text})}
                    placeholder="Enter nickname"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>IC Number</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedChild.icNumber}
                    onChangeText={(text) => setSelectedChild({...selectedChild, icNumber: text})}
                    placeholder="Enter IC number"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gender</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedChild.gender}
                    onChangeText={(text) => setSelectedChild({...selectedChild, gender: text})}
                    placeholder="Male/Female"
                  />
                </View>

                                 <View style={styles.inputGroup}>
                   <Text style={styles.label}>Date of Birth</Text>
                   <TouchableOpacity
                     style={styles.dateInput}
                     onPress={() => openDatePicker('dateOfBirth')}
                   >
                     <Text style={styles.dateInputText}>
                       {formatDate(selectedChild.dateOfBirth) || 'Select Date of Birth'}
                     </Text>
                     <Ionicons name="calendar-outline" size={20} color="#666" />
                   </TouchableOpacity>
                   
                   {/* Date Picker for Date of Birth */}
                   {showDatePicker && (
                     <DateTimePicker
                       value={
                         selectedChild?.dateOfBirth ? new Date(selectedChild.dateOfBirth) : 
                         new Date()
                       }
                       mode="date"
                       display="spinner"
                       onChange={handleDateChange}
                     />
                   )}
                 </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Autism Diagnosis</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedChild.autismDiagnose}
                    onChangeText={(text) => setSelectedChild({...selectedChild, autismDiagnose: text})}
                    placeholder="Enter diagnosis"
                  />
                </View>

                                 <View style={styles.inputGroup}>
                   <Text style={styles.label}>Diagnosed Date</Text>
                   <TouchableOpacity
                     style={styles.dateInput}
                     onPress={() => openDatePicker('diagnosedDate')}
                   >
                     <Text style={styles.dateInputText}>
                       {formatDate(selectedChild.diagnosedDate) || 'Select Diagnosed Date'}
                     </Text>
                     <Ionicons name="calendar-outline" size={20} color="#666" />
                   </TouchableOpacity>
                   
                   {/* Date Picker for Diagnosed Date */}
                   {showDiagnosedDatePicker && (
                     <DateTimePicker
                       value={
                         selectedChild?.diagnosedDate ? new Date(selectedChild.diagnosedDate) : 
                         new Date()
                       }
                       mode="date"
                       display="spinner"
                       onChange={handleDateChange}
                     />
                   )}
                 </View>

                 <View style={styles.inputGroup}>
                   <Text style={styles.label}>OKU Card</Text>
                   <ModalSelector
                     data={okuCardOptions}
                     initValue={selectedChild.okuCard || "-- Please select --"}
                     onChange={(option: any) => setSelectedChild({...selectedChild, okuCard: option.label})}
                     style={styles.selector}
                     initValueTextStyle={{ color: selectedChild.okuCard ? '#000' : '#999' }}
                     selectTextStyle={{ fontSize: 16 }}
                   >
                     <TextInput
                       style={styles.input}
                       editable={false}
                       placeholder="-- Please select --"
                       value={selectedChild.okuCard || ''}
                     />
                   </ModalSelector>
                 </View>

                 <View style={styles.inputGroup}>
                   <Text style={styles.label}>Treatment Type</Text>
                   <ModalSelector
                     data={treatmentTypeOptions}
                     initValue={selectedChild.treatmentType || "-- Please select --"}
                     onChange={(option: any) => setSelectedChild({...selectedChild, treatmentType: option.label})}
                     style={styles.selector}
                     initValueTextStyle={{ color: selectedChild.treatmentType ? '#000' : '#999' }}
                     selectTextStyle={{ fontSize: 16 }}
                   >
                     <TextInput
                       style={styles.input}
                       editable={false}
                       placeholder="-- Please select --"
                       value={selectedChild.treatmentType || ''}
                     />
                   </ModalSelector>
                 </View>

                 <TouchableOpacity style={styles.saveButton} onPress={handleSaveChild}>
                   <Text style={styles.saveButtonText}>Save Changes</Text>
                 </TouchableOpacity>
              </ScrollView>
             )}

            </View>
         </View>
       </Modal>

      {/* Add Child Modal */}
      <Modal visible={showAddChildModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Child</Text>
              <TouchableOpacity onPress={() => setShowAddChildModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.modalDescription}>
                Enter the IC number of the child you want to add. If the child already exists in the system, they will be linked to your account. If not, a new child record will be created with default information that you can edit later.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>IC Number</Text>
                <TextInput
                  style={styles.input}
                  value={newChildIC}
                  onChangeText={setNewChildIC}
                  placeholder="Enter child's IC number"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddNewChild}
                disabled={searchingChild}
              >
                <Text style={styles.addButtonText}>
                  {searchingChild ? 'Checking...' : 'Add Child'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Child Data Modal */}
      <Modal visible={showNewChildDataModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Child</Text>
              <TouchableOpacity onPress={() => setShowNewChildDataModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                This IC number is not registered. Please provide the child's information to create a new record.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={newChildData.fullname}
                  onChangeText={(text) => setNewChildData({...newChildData, fullname: text})}
                  placeholder="Enter child's full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nickname *</Text>
                <TextInput
                  style={styles.input}
                  value={newChildData.nickname}
                  onChangeText={(text) => setNewChildData({...newChildData, nickname: text})}
                  placeholder="Enter nickname"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender *</Text>
                <TextInput
                  style={styles.input}
                  value={newChildData.gender}
                  onChangeText={(text) => setNewChildData({...newChildData, gender: text})}
                  placeholder="Male/Female"
                />
              </View>

                             <View style={styles.inputGroup}>
                 <Text style={styles.label}>Date of Birth *</Text>
                 <TouchableOpacity
                   style={styles.dateInput}
                   onPress={() => openDatePicker('dateOfBirth')}
                 >
                   <Text style={styles.dateInputText}>
                     {formatDate(newChildData.dateOfBirth) || 'Select Date of Birth'}
                   </Text>
                   <Ionicons name="calendar-outline" size={20} color="#666" />
                 </TouchableOpacity>
                 
                 {/* Date Picker for Date of Birth */}
                 {showDatePicker && (
                   <DateTimePicker
                     value={
                       newChildData.dateOfBirth ? new Date(newChildData.dateOfBirth) : 
                       new Date()
                     }
                     mode="date"
                     display="spinner"
                     onChange={handleDateChange}
                   />
                 )}
               </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Autism Diagnosis *</Text>
                <TextInput
                  style={styles.input}
                  value={newChildData.autismDiagnose}
                  onChangeText={(text) => setNewChildData({...newChildData, autismDiagnose: text})}
                  placeholder="Enter diagnosis"
                />
              </View>

                             <View style={styles.inputGroup}>
                 <Text style={styles.label}>Diagnosed Date *</Text>
                 <TouchableOpacity
                   style={styles.dateInput}
                   onPress={() => openDatePicker('diagnosedDate')}
                 >
                   <Text style={styles.dateInputText}>
                     {formatDate(newChildData.diagnosedDate) || 'Select Diagnosed Date'}
                   </Text>
                   <Ionicons name="calendar-outline" size={20} color="#666" />
                 </TouchableOpacity>
                 
                 {/* Date Picker for Diagnosed Date */}
                 {showDiagnosedDatePicker && (
                   <DateTimePicker
                     value={
                       newChildData.diagnosedDate ? new Date(newChildData.diagnosedDate) : 
                       new Date()
                     }
                     mode="date"
                     display="spinner"
                     onChange={handleDateChange}
                   />
                 )}
               </View>

               <View style={styles.inputGroup}>
                 <Text style={styles.label}>OKU Card</Text>
                 <ModalSelector
                   data={okuCardOptions}
                   initValue={okuCardOptions.find(o => o.value === newChildData.okuCard)?.label || "-- Please select --"}
                   onChange={(option: any) => setNewChildData({...newChildData, okuCard: option.value})}
                   style={styles.selector}
                   initValueTextStyle={{ color: newChildData.okuCard ? '#000' : '#999' }}
                   selectTextStyle={{ fontSize: 16 }}
                 >
                   <TextInput
                     style={styles.input}
                     editable={false}
                     placeholder="-- Please select --"
                     value={okuCardOptions.find(o => o.value === newChildData.okuCard)?.label || newChildData.okuCard || ''}
                   />
                 </ModalSelector>
               </View>

               <View style={styles.inputGroup}>
                 <Text style={styles.label}>Treatment Type</Text>
                 <ModalSelector
                   data={treatmentTypeOptions}
                   initValue={treatmentTypeOptions.find(o => o.value === newChildData.treatmentType)?.label || "-- Please select --"}
                   onChange={(option: any) => setNewChildData({...newChildData, treatmentType: option.value})}
                   style={styles.selector}
                   initValueTextStyle={{ color: newChildData.treatmentType ? '#000' : '#999' }}
                   selectTextStyle={{ fontSize: 16 }}
                 >
                   <TextInput
                     style={styles.input}
                     editable={false}
                     placeholder="-- Please select --"
                     value={treatmentTypeOptions.find(o => o.value === newChildData.treatmentType)?.label || newChildData.treatmentType || ''}
                   />
                 </ModalSelector>
               </View>

                             <TouchableOpacity 
                 style={styles.addButton} 
                 onPress={handleCreateNewChild}
                 disabled={searchingChild}
               >
                 <Text style={styles.addButtonText}>
                   {searchingChild ? 'Creating...' : 'Create Child'}
                 </Text>
               </TouchableOpacity>
             </ScrollView>
           </View>
         </View>

               </Modal>

                               
     </ScrollView>
   );
 }

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#E1F5FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1F5FF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24A8FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#24A8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  childAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
    color: '#666',
  },
  childStatus: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  childActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButton: {
    marginRight: 10,
  },
  noChildrenText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  modalForm: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#24A8FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  selector: {
    marginBottom: 0,
  },

});
