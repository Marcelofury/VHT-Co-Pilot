import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, TRIAGE_STATUS } from "../constants/colors";
import { Patient, TriageLevel } from "../types";
import { useAppStore } from "../stores/appStore";

// Mock data for patients
const MOCK_PATIENTS: Patient[] = [
  {
    id: "1",
    vhtCode: "VHT-8821",
    firstName: "Nalubega",
    lastName: "Sarah",
    age: "24",
    gender: "female",
    triageLevel: "moderate",
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    vhtCode: "VHT-8845",
    firstName: "Mukasa",
    lastName: "David",
    age: "42",
    gender: "male",
    triageLevel: "stable",
    lastVisit: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    vhtCode: "VHT-9012",
    firstName: "Namono",
    lastName: "Prossy",
    age: "8mo",
    gender: "female",
    triageLevel: "highRisk",
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    vhtCode: "VHT-7762",
    firstName: "Lwanga",
    lastName: "Joseph",
    age: "65",
    gender: "male",
    triageLevel: "stable",
    lastVisit: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const getTriageConfig = (level: TriageLevel) => TRIAGE_STATUS[level];

const formatLastVisit = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => {
  const triageConfig = getTriageConfig(patient.triageLevel);

  return (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {patient.photoUrl ? (
          <Image source={{ uri: patient.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <MaterialIcons name="person" size={24} color={COLORS.slate400} />
          </View>
        )}
        <View
          style={[
            styles.triageIndicator,
            { backgroundColor: triageConfig.color },
          ]}
        />
      </View>

      <View style={styles.patientInfo}>
        <View style={styles.patientHeader}>
          <Text
            style={styles.patientName}
          >{`${patient.firstName} ${patient.lastName}`}</Text>
          <Text style={styles.patientCode}>#{patient.vhtCode}</Text>
        </View>

        <View style={styles.tagsContainer}>
          <View style={styles.ageTag}>
            <Text style={styles.ageTagText}>Age: {patient.age}</Text>
          </View>
          <View
            style={[
              styles.triageTag,
              { backgroundColor: triageConfig.bgColor },
            ]}
          >
            <Text style={[styles.triageTagText, { color: triageConfig.color }]}>
              {triageConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.lastVisitContainer}>
          <Text style={styles.lastVisitLabel}>Last Visit: </Text>
          <Text style={styles.lastVisitLuganda}>Okukyalirwa okusembyeyo: </Text>
          <Text style={styles.lastVisitValue}>
            {formatLastVisit(patient.lastVisit)}
          </Text>
        </View>
      </View>

      <MaterialIcons name="chevron-right" size={24} color={COLORS.slate300} />
    </TouchableOpacity>
  );
};

interface PatientListScreenProps {
  onPatientSelect?: (patient: Patient) => void;
  onAddPatient?: () => void;
  onNavigate?: (screen: string) => void;
}

export const PatientListScreen: React.FC<PatientListScreenProps> = ({
  onPatientSelect,
  onAddPatient,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { selectPatient } = useAppStore();

  const filteredPatients = MOCK_PATIENTS.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.vhtCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handlePatientPress = (patient: Patient) => {
    selectPatient(patient);
    onPatientSelect?.(patient);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="menu" size={24} color={COLORS.deepBlue} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>VHT Co-Pilot</Text>
            <Text style={styles.headerSubtitle}>VILLAGE HEALTH TEAM</Text>
          </View>

          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons
              name="notifications"
              size={24}
              color={COLORS.deepBlue}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color={COLORS.slate400}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Find patient by name or ID..."
            placeholderTextColor={COLORS.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Patient List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onPress={() => handlePatientPress(patient)}
          />
        ))}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onAddPatient}
        activeOpacity={0.8}
      >
        <MaterialIcons name="person-add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.deepBlue,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate50,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.slate100,
    alignItems: "center",
    justifyContent: "center",
  },
  triageIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  patientInfo: {
    flex: 1,
  },
  patientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  patientCode: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.slate400,
  },
  tagsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  ageTag: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  ageTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate600,
    textTransform: "uppercase",
  },
  triageTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  triageTagText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  lastVisitContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  lastVisitLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  lastVisitLuganda: {
    fontSize: 12,
    fontStyle: "italic",
    color: COLORS.slate500,
  },
  lastVisitValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 4,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default PatientListScreen;
