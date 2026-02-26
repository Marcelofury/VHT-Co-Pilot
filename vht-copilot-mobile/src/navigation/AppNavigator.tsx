import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import CustomTabBar from "../components/CustomTabBar";
import { useAppStore } from "../stores/appStore";
import { clearAuthToken } from "../services/api";

// Import screens
import {
  PatientListScreen,
  PatientFormScreen,
  VoiceIntakeScreen,
  EmergencyDecisionScreen,
  DashboardScreen,
  HospitalDashboardScreen,
  ProfileScreen,
  SyncScreen,
  AIActionScreen,
  AIMonitoringScreen,
  LoginScreen,
  RegisterScreen,
} from "../screens";

// Define navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  HospitalMain: undefined;
  PatientForm: undefined;
  VoiceIntake: { patientId?: string };
  EmergencyDecision: { patientId: string };
  AIAction: { referralId?: string };
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Monitoring: undefined;
  Sync: undefined;
  Profile: undefined;
};

export type HospitalTabParamList = {
  HospitalDashboard: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HospitalTab = createBottomTabNavigator<HospitalTabParamList>();

// Hospital Tab Navigator (for hospital staff)
const HospitalTabNavigator: React.FC = () => {
  return (
    <HospitalTab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <HospitalTab.Screen name="HospitalDashboard" component={HospitalDashboardScreenWrapper} />
      <HospitalTab.Screen name="Profile" component={ProfileScreenWrapper} />
    </HospitalTab.Navigator>
  );
};

// VHT Tab Navigator (for VHT personnel)
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
      onStartIntake={() => {
        navigation.navigate("PatientForm");
      }}
      onQuickAction={(action) => {
        if (action === "intake") {
          navigation.navigate("PatientForm");
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

const HospitalDashboardScreenWrapper: React.FC<any> = ({ navigation }) => {
  const { clearAuth } = useAppStore();
  
  return (
    <HospitalDashboardScreen
      onViewReferral={(referralId) => {
        console.log("View referral:", referralId);
        // TODO: Navigate to referral detail screen
      }}
      onNavigate={(screen) => {
        switch (screen) {
          case "profile":
            navigation.navigate("Profile");
            break;
        }
      }}
      onLogout={() => {
        clearAuth();
        navigation.replace("Login");
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
        navigation.navigate("PatientForm");
      }}
      onNavigate={(screen) => {
        switch (screen) {
          case "intake":
            navigation.navigate("PatientForm");
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
  const { clearAuth } = useAppStore();
  
  const handleSignOut = async () => {
    try {
      // Clear auth token from storage and axios headers
      await clearAuthToken();
      
      // Clear user data from store
      clearAuth();
      
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <ProfileScreen
      onBack={() => navigation.goBack()}
      onSignOut={handleSignOut}
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
const PatientFormScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <PatientFormScreen
      onBack={() => navigation.goBack()}
      onPatientCreated={(patientId) => {
        navigation.replace("VoiceIntake", { patientId });
      }}
    />
  );
};

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

// Auth Screen Wrappers
const LoginScreenWrapper: React.FC<any> = ({ navigation }) => {
  const { setCurrentUser } = useAppStore();
  
  return (
    <LoginScreen
      onLoginSuccess={() => {
        // Check user role and navigate accordingly
        const user = useAppStore.getState().currentUser;
        console.log("Login successful, user role:", user?.role);
        
        if (user?.role === 'HOSPITAL' || user?.role === 'HOSPITAL_STAFF') {
          navigation.replace("HospitalMain");
        } else {
          navigation.replace("Main");
        }
      }}
      onNavigateToRegister={() => {
        navigation.navigate("Register");
      }}
    />
  );
};

const RegisterScreenWrapper: React.FC<any> = ({ navigation }) => {
  return (
    <RegisterScreen
      onRegisterSuccess={() => {
        navigation.replace("Login");
      }}
      onNavigateToLogin={() => {
        navigation.navigate("Login");
      }}
    />
  );
};

// Main App Navigator
export const AppNavigator: React.FC = () => {
  const { currentUser } = useAppStore();
  
  // Determine initial route based on authentication state
  const getInitialRouteName = () => {
    if (!currentUser) {
      return "Login";
    }
    
    // User is authenticated, check role
    if (currentUser.role === 'HOSPITAL' || currentUser.role === 'HOSPITAL_STAFF') {
      return "HospitalMain";
    } else {
      return "Main";
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Login" component={LoginScreenWrapper} />
        <Stack.Screen name="Register" component={RegisterScreenWrapper} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="HospitalMain" component={HospitalTabNavigator} />
        <Stack.Screen name="PatientForm" component={PatientFormScreenWrapper} />
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
