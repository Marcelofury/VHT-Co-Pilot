import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";

interface VoiceIntakeScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
}

export const VoiceIntakeScreen: React.FC<VoiceIntakeScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const {
    isRecording,
    setIsRecording,
    triageScore,
    currentTriageLevel,
    selectedPatient,
  } = useAppStore();

  const [currentSymptom, setCurrentSymptom] = useState({
    english: "High Fever",
    luganda: "Omusujja ogw'amaanyi",
  });

  // Animated wave bars
  const waveAnimations = useRef(
    Array(11)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (isRecording) {
      startWaveAnimation();
    } else {
      stopWaveAnimation();
    }
  }, [isRecording]);

  const startWaveAnimation = () => {
    waveAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300 + Math.random() * 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  };

  const stopWaveAnimation = () => {
    waveAnimations.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0);
    });
  };

  const handleMicPress = () => {
    setIsRecording(!isRecording);
  };

  const getTriageColor = () => {
    switch (currentTriageLevel) {
      case "stable":
        return COLORS.triageGreen;
      case "moderate":
        return COLORS.triageYellow;
      case "highRisk":
        return COLORS.triageRed;
      case "urgent":
        return COLORS.emergencyRed;
      default:
        return COLORS.triageYellow;
    }
  };

  const getTriageLabel = () => {
    switch (currentTriageLevel) {
      case "stable":
        return "Stable";
      case "moderate":
        return "Moderate";
      case "highRisk":
        return "High Risk";
      case "urgent":
        return "URGENT";
      default:
        return "Moderate";
    }
  };

  const waveHeights = [32, 64, 96, 128, 80, 112, 144, 96, 48, 80, 40];
  const waveOpacities = [0.3, 0.5, 0.7, 1, 0.8, 0.9, 1, 0.7, 0.5, 0.6, 0.3];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={getTriageColor()} />

      {/* Triage Status Bar */}
      <View style={[styles.triageBar, { backgroundColor: getTriageColor() }]}>
        <View style={styles.triageBarLeft}>
          <MaterialIcons name="warning" size={20} color={COLORS.deepBlue} />
          <Text style={styles.triageBarText}>
            Real-time Triage: {getTriageLabel()}
          </Text>
        </View>
        <View style={styles.triageBarRight}>
          <View style={styles.scoreTag}>
            <Text style={styles.scoreText}>Score: {triageScore}</Text>
          </View>
          <MaterialIcons name="cloud-done" size={20} color={COLORS.deepBlue} />
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
          <Text style={styles.headerSubtitle}>ACTIVE INTAKE SESSION</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="info" size={24} color={COLORS.deepBlue} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Symptom Card */}
        <View style={styles.symptomCard}>
          <View style={styles.symptomSection}>
            <Text style={styles.languageLabel}>English</Text>
            <Text style={styles.symptomText}>{currentSymptom.english}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.symptomSection}>
            <Text style={styles.languageLabel}>Luganda</Text>
            <Text style={styles.symptomText}>{currentSymptom.luganda}</Text>
          </View>
        </View>

        {/* Voice Capture Section */}
        <View style={styles.voiceCaptureSection}>
          <View style={styles.captureStatusContainer}>
            <Text style={styles.captureStatus}>
              {isRecording ? "Voice Capture Active" : "Tap to Start Recording"}
            </Text>
            <Text style={styles.captureSubtext}>
              {isRecording
                ? "Listening for patient symptoms..."
                : "Hold the button to speak"}
            </Text>
          </View>

          {/* Waveform Visualization */}
          <View style={styles.waveformContainer}>
            {waveAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height: waveHeights[index],
                    opacity: waveOpacities[index],
                    transform: [
                      {
                        scaleY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          {/* Patient Info Badge */}
          <View style={styles.patientBadge}>
            <Image
              source={{
                uri:
                  selectedPatient?.photoUrl ||
                  "https://randomuser.me/api/portraits/women/44.jpg",
              }}
              style={styles.patientBadgeAvatar}
            />
            <View>
              <Text style={styles.patientBadgeName}>
                {selectedPatient
                  ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                  : "Nalubega Sarah"}
              </Text>
              <Text style={styles.patientBadgeId}>
                Patient ID: #{selectedPatient?.vhtCode || "VHT-8821"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Microphone Button Section */}
      <View style={styles.micSection}>
        <View style={styles.micButtonContainer}>
          {isRecording && (
            <>
              <View style={[styles.micPulse, styles.micPulseLarge]} />
              <View style={[styles.micPulse, styles.micPulseSmall]} />
            </>
          )}
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            activeOpacity={0.9}
          >
            <MaterialIcons
              name={isRecording ? "mic" : "mic-none"}
              size={40}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.micInstructions}>
          <Text style={styles.micInstructionTitle}>
            {isRecording ? "Recording..." : "Hold to Speak"}
          </Text>
          <Text style={styles.micInstructionSubtitle}>
            {isRecording ? "Wogera..." : "Kwata wano okwogera"}
          </Text>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons
            name="medical-services"
            size={24}
            color={COLORS.primary}
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Intake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.("patients")}
        >
          <MaterialIcons name="group" size={24} color={COLORS.slate300} />
          <Text style={styles.navLabel}>Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.("sync")}
        >
          <MaterialIcons name="sync" size={24} color={COLORS.slate300} />
          <Text style={styles.navLabel}>Sync</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.("profile")}
        >
          <MaterialIcons name="settings" size={24} color={COLORS.slate300} />
          <Text style={styles.navLabel}>Profile</Text>
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
  triageBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  triageBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  triageBarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  triageBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreTag: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
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
    gap: 24,
  },
  symptomCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  symptomSection: {
    gap: 4,
  },
  languageLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  symptomText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.softBlue,
    marginVertical: 16,
  },
  voiceCaptureSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  captureStatusContainer: {
    alignItems: "center",
    gap: 4,
  },
  captureStatus: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  captureSubtext: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate500,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 150,
    width: "100%",
    maxWidth: 280,
  },
  waveBar: {
    width: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 99,
    minHeight: 4,
  },
  patientBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.softBlue,
  },
  patientBadgeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  patientBadgeName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  patientBadgeId: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    opacity: 0.8,
    textTransform: "uppercase",
  },
  micSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.03,
    shadowRadius: 30,
    elevation: 10,
  },
  micButtonContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  micPulse: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  micPulseLarge: {
    width: 96 * 1.5,
    height: 96 * 1.5,
    opacity: 0.1,
  },
  micPulseSmall: {
    width: 96 * 1.25,
    height: 96 * 1.25,
    opacity: 0.2,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  micInstructions: {
    alignItems: "center",
    gap: 4,
  },
  micInstructionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  micInstructionSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate500,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.slate300,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
});

export default VoiceIntakeScreen;
