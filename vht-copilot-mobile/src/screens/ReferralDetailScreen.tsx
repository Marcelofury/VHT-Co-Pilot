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
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { referralAPI } from "../services/api";

interface ReferralDetailScreenProps {
  referralId: string;
  onBack?: () => void;
  onStatusUpdated?: () => void;
}

export const ReferralDetailScreen: React.FC<ReferralDetailScreenProps> = ({
  referralId,
  onBack,
  onStatusUpdated,
}) => {
  const [referral, setReferral] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadReferralDetails();
  }, [referralId]);

  const loadReferralDetails = async () => {
    try {
      setIsLoading(true);
      const data = await referralAPI.getById(referralId);
      setReferral(data);
    } catch (error) {
      console.error("Error loading referral:", error);
      if (Platform.OS === 'web') {
        alert("Failed to load referral details");
      } else {
        Alert.alert("Error", "Failed to load referral details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!referral) return;

    const statusMessages: { [key: string]: string } = {
      IN_TRANSIT: "Patient is now in transit to your hospital",
      ARRIVED: "Patient has arrived at your hospital",
      COMPLETED: "Case has been marked as completed",
    };

    try {
      setIsUpdating(true);
      await referralAPI.updateStatus(referralId, newStatus);
      
      if (Platform.OS === 'web') {
        alert(`✅ Status Updated\n\n${statusMessages[newStatus]}`);
      } else {
        Alert.alert("Status Updated", statusMessages[newStatus]);
      }
      
      await loadReferralDetails();
      onStatusUpdated?.();
    } catch (error: any) {
      console.error("Error updating status:", error);
      const errorMessage = error.response?.data?.error || "Failed to update status";
      if (Platform.OS === 'web') {
        alert(`❌ Error\n\n${errorMessage}`);
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmStatusUpdate = (newStatus: string, message: string) => {
    if (Platform.OS === 'web') {
      if (confirm(message)) {
        updateStatus(newStatus);
      }
    } else {
      Alert.alert(
        "Confirm Status Update",
        message,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Confirm", onPress: () => updateStatus(newStatus) },
        ]
      );
    }
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case "URGENT":
        return COLORS.urgentRed;
      case "HIGH_RISK":
        return COLORS.triageOrange;
      case "MODERATE":
        return COLORS.triageYellow;
      default:
        return COLORS.successGreen;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
      case "CONFIRMED":
        return COLORS.triageYellow;
      case "IN_TRANSIT":
        return COLORS.primary;
      case "ARRIVED":
        return COLORS.triageOrange;
      case "COMPLETED":
        return COLORS.successGreen;
      case "CANCELLED":
        return COLORS.slate400;
      default:
        return COLORS.slate400;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ");
  };

  const renderStatusButtons = () => {
    if (!referral) return null;

    const buttons = [];

    if (referral.status === "CONFIRMED" || referral.status === "PENDING") {
      buttons.push({
        key: "in_transit",
        status: "IN_TRANSIT",
        label: "Mark In Transit",
        icon: "directions-car",
        message: "Mark this patient as in transit to the hospital?",
        color: COLORS.primary,
      });
    }

    if (referral.status === "IN_TRANSIT") {
      buttons.push({
        key: "arrived",
        status: "ARRIVED",
        label: "Mark Arrived",
        icon: "check-circle",
        message: "Confirm that the patient has arrived at the hospital?",
        color: COLORS.triageOrange,
      });
    }

    if (referral.status === "ARRIVED") {
      buttons.push({
        key: "completed",
        status: "COMPLETED",
        label: "Mark Completed",
        icon: "done-all",
        message: "Mark this case as completed?",
        color: COLORS.successGreen,
      });
    }

    return (
      <View style={styles.statusButtonsContainer}>
        <Text style={styles.sectionTitle}>Update Status</Text>
        {buttons.map((button) => (
          <TouchableOpacity
            key={button.key}
            style={[styles.statusButton, { backgroundColor: button.color }]}
            onPress={() => confirmStatusUpdate(button.status, button.message)}
            disabled={isUpdating}
          >
            <MaterialIcons name={button.icon as any} size={24} color={COLORS.white} />
            <Text style={styles.statusButtonText}>{button.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading referral details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!referral) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.urgentRed} />
          <Text style={styles.errorText}>Referral not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBackButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.slate900} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Referral Details</Text>
          <Text style={styles.headerSubtitle}>{referral.referral_code}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(referral.status)}20` },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: getStatusColor(referral.status) },
              ]}
            >
              {getStatusLabel(referral.status)}
            </Text>
          </View>
          <View
            style={[
              styles.triageBadge,
              { backgroundColor: getTriageColor(referral.urgency_level) },
            ]}
          >
            <Text style={styles.triageBadgeText}>{referral.urgency_level}</Text>
            <Text style={styles.triageScore}>{referral.triage_score}</Text>
          </View>
        </View>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="person"
              label="Name"
              value={referral.patient_details.full_name}
            />
            <InfoRow
              icon="cake"
              label="Age"
              value={`${referral.patient_details.age} years`}
            />
            <InfoRow
              icon="wc"
              label="Gender"
              value={referral.patient_details.gender}
            />
            <InfoRow
              icon="phone"
              label="Phone"
              value={referral.patient_details.phone_number}
            />
            <InfoRow
              icon="location-on"
              label="Location"
              value={`${referral.patient_details.village}, ${referral.patient_details.district}`}
            />
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.medicalInfo}>
              <Text style={styles.medicalLabel}>Primary Condition</Text>
              <Text style={styles.medicalValue}>{referral.primary_condition}</Text>
            </View>
            <View style={styles.medicalInfo}>
              <Text style={styles.medicalLabel}>Symptoms Summary</Text>
              <Text style={styles.medicalValue}>{referral.symptoms_summary}</Text>
            </View>
            <View style={styles.medicalInfo}>
              <Text style={styles.medicalLabel}>Recommended Specialty</Text>
              <Text style={styles.medicalValue}>
                {referral.recommended_specialty || "General"}
              </Text>
            </View>
            <View style={styles.medicalInfo}>
              <Text style={styles.medicalLabel}>AI Confidence</Text>
              <Text style={styles.medicalValue}>
                {(referral.confidence_score * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        {/* AI Reasoning */}
        {referral.ai_reasoning && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Reasoning</Text>
            <View style={styles.reasoningCard}>
              <MaterialIcons
                name="psychology"
                size={20}
                color={COLORS.primary}
                style={styles.reasoningIcon}
              />
              <Text style={styles.reasoningText}>{referral.ai_reasoning}</Text>
            </View>
          </View>
        )}

        {/* Referral Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Referral Information</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="person-outline"
              label="Referred By (VHT)"
              value={referral.referred_by_name}
            />
            <InfoRow
              icon="access-time"
              label="Created"
              value={new Date(referral.created_at).toLocaleString()}
            />
            {referral.confirmed_at && (
              <InfoRow
                icon="check-circle-outline"
                label="Confirmed"
                value={new Date(referral.confirmed_at).toLocaleString()}
              />
            )}
            {referral.actual_arrival_time && (
              <InfoRow
                icon="local-hospital"
                label="Arrived"
                value={new Date(referral.actual_arrival_time).toLocaleString()}
              />
            )}
            <InfoRow
              icon="directions-car"
              label="Estimated Travel Time"
              value={`${referral.estimated_travel_time} minutes`}
            />
          </View>
        </View>

        {/* Status Update Buttons */}
        {renderStatusButtons()}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoRow}>
    <MaterialIcons name={icon as any} size={20} color={COLORS.slate400} />
    <View style={styles.infoRowContent}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowValue}>{value}</Text>
    </View>
  </View>
);

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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.slate600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.slate900,
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.slate900,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.slate500,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  statusBadge: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  triageBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  triageBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.white,
  },
  triageScore: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoRowContent: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 13,
    color: COLORS.slate500,
    marginBottom: 2,
  },
  infoRowValue: {
    fontSize: 15,
    color: COLORS.slate900,
    fontWeight: "500",
  },
  medicalInfo: {
    marginBottom: 12,
  },
  medicalLabel: {
    fontSize: 13,
    color: COLORS.slate500,
    marginBottom: 4,
  },
  medicalValue: {
    fontSize: 15,
    color: COLORS.slate900,
    lineHeight: 22,
  },
  reasoningCard: {
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  reasoningIcon: {
    marginTop: 2,
  },
  reasoningText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.slate600,
    lineHeight: 20,
  },
  statusButtonsContainer: {
    padding: 16,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  bottomPadding: {
    height: 32,
  },
});

export default ReferralDetailScreen;
