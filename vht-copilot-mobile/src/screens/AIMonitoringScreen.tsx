import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";

interface AIMonitoringScreenProps {
  onNavigate?: (screen: string) => void;
  onManualIntake?: () => void;
  onViewPatients?: () => void;
  onViewHistory?: () => void;
  onSettings?: () => void;
  onOverride?: () => void;
}

interface StatCard {
  label: string;
  value: string;
  bgColor: string;
  borderColor: string;
  labelColor: string;
  valueColor: string;
}

interface AIDecision {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  tags?: { label: string; bgColor: string; textColor: string }[];
}

const STAT_CARDS: StatCard[] = [
  {
    label: "Agent Sync",
    value: "Live",
    bgColor: "#F0F7FF",
    borderColor: "#E3F2FD",
    labelColor: COLORS.primary,
    valueColor: COLORS.deepBlue,
  },
  {
    label: "AI Actions",
    value: "24",
    bgColor: "#F2FDF5",
    borderColor: "#dcfce7",
    labelColor: "#15803d",
    valueColor: "#166534",
  },
  {
    label: "Alerts",
    value: "02",
    bgColor: "#FFF9E6",
    borderColor: "#fef3c7",
    labelColor: "#a16207",
    valueColor: "#854d0e",
  },
];

const AI_DECISIONS: AIDecision[] = [
  {
    id: "1",
    title: "Kato J. Referred to Hospital",
    description:
      "Autonomous triage detected acute respiratory distress. Hospital notified.",
    timeAgo: "2m ago",
    icon: "share",
    iconBgColor: "#fef2f2",
    iconColor: "#ef4444",
    tags: [
      { label: "Urgent", bgColor: COLORS.slate100, textColor: COLORS.slate500 },
      {
        label: "Referral Code: #V881",
        bgColor: "#eff6ff",
        textColor: COLORS.primary,
      },
    ],
  },
  {
    id: "2",
    title: "Mukasa L. Follow-up Scheduled",
    description:
      "Malaria treatment course Day 2 check-in completed via voice link.",
    timeAgo: "15m ago",
    icon: "medication",
    iconBgColor: "#f0fdf4",
    iconColor: "#22c55e",
  },
  {
    id: "3",
    title: "Zone 4 Risk Assessment",
    description: "Updated community risk map based on 14 new intake trends.",
    timeAgo: "1h ago",
    icon: "analytics",
    iconBgColor: "#eff6ff",
    iconColor: COLORS.primary,
  },
];

export const AIMonitoringScreen: React.FC<AIMonitoringScreenProps> = ({
  onNavigate,
  onManualIntake,
  onViewPatients,
  onViewHistory,
  onSettings,
  onOverride,
}) => {
  const { currentUser, lastSyncTime } = useAppStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  const getLastSyncString = () => {
    if (lastSyncTime) {
      const diffMs = Date.now() - lastSyncTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    }
    return "2 minutes ago";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.triageYellow}
      />

      {/* Community Alert Bar */}
      <View style={styles.alertBar}>
        <View style={styles.alertLeft}>
          <MaterialIcons name="warning" size={18} color="#000" />
          <Text style={styles.alertText}>
            Community Alert: Moderate Malaria Risk
          </Text>
        </View>
        <View style={styles.alertTag}>
          <Text style={styles.alertTagText}>Zone 4</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.headerTitle}>Co-Pilot Monitoring</Text>
            <Text style={styles.headerSubtitle}>VHT Autonomous Agent</Text>
          </View>
        </View>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            style={styles.avatar}
          />
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STAT_CARDS.map((card, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                {
                  backgroundColor: card.bgColor,
                  borderColor: card.borderColor,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: card.labelColor }]}>
                {card.label}
              </Text>
              <Text style={[styles.statValue, { color: card.valueColor }]}>
                {card.value}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Status Card */}
        <View style={styles.aiStatusCard}>
          {/* Pulse indicator */}
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.8],
                    outputRange: [0.5, 0],
                  }),
                },
              ]}
            />
            <View style={styles.pulseCore} />
          </View>

          <View style={styles.aiStatusHeader}>
            <View style={styles.aiIconContainer}>
              <MaterialIcons name="psychology" size={32} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.aiStatusTitle}>VHT Co-Pilot</Text>
              <Text style={styles.aiStatusLabel}>ACTIVE MONITORING</Text>
            </View>
          </View>

          <View style={styles.aiStatusMessage}>
            <Text style={styles.aiStatusMessageText}>
              <Text style={styles.aiStatusMessageBold}>Status:</Text> Listening
              for community health signals. Ready to assist with diagnosis and
              triage autonomously.
            </Text>
          </View>

          <View style={styles.aiStatusButtons}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={onSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.overrideButton}
              onPress={onOverride}
              activeOpacity={0.9}
            >
              <Text style={styles.overrideButtonText}>Override</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent AI Decisions */}
        <View style={styles.decisionsSection}>
          <View style={styles.decisionsSectionHeader}>
            <Text style={styles.decisionsSectionTitle}>
              Recent AI Decisions
            </Text>
            <TouchableOpacity onPress={onViewHistory}>
              <Text style={styles.viewHistoryText}>View History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.decisionsList}>
            {AI_DECISIONS.map((decision) => (
              <View key={decision.id} style={styles.decisionCard}>
                <View
                  style={[
                    styles.decisionIconContainer,
                    { backgroundColor: decision.iconBgColor },
                  ]}
                >
                  <MaterialIcons
                    name={decision.icon as keyof typeof MaterialIcons.glyphMap}
                    size={20}
                    color={decision.iconColor}
                  />
                </View>
                <View style={styles.decisionContent}>
                  <View style={styles.decisionHeader}>
                    <Text style={styles.decisionTitle}>{decision.title}</Text>
                    <Text style={styles.decisionTime}>{decision.timeAgo}</Text>
                  </View>
                  <Text style={styles.decisionDescription}>
                    {decision.description}
                  </Text>
                  {decision.tags && (
                    <View style={styles.decisionTags}>
                      {decision.tags.map((tag, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.decisionTag,
                            { backgroundColor: tag.bgColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.decisionTagText,
                              { color: tag.textColor },
                            ]}
                          >
                            {tag.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onManualIntake}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="add-to-photos"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.quickActionText}>Manual Intake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onViewPatients}
            activeOpacity={0.7}
          >
            <MaterialIcons name="group" size={24} color={COLORS.slate400} />
            <Text style={styles.quickActionText}>My Patients</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Last Sync Status */}
      <View style={styles.lastSyncBar}>
        <View style={styles.syncDot} />
        <Text style={styles.lastSyncText}>
          Last AI Sync: {getLastSyncString()}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  alertBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.triageYellow,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  alertTag: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  alertTagText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.deepBlue,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  statsContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingLeft: 24,
  },
  statCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  aiStatusCard: {
    backgroundColor: COLORS.deepBlue,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
    position: "relative",
  },
  pulseContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },
  pulseCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  aiStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  aiStatusTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.white,
  },
  aiStatusLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#10B981",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 4,
  },
  aiStatusMessage: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  aiStatusMessageText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  aiStatusMessageBold: {
    fontWeight: "700",
    color: COLORS.white,
  },
  aiStatusButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  settingsButton: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  settingsButtonText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  overrideButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  overrideButtonText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  decisionsSection: {
    marginTop: 24,
  },
  decisionsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  decisionsSectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  viewHistoryText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  decisionsList: {
    gap: 12,
  },
  decisionCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 16,
  },
  decisionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  decisionContent: {
    flex: 1,
  },
  decisionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  decisionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.deepBlue,
    flex: 1,
  },
  decisionTime: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate400,
  },
  decisionDescription: {
    fontSize: 11,
    color: COLORS.slate500,
    marginTop: 4,
    lineHeight: 16,
  },
  decisionTags: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  decisionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  decisionTagText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.deepBlue,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  lastSyncBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.successGreen,
  },
  lastSyncText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default AIMonitoringScreen;
