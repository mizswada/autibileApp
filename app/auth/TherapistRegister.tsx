import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import API from '../../api';

export default function TherapistRegister() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [ic, setIC] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [department, setDepartment] = useState('');
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    fullName: '',
    email: '',
    ic: '',
    phone: '',
    password: '',
    confirmPassword: '',
    workplace: '',
    department: '',
    acceptTerms: '',
  });

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    fetchDepartmentOptions();
  }, []);

  useEffect(() => {
    const validateAll = () => {
      const usernameValid = username ? username.trim() !== '' : false;
      const fullNameValid = fullName ? fullName.trim() !== '' : false;
      const emailValid = email ? email.trim() !== '' && isValidEmail(email) : false;
      const icValid = ic ? ic.trim() !== '' : false;
      const phoneValid = phone ? phone.trim() !== '' && phone.length >= 8 : false;
      const passwordValid = password ? password.length >= 8 : false;
      const confirmPasswordValid = password === confirmPassword && confirmPassword ? confirmPassword.length >= 8 : false;
      const workplaceValid = workplace ? workplace.trim() !== '' : false;
      const departmentValid = department ? String(department).trim() !== '' : false;
      const termsValid = acceptTerms;

      return (
        usernameValid &&
        fullNameValid &&
        emailValid &&
        icValid &&
        phoneValid &&
        passwordValid &&
        confirmPasswordValid &&
        workplaceValid &&
        departmentValid &&
        termsValid
      );
    };

    setIsFormValid(validateAll());
  }, [username, fullName, email, ic, phone, password, confirmPassword, workplace, department, acceptTerms]);


  const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const fetchDepartmentOptions = async () => {
    try {
      const response = await API('lookup/departments', {}, 'GET', false);
      if (response && Array.isArray(response)) {
        const options = response.map((dept: any) => ({
          key: dept.lookupID,
          label: dept.title,
          value: dept.lookupID
        }));
        setDepartmentOptions(options);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const validateField = (field: string, value: string | number) => {
    let message = '';
    const stringValue = String(value || '');
    const trimmedValue = stringValue ? stringValue.trim() : '';
    
    switch (field) {
      case 'username':
        if (!trimmedValue) message = 'Username is required';
        break;
      case 'fullName':
        if (!trimmedValue) message = 'Full name is required';
        break;
      case 'email':
        if (!trimmedValue) message = 'Email is required';
        else if (!isValidEmail(stringValue)) message = 'Invalid email format';
        break;
      case 'ic':
        if (!trimmedValue || stringValue.length < 12 || stringValue.length > 12) message = 'IC / MyKid / Passport is required and valid';
        break;
      case 'phone':
        if (!trimmedValue || stringValue.length < 10 || stringValue.length > 11) message = 'Phone number must be valid';
        break;
      case 'password':
        if (!stringValue || stringValue.length < 8) message = 'Password must be at least 8 characters';
        break;
      case 'confirmPassword':
        if (stringValue !== password) message = 'Passwords do not match';
        break;
      case 'workplace':
        if (!trimmedValue) message = 'Workplace is required';
        break;
      case 'department':
        if (!value) message = 'Department is required';
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [field]: message }));
    return message === '';
  };

  const validateForm = () => {
    const fields = ['username', 'fullName', 'email', 'ic', 'phone', 'password', 'confirmPassword', 'workplace', 'department'];
    let valid = true;
    fields.forEach(field => {
      const value = eval(field);
      if (!validateField(field, value)) valid = false;
    });
    if (!acceptTerms) {
      setErrors(prev => ({ ...prev, acceptTerms: 'You must accept terms and conditions' }));
      valid = false;
    } else {
      setErrors(prev => ({ ...prev, acceptTerms: '' }));
    }
    return valid;
  };

  const handleSignUp = async () => {
    //if (!validateForm()) return;
    try {
      console.log("Calling API...");
      const response = await API("apps/registration/registerPractitioner", {
        username,
        fullname: fullName,
        email,
        ic,
        password,
        phone,
        role: "3", 
        type: "Therapist",
        workplace,
        department
      });
  
      if (response.statusCode === 200 && response.data) {
        setShowSuccessModal(true); 
      } else {
        alert(response.message || 'Registration failed');
      }      
    } catch (error) {
      console.error(error);
      alert('An error occurred during registration');
    }
  };


  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/auth/LoginTherapist');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.create}>Create New Account</Text>
      </View>

      {/** Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Username"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          validateField('username', text);
        }}
      />
      {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

      {/** Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Full Name"
        value={fullName}
        onChangeText={(text) => {
          setFullName(text);
          validateField('fullName', text);
        }}
      />
      {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

      {/** Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Your Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          validateField('email', text);
        }}
        keyboardType="email-address"
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      {/** IC */}
      <Text style={styles.label}>IC / MyKid / Passport</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: 123456789012"
        value={ic}
        onChangeText={(text) => {
          setIC(text);
          validateField('ic', text);
        }}
      />
      {errors.ic ? <Text style={styles.errorText}>{errors.ic}</Text> : null}

      {/** Phone */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          validateField('phone', text);
        }}
      />
      {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

      {/** Workplace */}
      <Text style={styles.label}>Workplace</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your workplace"
        value={workplace}
        onChangeText={(text) => {
          setWorkplace(text);
          validateField('workplace', text);
        }}
      />
      {errors.workplace ? <Text style={styles.errorText}>{errors.workplace}</Text> : null}

      {/** Department */}
      <Text style={styles.label}>Department</Text>
      <ModalSelector
        data={departmentOptions.map((option, index) => ({ ...option, key: `dept-${index}` }))}
        initValue={departmentOptions.find(o => o.value === department)?.label || "-- Please select --"}
        onChange={(option: any) => {
          setDepartment(option.value);
          validateField('department', option.value);
        }}
        style={styles.selector}
        initValueTextStyle={{ color: department ? '#000' : '#999' }}
        selectTextStyle={{ fontSize: 16 }}
      >
        <TextInput
          style={styles.input}
          editable={false}
          placeholder="-- Please select --"
          value={departmentOptions.find(o => o.value === department)?.label || department || ''}
        />
      </ModalSelector>
      {errors.department ? <Text style={styles.errorText}>{errors.department}</Text> : null}

      {/** Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Password (Min: 8 characters)"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          validateField('password', text);
        }}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      {/** Confirm Password */}
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Reenter Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          validateField('confirmPassword', text);
        }}
      />
      {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

      {/** Terms */}
      <View style={styles.termsRow}>
        <TouchableOpacity
          style={[styles.checkboxBase, acceptTerms && styles.checkboxChecked]}
          onPress={() => {
            setAcceptTerms(!acceptTerms);
            if (!acceptTerms) setErrors(prev => ({ ...prev, acceptTerms: '' }));
          }}
        >
          {acceptTerms && <View style={styles.checkboxInner} />}
        </TouchableOpacity>
        <Text style={styles.termsText}>I accept terms and condition</Text>
      </View>
      {errors.acceptTerms ? <Text style={styles.errorText}>{errors.acceptTerms}</Text> : null}

      {/** Sign Up button */}
      <TouchableOpacity
        style={[styles.button, !isFormValid && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={!isFormValid}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>


      {/** Sign In redirect */}
      <TouchableOpacity onPress={() => router.push('/auth/LoginTherapist')}>
        <Text style={styles.signInLink}>
          Already have an account? <Text style={styles.signInText}>Sign In</Text>
        </Text>
      </TouchableOpacity>

      {/** Success Modal */}
      <Modal animationType="fade" transparent={true} visible={showSuccessModal} onRequestClose={handleSuccessModalClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Up Complete</Text>
            <Text style={styles.modalText}>Your account is pending approval. Please contact the Administrator to activate your account.</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleSuccessModalClose}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // [styles remain unchanged as per your latest version]
  // include your styles here
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 80, backgroundColor: '#fff' },
  headerContainer: { position: 'relative', width: '100%', alignItems: 'center', marginBottom: 8 },
  backButton: { position: 'absolute', left: 0 },
  create: { fontSize: 26, fontWeight: 'bold', color: '#0B8FAC', marginBottom: 20 },
  input: { width: '100%', height: 52, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#f9f9f9' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, width: '100%' },
  termsText: { marginLeft: 8, fontSize: 14, color: '#555' },
  button: { width: '100%', height: 48, backgroundColor: '#4db5ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signInLink: { fontSize: 14, color: '#555' },
  signInText: { color: '#4db5ff', fontWeight: 'bold' },
  checkboxBase: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#4db5ff', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#4db5ff22' },
  checkboxInner: { width: 12, height: 12, backgroundColor: '#4db5ff', borderRadius: 2 },
  label: { alignSelf: 'flex-start', fontSize: 16, color: '#000', marginBottom: 4, marginTop: 4, fontWeight: '600' },
  errorText: { color: 'red', alignSelf: 'flex-start', marginBottom: 8, marginTop: -12, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 24, width: '80%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#222' },
  modalText: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 20 },
  modalButton: { backgroundColor: '#4db5ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  selector: {
    marginBottom: 0,
    width: '100%',
  },
  
});
