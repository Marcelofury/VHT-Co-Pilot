import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import CustomTabBar from "../components/CustomTabBar";

// Import screens
import {
  PatientListScreen,
  VoiceIntakeScreen,
  EmergencyDecisionScreen,
  DashboardScreen,
  ProfileScreen,
  SyncScreen,
  AIActionScreen,
  AIMonitoringScreen,
} from "../screens";

// Define navigation types
export type RootStackParamList = {
  Main: undefined;
  VoiceIntake: { patientId?: string };
  EmergencyDecision: { patientId: string };
  AIAction: { referralId?: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Monitoring: undefined;
  Sync: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreenWrapper} />
      <Tab.Screen name="Patients" component={PatientListScreenWrapper} />
      <Tab.Screen name="Monitoring" component={AIMonitoringScreenWrapper} />
      <Tab.Screen name="Sync" component={SyncScreenWrapper} />
      <Tab.Screen name="Profile" component={ProfileScreenWrapper} />
    </Tab.Navigator>
  );
};

// Screen wrappers with navigation props
const DashboardScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <DashboardScreen
      onQuickAction={(action) => {
        if (action === "intake") {
          navigation.navigate("VoiceIntake", {});
        } else if (action === "patients") {
          navigation.navigate("Patients");
        } else if (action === "referrals") {
          navigation.navigate("EmergencyDecision", { patientId: "" });
        } else if (action === "reports") {
          navigation.navigate("Monitoring");
        }
      }}
      onViewPatient={(patientId) => {
        navigation.navigate("VoiceIntake", { patientId });
      }}
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("VoiceIntake", {});
            break;
          case "patients":
            navigation.navigate("Patients");
            break;
          case "sync":
            navigation.navigate("Sync");
            break;
          case "profile":
            navigation.navigate("Profile");
            break;
        }
      }}
    />
  );
};

const PatientListScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <PatientListScreen
      onPatientSelect={(patientId) => {
        navigation.navigate("VoiceIntake", { patientId });
      }}
      onAddPatient={() => {
        navigation.navigate("VoiceIntake", {});
      }}
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("VoiceIntake", {});
            break;
          case "sync":
            navigation.navigate("Sync");
            break;
          case "profile":
            navigation.navigate("Profile");
            break;
        }
      }}
    />
  );
};

const AIMonitoringScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <AIMonitoringScreen
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("VoiceIntake", {});
            break;
          case "sync":
            navigation.navigate("Sync");
            break;
          case "profile":
            navigation.navigate("Profile");
            break;
          case "logs":
            // Stay on monitoring for now
            break;
        }
      }}
      onManualIntake={() => {
        navigation.navigate("VoiceIntake", {});
      }}
      onViewPatients={() => {
        navigation.navigate("Patients");
      }}
    />
  );
};

const SyncScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <SyncScreen
      onBack={() => navigation.goBack()}
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("VoiceIntake", {});
            break;
          case "patients":
            navigation.navigate("Patients");
            break;
          case "profile":
            navigation.navigate("Profile");
            break;
        }
      }}
      onSyncNow={() => {
        // Trigger sync logic
        console.log("Sync triggered");
      }}
    />
  );
};

const ProfileScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <ProfileScreen
      onBack={() => navigation.goBack()}
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("VoiceIntake", {});
            break;
          case "patients":
            navigation.navigate("Patients");
            break;
          case "sync":
            navigation.navigate("Sync");
            break;
        }
      }}
    />
  );
};

// Stack screen wrappers
const VoiceIntakeScreenWrapper: React.FC<any> = ({ navigation, route }) => {
  return (
    <VoiceIntakeScreen
      patientId={route.params?.patientId}
      onBack={() => navigation.goBack()}
      onTriageComplete={(triageData) => {
        if (triageData.urgencyLevel === "urgent") {
          navigation.navigate("EmergencyDecision", {
            patientId: route.params?.patientId || "",
          });
        } else {
          navigation.navigate("AIAction", {});
        }
      }}
      onNavigate={(screen) => {
        switch (screen) {
          case "patients":
            navigation.navigate("Main", { screen: "Patients" });
            break;
          case "sync":
            navigation.navigate("Main", { screen: "Sync" });
            break;
          case "profile":
            navigation.navigate("Main", { screen: "Profile" });
            break;
        }
      }}
    />
  );
};

const EmergencyDecisionScreenWrapper: React.FC<any> = ({
  navigation,
  route,
}) => {
  return (
    <EmergencyDecisionScreen
      patientId={route.params?.patientId}
      onBack={() => navigation.goBack()}
      onConfirmReferral={() => {
        navigation.navigate("AIAction", {
          referralId: route.params?.patientId || "",
        });
      }}
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("VoiceIntake", {});
            break;
          case "patients":
            navigation.navigate("Main", { screen: "Patients" });
            break;
          case "sync":
            navigation.navigate("Main", { screen: "Sync" });
            break;
          case "profile":
            navigation.navigate("Main", { screen: "Profile" });
            break;
        }
      }}
    />
  );
};

const AIActionScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <AIActionScreen
      onBack={() => navigation.goBack()}
      onPauseAction={() => {
        // Handle AI action pause
        console.log("AI Action paused");
        navigation.goBack();
      }}
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("VoiceIntake", {});
            break;
          case "patients":
            navigation.navigate("Main", { screen: "Patients" });
            break;
          case "profile":
            navigation.navigate("Main", { screen: "Profile" });
            break;
        }
      }}
    />
  );
};

// Main App Navigator
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="VoiceIntake" component={VoiceIntakeScreenWrapper} />
        <Stack.Screen
          name="EmergencyDecision"
          component={EmergencyDecisionScreenWrapper}
          options={{
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="AIAction"
          component={AIActionScreenWrapper}
          options={{
            animation: "fade",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
