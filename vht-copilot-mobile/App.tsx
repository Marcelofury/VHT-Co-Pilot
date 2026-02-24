import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AppNavigator } from "./src/navigation";
import { COLORS } from "./src/constants/colors";
import { useAppStore } from "./src/stores/appStore";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { setLanguage, setIsOnline } = useAppStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize app settings
        setLanguage("en"); // Default to English
        setIsOnline(true); // Assume online by default

        // Add any other initialization logic here
        // - Load cached data
        // - Check authentication
        // - Fetch initial data

        // Simulate loading time for splash screen
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
