import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";

interface AIActionScreenProps {
  onBack?: () => void;
  onPauseAction?: () => void;
  onNavigate?: (screen: string) => void;
}

interface ExecutionLogItem {
  id: string;
  message: string;
  completed: boolean;
}

const EXECUTION_LOG: ExecutionLogItem[] = [
  { id: "1", message: "Hospital HCIV Alerted", completed: true },
  { id: "2", message: "GPS Coordinates Dispatched", completed: true },
  { id: "3", message: "Record Synced to eCHIS", completed: true },
];

export const AIActionScreen: React.FC<AIActionScreenProps> = ({
  onBack,
  onPauseAction,
  onNavigate,
}) => {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for AI card
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    // Spin animation for sync icon
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    );

    // Glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    spinAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      spinAnimation.stop();
      glowAnimation.stop();
    };
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handlePauseAction = () => {
    onPauseAction?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* AI Action Status Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionBarContent}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="sync" size={16} color={COLORS.white} />
          </Animated.View>
          <Text style={styles.actionBarText}>
            AI ACTION: URGENT REFERRAL INITIATED
          </Text>
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
          <Text style={styles.headerSubtitle}>AUTONOMOUS AGENT</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="auto-awesome" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.centerContent}>
          {/* AI Processing Card */}
          <Animated.View
            style={[
              styles.aiCard,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.aiCardGlow,
                {
                  opacity: glowAnim,
                },
              ]}
            />
            <MaterialIcons name="psychology" size={64} color={COLORS.primary} />
            <Text style={styles.aiCardTitle}>AI Processing</Text>
            <Text style={styles.aiCardSubtitle}>Analyzing Vitals...</Text>

            {/* Animated line */}
            <View style={styles.animatedLine} />
          </Animated.View>

          {/* Execution Log */}
          <View style={styles.executionLog}>
            <Text style={styles.executionLogTitle}>Execution Log</Text>

            {EXECUTION_LOG.map((item) => (
              <View key={item.id} style={styles.logItem}>
                <View style={styles.logCheckContainer}>
                  <MaterialIcons name="check" size={14} color={COLORS.white} />
                </View>
                <Text style={styles.logItemText}>{item.message}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Emergency Target Section */}
        <View style={styles.emergencySection}>
          <View style={styles.emergencyInfo}>
            <View>
              <Text style={styles.emergencyLabel}>Emergency Target</Text>
              <Text style={styles.emergencyFacility}>
                Mukono Health Centre IV
              </Text>
            </View>
            <View style={styles.emergencyUrgent}>
              <Text style={styles.urgentText}>URGENT</Text>
              <Text style={styles.triageLevelText}>TRIAGE LEVEL</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.pauseButton}
            onPress={handlePauseAction}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="pause-circle-outline"
              size={24}
              color={COLORS.slate500}
            />
            <Text style={styles.pauseButtonText}>
              Pause AI Action (Human Override)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate?.("intake")}
        >
          <MaterialIcons
            name="medical-services"
            size={24}
            color={COLORS.slate300}
          />
          <Text style={styles.navLabel}>Intake</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="bolt" size={24} color={COLORS.primary} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Agency</Text>
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
    backgroundColor: COLORS.slate50,
  },
  actionBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  actionBarContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBarText: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
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
    justifyContent: "space-between",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  aiCard: {
    width: 280,
    height: 280,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
  },
  aiCardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 123, 255, 0.05)",
    borderRadius: 40,
  },
  aiCardTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.deepBlue,
    marginTop: 16,
    letterSpacing: -0.5,
  },
  aiCardSubtitle: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  animatedLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 2,
    backgroundColor: "rgba(0, 123, 255, 0.3)",
  },
  executionLog: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.1)",
    gap: 12,
  },
  executionLogTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
    paddingLeft: 4,
  },
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logCheckContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.successGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  logItemText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.deepBlue,
    fontStyle: "italic",
  },
  emergencySection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    gap: 16,
  },
  emergencyInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 8,
  },
  emergencyLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emergencyFacility: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.deepBlue,
    marginTop: 4,
  },
  emergencyUrgent: {
    alignItems: "flex-end",
  },
  urgentText: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.urgentRed,
    textTransform: "uppercase",
  },
  triageLevelText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate400,
    marginTop: 2,
  },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
  },
  pauseButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 1,
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

export default AIActionScreen;
