import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";
import { authAPI } from "../services/api";

interface ProfileScreenProps {
  onBack?: () => void;
  onSignOut?: () => void;
  onNavigate?: (screen: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onSignOut,
  onNavigate,
}) => {
  const {
    currentUser,
    language,
    voiceFeedbackEnabled,
    setLanguage,
    setVoiceFeedback,
    updateUser,
    lastSyncTime,
    setLastSyncTime,
    isOnline,
  } = useAppStore();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: currentUser?.name || "",
    village: currentUser?.village || "",
    district: currentUser?.district || "",
    region: currentUser?.region || "",
    phone: currentUser?.phone || "",
    photoUrl: currentUser?.photoUrl || "",
  });

  const handleLanguageToggle = () => {
    setLanguage(language === "lg" ? "en" : "lg");
  };

  const handleForceSync = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Cannot sync while offline. Please check your connection.");
      return;
    }

    setIsSyncing(true);
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLastSyncTime(new Date());
      Alert.alert("Success", "Data synced successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to sync data. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCallSupport = async () => {
    const phoneNumber = "tel:+256800123456"; // District supervisor number
    const canCall = await Linking.canOpenURL(phoneNumber);
    
    if (!canCall) {
      Alert.alert("Error", "Unable to make phone calls on this device");
      return;
    }

    Alert.alert(
      "Call Support",
      "Contact district supervisor at +256 800 123 456?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Call", 
          onPress: () => {
            Linking.openURL(phoneNumber).catch(() => {
              Alert.alert("Error", "Failed to initiate call");
            });
          }
        },
      ]
    );
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return "Never synced";
    const now = new Date();
    const diffMs = now.getTime() - lastSyncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleEditProfile = () => {
    setEditedUser({
      name: currentUser?.name || "",
      village: currentUser?.village || "",
      district: currentUser?.district || "",
      region: currentUser?.region || "",
      phone: currentUser?.phone || "",
      photoUrl: currentUser?.photoUrl || "",
    });
    setIsEditModalVisible(true);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditedUser({ ...editedUser, photoUrl: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSaveProfile = async () => {
    console.log("Save button pressed", editedUser);
    
    // Validate required fields
    if (!editedUser.name || !editedUser.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return;
    }
    
    if (!editedUser.village || !editedUser.village.trim()) {
      Alert.alert("Validation Error", "Village is required");
      return;
    }

    setIsSaving(true);
    try {
      console.log("Sending update to API...");
      const updatedUser = await authAPI.updateProfile({
        name: editedUser.name.trim(),
        village: editedUser.village.trim(),
        district: editedUser.district.trim(),
        region: editedUser.region.trim(),
        phone: editedUser.phone.trim(),
        photoUrl: editedUser.photoUrl,
      });

      console.log("Profile updated successfully:", updatedUser);

      // Update store with new user data
      updateUser({
        name: editedUser.name.trim(),
        village: editedUser.village.trim(),
        district: editedUser.district.trim(),
        region: editedUser.region.trim(),
        phone: editedUser.phone.trim(),
        photoUrl: editedUser.photoUrl,
      });

      setIsEditModalVisible(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || "Failed to update profile. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Top Spacer */}
      <View style={styles.topSpacer} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Image
              source={{
                uri:
                  currentUser?.photoUrl ||
                  "https://randomuser.me/api/portraits/men/32.jpg",
              }}
              style={styles.profileAvatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {currentUser?.name || "Musa Kanda"}
              </Text>
              <Text style={styles.profileId}>
                VHT ID: #{currentUser?.vhtId || "UG-8821-KMP"}
              </Text>
              <View style={styles.locationRow}>
                <MaterialIcons
                  name="location-on"
                  size={14}
                  color={COLORS.slate500}
                />
                <Text style={styles.locationText}>
                  {currentUser?.village || "Nakaseke Village"},{" "}
                  {currentUser?.region || "Central"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={18} color={COLORS.primary} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences / Okulonda</Text>

          <View style={styles.settingsCard}>
            {/* Language Setting */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.settingIconBlue]}>
                  <MaterialIcons
                    name="translate"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Primary Language</Text>
                  <Text style={styles.settingSubtext}>Luganda / English</Text>
                </View>
              </View>
              <View style={styles.languageToggle}>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === "lg" && styles.languageButtonActive,
                  ]}
                  onPress={() => setLanguage("lg")}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      language === "lg" && styles.languageButtonTextActive,
                    ]}
                  >
                    Luganda
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.languageButton,
                    language === "en" && styles.languageButtonActive,
                  ]}
                  onPress={() => setLanguage("en")}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      language === "en" && styles.languageButtonTextActive,
                    ]}
                  >
                    ENG
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingDivider} />

            {/* Voice Feedback Setting */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.settingIconBlue]}>
                  <MaterialIcons
                    name="volume-up"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.settingLabel}>Voice Feedback</Text>
              </View>
              <Switch
                value={voiceFeedbackEnabled}
                onValueChange={setVoiceFeedback}
                trackColor={{ false: COLORS.slate200, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>
        </View>

        {/* Sync & Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync & Tools</Text>

          <View style={styles.settingsCard}>
            {/* Force Sync */}
            <TouchableOpacity 
              style={styles.settingRow} 
              activeOpacity={0.7}
              onPress={handleForceSync}
              disabled={isSyncing || !isOnline}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.settingIconBlue]}>
                  <MaterialIcons 
                    name="sync" 
                    size={20} 
                    color={isSyncing ? COLORS.slate400 : COLORS.primary} 
                  />
                </View>
                <View>
                  <Text style={styles.settingLabel}>
                    {isSyncing ? "Syncing..." : "Force Data Sync"}
                  </Text>
                  <Text style={[
                    styles.settingSubtext,
                    !isOnline && { color: COLORS.urgentRed }
                  ]}>
                    {!isOnline ? "Offline" : `Last synced: ${formatLastSync()}`}
                  </Text>
                </View>
              </View>
              {isSyncing ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialIcons
                  name="refresh"
                  size={24}
                  color={isOnline ? COLORS.slate300 : COLORS.slate200}
                />
              )}
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            {/* Network Status */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.settingIconBlue]}>
                  <MaterialIcons 
                    name={isOnline ? "wifi" : "wifi-off"} 
                    size={20} 
                    color={isOnline ? COLORS.successGreen : COLORS.slate400} 
                  />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Network Status</Text>
                  <Text style={[
                    styles.settingSubtext,
                    { color: isOnline ? COLORS.successGreen : COLORS.slate500 }
                  ]}>
                    {isOnline ? "Connected" : "Offline"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.supportCard}>
          <View style={styles.supportHeader}>
            <MaterialIcons
              name="support-agent"
              size={32}
              color={COLORS.primary}
            />
            <View>
              <Text style={styles.supportTitle}>
                Need help, {currentUser?.name?.split(" ")[0] || "Musa"}?
              </Text>
              <Text style={styles.supportSubtext}>
                Contact the district supervisor
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.supportButton} 
            activeOpacity={0.8}
            onPress={handleCallSupport}
          >
            <MaterialIcons name="phone" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.supportButtonText}>Call Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color={COLORS.slate600} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Profile Photo */}
              <View style={styles.photoSection}>
                <Image
                  source={{
                    uri:
                      editedUser.photoUrl ||
                      "https://randomuser.me/api/portraits/men/32.jpg",
                  }}
                  style={styles.modalAvatar}
                />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={handlePickImage}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="camera-alt" size={20} color={COLORS.primary} />
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser.name}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, name: text })
                  }
                  placeholder="Enter your full name"
                  editable={!isSaving}
                />

                <Text style={styles.fieldLabel}>Village *</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser.village}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, village: text })
                  }
                  placeholder="Enter your village"
                  editable={!isSaving}
                />

                <Text style={styles.fieldLabel}>District</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser.district}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, district: text })
                  }
                  placeholder="Enter your district"
                  editable={!isSaving}
                />

                <Text style={styles.fieldLabel}>Region</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser.region}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, region: text })
                  }
                  placeholder="Enter your region"
                  editable={!isSaving}
                />

                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser.phone}
                  onChangeText={(text) =>
                    setEditedUser({ ...editedUser, phone: text })
                  }
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </View>
            </ScrollView>

            {/* Save Button - Fixed at bottom */}
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
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
  topSpacer: {
    height: 48,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.softBlue,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.deepBlue,
    marginBottom: 4,
  },
  profileId: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate500,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.2)",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  section: {
    padding: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    minHeight: 64,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingIconBlue: {
    backgroundColor: COLORS.primaryLight,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.slate500,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.slate50,
    marginLeft: 68,
  },
  languageToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.slate100,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  languageButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  languageButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.slate400,
  },
  languageButtonTextActive: {
    color: COLORS.deepBlue,
  },
  supportCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.1)",
    gap: 16,
  },
  supportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  supportSubtext: {
    fontSize: 13,
    color: COLORS.slate600,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
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
    paddingTop: 24,
    paddingBottom: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: COLORS.softBlue,
    marginBottom: 12,
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  formSection: {
    gap: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.deepBlue,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.deepBlue,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    marginHorizontal: 24,
    marginBottom: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
});

export default ProfileScreen;
