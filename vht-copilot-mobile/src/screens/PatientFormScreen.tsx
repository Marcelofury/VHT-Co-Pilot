import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { patientAPI, locationAPI } from "../services/api";

interface PatientFormScreenProps {
  onBack?: () => void;
  onPatientCreated?: (patientId: string) => void;
}

export const PatientFormScreen: React.FC<PatientFormScreenProps> = ({
  onBack,
  onPatientCreated,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Modal states
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [villages, setVillages] = useState<Array<{name: string; latitude: number; longitude: number}>>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // Fetch districts on mount
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch villages when district changes
  useEffect(() => {
    if (district) {
      fetchVillages(district);
    }
  }, [district]);

  const fetchDistricts = async () => {
    setLoadingDistricts(true);
    try {
      const districtsList = await locationAPI.getDistricts();
      setDistricts(districtsList.sort());
    } catch (error) {
      console.error("Error fetching districts:", error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchVillages = async (selectedDistrict: string) => {
    setLoadingVillages(true);
    try {
      const villagesList = await locationAPI.getVillages(selectedDistrict);
      setVillages(villagesList);
    } catch (error) {
      console.error("Error fetching villages:", error);
      setVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  };

  const selectDistrict = (dist: string) => {
    setDistrict(dist);
    setVillage(""); // Reset village when district changes
    setLatitude(undefined);
    setLongitude(undefined);
    setShowDistrictModal(false);
  };

  const selectVillage = (villageData: {name: string; latitude: number; longitude: number}) => {
    setVillage(villageData.name);
    setLatitude(villageData.latitude);
    setLongitude(villageData.longitude);
    setShowVillageModal(false);
  };

  // Generate unique VHT code
  const generateVHTCode = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `VHT-${timestamp}-${random}`;
  };

  const handleSubmit = async () => {
    // Validation
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (!age.trim()) {
      setError("Age is required");
      return;
    }
    if (!gender) {
      setError("Please select gender");
      return;
    }
    if (!district.trim()) {
      setError("District is required");
      return;
    }
    if (!village.trim()) {
      setError("Village is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("Creating patient:", { firstName, lastName, age, gender, village, district, latitude, longitude });
      
      // Backend expects snake_case, and we cast to any since the full Patient type
      // includes server-generated fields (id, vhtCode, triageLevel, etc.)
      const patientData: any = {
        vht_code: generateVHTCode(),
        first_name: firstName,
        last_name: lastName,
        age: age, // Backend accepts string for age (e.g., "8mo" or "42")
        gender: gender, // MALE or FEMALE
        village: village,
        latitude: latitude,
        longitude: longitude,
        phone_number: phoneNumber || undefined,
      };

      const newPatient = await patientAPI.create(patientData);
      console.log("Patient created:", newPatient);
      
      // Navigate to voice intake with the new patient ID
      onPatientCreated?.(newPatient.id);
    } catch (err: any) {
      console.error("Error creating patient:", err);
      const errorMessage = err.response?.data?.vht_code?.[0] || 
                          err.response?.data?.gender?.[0] || 
                          err.response?.data?.message || 
                          "Failed to create patient. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.deepBlue} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>New Patient</Text>
          <Text style={styles.headerSubtitle}>Register Patient Information</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Patient Details</Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={20} color={COLORS.urgentRed} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                First Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor={COLORS.slate300}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Last Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor={COLORS.slate300}
                autoCapitalize="words"
              />
            </View>

            {/* Age and Gender Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>
                  Age <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g., 25 or 8mo"
                  placeholderTextColor={COLORS.slate300}
                  maxLength={10}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.inputLabel}>
                  Gender <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.genderButtons}>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === "MALE" && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender("MALE")}
                  >
                    <MaterialIcons
                      name="male"
                      size={20}
                      color={gender === "MALE" ? COLORS.white : COLORS.slate400}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === "MALE" && styles.genderButtonTextActive,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      gender === "FEMALE" && styles.genderButtonActive,
                    ]}
                    onPress={() => setGender("FEMALE")}
                  >
                    <MaterialIcons
                      name="female"
                      size={20}
                      color={gender === "FEMALE" ? COLORS.white : COLORS.slate400}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === "FEMALE" && styles.genderButtonTextActive,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* District */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                District <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowDistrictModal(true)}
              >
                <Text style={[styles.dropdownButtonText, !district && styles.placeholderText]}>
                  {district || "Select District"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.slate400} />
              </TouchableOpacity>
            </View>

            {/* Village */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Village <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  if (!district) {
                    setError("Please select a district first");
                    return;
                  }
                  setShowVillageModal(true);
                }}
                disabled={!district}
              >
                <Text style={[styles.dropdownButtonText, !village && styles.placeholderText]}>
                  {village || "Select Village"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.slate400} />
              </TouchableOpacity>
              {latitude && longitude && (
                <Text style={styles.gpsInfo}>
                  GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Text>
              )}
            </View>

            {/* Phone Number (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.slate300}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              After submitting, you'll proceed to voice intake to record patient symptoms.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Continue to Voice Intake</Text>
                <MaterialIcons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.deepBlue} />
              </TouchableOpacity>
            </View>
            {loadingDistricts ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={districts}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, district === item && styles.modalItemActive]}
                    onPress={() => selectDistrict(item)}
                  >
                    <Text style={[styles.modalItemText, district === item && styles.modalItemTextActive]}>
                      {item}
                    </Text>
                    {district === item && (
                      <MaterialIcons name="check" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Village Selection Modal */}
      <Modal
        visible={showVillageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVillageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Village - {district}</Text>
              <TouchableOpacity onPress={() => setShowVillageModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.deepBlue} />
              </TouchableOpacity>
            </View>
            {loadingVillages ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : villages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No villages found for {district}</Text>
              </View>
            ) : (
              <FlatList
                data={villages}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, village === item.name && styles.modalItemActive]}
                    onPress={() => selectVillage(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalItemText, village === item.name && styles.modalItemTextActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.modalItemSubtext}>
                        GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                      </Text>
                    </View>
                    {village === item.name && (
                      <MaterialIcons name="check" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
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
    backgroundColor: COLORS.slate50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.deepBlue,
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.urgentRed,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.deepBlue,
    marginBottom: 8,
  },
  required: {
    color: COLORS.urgentRed,
  },
  input: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.deepBlue,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  genderButtons: {
    flexDirection: "row",
    gap: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingVertical: 14,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate400,
  },
  genderButtonTextActive: {
    color: COLORS.white,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.softBlue,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.deepBlue,
  },
  placeholderText: {
    color: COLORS.slate300,
  },
  gpsInfo: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.softGreen,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate50,
  },
  modalItemActive: {
    backgroundColor: COLORS.softBlue,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.deepBlue,
  },
  modalItemTextActive: {
    color: COLORS.primary,
  },
  modalItemSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.slate400,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate400,
  },
});
