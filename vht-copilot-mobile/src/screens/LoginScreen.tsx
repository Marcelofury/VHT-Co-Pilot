import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { authAPI, loadAuthToken } from "../services/api";
import { useAppStore } from "../stores/appStore";

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onNavigateToRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setCurrentUser } = useAppStore();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting login with:", username);
      const response = await authAPI.login(username, password);
      console.log("Login successful, fetching profile...");
      
      // Load user profile
      const profile = await authAPI.getProfile();
      setCurrentUser(profile);
      
      console.log("Profile loaded:", profile);
      Alert.alert("Success", "Logged in successfully!");
      onLoginSuccess?.();
    } catch (error: any) {
      console.error("Login error:", error);
      const message = error.response?.data?.detail || "Invalid credentials";
      Alert.alert("Login Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="local-hospital" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>VHT Co-Pilot</Text>
          <Text style={styles.subtitle}>Village Health Team Assistant</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.welcomeSubtext}>Login to continue</Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="person-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Username or VHT ID"
              placeholderTextColor={COLORS.slate400}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.slate400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color={COLORS.slate400}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToRegister} disabled={isLoading}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ministry of Health, Uganda
          </Text>
          <Text style={styles.footerSubtext}>
            Community Health Workers Portal
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    marginTop: 60,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate500,
  },
  formSection: {
    flex: 1,
    justifyContent: "center",
    marginTop: -40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: COLORS.slate500,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.slate900,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  registerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: COLORS.slate500,
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.slate400,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: COLORS.slate300,
  },
});
