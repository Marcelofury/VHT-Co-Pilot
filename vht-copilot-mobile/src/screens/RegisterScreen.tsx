import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { authAPI, hospitalAPI } from "../services/api";

// Web-compatible alert
const showAlert = (title: string, message: string, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
    onOk?.();
  } else {
    Alert.alert(title, message, onOk ? [{ text: "OK", onPress: onOk }] : undefined);
  }
};

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "VHT", // VHT or HOSPITAL
    vhtId: "",
    hospitalCode: "",
    hospitalId: "",
    hospitalName: "",
    phone: "",
    village: "",
    district: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchHospitals();
    fetchDistricts();
  }, []);

  // Fetch villages when district changes
  useEffect(() => {
    if (formData.district) {
      fetchVillages(formData.district);
    }
  }, [formData.district]);

  const fetchHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const hospitalsList = await hospitalAPI.getAll();
      setHospitals(hospitalsList);
      console.log(`Loaded ${hospitalsList.length} hospitals`);
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      showAlert("Warning", "Could not load hospitals list. You can still register manually.");
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchDistricts = async () => {
    setLoadingDistricts(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/locations/?action=districts');
      const data = await response.json();
      setDistricts(data.districts || []);
      console.log(`Loaded ${data.districts?.length || 0} districts`);
    } catch (error) {
      console.error("Error fetching districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchVillages = async (districtName: string) => {
    setLoadingVillages(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/locations/?action=villages&district=${encodeURIComponent(districtName)}`);
      const data = await response.json();
      setVillages(data.villages || []);
      console.log(`Loaded ${data.villages?.length || 0} villages for ${districtName}`);
    } catch (error) {
      console.error("Error fetching villages:", error);
      setVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  };

  const selectHospital = (hospital: any) => {
    setFormData(prev => ({
      ...prev,
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      hospitalCode: hospital.id.toString(), // Use ID as code for backend
      district: hospital.district || prev.district, // Auto-populate district from hospital
      village: '', // Clear village when hospital/district changes
    }));
    setShowHospitalModal(false);
    
    // Show success message
    console.log(`Hospital selected: ${hospital.name} in ${hospital.district} district`);
  };

  const selectDistrict = (district: any) => {
    setFormData(prev => ({
      ...prev,
      district: district.name,
      village: '', // Clear village when district changes
    }));
    setShowDistrictModal(false);
    console.log(`District selected: ${district.name}`);
  };

  const selectVillage = (village: any) => {
    setFormData(prev => ({
      ...prev,
      village: village.name,
    }));
    setShowVillageModal(false);
    console.log(`Village selected: ${village.name}`);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    console.log("Validating form...", formData);
    
    if (!formData.firstName.trim()) {
      console.log("Validation failed: First name missing");
      showAlert("Error", "Please enter your first name");
      return false;
    }
    if (!formData.lastName.trim()) {
      console.log("Validation failed: Last name missing");
      showAlert("Error", "Please enter your last name");
      return false;
    }
    if (formData.role === "VHT" && !formData.vhtId.trim()) {
      console.log("Validation failed: VHT ID missing");
      showAlert("Error", "Please enter your VHT ID");
      return false;
    }
    if (formData.role === "HOSPITAL" && !formData.hospitalCode.trim()) {
      console.log("Validation failed: Hospital code missing");
      showAlert("Error", "Please enter your Hospital ID");
      return false;
    }
    if (!formData.username.trim()) {
      console.log("Validation failed: Username missing");
      showAlert("Error", "Please enter a username");
      return false;
    }
    if (formData.password.length < 6) {
      console.log("Validation failed: Password too short");
      showAlert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      console.log("Validation failed: Passwords don't match");
      showAlert("Error", "Passwords do not match");
      return false;
    }
    
    console.log("Validation passed!");
    return true;
  };

  const handleRegister = async () => {
    console.log("Register button clicked!");
    console.log("Form data:", formData);
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    console.log("Form validation passed, starting registration...");
    setIsLoading(true);
    try {
      // Prepare data
      const registrationData = {
        username: formData.username,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        vht_id: formData.role === "VHT" ? formData.vhtId : undefined,
        hospital_code: formData.role === "HOSPITAL" ? formData.hospitalCode : undefined,
        phone_number: formData.phone,
        village: formData.village,
        district: formData.district,
      };
      
      console.log("Registering with data:", registrationData);
      
      // Call registration API
      await authAPI.register(registrationData);
      
      console.log("Registration successful!");
      showAlert(
        "Success",
        "Registration successful! Please login with your credentials.",
        onNavigateToLogin
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Response data:", error.response?.data);
      
      // Extract detailed error message
      let errorMessage = "Registration failed. Please try again.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data) {
        // Try to format validation errors
        const errors = error.response.data;
        const messages = Object.entries(errors).map(([key, value]) => {
          return `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
        });
        errorMessage = messages.join('\n');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert("Registration Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onNavigateToLogin}
            style={styles.backButton}
            disabled={isLoading}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.slate900} />
          </TouchableOpacity>
          <View style={styles.logoCircle}>
            <MaterialIcons name="person-add" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the VHT Co-Pilot Community</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          {/* Personal Information */}
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="person-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={COLORS.slate400}
              value={formData.firstName}
              onChangeText={(value) => updateField("firstName", value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="person-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={COLORS.slate400}
              value={formData.lastName}
              onChangeText={(value) => updateField("lastName", value)}
              editable={!isLoading}
            />
          </View>

          {/* Role Selection */}
          <Text style={styles.sectionTitle}>User Type</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === "VHT" && styles.roleButtonActive,
              ]}
              onPress={() => updateField("role", "VHT")}
              disabled={isLoading}
            >
              <MaterialIcons
                name="medical-services"
                size={24}
                color={formData.role === "VHT" ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === "VHT" && styles.roleButtonTextActive,
                ]}
              >
                VHT Personnel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === "HOSPITAL" && styles.roleButtonActive,
              ]}
              onPress={() => updateField("role", "HOSPITAL")}
              disabled={isLoading}
            >
              <MaterialIcons
                name="local-hospital"
                size={24}
                color={formData.role === "HOSPITAL" ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === "HOSPITAL" && styles.roleButtonTextActive,
                ]}
              >
                Hospital Staff
              </Text>
            </TouchableOpacity>
          </View>

          {formData.role === "VHT" && (
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="badge"
                size={20}
                color={COLORS.slate400}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="VHT ID (e.g., VHT-8821)"
                placeholderTextColor={COLORS.slate400}
                value={formData.vhtId}
                onChangeText={(value) => updateField("vhtId", value)}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>
          )}

          {formData.role === "HOSPITAL" && (
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="local-hospital"
                size={20}
                color={COLORS.slate400}
                style={styles.inputIcon}
              />
              <TouchableOpacity 
                style={styles.hospitalSelector}
                onPress={() => setShowHospitalModal(true)}
                disabled={isLoading}
              >
                <Text style={formData.hospitalName ? styles.input : styles.placeholderText}>
                  {formData.hospitalName || "Select Your Hospital"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.slate400} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="phone"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.slate400}
              value={formData.phone}
              onChangeText={(value) => updateField("phone", value)}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>

          {/* District Dropdown */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="map"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TouchableOpacity 
              style={styles.hospitalSelector}
              onPress={() => setShowDistrictModal(true)}
              disabled={isLoading || (formData.role === 'HOSPITAL' && !!formData.hospitalName)}
            >
              <Text style={formData.district ? styles.input : styles.placeholderText}>
                {formData.district || "Select District"}
              </Text>
              {formData.role === 'HOSPITAL' && formData.hospitalName && formData.district ? (
                <MaterialIcons name="check-circle" size={20} color={COLORS.successGreen} style={{ marginLeft: 8 }} />
              ) : (
                <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.slate400} />
              )}
            </TouchableOpacity>
          </View>
          {formData.role === 'HOSPITAL' && formData.hospitalName && (
            <Text style={styles.helperText}>District auto-populated from hospital</Text>
          )}

          {/* Village Dropdown */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="location-on"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TouchableOpacity 
              style={styles.hospitalSelector}
              onPress={() => setShowVillageModal(true)}
              disabled={isLoading || !formData.district || loadingVillages}
            >
              <Text style={formData.village ? styles.input : styles.placeholderText}>
                {loadingVillages ? 'Loading villages...' : (formData.village || (formData.district ? `Select Village in ${formData.district}` : 'Select district first'))}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>
          {villages.length > 0 && (
            <Text style={styles.helperText}>{villages.length} villages available in {formData.district}</Text>
          )}

          {/* Account Credentials */}
          <Text style={styles.sectionTitle}>Account Credentials</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="account-circle"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={COLORS.slate400}
              value={formData.username}
              onChangeText={(value) => updateField("username", value)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={COLORS.slate400}
              value={formData.password}
              onChangeText={(value) => updateField("password", value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color={COLORS.slate400}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.slate400}
              value={formData.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={20}
                color={COLORS.slate400}
              />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              isLoading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Hospital Selection Modal */}
      <Modal
        visible={showHospitalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHospitalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Hospital</Text>
              <TouchableOpacity onPress={() => setShowHospitalModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate600} />
              </TouchableOpacity>
            </View>

            {loadingHospitals ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.hospitalList}>
                {hospitals.length === 0 ? (
                  <Text style={styles.noHospitalsText}>No hospitals available</Text>
                ) : (
                  hospitals.map((hospital) => (
                    <TouchableOpacity
                      key={hospital.id}
                      style={styles.hospitalItem}
                      onPress={() => selectHospital(hospital)}
                    >
                      <MaterialIcons name="local-hospital" size={24} color={COLORS.primary} />
                      <View style={styles.hospitalInfo}>
                        <Text style={styles.hospitalName}>{hospital.name}</Text>
                        <Text style={styles.hospitalDetails}>
                          {hospital.district} • {hospital.facility_type}
                        </Text>
                      </View>
                      {formData.hospitalId === hospital.id && (
                        <MaterialIcons name="check-circle" size={24} color={COLORS.successGreen} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate600} />
              </TouchableOpacity>
            </View>

            {loadingDistricts ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.hospitalList}>
                {districts.length === 0 ? (
                  <Text style={styles.noHospitalsText}>No districts available</Text>
                ) : (
                  districts.map((district) => (
                    <TouchableOpacity
                      key={district.id}
                      style={styles.hospitalItem}
                      onPress={() => selectDistrict(district)}
                    >
                      <MaterialIcons name="map" size={24} color={COLORS.primary} />
                      <View style={styles.hospitalInfo}>
                        <Text style={styles.hospitalName}>{district.name}</Text>
                        <Text style={styles.hospitalDetails}>
                          {district.region} Region • {district.village_count} villages
                        </Text>
                      </View>
                      {formData.district === district.name && (
                        <MaterialIcons name="check-circle" size={24} color={COLORS.successGreen} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Village Selection Modal */}
      <Modal
        visible={showVillageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVillageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Village in {formData.district}</Text>
              <TouchableOpacity onPress={() => setShowVillageModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate600} />
              </TouchableOpacity>
            </View>

            {loadingVillages ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.hospitalList}>
                {villages.length === 0 ? (
                  <Text style={styles.noHospitalsText}>No villages available for {formData.district}</Text>
                ) : (
                  villages.map((village) => (
                    <TouchableOpacity
                      key={village.id}
                      style={styles.hospitalItem}
                      onPress={() => selectVillage(village)}
                    >
                      <MaterialIcons name="location-on" size={24} color={COLORS.primary} />
                      <View style={styles.hospitalInfo}>
                        <Text style={styles.hospitalName}>{village.name}</Text>
                        <Text style={styles.hospitalDetails}>
                          GPS: {village.latitude.toFixed(4)}, {village.longitude.toFixed(4)}
                        </Text>
                      </View>
                      {formData.village === village.name && (
                        <MaterialIcons name="check-circle" size={24} color={COLORS.successGreen} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate500,
  },
  formSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate600,
    marginBottom: 12,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.slate900,
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  loginSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.slate500,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  hospitalSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  placeholderText: {
    fontSize: 15,
    color: COLORS.slate400,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 44,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.slate900,
  },
  hospitalList: {
    paddingHorizontal: 20,
  },
  hospitalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    gap: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  hospitalDetails: {
    fontSize: 13,
    color: COLORS.slate500,
  },
  noHospitalsText: {
    textAlign: "center",
    color: COLORS.slate400,
    padding: 20,
  },
});
