import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";
import { referralAPI } from "../services/api";

interface HospitalDashboardScreenProps {
  onNavigate?: (screen: string) => void;
  onViewReferral?: (referralId: string) => void;
  onLogout?: () => void;
}

interface HospitalReferral {
  id: string;
  patient_name: string;
  vht_code: string;
  triage_level: string;
  triage_score: number;
  status: string;
  arrival_time?: string;
  created_at: string;
}

export const HospitalDashboardScreen: React.FC<HospitalDashboardScreenProps> = ({
  onNavigate,
  onViewReferral,
  onLogout,
}) => {
  const { currentUser } = useAppStore();
  const [referrals, setReferrals] = useState<HospitalReferral[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    in_transit: 0,
    arrived: 0,
    completed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  const loadData = async () => {
    try {
      // Fetch hospital-specific referrals from API
      const [referralsData, statsData] = await Promise.all([
        referralAPI.getMyHospitalReferrals(),
        referralAPI.getHospitalStats(),
      ]);
      
      setReferrals(referralsData as any);
      setStats(statsData);
      
      // Check for new urgent referrals (real-time notification)
      const urgentCount = (referralsData as any[]).filter(
        (r: any) => r.triage_level === 'URGENT' && r.status === 'PENDING'
      ).length;
      
      if (urgentCount > lastNotificationCount && lastNotificationCount > 0) {
        // New urgent referral arrived!
        const newReferrals = urgentCount - lastNotificationCount;
        if (Platform.OS === 'web') {
          alert(`🚨 NEW URGENT REFERRAL\n\n${newReferrals} new urgent patient(s) need immediate attention!`);
        } else {
          Alert.alert(
            "🚨 Urgent Referral",
            `${newReferrals} new urgent patient(s) need immediate attention!`,
            [{ text: "View Now", style: "default" }]
          );
        }
      }
      setLastNotificationCount(urgentCount);
      
    } catch (error: any) {
      console.error("Error loading referrals:", error);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.warn("Authentication failed - token may be expired or missing");
        if (Platform.OS === 'web') {
          alert("Session expired. Please log in again.");
        } else {
          Alert.alert(
            "Session Expired",
            "Your session has expired. Please log in again.",
            [{ text: "OK", onPress: () => onLogout?.() }]
          );
        }
        // Trigger logout after a brief delay (for web)
        setTimeout(() => {
          onLogout?.();
        }, 1000);
        return;
      }
      
      // Set empty data on error
      setReferrals([]);
      setStats({
        pending: 0,
        in_transit: 0,
        arrived: 0,
        completed: 0,
        total: 0,
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only load data if user is authenticated
    if (currentUser) {
      loadData();
      
      // Real-time polling: Check for new referrals every 30 seconds
      const pollInterval = setInterval(() => {
        console.log('Polling for new referrals...');
        loadData();
      }, 30000); // 30 seconds
      
      return () => clearInterval(pollInterval);
    }
  }, [currentUser]); // Depend on currentUser instead of lastNotificationCount

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAcceptReferral = async (referralId: string) => {
    try {
      const result = await referralAPI.acceptReferral(referralId);
      if (result.success) {
        // Show success message
        if (Platform.OS === 'web') {
          alert(`✅ ${result.message}\n\nReferral accepted successfully. VHT has been notified.`);
        } else {
          Alert.alert(
            "Referral Accepted",
            result.message + "\n\nVHT has been notified.",
            [{ text: "OK" }]
          );
        }
        // Reload data to show updated status
        loadData();
      }
    } catch (error: any) {
      console.error("Error accepting referral:", error);
      const errorMessage = error.response?.data?.error || "Failed to accept referral. Please try again.";
      if (Platform.OS === 'web') {
        alert(`❌ Error\n\n${errorMessage}`);
      } else {
        Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      }
    }
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case "URGENT":
        return COLORS.urgentRed;
      case "HIGH_RISK":
        return COLORS.triageYellow;
      case "MODERATE":
        return COLORS.triageYellow;
      default:
        return COLORS.successGreen;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return COLORS.triageYellow;
      case "in_transit":
        return COLORS.primary;
      case "arrived":
        return COLORS.primary;
      case "completed":
        return COLORS.successGreen;
      default:
        return COLORS.slate400;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {currentUser?.hospitalName || "Hospital Dashboard"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {currentUser?.name || "Hospital Staff"}
            {currentUser?.hospitalDistrict && ` • ${currentUser.hospitalDistrict} District`}
          </Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color={COLORS.slate600} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: `${COLORS.triageYellow}20` }]}>
            <MaterialIcons name="schedule" size={32} color={COLORS.triageYellow} />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: `${COLORS.primary}20` }]}>
            <MaterialIcons name="directions-car" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.in_transit}</Text>
            <Text style={styles.statLabel}>In Transit</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: `${COLORS.primary}20` }]}>
            <MaterialIcons name="local-hospital" size={32} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.arrived}</Text>
            <Text style={styles.statLabel}>Arrived</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: `${COLORS.successGreen}20` }]}>
            <MaterialIcons name="check-circle" size={32} color={COLORS.successGreen} />
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Incoming Referrals - Organized by Triage Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Referrals</Text>
          
          {referrals.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={48} color={COLORS.slate300} />
              <Text style={styles.emptyText}>No pending referrals</Text>
              <Text style={styles.emptySubtext}>
                New referrals will appear here
              </Text>
            </View>
          ) : (
            <>
              {/* URGENT Referrals */}
              {referrals.filter(r => r.triage_level === 'URGENT').length > 0 && (
                <View style={styles.triageSection}>
                  <View style={[styles.triageSectionHeader, { backgroundColor: `${COLORS.urgentRed}20` }]}>
                    <MaterialIcons name="warning" size={20} color={COLORS.urgentRed} />
                    <Text style={[styles.triageSectionTitle, { color: COLORS.urgentRed }]}>
                      URGENT ({referrals.filter(r => r.triage_level === 'URGENT').length})
                    </Text>
                  </View>
                  {referrals.filter(r => r.triage_level === 'URGENT').map((referral) => (
                    <TouchableOpacity
                      key={referral.id}
                      style={[styles.referralCard, { borderLeftWidth: 4, borderLeftColor: COLORS.urgentRed }]}
                      onPress={() => onViewReferral?.(referral.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.referralHeader}>
                        <View style={styles.referralPatient}>
                          <Text style={styles.patientName}>{referral.patient_name}</Text>
                          <Text style={styles.vhtCode}>{referral.vht_code}</Text>
                        </View>
                        <View
                          style={[
                            styles.triageBadge,
                            { backgroundColor: COLORS.urgentRed },
                          ]}
                        >
                          <Text style={styles.triageBadgeText}>URGENT</Text>
                          <Text style={styles.triageScore}>{referral.triage_score}</Text>
                        </View>
                      </View>

                      <View style={styles.referralDetails}>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="info-outline" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            Status:{" "}
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(referral.status) },
                              ]}
                            >
                              {getStatusLabel(referral.status)}
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="access-time" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            {new Date(referral.created_at).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptReferral(referral.id)}
                        >
                          <MaterialIcons name="check" size={18} color={COLORS.white} />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.viewButton]}
                          onPress={() => onViewReferral?.(referral.id)}
                        >
                          <MaterialIcons name="visibility" size={18} color={COLORS.primary} />
                          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                            View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* HIGH RISK Referrals */}
              {referrals.filter(r => r.triage_level === 'HIGH_RISK').length > 0 && (
                <View style={styles.triageSection}>
                  <View style={[styles.triageSectionHeader, { backgroundColor: `${COLORS.triageOrange}20` }]}>
                    <MaterialIcons name="priority-high" size={20} color={COLORS.triageOrange} />
                    <Text style={[styles.triageSectionTitle, { color: COLORS.triageOrange }]}>
                      HIGH RISK ({referrals.filter(r => r.triage_level === 'HIGH_RISK').length})
                    </Text>
                  </View>
                  {referrals.filter(r => r.triage_level === 'HIGH_RISK').map((referral) => (
                    <TouchableOpacity
                      key={referral.id}
                      style={[styles.referralCard, { borderLeftWidth: 4, borderLeftColor: COLORS.triageOrange }]}
                      onPress={() => onViewReferral?.(referral.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.referralHeader}>
                        <View style={styles.referralPatient}>
                          <Text style={styles.patientName}>{referral.patient_name}</Text>
                          <Text style={styles.vhtCode}>{referral.vht_code}</Text>
                        </View>
                        <View
                          style={[
                            styles.triageBadge,
                            { backgroundColor: COLORS.triageOrange },
                          ]}
                        >
                          <Text style={styles.triageBadgeText}>HIGH RISK</Text>
                          <Text style={styles.triageScore}>{referral.triage_score}</Text>
                        </View>
                      </View>

                      <View style={styles.referralDetails}>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="info-outline" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            Status:{" "}
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(referral.status) },
                              ]}
                            >
                              {getStatusLabel(referral.status)}
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="access-time" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            {new Date(referral.created_at).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptReferral(referral.id)}
                        >
                          <MaterialIcons name="check" size={18} color={COLORS.white} />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.viewButton]}
                          onPress={() => onViewReferral?.(referral.id)}
                        >
                          <MaterialIcons name="visibility" size={18} color={COLORS.primary} />
                          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                            View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* MODERATE Referrals */}
              {referrals.filter(r => r.triage_level === 'MODERATE').length > 0 && (
                <View style={styles.triageSection}>
                  <View style={[styles.triageSectionHeader, { backgroundColor: `${COLORS.triageYellow}20` }]}>
                    <MaterialIcons name="info" size={20} color={COLORS.triageYellow} />
                    <Text style={[styles.triageSectionTitle, { color: COLORS.triageYellow }]}>
                      MODERATE ({referrals.filter(r => r.triage_level === 'MODERATE').length})
                    </Text>
                  </View>
                  {referrals.filter(r => r.triage_level === 'MODERATE').map((referral) => (
                    <TouchableOpacity
                      key={referral.id}
                      style={[styles.referralCard, { borderLeftWidth: 4, borderLeftColor: COLORS.triageYellow }]}
                      onPress={() => onViewReferral?.(referral.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.referralHeader}>
                        <View style={styles.referralPatient}>
                          <Text style={styles.patientName}>{referral.patient_name}</Text>
                          <Text style={styles.vhtCode}>{referral.vht_code}</Text>
                        </View>
                        <View
                          style={[
                            styles.triageBadge,
                            { backgroundColor: COLORS.triageYellow },
                          ]}
                        >
                          <Text style={styles.triageBadgeText}>MODERATE</Text>
                          <Text style={styles.triageScore}>{referral.triage_score}</Text>
                        </View>
                      </View>

                      <View style={styles.referralDetails}>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="info-outline" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            Status:{" "}
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(referral.status) },
                              ]}
                            >
                              {getStatusLabel(referral.status)}
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="access-time" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            {new Date(referral.created_at).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptReferral(referral.id)}
                        >
                          <MaterialIcons name="check" size={18} color={COLORS.white} />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.viewButton]}
                          onPress={() => onViewReferral?.(referral.id)}
                        >
                          <MaterialIcons name="visibility" size={18} color={COLORS.primary} />
                          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                            View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* NON-URGENT / Other Referrals */}
              {referrals.filter(r => !['URGENT', 'HIGH_RISK', 'MODERATE'].includes(r.triage_level)).length > 0 && (
                <View style={styles.triageSection}>
                  <View style={[styles.triageSectionHeader, { backgroundColor: `${COLORS.successGreen}20` }]}>
                    <MaterialIcons name="check-circle-outline" size={20} color={COLORS.successGreen} />
                    <Text style={[styles.triageSectionTitle, { color: COLORS.successGreen }]}>
                      NON-URGENT ({referrals.filter(r => !['URGENT', 'HIGH_RISK', 'MODERATE'].includes(r.triage_level)).length})
                    </Text>
                  </View>
                  {referrals.filter(r => !['URGENT', 'HIGH_RISK', 'MODERATE'].includes(r.triage_level)).map((referral) => (
                    <TouchableOpacity
                      key={referral.id}
                      style={[styles.referralCard, { borderLeftWidth: 4, borderLeftColor: COLORS.successGreen }]}
                      onPress={() => onViewReferral?.(referral.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.referralHeader}>
                        <View style={styles.referralPatient}>
                          <Text style={styles.patientName}>{referral.patient_name}</Text>
                          <Text style={styles.vhtCode}>{referral.vht_code}</Text>
                        </View>
                        <View
                          style={[
                            styles.triageBadge,
                            { backgroundColor: COLORS.successGreen },
                          ]}
                        >
                          <Text style={styles.triageBadgeText}>{referral.triage_level}</Text>
                          <Text style={styles.triageScore}>{referral.triage_score}</Text>
                        </View>
                      </View>

                      <View style={styles.referralDetails}>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="info-outline" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            Status:{" "}
                            <Text
                              style={[
                                styles.statusText,
                                { color: getStatusColor(referral.status) },
                              ]}
                            >
                              {getStatusLabel(referral.status)}
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <MaterialIcons name="access-time" size={16} color={COLORS.slate400} />
                          <Text style={styles.detailText}>
                            {new Date(referral.created_at).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptReferral(referral.id)}
                        >
                          <MaterialIcons name="check" size={18} color={COLORS.white} />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.viewButton]}
                          onPress={() => onViewReferral?.(referral.id)}
                        >
                          <MaterialIcons name="visibility" size={18} color={COLORS.primary} />
                          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
                            View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.slate900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.slate500,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.slate600,
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginBottom: 16,
  },
  referralCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  referralHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  referralPatient: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.slate900,
  },
  vhtCode: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  triageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  triageBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.white,
  },
  triageScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.white,
  },
  referralDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.slate600,
  },
  statusText: {
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: COLORS.successGreen,
  },
  viewButton: {
    backgroundColor: `${COLORS.primary}15`,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate600,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 4,
  },
  triageSection: {
    marginBottom: 20,
  },
  triageSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  triageSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HospitalDashboardScreen;
