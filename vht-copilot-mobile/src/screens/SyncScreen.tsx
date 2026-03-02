import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";

interface SyncScreenProps {
  onBack?: () => void;
  onSyncNow?: () => void;
  onNavigate?: (screen: string) => void;
}

export const SyncScreen: React.FC<SyncScreenProps> = ({
  onBack,
  onSyncNow,
  onNavigate,
}) => {
  const { 
    syncProgress, 
    isOnline, 
    lastSyncTime, 
    syncRecords,
    setSyncProgress,
    setLastSyncTime,
  } = useAppStore();
  
  const [isSyncing, setIsSyncing] = useState(false);

  // Platform-aware alert function
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      // Simulate sync progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setSyncProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Update last sync time
      setLastSyncTime(new Date());
      
      // Call the optional callback
      onSyncNow?.();
      
      showAlert(
        "Sync Complete",
        "All patient data has been successfully synced to eCHIS cloud."
      );
    } catch (error) {
      console.error("Sync error:", error);
      showAlert(
        "Sync Failed",
        "Failed to sync data. Please check your connection and try again."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const getLastSyncString = () => {
    if (lastSyncTime) {
      return `Today at ${lastSyncTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "Today at 14:32";
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

  const getIconForAction = (action: string) => {
    if (action.toLowerCase().includes('referral')) return 'emergency';
    if (action.toLowerCase().includes('follow')) return 'person';
    return 'person';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.triageYellow}
      />

      {/* Connectivity Status Bar */}
      <View style={styles.connectivityBar}>
        <View style={styles.connectivityLeft}>
          <MaterialIcons name="warning" size={20} color="#000" />
          <Text style={styles.connectivityText}>Connectivity: Spotty</Text>
        </View>
        <View style={styles.connectivityRight}>
          <View style={styles.offlineTag}>
            <Text style={styles.offlineTagText}>Offline Ready</Text>
          </View>
          <MaterialIcons
            name={isOnline ? "wifi" : "wifi-off"}
            size={20}
            color="#000"
          />
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
          <Text style={styles.headerSubtitle}>SYNC & CLOUD STATUS</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="cloud-sync" size={24} color={COLORS.deepBlue} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusIconContainer}>
            <MaterialIcons
              name="check-circle"
              size={60}
              color={COLORS.successGreen}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>All Data Securely Synced</Text>
            <Text style={styles.statusSubtitle}>
              Bonna bisindikiddwa mu eCHIS
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>eCHIS Upload Progress</Text>
            <Text style={styles.progressValue}>{syncProgress}% Complete</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${syncProgress}%` }]}
            />
          </View>
        </View>

        {/* Sync Records */}
        <View style={styles.recordsSection}>
          <Text style={styles.recordsTitle}>Recently Synced Records</Text>

          <View style={styles.recordsList}>
            {syncRecords.length > 0 ? (
              syncRecords.slice(0, 10).map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordLeft}>
                    <View style={styles.recordIconContainer}>
                      <MaterialIcons
                        name={getIconForAction(record.action) as keyof typeof MaterialIcons.glyphMap}
                        size={20}
                        color={COLORS.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.recordTitle}>
                        {record.patientName} - {record.action}
                      </Text>
                      <Text style={styles.recordSubtext}>
                        Synced {getTimeSince(record.timestamp)} • #{record.vhtCode}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name={record.status === 'synced' ? 'check-circle' : 'sync'}
                    size={20}
                    color={record.status === 'synced' ? COLORS.successGreen : COLORS.slate400}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="cloud-done" size={48} color={COLORS.slate300} />
                <Text style={styles.emptyStateText}>No sync records yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Complete patient intakes to see sync history
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sync Button Section */}
      <View style={styles.syncButtonSection}>
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleSyncNow}
          activeOpacity={0.9}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.syncButtonText}>Syncing... / Sindika...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="sync" size={24} color={COLORS.white} />
              <Text style={styles.syncButtonText}>Sync Now / Sindika kaati</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.lastSyncText}>
          Last full sync: {getLastSyncString()}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  connectivityBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.triageYellow,
  },
  connectivityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  connectivityText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  connectivityRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offlineTag: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineTagText: {
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
    padding: 24,
  },
  statusSection: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  statusIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: "#F2FDF5",
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTextContainer: {
    alignItems: "center",
    gap: 4,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.deepBlue,
    textAlign: "center",
  },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate500,
  },
  progressSection: {
    gap: 12,
    marginTop: 32,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  progressBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: COLORS.slate100,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  recordsSection: {
    marginTop: 32,
    gap: 16,
  },
  recordsTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  recordsList: {
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
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.softBlue,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recordLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  recordIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  recordSubtext: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate400,
    marginTop: 2,
  },
  syncButtonSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.03,
    shadowRadius: 30,
    elevation: 10,
  },
  syncButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  syncButtonDisabled: {
    backgroundColor: COLORS.slate400,
    shadowColor: COLORS.slate400,
    opacity: 0.7,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.white,
  },
  lastSyncText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.slate400,
  },
});

export default SyncScreen;
