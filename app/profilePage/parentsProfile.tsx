import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

interface ParentData {
  parentID: string;
  userID: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  ic: string;
  relationship: string;
  nationality: string;
  state: string;
  status: string;
  gender: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  city: string;
  postcode: string;
}



export default function ParentsProfile() {
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [originalParentData, setOriginalParentData] = useState<ParentData | null>(null);

  const [isEditingParent, setIsEditingParent] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [relationshipOptions, setRelationshipOptions] = useState<Option[]>([]);
  const [nationalityOptions, setNationalityOptions] = useState<Option[]>([]);
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

     useEffect(() => {
     fetchParentAndChildrenData();
     fetchDropdownOptions();
   }, []);

       // Process dropdown data after options are loaded
    useEffect(() => {
      if (parentData && relationshipOptions.length > 0 && nationalityOptions.length > 0 && stateOptions.length > 0 && originalParentData) {
        // Convert text labels to IDs if needed
        const getLookupId = (value: any, options: Option[]) => {
          if (!value) return '';
          if (!isNaN(Number(value))) return String(value);
          const option = options.find(opt => opt.label === value);
          return option ? option.value : '';
        };

        const updatedRelationship = getLookupId(parentData.relationship, relationshipOptions);
        const updatedNationality = getLookupId(parentData.nationality, nationalityOptions);
        const updatedState = getLookupId(parentData.state, stateOptions);

        // Only update if any values changed
        if (updatedRelationship !== parentData.relationship || 
            updatedNationality !== parentData.nationality || 
            updatedState !== parentData.state) {
          setParentData(prev => prev ? { 
            ...prev, 
            relationship: updatedRelationship,
            nationality: updatedNationality,
            state: updatedState
          } : null);
          setOriginalParentData(prev => prev ? { 
            ...prev, 
            relationship: updatedRelationship,
            nationality: updatedNationality,
            state: updatedState
          } : null);
        }
      }
    }, [relationshipOptions, nationalityOptions, stateOptions, parentData, originalParentData]);

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
    if (parentData && selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setParentData({...parentData, dateOfBirth: formattedDate});
      setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const [relRes, natRes, stateRes] = await Promise.all([
        API("apps/parents/lookupRelationship", {}, "GET", false),
        API("apps/parents/lookupNationality", {}, "GET", false),
        API("apps/parents/lookupState", {}, "GET", false),
      ]);

      setRelationshipOptions([
        { key: 'default', label: '-- Please select --', value: '' },
        ...(Array.isArray(relRes.data) ? relRes.data : Array.isArray(relRes) ? relRes : []).map((i: any) => ({
          key: String(i.lookupID),
          label: i.title,
          value: String(i.lookupID)
        }))
      ]);
      
      setNationalityOptions([
        { key: 'default', label: '-- Please select --', value: '' },
        ...(Array.isArray(natRes.data) ? natRes.data : Array.isArray(natRes) ? natRes : []).map((i: any) => ({
          key: String(i.lookupID),
          label: i.title,
          value: String(i.lookupID)
        }))
      ]);
      
      setStateOptions([
        { key: 'default', label: '-- Please select --', value: '' },
        ...(Array.isArray(stateRes.data) ? stateRes.data : Array.isArray(stateRes) ? stateRes : []).map((i: any) => ({
          key: String(i.lookupID),
          label: i.title,
          value: String(i.lookupID)
        }))
      ]);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  };

  const fetchParentAndChildrenData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const data = JSON.parse(storedData);
        
        // Fetch parent and children data using the new comprehensive API
        const response = await API('apps/parents/displayDetails', { parentID: data.parentId }, 'GET', false);
        
        if (response.statusCode === 200 && response.data) {
          // Since we're passing parentID, we should get a single parent or array with one item
          const parents = response.data as any[];
          const currentParent = parents.length > 0 ? parents[0] : null;
          
          if (currentParent) {
                         // Ensure dropdown values are strings for proper comparison with dropdown options
             // Only convert to string if the value exists, otherwise keep as is
             const processedParent = {
               ...currentParent,
               relationship: currentParent.relationship ? String(currentParent.relationship) : currentParent.relationship,
               nationality: currentParent.nationality ? String(currentParent.nationality) : currentParent.nationality,
               state: currentParent.state ? String(currentParent.state) : currentParent.state
             };
                         setParentData(processedParent);
             setOriginalParentData(processedParent);
          } else {
            console.error('No parent data found in API response');
          }
        } else {
          console.error('Failed to fetch parent data:', response.message);
          console.error('Response details:', response);
          
          // Fallback: Use stored data if API fails
          console.log('Using fallback data from AsyncStorage');
          const fallbackParent = {
            parentID: data.parentId,
            userID: data.userId || '',
            username: data.username || '',
            fullName: data.fullname || data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            ic: data.ic || data.userIC || '',
            relationship: '',
            nationality: '',
            state: '',
            status: 'Active',
            gender: '',
            dateOfBirth: '',
            addressLine1: '',
            addressLine2: '',
            addressLine3: '',
            city: '',
            postcode: ''
          };
          
          setParentData(fallbackParent);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching parent and children data:', error);
      setLoading(false);
    }
  };

  const handleSaveParent = async () => {
    if (!parentData) return;

    try {

      // Helper function to safely convert to number or return undefined
      const safeNumber = (value: any) => {
        if (!value || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
      };

      // Always use the current value if it exists and is not empty, otherwise fall back to original
      const relationshipValue = safeNumber(parentData.relationship) || safeNumber(originalParentData?.relationship);
      const nationalityValue = safeNumber(parentData.nationality) || safeNumber(originalParentData?.nationality);
      const stateValue = safeNumber(parentData.state) || safeNumber(originalParentData?.state);

      // Build the update payload, only including dropdown fields if they have values
      const updatePayload: any = {
        parentID: parentData.parentID,
        fullName: parentData.fullName,
        email: parentData.email,
        phone: parentData.phone,
        addressLine1: parentData.addressLine1,
        addressLine2: parentData.addressLine2,
        addressLine3: parentData.addressLine3,
        city: parentData.city,
        postcode: parentData.postcode,
        gender: parentData.gender,
        dateOfBirth: parentData.dateOfBirth,
      };

      // Only add dropdown fields if they have values
      if (relationshipValue !== undefined) updatePayload.relationship = relationshipValue;
      if (nationalityValue !== undefined) updatePayload.nationality = nationalityValue;
      if (stateValue !== undefined) updatePayload.state = stateValue;

      const response = await API('apps/parents/updateDetails', updatePayload, 'PUT');

      if (response.statusCode === 200) {
        Alert.alert('Success', 'Parent information updated successfully');
        setIsEditingParent(false);
        // Don't refresh data at all - keep the current state
        // The data is already saved and the current state is correct
      } else {
        Alert.alert('Error', response.message || 'Failed to update parent information');
      }
    } catch (error) {
      console.error('Error updating parent:', error);
      Alert.alert('Error', 'Failed to update parent information');
    }
  };

  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!parentData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No parent data found</Text>
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {/* Parent Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Parent Information</Text>
          <TouchableOpacity 
            style={[styles.editButton, isEditingParent && styles.editButtonActive]}
            onPress={() => setIsEditingParent(!isEditingParent)}
          >
            <Text style={[styles.editButtonText, isEditingParent && styles.editButtonTextActive]}>
              {isEditingParent ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.fullName}
              onChangeText={(text) => setParentData({...parentData, fullName: text})}
              editable={isEditingParent}
              placeholder="Enter full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.email}
              onChangeText={(text) => setParentData({...parentData, email: text})}
              editable={isEditingParent}
              placeholder="Enter email"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.phone}
              onChangeText={(text) => setParentData({...parentData, phone: text})}
              editable={isEditingParent}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>IC Number</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.ic}
              onChangeText={(text) => setParentData({...parentData, ic: text})}
              editable={isEditingParent}
              placeholder="Enter IC number"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.gender}
              onChangeText={(text) => setParentData({...parentData, gender: text})}
              editable={isEditingParent}
              placeholder="Male/Female"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            {isEditingParent ? (
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateInputText}>
                  {formatDate(parentData.dateOfBirth) || 'Select Date of Birth'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            ) : (
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formatDate(parentData.dateOfBirth)}
                editable={false}
                placeholder="Date of Birth"
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Line 1</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.addressLine1}
              onChangeText={(text) => setParentData({...parentData, addressLine1: text})}
              editable={isEditingParent}
              placeholder="Enter address line 1"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.addressLine2}
              onChangeText={(text) => setParentData({...parentData, addressLine2: text})}
              editable={isEditingParent}
              placeholder="Enter address line 2"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address Line 3</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.addressLine3}
              onChangeText={(text) => setParentData({...parentData, addressLine3: text})}
              editable={isEditingParent}
              placeholder="Enter address line 3"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.city}
              onChangeText={(text) => setParentData({...parentData, city: text})}
              editable={isEditingParent}
              placeholder="Enter city"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postcode</Text>
            <TextInput
              style={[styles.input, !isEditingParent && styles.inputDisabled]}
              value={parentData.postcode}
              onChangeText={(text) => setParentData({...parentData, postcode: text})}
              editable={isEditingParent}
              placeholder="Enter postcode"
            />
          </View>

                     <View style={styles.inputGroup}>
             <Text style={styles.label}>Relationship</Text>
             {isEditingParent ? (
               <ModalSelector
                 data={relationshipOptions}
                 initValue={relationshipOptions.find(o => o.value === parentData.relationship)?.label || "-- Please select --"}
                 onChange={(option: any) => setParentData({...parentData, relationship: option.value})}
                 style={styles.selector}
                 initValueTextStyle={{ color: parentData.relationship ? '#000' : '#999' }}
                 selectTextStyle={{ fontSize: 16 }}
               >
                 <TextInput
                   style={[styles.input, !isEditingParent && styles.inputDisabled]}
                   editable={false}
                   placeholder="-- Please select --"
                   value={relationshipOptions.find(o => o.value === parentData.relationship)?.label || parentData.relationship || ''}
                 />
               </ModalSelector>
             ) : (
               <TextInput
                 style={[styles.input, styles.inputDisabled]}
                 value={relationshipOptions.find(o => o.value === parentData.relationship)?.label || parentData.relationship}
                 editable={false}
                 placeholder="-- Please select --"
               />
             )}
           </View>

           <View style={styles.inputGroup}>
             <Text style={styles.label}>Nationality</Text>
             {isEditingParent ? (
               <ModalSelector
                 data={nationalityOptions}
                 initValue={nationalityOptions.find(o => o.value === parentData.nationality)?.label || "-- Please select --"}
                 onChange={(option: any) => setParentData({...parentData, nationality: option.value})}
                 style={styles.selector}
                 initValueTextStyle={{ color: parentData.nationality ? '#000' : '#999' }}
                 selectTextStyle={{ fontSize: 16 }}
               >
                 <TextInput
                   style={[styles.input, !isEditingParent && styles.inputDisabled]}
                   editable={false}
                   placeholder="-- Please select --"
                   value={nationalityOptions.find(o => o.value === parentData.nationality)?.label || parentData.nationality || ''}
                 />
               </ModalSelector>
             ) : (
               <TextInput
                 style={[styles.input, styles.inputDisabled]}
                 value={nationalityOptions.find(o => o.value === parentData.nationality)?.label || parentData.nationality}
                 editable={false}
                 placeholder="-- Please select --"
               />
             )}
           </View>

           <View style={styles.inputGroup}>
             <Text style={styles.label}>State</Text>
             {isEditingParent ? (
               <ModalSelector
                 data={stateOptions}
                 initValue={stateOptions.find(o => o.value === parentData.state)?.label || "-- Please select --"}
                 onChange={(option: any) => setParentData({...parentData, state: option.value})}
                 style={styles.selector}
                 initValueTextStyle={{ color: parentData.state ? '#000' : '#999' }}
                 selectTextStyle={{ fontSize: 16 }}
               >
                 <TextInput
                   style={[styles.input, !isEditingParent && styles.inputDisabled]}
                   editable={false}
                   placeholder="-- Please select --"
                   value={stateOptions.find(o => o.value === parentData.state)?.label || parentData.state || ''}
                 />
               </ModalSelector>
             ) : (
               <TextInput
                 style={[styles.input, styles.inputDisabled]}
                 value={stateOptions.find(o => o.value === parentData.state)?.label || parentData.state}
                 editable={false}
                 placeholder="-- Please select --"
               />
             )}
           </View>

          {isEditingParent && (
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveParent}>
              <Text style={styles.saveButtonText}>Save Parent Information</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={parentData?.dateOfBirth ? new Date(parentData.dateOfBirth) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
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
    backgroundColor: '#E1F5FF',
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
  editButton: {
    backgroundColor: '#F1F1F1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButtonActive: {
    backgroundColor: '#24A8FF',
    borderColor: '#24A8FF',
  },
  editButtonText: {
    color: '#222',
    fontSize: 12,
    fontWeight: '500',
  },
  editButtonTextActive: {
    color: '#fff',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
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
  inputDisabled: {
    backgroundColor: '#E1F5FF',
    color: '#666',
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

  selector: {
    marginBottom: 0,
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
}); 