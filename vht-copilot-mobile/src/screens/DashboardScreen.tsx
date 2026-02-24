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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";

interface DashboardScreenProps {
  onNavigate?: (screen: string) => void;
  onStartIntake?: () => void;
  onQuickAction?: (action: string) => void;
  onViewPatient?: (patientId: string) => void;
}

interface RecentActivity {
  id: string;
  patientName: string;
  action: string;
  time: string;
  status: "completed" | "flagged";
}

const RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: "1",
    patientName: "Nalubega Sarah",
    action: "Intake Completed",
    time: "10:45 AM",
    status: "completed",
  },
  {
    id: "2",
    patientName: "Mukasa John",
    action: "Triage Flagged",
    time: "09:15 AM",
    status: "flagged",
  },
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onStartIntake,
}) => {
  const { currentUser, lastSyncTime } = useAppStore();

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
            <Text style={styles.statLabel}>Today's Intakes</Text>
            <Text style={styles.statValue}>12</Text>
          </View>
          <View style={[styles.statCard, styles.statCardYellow]}>
            <Text style={[styles.statLabel, styles.statLabelYellow]}>
              Urgent
            </Text>
            <Text style={[styles.statValue, styles.statValueYellow]}>03</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={[styles.statLabel, styles.statLabelGreen]}>
              Follow-ups
            </Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>08</Text>
          </View>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, styles.actionCardPrimary]}
            onPress={onStartIntake}
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
            onPress={() => onNavigate?.("referrals")}
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
            onPress={() => onNavigate?.("patients")}
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
            onPress={() => onNavigate?.("sync")}
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
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {RECENT_ACTIVITIES.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.activityIndicator,
                    {
                      backgroundColor:
                        activity.status === "completed"
                          ? COLORS.successGreen
                          : COLORS.triageYellow,
                    },
                  ]}
                />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>
                    {activity.patientName}
                  </Text>
                  <Text style={styles.activityTime}>
                    {activity.action} • {activity.time}
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
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
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
    padding: 16,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
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
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconRed: {
    width: 40,
    height: 40,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconBlue: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconGreen: {
    width: 40,
    height: 40,
    backgroundColor: "#F2FDF5",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitlePrimary: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 20,
  },
  actionSubtitlePrimary: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.deepBlue,
    lineHeight: 20,
  },
  actionSubtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.slate400,
    marginTop: 4,
  },
  recentSection: {
    marginBottom: 24,
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
