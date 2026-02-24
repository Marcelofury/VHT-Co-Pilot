import React from "react";
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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";

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
  } = useAppStore();

  const handleLanguageToggle = () => {
    setLanguage(language === "lg" ? "en" : "lg");
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

        {/* Offline Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Access & Tools</Text>

          <View style={styles.settingsCard}>
            {/* Offline Maps */}
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.settingIconBlue]}>
                  <MaterialIcons name="map" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Offline Village Maps</Text>
                  <Text
                    style={[
                      styles.settingSubtext,
                      { color: COLORS.successGreen },
                    ]}
                  >
                    124 MB Downloaded
                  </Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.slate300}
              />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            {/* Training Resources */}
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.settingIconBlue]}>
                  <MaterialIcons
                    name="school"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Training Resources</Text>
                  <Text style={styles.settingSubtext}>8 modules available</Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.slate300}
              />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            {/* Force Sync */}
            <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.settingIconBlue]}>
                  <MaterialIcons name="sync" size={20} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Force Data Sync</Text>
                  <Text style={styles.settingSubtext}>Last synced: 2h ago</Text>
                </View>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={COLORS.slate300}
              />
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.supportButton} activeOpacity={0.8}>
            <Text style={styles.supportButtonText}>Call Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
});

export default ProfileScreen;
