import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AppNavigator } from "./src/navigation";
import { COLORS } from "./src/constants/colors";
import { useAppStore } from "./src/stores/appStore";
import { loadAuthToken, authAPI } from "./src/services/api";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { setLanguage, setIsOnline, setCurrentUser } = useAppStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize app settings
        setLanguage("en"); // Default to English
        setIsOnline(true); // Assume online by default

        // Check authentication - load stored token
        console.log("Loading auth token...");
        const token = await loadAuthToken();
        
        if (token) {
          console.log("Auth token found, fetching user profile...");
          try {
            const profile = await authAPI.getProfile();
            setCurrentUser(profile);
            console.log("User profile loaded:", profile.email);
          } catch (error) {
            console.warn("Failed to load user profile:", error);
            // Token might be expired, clear it
            // clearAuthToken() will be called by the interceptor
          }
        } else {
          console.log("No auth token found");
        }

        // Simulate loading time for splash screen
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn("Error during app initialization:", e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
