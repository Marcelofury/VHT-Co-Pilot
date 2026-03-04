import React, { useEffect, useRef, useState } from "react";
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
  ActivityIndicator,
  RefreshControl,
  Modal,
  Switch,
  Alert,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";
import { referralAPI, notificationAPI, vhtSettingsAPI, aiOverrideAPI, hospitalAPI } from "../services/api";

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

export const AIMonitoringScreen: React.FC<AIMonitoringScreenProps> = ({
  onNavigate,
  onManualIntake,
  onViewPatients,
  onViewHistory,
  onSettings,
  onOverride,
}) => {
  const { 
    currentUser, 
    lastSyncTime, 
    aiActions, 
    isOnline, 
    syncProgress 
  } = useAppStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [referrals, setReferrals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  
  // Settings states
  const [aiMonitoringEnabled, setAiMonitoringEnabled] = useState(true);
  const [autoTriageEnabled, setAutoTriageEnabled] = useState(true);
  const [highAlertThreshold, setHighAlertThreshold] = useState(80);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Override input states
  const [showTriageInputModal, setShowTriageInputModal] = useState(false);
  const [showFlagInputModal, setShowFlagInputModal] = useState(false);
  const [showHospitalSelectionModal, setShowHospitalSelectionModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [triageScoreInput, setTriageScoreInput] = useState('');
  const [flagReasonInput, setFlagReasonInput] = useState('');
  const [availableHospitals, setAvailableHospitals] = useState<any[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  useEffect(() => {
    loadData();
    loadSettings();
    
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

  const loadData = async () => {
    try {
      if (currentUser?.role === 'VHT') {
        const [referralsData, notificationsData, unreadData] = await Promise.all([
          referralAPI.getMyReferrals(true),
          notificationAPI.getAll(),
          notificationAPI.getUnreadCount(),
        ]);
        setReferrals(referralsData);
        setNotifications(notificationsData.slice(0, 5)); // Show only 5 most recent
        setUnreadCount(unreadData.count);
      }
    } catch (error) {
      console.error("Error loading referrals and notifications:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await vhtSettingsAPI.getMySettings();
      setAiMonitoringEnabled(settings.ai_monitoring_enabled);
      setAutoTriageEnabled(settings.auto_triage_enabled);
      setNotificationsEnabled(settings.notifications_enabled);
      setHighAlertThreshold(settings.high_alert_threshold);
    } catch (error) {
      console.error("Error loading settings:", error);
      // Keep default values if loading fails
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getLastSyncString = () => {
    if (lastSyncTime) {
      const diffMs = Date.now() - lastSyncTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    }
    return "2 minutes ago";
  };

  const getTimeSince = (timestamp: Date) => {
    const diffMs = Date.now() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getIconForAction = (type: string) => {
    switch (type) {
      case 'referral': return 'share';
      case 'triage': return 'local-hospital';
      case 'assessment': return 'analytics';
      default: return 'psychology';
    }
  };

  const getIconColors = (type: string) => {
    switch (type) {
      case 'referral':
        return { bg: '#fee2e2', color: '#dc2626' };
      case 'triage':
        return { bg: '#dcfce7', color: '#22c55e' };
      case 'assessment':
        return { bg: '#eff6ff', color: COLORS.primary };
      default:
        return { bg: COLORS.primaryLight, color: COLORS.primary };
    }
  };

  // Calculate dynamic stats
  const totalAIActions = aiActions.length;
  const alertCount = aiActions.filter(a => 
    a.type === 'referral' || 
    (a.aiReasoning && a.aiReasoning.toLowerCase().includes('urgent'))
  ).length;
  const syncStatus = isOnline ? 'Live' : 'Offline';
  
  const STAT_CARDS: StatCard[] = [
    {
      label: "Agent Sync",
      value: syncStatus,
      bgColor: "#F0F7FF",
      borderColor: "#E3F2FD",
      labelColor: COLORS.primary,
      valueColor: COLORS.deepBlue,
    },
    {
      label: "AI Actions",
      value: totalAIActions.toString(),
      bgColor: "#F2FDF5",
      borderColor: "#dcfce7",
      labelColor: "#15803d",
      valueColor: "#166534",
    },
    {
      label: "Alerts",
      value: alertCount.toString().padStart(2, '0'),
      bgColor: "#FFF9E6",
      borderColor: "#fef3c7",
      labelColor: "#a16207",
      valueColor: "#854d0e",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.triageYellow}
      />

      {/* Main Content - Everything scrolls together */}
      <ScrollView
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
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
              source={{
                uri:
                  currentUser?.photoUrl ||
                  "https://randomuser.me/api/portraits/men/32.jpg",
              }}
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

        {/* Content Section with padding */}
        <View style={styles.contentSection}>
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
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.overrideButton}
              onPress={() => setShowOverrideModal(true)}
              activeOpacity={0.9}
            >
              <Text style={styles.overrideButtonText}>Override</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Referrals Section */}
        {currentUser?.role === 'VHT' && (
          <View style={styles.decisionsSection}>
            <View style={styles.decisionsSectionHeader}>
              <Text style={styles.decisionsSectionTitle}>
                My Active Referrals
              </Text>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : referrals.length > 0 ? (
              <View style={styles.decisionsList}>
                {referrals.map((referral) => (
                  <View key={referral.id} style={styles.decisionCard}>
                    <View
                      style={[
                        styles.decisionIconContainer,
                        { backgroundColor: referral.urgency_level === 'URGENT' ? COLORS.urgentRed : COLORS.primary },
                      ]}
                    >
                      <MaterialIcons
                        name="local-hospital"
                        size={20}
                        color={COLORS.white}
                      />
                    </View>
                    <View style={styles.decisionContent}>
                      <View style={styles.decisionHeader}>
                        <Text style={styles.decisionTitle}>
                          {referral.patient_details?.full_name || 'Patient'}
                        </Text>
                        <Text style={[
                          styles.decisionTime,
                          { 
                            color: referral.status === 'CONFIRMED' ? COLORS.successGreen : COLORS.triageYellow,
                            fontWeight: '600'
                          }
                        ]}>
                          {referral.status}
                        </Text>
                      </View>
                      <Text style={styles.decisionDescription}>
                        {referral.hospital_details?.name || referral.hospital_name}
                      </Text>
                      <Text style={styles.decisionMetadata}>
                        {referral.urgency_level} • Score: {referral.triage_score}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No active referrals</Text>
            )}
          </View>
        )}

        {/* Notifications Section */}
        {currentUser?.role === 'VHT' && notifications.length > 0 && (
          <View style={styles.decisionsSection}>
            <View style={styles.decisionsSectionHeader}>
              <Text style={styles.decisionsSectionTitle}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Text>
            </View>

            <View style={styles.decisionsList}>
              {notifications.map((notification) => (
                <View 
                  key={notification.id} 
                  style={[
                    styles.decisionCard,
                    !notification.is_read && { backgroundColor: COLORS.primaryLight }
                  ]}
                >
                  <View
                    style={[
                      styles.decisionIconContainer,
                      { backgroundColor: notification.notification_type === 'REFERRAL_ACCEPTED' ? COLORS.successGreen : COLORS.primary },
                    ]}
                  >
                    <MaterialIcons
                      name={notification.notification_type === 'REFERRAL_ACCEPTED' ? 'check-circle' : 'info'}
                      size={20}
                      color={COLORS.white}
                    />
                  </View>
                  <View style={styles.decisionContent}>
                    <View style={styles.decisionHeader}>
                      <Text style={[styles.decisionTitle, !notification.is_read && { fontWeight: 'bold' }]}>
                        {notification.title}
                      </Text>
                    </View>
                    <Text style={styles.decisionDescription}>
                      {notification.message}
                    </Text>
                    <Text style={styles.decisionMetadata}>
                      {getTimeSince(new Date(notification.created_at))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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
            {aiActions.length > 0 ? (
              aiActions.slice(0, 5).map((action) => {
                const iconColors = getIconColors(action.type);
                return (
                  <View key={action.id} style={styles.decisionCard}>
                    <View
                      style={[
                        styles.decisionIconContainer,
                        { backgroundColor: iconColors.bg },
                      ]}
                    >
                      <MaterialIcons
                        name={getIconForAction(action.type) as keyof typeof MaterialIcons.glyphMap}
                        size={20}
                        color={iconColors.color}
                      />
                    </View>
                    <View style={styles.decisionContent}>
                      <View style={styles.decisionHeader}>
                        <Text style={styles.decisionTitle}>
                          {action.patientName} - {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                        </Text>
                        <Text style={styles.decisionTime}>
                          {getTimeSince(action.timestamp)}
                        </Text>
                      </View>
                      <Text style={styles.decisionDescription}>
                        {action.description}
                      </Text>
                      <View style={styles.decisionTags}>
                        <View
                          style={[
                            styles.decisionTag,
                            { backgroundColor: iconColors.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.decisionTagText,
                              { color: iconColors.color },
                            ]}
                          >
                            {action.status}
                          </Text>
                        </View>
                        {action.confidence && (
                          <View
                            style={[
                              styles.decisionTag,
                              { backgroundColor: '#f0f9ff' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.decisionTagText,
                                { color: COLORS.primary },
                              ]}
                            >
                              {Math.round(action.confidence * 100)}% Confident
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="psychology" size={48} color={COLORS.slate300} />
                <Text style={styles.emptyStateText}>No AI decisions yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Complete patient triage to see AI analysis here
                </Text>
              </View>
            )}
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
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Co-Pilot Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.settingsDescription}>
                Configure AI monitoring behavior, alert thresholds, and automation preferences
              </Text>

              {/* AI Monitoring Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>AI Monitoring</Text>
                  <Text style={styles.settingSubtext}>
                    Enable continuous AI monitoring for health signals
                  </Text>
                </View>
                <Switch
                  value={aiMonitoringEnabled}
                  onValueChange={setAiMonitoringEnabled}
                  trackColor={{ false: COLORS.slate300, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              {/* Auto-Triage Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Auto-Triage</Text>
                  <Text style={styles.settingSubtext}>
                    Allow AI to automatically triage patients based on symptoms
                  </Text>
                </View>
                <Switch
                  value={autoTriageEnabled}
                  onValueChange={setAutoTriageEnabled}
                  trackColor={{ false: COLORS.slate300, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              {/* Notifications Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingSubtext}>
                    Receive alerts for urgent cases and referral updates
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: COLORS.slate300, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              {/* Alert Threshold Info */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>High Alert Threshold</Text>
                  <Text style={styles.settingSubtext}>
                    AI confidence score: {highAlertThreshold}% and above triggers urgent alerts
                  </Text>
                </View>
              </View>

              <View style={styles.settingNote}>
                <MaterialIcons name="info" size={16} color={COLORS.primary} />
                <Text style={styles.settingNoteText}>
                  These settings affect how the AI Co-Pilot processes and prioritizes cases. 
                  Changes apply immediately to new cases.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={async () => {
                  try {
                    await vhtSettingsAPI.updateSettings({
                      ai_monitoring_enabled: aiMonitoringEnabled,
                      auto_triage_enabled: autoTriageEnabled,
                      notifications_enabled: notificationsEnabled,
                      high_alert_threshold: highAlertThreshold,
                    });
                    Alert.alert("Settings Saved", "Your AI Co-Pilot preferences have been updated.");
                    setShowSettingsModal(false);
                  } catch (error) {
                    console.error("Error saving settings:", error);
                    Alert.alert("Error", "Failed to save settings. Please try again.");
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Override Modal */}
      <Modal
        visible={showOverrideModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOverrideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Override AI Decisions</Text>
              <TouchableOpacity onPress={() => setShowOverrideModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.settingsDescription}>
                Manually adjust AI recommendations and provide clinical judgment override
              </Text>

              <View style={styles.overrideCard}>
                <View style={styles.overrideIconContainer}>
                  <MaterialIcons name="warning" size={32} color={COLORS.urgentRed} />
                </View>
                <Text style={styles.overrideTitle}>Clinical Override Authority</Text>
                <Text style={styles.overrideText}>
                  As a VHT, you can override AI triage scores, referral decisions, and urgency 
                  levels based on your clinical assessment and local context.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.overrideActionButton}
                onPress={() => {
                  if (referrals.length === 0) {
                    Alert.alert("No Referrals", "You have no active referrals to override.");
                    return;
                  }
                  setShowOverrideModal(false);
                  setTimeout(() => {
                    // Show first referral by default
                    const firstReferral = referrals[0];
                    setSelectedReferral(firstReferral);
                    setTriageScoreInput(firstReferral.triage_score.toString());
                    setShowTriageInputModal(true);
                  }, 300);
                }}
              >
                <MaterialIcons name="edit" size={20} color={COLORS.primary} />
                <Text style={styles.overrideActionText}>Adjust Triage Score</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.overrideActionButton}
                onPress={async () => {
                  if (referrals.length === 0) {
                    Alert.alert("No Referrals", "You have no active referrals to change.");
                    return;
                  }
                  setShowOverrideModal(false);
                  setLoadingHospitals(true);
                  try {
                    const hospitals = await hospitalAPI.getAll();
                    setAvailableHospitals(hospitals);
                    setTimeout(() => {
                      const firstReferral = referrals[0];
                      setSelectedReferral(firstReferral);
                      setShowHospitalSelectionModal(true);
                    }, 300);
                  } catch (error) {
                    console.error("Failed to load hospitals:", error);
                    Alert.alert("Error", "Failed to load hospitals. Please try again.");
                  } finally {
                    setLoadingHospitals(false);
                  }
                }}
              >
                <MaterialIcons name="local-hospital" size={20} color={COLORS.primary} />
                <Text style={styles.overrideActionText}>Change Referral Hospital</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.overrideActionButton}
                onPress={() => {
                  if (referrals.length === 0) {
                    Alert.alert("No Referrals", "You have no active referrals to flag.");
                    return;
                  }
                  setShowOverrideModal(false);
                  setTimeout(() => {
                    // Show first referral by default
                    const firstReferral = referrals[0];
                    setSelectedReferral(firstReferral);
                    setFlagReasonInput('');
                    setShowFlagInputModal(true);
                  }, 300);
                }}
              >
                <MaterialIcons name="flag" size={20} color={COLORS.primary} />
                <Text style={styles.overrideActionText}>Flag Incorrect Decision</Text>
              </TouchableOpacity>

              <View style={styles.settingNote}>
                <MaterialIcons name="psychology" size={16} color={COLORS.primary} />
                <Text style={styles.settingNoteText}>
                  Overrides are logged and used to improve AI accuracy. Your clinical judgment 
                  takes precedence over AI recommendations.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowOverrideModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Triage Score Input Modal */}
      <Modal
        visible={showTriageInputModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTriageInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Triage Score</Text>
              <TouchableOpacity onPress={() => setShowTriageInputModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedReferral && (
                <>
                  <View style={styles.overrideCard}>
                    <Text style={styles.overrideTitle}>
                      {selectedReferral.patient_details?.full_name}
                    </Text>
                    <Text style={styles.overrideText}>
                      Current Score: {selectedReferral.triage_score} • {selectedReferral.urgency_level}
                    </Text>
                    <Text style={styles.overrideText}>
                      Hospital: {selectedReferral.hospital_details?.name}
                    </Text>
                  </View>

                  <Text style={styles.settingLabel}>New Triage Score (0-100)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={triageScoreInput}
                    onChangeText={setTriageScoreInput}
                    keyboardType="number-pad"
                    placeholder="Enter new score"
                    maxLength={3}
                  />

                  <View style={styles.settingNote}>
                    <MaterialIcons name="info" size={16} color={COLORS.primary} />
                    <Text style={styles.settingNoteText}>
                      0-49: Routine • 50-79: Moderate • 80-100: Urgent
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowTriageInputModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { flex: 1, marginLeft: 8 }]}
                onPress={async () => {
                  if (!selectedReferral) return;
                  const newScore = parseInt(triageScoreInput);
                  if (isNaN(newScore) || newScore < 0 || newScore > 100) {
                    Alert.alert("Invalid Score", "Please enter a number between 0 and 100");
                    return;
                  }
                  try {
                    await aiOverrideAPI.overrideTriageScore({
                      referral_id: selectedReferral.id,
                      new_triage_score: newScore,
                      reason: "VHT clinical judgment override",
                      clinical_notes: `Adjusted from ${selectedReferral.triage_score} to ${newScore}`
                    });
                    Alert.alert("Success", "Triage score updated successfully");
                    setShowTriageInputModal(false);
                    loadData(); // Refresh data
                  } catch (error) {
                    console.error("Override error:", error);
                    Alert.alert("Error", "Failed to update triage score. Please try again.");
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Update Score</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hospital Selection Modal */}
      <Modal
        visible={showHospitalSelectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHospitalSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Referral Hospital</Text>
              <TouchableOpacity onPress={() => setShowHospitalSelectionModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedReferral && (
                <>
                  <View style={styles.overrideCard}>
                    <Text style={styles.overrideTitle}>
                      {selectedReferral.patient_details?.full_name}
                    </Text>
                    <Text style={styles.overrideText}>
                      Current Hospital: {selectedReferral.hospital_details?.name || 'Not assigned'}
                    </Text>
                    <Text style={styles.overrideText}>
                      Triage Score: {selectedReferral.triage_score} • {selectedReferral.urgency_level}
                    </Text>
                  </View>

                  <Text style={styles.settingLabel}>Select New Hospital</Text>
                  
                  {loadingHospitals ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
                  ) : availableHospitals.length === 0 ? (
                    <Text style={styles.emptyText}>No hospitals available</Text>
                  ) : (
                    availableHospitals.map((hospital) => (
                      <TouchableOpacity
                        key={hospital.id}
                        style={[
                          styles.hospitalCard,
                          selectedReferral.hospital?.id === hospital.id && styles.hospitalCardCurrent
                        ]}
                        onPress={async () => {
                          if (selectedReferral.hospital?.id === hospital.id) {
                            Alert.alert("Same Hospital", "This is already the assigned hospital.");
                            return;
                          }
                          try {
                            await aiOverrideAPI.overrideReferralHospital({
                              referral_id: selectedReferral.id,
                              new_hospital_id: hospital.id,
                              reason: "VHT manual hospital reassignment",
                              clinical_notes: `Changed from ${selectedReferral.hospital_details?.name} to ${hospital.name}`
                            });
                            Alert.alert("Success", `Referral hospital changed to ${hospital.name}`);
                            setShowHospitalSelectionModal(false);
                            loadData(); // Refresh data
                          } catch (error) {
                            console.error("Hospital change error:", error);
                            Alert.alert("Error", "Failed to change hospital. Please try again.");
                          }
                        }}
                      >
                        <View style={styles.hospitalCardHeader}>
                          <MaterialIcons 
                            name="local-hospital" 
                            size={24} 
                            color={selectedReferral.hospital?.id === hospital.id ? COLORS.primary : COLORS.slate400} 
                          />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.hospitalName}>{hospital.name}</Text>
                            <Text style={styles.hospitalInfo}>
                              {hospital.facility_type} • {hospital.district}
                            </Text>
                            <Text style={styles.hospitalInfo}>
                              Capacity: {hospital.current_active_referrals}/{hospital.max_capacity} • {hospital.emergency_capacity_status}
                            </Text>
                          </View>
                          {selectedReferral.hospital?.id === hospital.id && (
                            <View style={styles.currentBadge}>
                              <Text style={styles.currentBadgeText}>CURRENT</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}

                  <View style={styles.settingNote}>
                    <MaterialIcons name="info" size={16} color={COLORS.primary} />
                    <Text style={styles.settingNoteText}>
                      Tap a hospital to change the referral assignment. Consider bed availability and distance.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowHospitalSelectionModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Flag Decision Input Modal */}
      <Modal
        visible={showFlagInputModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFlagInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Flag Incorrect Decision</Text>
              <TouchableOpacity onPress={() => setShowFlagInputModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedReferral && (
                <>
                  <View style={styles.overrideCard}>
                    <Text style={styles.overrideTitle}>
                      {selectedReferral.patient_details?.full_name}
                    </Text>
                    <Text style={styles.overrideText}>
                      Triage Score: {selectedReferral.triage_score} • {selectedReferral.urgency_level}
                    </Text>
                    <Text style={styles.overrideText}>
                      Hospital: {selectedReferral.hospital_details?.name}
                    </Text>
                  </View>

                  <Text style={styles.settingLabel}>What was incorrect?</Text>
                  <TextInput
                    style={[styles.textInput, { height: 120, textAlignVertical: 'top' }]}
                    value={flagReasonInput}
                    onChangeText={setFlagReasonInput}
                    placeholder="e.g., 'AI misinterpreted symptoms', 'Wrong hospital', 'Incorrect urgency level'"
                    multiline
                    numberOfLines={4}
                  />

                  <View style={styles.settingNote}>
                    <MaterialIcons name="psychology" size={16} color={COLORS.primary} />
                    <Text style={styles.settingNoteText}>
                      Your feedback helps improve AI accuracy. Thank you for taking the time to report this.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowFlagInputModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: COLORS.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { flex: 1, marginLeft: 8 }]}
                onPress={async () => {
                  if (!selectedReferral || !flagReasonInput.trim()) {
                    Alert.alert("Reason Required", "Please describe what was incorrect");
                    return;
                  }
                  try {
                    await aiOverrideAPI.flagIncorrectDecision({
                      referral_id: selectedReferral.id,
                      reason: flagReasonInput.trim(),
                      decision_type: "triage",
                      clinical_notes: "VHT identified incorrect AI decision"
                    });
                    Alert.alert("Thank You", "Your feedback will help improve AI accuracy");
                    setShowFlagInputModal(false);
                    setFlagReasonInput('');
                  } catch (error) {
                    console.error("Flag error:", error);
                    Alert.alert("Error", "Failed to submit feedback. Please try again.");
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Last Sync Status - Fixed at bottom */}
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
  mainScrollView: {
    flex: 1,
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
  contentSection: {
    padding: 16,
    paddingBottom: 24,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slate500,
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: 'center',
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
  emptyText: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
    padding: 20,
  },
  decisionMetadata: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate400,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.deepBlue,
  },
  modalBody: {
    padding: 20,
  },
  settingsDescription: {
    fontSize: 13,
    color: COLORS.slate500,
    lineHeight: 20,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.deepBlue,
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 12,
    color: COLORS.slate500,
    lineHeight: 18,
  },
  settingNote: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  settingNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.slate600,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Override modal styles
  overrideCard: {
    backgroundColor: COLORS.slate50,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.urgentRed,
  },
  overrideIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: COLORS.white,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.urgentRed,
  },
  overrideTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.deepBlue,
    marginBottom: 8,
    textAlign: 'center',
  },
  overrideText: {
    fontSize: 13,
    color: COLORS.slate600,
    textAlign: 'center',
    lineHeight: 20,
  },
  overrideActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  overrideActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.deepBlue,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.deepBlue,
    marginTop: 8,
    marginBottom: 16,
  },
  hospitalCard: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  hospitalCardCurrent: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  hospitalCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.deepBlue,
    marginBottom: 4,
  },
  hospitalInfo: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});

export default AIMonitoringScreen;
