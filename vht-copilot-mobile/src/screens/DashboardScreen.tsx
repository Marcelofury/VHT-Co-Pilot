import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";
import { dashboardAPI, patientAPI } from "../services/api";
import { Patient } from "../types";

interface DashboardScreenProps {
  onNavigate?: (screen: string) => void;
  onStartIntake?: () => void;
  onQuickAction?: (action: string) => void;
  onViewPatient?: (patientId: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onStartIntake,
}) => {
  const { currentUser, lastSyncTime } = useAppStore();
  const [stats, setStats] = useState({
    total_patients: 0,
    patients_this_week: 0,
    emergency_referrals_today: 0,
    active_referrals: 0,
  });
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log("Loading dashboard data...");
      
      // Load stats
      const statsData = await dashboardAPI.getStats();
      console.log("Dashboard stats loaded:", statsData);
      setStats({
        total_patients: statsData.total_patients || 0,
        patients_this_week: statsData.patients_this_week || 0,
        emergency_referrals_today: statsData.emergency_referrals_today || 0,
        active_referrals: statsData.active_referrals || 0,
      });

      // Load recent patients
      const patientsData = await patientAPI.getAll();
      console.log("Recent patients loaded:", patientsData.length);
      // Get the 5 most recent patients
      setRecentPatients(patientsData.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleStartIntake = () => {
    console.log('Start Intake button pressed');
    onStartIntake?.();
  };

  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    onNavigate?.(screen);
  };

  const getSyncTimeString = () => {
    if (lastSyncTime) {
      const now = new Date();
      const diffMs = now.getTime() - lastSyncTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      return `${Math.floor(diffMins / 60)} hours ago`;
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
        <View style={styles.alertBarLeft}>
          <MaterialIcons name="warning" size={18} color="#000" />
          <Text style={styles.alertBarText}>
            Community Alert: Moderate Malaria Risk
          </Text>
        </View>
        <View style={styles.alertTag}>
          <Text style={styles.alertTagText}>Zone 4</Text>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Ready to Assist</Text>
              <Text style={styles.headerSubtitle}>VHT Co-Pilot Dashboard</Text>
            </View>
            <Image
              source={{
                uri:
                  currentUser?.photoUrl ||
                  "https://randomuser.me/api/portraits/men/32.jpg",
              }}
              style={styles.profileImage}
            />
          </View>

          {/* Stats Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>This Week</Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.statValue}>{stats.patients_this_week}</Text>
              )}
            </View>
            <View style={[styles.statCard, styles.statCardYellow]}>
              <Text style={[styles.statLabel, styles.statLabelYellow]}>
                Urgent Today
              </Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.triageYellow} />
              ) : (
                <Text style={[styles.statValue, styles.statValueYellow]}>{stats.emergency_referrals_today}</Text>
              )}
            </View>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <Text style={[styles.statLabel, styles.statLabelGreen]}>
                Active Referrals
              </Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.triageGreen} />
              ) : (
                <Text style={[styles.statValue, styles.statValueGreen]}>{stats.active_referrals}</Text>
              )}
            </View>
          </ScrollView>
        </View>
        {/* Quick Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={handleStartIntake}
            activeOpacity={0.9}
          >
            <View style={styles.actionIconPrimary}>
              <MaterialIcons
                name="add-to-photos"
                size={24}
                color={COLORS.white}
              />
            </View>
            <View>
              <Text style={styles.actionTitlePrimary}>Start New Intake</Text>
              <Text style={styles.actionSubtitlePrimary}>
                Nandikidde okupima omulwadde
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handleNavigate("referrals")}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconRed}>
              <MaterialIcons
                name="emergency"
                size={24}
                color={COLORS.urgentRed}
              />
            </View>
            <View>
              <Text style={styles.actionTitle}>Urgent Referrals</Text>
              <Text style={styles.actionSubtitle}>Abatwalibwa mu ddwaliro</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handleNavigate("patients")}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconBlue}>
              <MaterialIcons name="group" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>My Patients</Text>
              <Text style={styles.actionSubtitle}>Abalwadde bange</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => handleNavigate("sync")}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconGreen}>
              <MaterialIcons
                name="cloud-done"
                size={24}
                color={COLORS.successGreen}
              />
            </View>
            <View>
              <Text style={styles.actionTitle}>Sync Status</Text>
              <Text style={styles.actionSubtitle}>Okutereka ebikoleddwa</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Patients</Text>
            <TouchableOpacity onPress={() => handleNavigate('patients')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading patients...</Text>
            </View>
          ) : recentPatients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={48} color={COLORS.slate300} />
              <Text style={styles.emptyText}>No patients registered yet</Text>
              <Text style={styles.emptySubtext}>Start by adding a new patient</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {recentPatients.map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={styles.activityCard}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate('patients')}
                >
                  <View
                    style={[
                      styles.activityIndicator,
                      {
                        backgroundColor:
                          patient.triageLevel === "urgent" || patient.triageLevel === "highRisk"
                            ? COLORS.triageRed
                            : patient.triageLevel === "moderate"
                            ? COLORS.triageYellow
                            : COLORS.successGreen,
                      },
                    ]}
                  />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityName}>
                      {patient.firstName} {patient.lastName}
                    </Text>
                    <Text style={styles.activityTime}>
                      {patient.age} years • {patient.location?.village || 'Unknown village'}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={16}
                    color={COLORS.slate300}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sync Status Footer */}
      <View style={styles.syncFooter}>
        <View style={styles.syncIndicator} />
        <Text style={styles.syncText}>Last Sync: {getSyncTimeString()}</Text>
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
  },
  alertBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertBarText: {
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
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 24,
  },
  statCard: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.softBlue,
  },
  statCardYellow: {
    backgroundColor: "#FFF9E6",
    borderColor: "#FEF3C7",
  },
  statCardGreen: {
    backgroundColor: "#F2FDF5",
    borderColor: "#D1FAE5",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  statLabelYellow: {
    color: "#B45309",
  },
  statLabelGreen: {
    color: "#047857",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.deepBlue,
  },
  statValueYellow: {
    color: "#92400E",
  },
  statValueGreen: {
    color: "#065F46",
  },
  mainContent: {
    flex: 1,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  actionCard: {
    width: "47%",
    minHeight: 110,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.slate100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionCardPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionIconPrimary: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconRed: {
    width: 36,
    height: 36,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconBlue: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconGreen: {
    width: 36,
    height: 36,
    backgroundColor: "#F2FDF5",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitlePrimary: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 18,
  },
  actionSubtitlePrimary: {
    fontSize: 9,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.deepBlue,
    lineHeight: 18,
  },
  actionSubtitle: {
    fontSize: 9,
    fontWeight: "500",
    color: COLORS.slate400,
    marginTop: 2,
  },
  recentSection: {
    marginBottom: 80,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate400,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.slate100,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slate400,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.slate300,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate50,
    gap: 12,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.slate400,
  },
  syncFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  syncIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.successGreen,
  },
  syncText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default DashboardScreen;
