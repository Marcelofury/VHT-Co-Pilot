import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";

interface EmergencyDecisionScreenProps {
  onBack?: () => void;
  onConfirmReferral?: () => void;
  onNavigate?: (screen: string) => void;
  patientId?: string;
}

interface FirstAidInstruction {
  id: string;
  icon: string;
  titleEnglish: string;
  titleLuganda: string;
  description: string;
}

const FIRST_AID_INSTRUCTIONS: FirstAidInstruction[] = [
  {
    id: "1",
    icon: "air",
    titleEnglish: "Airway",
    titleLuganda: "Okussa",
    description: "Ensure patient is sitting upright. Clear any obstructions.",
  },
  {
    id: "2",
    icon: "water-drop",
    titleEnglish: "Hydration",
    titleLuganda: "Okunywa amazzi",
    description: "Small sips of clean water if patient is conscious.",
  },
  {
    id: "3",
    icon: "thermostat",
    titleEnglish: "Fever",
    titleLuganda: "Omusujja",
    description: "Use cool damp cloth on forehead and armpits.",
  },
];

export const EmergencyDecisionScreen: React.FC<
  EmergencyDecisionScreenProps
> = ({ onBack, onConfirmReferral, onNavigate }) => {
  const { triageScore, selectedPatient } = useAppStore();

  const handleConfirmReferral = () => {
    onConfirmReferral?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.urgentRed} />

      {/* Urgent Triage Bar */}
      <View style={styles.urgentBar}>
        <View style={styles.urgentBarLeft}>
          <MaterialIcons name="emergency" size={20} color={COLORS.white} />
          <Text style={styles.urgentBarText}>Red - URGENT Referral</Text>
        </View>
        <View style={styles.urgentBarRight}>
          <View style={styles.scoreTag}>
            <Text style={styles.scoreText}>Score: {triageScore || 88}</Text>
          </View>
          <MaterialIcons name="gpp-maybe" size={20} color={COLORS.white} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <MaterialIcons
            name="arrow-back-ios"
            size={20}
            color={COLORS.deepBlue}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>VHT Co-Pilot</Text>
          <Text style={styles.headerSubtitle}>DECISION SUPPORT</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="map" size={24} color={COLORS.deepBlue} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Instructions Header */}
        <View style={styles.instructionsHeader}>
          <Text style={styles.instructionsLabel}>Emergency Instructions</Text>
          <Text style={styles.instructionsLuganda}>
            Omulambiki gw'obujjanjabi obusooka
          </Text>
        </View>

        {/* First Aid Cards */}
        <View style={styles.instructionsContainer}>
          {FIRST_AID_INSTRUCTIONS.map((instruction) => (
            <View key={instruction.id} style={styles.instructionCard}>
              <View style={styles.instructionIconContainer}>
                <MaterialIcons
                  name={instruction.icon as keyof typeof MaterialIcons.glyphMap}
                  size={28}
                  color={COLORS.urgentRed}
                />
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>
                  {instruction.titleEnglish} / {instruction.titleLuganda}
                </Text>
                <Text style={styles.instructionDescription}>
                  {instruction.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Referral Section */}
      <View style={styles.referralSection}>
        {/* Facility Card */}
        <View style={styles.facilityCard}>
          <View style={styles.facilityInfo}>
            <View style={styles.facilityIconContainer}>
              <MaterialIcons
                name="location-on"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View>
              <Text style={styles.facilityLabel}>Nearest HCIV</Text>
              <Text style={styles.facilityName}>Mukono Health Centre IV</Text>
            </View>
          </View>
          <View style={styles.facilityTime}>
            <Text style={styles.facilityTimeValue}>18 min</Text>
            <Text style={styles.facilityTimeLabel}>ESTIMATED TRAVEL</Text>
          </View>
        </View>

        {/* GPS Coordinates */}
        <View style={styles.gpsContainer}>
          <Text style={styles.gpsLabel}>GPS Coordinates</Text>
          <Text style={styles.gpsValue}>Lat: 0.3541° N, Long: 32.7387° E</Text>
        </View>

        {/* Confirm Referral Button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmReferral}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmButtonText}>Confirm Referral to HCIV</Text>
          <Text style={styles.confirmButtonSubtext}>
            Kakasanya okusindika ku ddwaliro
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  urgentBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.urgentRed,
  },
  urgentBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  urgentBarText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  urgentBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreTag: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.urgentRed,
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
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  instructionsHeader: {
    marginBottom: 16,
    gap: 4,
  },
  instructionsLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.urgentRed,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  instructionsLuganda: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  instructionsContainer: {
    gap: 12,
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.urgentRed,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    gap: 16,
  },
  instructionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.deepBlue,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: COLORS.slate600,
    lineHeight: 20,
  },
  referralSection: {
    backgroundColor: COLORS.slate50,
    borderTopWidth: 2,
    borderTopColor: COLORS.slate200,
    padding: 24,
    gap: 16,
  },
  facilityCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  facilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  facilityIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  facilityLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.slate400,
    textTransform: "uppercase",
  },
  facilityName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  facilityTime: {
    alignItems: "flex-end",
  },
  facilityTimeValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  facilityTimeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.slate400,
    textTransform: "uppercase",
  },
  gpsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  gpsLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  gpsValue: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate500,
    letterSpacing: 0.5,
  },
  confirmButton: {
    backgroundColor: COLORS.urgentRed,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    gap: 4,
    shadowColor: COLORS.urgentRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  confirmButtonSubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.white,
    opacity: 0.9,
  },
});

export default EmergencyDecisionScreen;
