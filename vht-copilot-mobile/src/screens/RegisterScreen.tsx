import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { authAPI } from "../services/api";

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    role: "VHT", // VHT or HOSPITAL
    vhtId: "",
    hospitalCode: "",
    phone: "",
    village: "",
    district: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert("Error", "Please enter your first name");
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert("Error", "Please enter your last name");
      return false;
    }
    if (formData.role === "VHT" && !formData.vhtId.trim()) {
      Alert.alert("Error", "Please enter your VHT ID");
      return false;
    }
    if (formData.role === "HOSPITAL" && !formData.hospitalCode.trim()) {
      Alert.alert("Error", "Please enter your Hospital ID");
      return false;
    }
    if (!formData.username.trim()) {
      Alert.alert("Error", "Please enter a username");
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Call registration API
      await authAPI.register({
        username: formData.username,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        vht_id: formData.role === "VHT" ? formData.vhtId : undefined,
        hospital_code: formData.role === "HOSPITAL" ? formData.hospitalCode : undefined,
        phone_number: formData.phone,
        village: formData.village,
        district: formData.district,
      });
      
      Alert.alert(
        "Success",
        "Registration successful! Please login with your credentials.",
        [{ text: "OK", onPress: onNavigateToLogin }]
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Registration failed. Please try again.";
      Alert.alert("Registration Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onNavigateToLogin}
            style={styles.backButton}
            disabled={isLoading}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.slate900} />
          </TouchableOpacity>
          <View style={styles.logoCircle}>
            <MaterialIcons name="person-add" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the VHT Co-Pilot Community</Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          {/* Personal Information */}
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="person-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={COLORS.slate400}
              value={formData.firstName}
              onChangeText={(value) => updateField("firstName", value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="person-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={COLORS.slate400}
              value={formData.lastName}
              onChangeText={(value) => updateField("lastName", value)}
              editable={!isLoading}
            />
          </View>

          {/* Role Selection */}
          <Text style={styles.sectionTitle}>User Type</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === "VHT" && styles.roleButtonActive,
              ]}
              onPress={() => updateField("role", "VHT")}
              disabled={isLoading}
            >
              <MaterialIcons
                name="medical-services"
                size={24}
                color={formData.role === "VHT" ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === "VHT" && styles.roleButtonTextActive,
                ]}
              >
                VHT Personnel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === "HOSPITAL" && styles.roleButtonActive,
              ]}
              onPress={() => updateField("role", "HOSPITAL")}
              disabled={isLoading}
            >
              <MaterialIcons
                name="local-hospital"
                size={24}
                color={formData.role === "HOSPITAL" ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === "HOSPITAL" && styles.roleButtonTextActive,
                ]}
              >
                Hospital Staff
              </Text>
            </TouchableOpacity>
          </View>

          {formData.role === "VHT" && (
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="badge"
                size={20}
                color={COLORS.slate400}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="VHT ID (e.g., VHT-8821)"
                placeholderTextColor={COLORS.slate400}
                value={formData.vhtId}
                onChangeText={(value) => updateField("vhtId", value)}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>
          )}

          {formData.role === "HOSPITAL" && (
            <View style={styles.inputContainer}>
              <MaterialIcons
                name="local-hospital"
                size={20}
                color={COLORS.slate400}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Hospital ID (e.g., HOSP-001)"
                placeholderTextColor={COLORS.slate400}
                value={formData.hospitalCode}
                onChangeText={(value) => updateField("hospitalCode", value)}
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="phone"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.slate400}
              value={formData.phone}
              onChangeText={(value) => updateField("phone", value)}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="location-on"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Village"
              placeholderTextColor={COLORS.slate400}
              value={formData.village}
              onChangeText={(value) => updateField("village", value)}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="map"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="District"
              placeholderTextColor={COLORS.slate400}
              value={formData.district}
              onChangeText={(value) => updateField("district", value)}
              editable={!isLoading}
            />
          </View>

          {/* Account Credentials */}
          <Text style={styles.sectionTitle}>Account Credentials</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="account-circle"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={COLORS.slate400}
              value={formData.username}
              onChangeText={(value) => updateField("username", value)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={COLORS.slate400}
              value={formData.password}
              onChangeText={(value) => updateField("password", value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
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

          <View style={styles.inputContainer}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={COLORS.slate400}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.slate400}
              value={formData.confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={20}
                color={COLORS.slate400}
              />
            </TouchableOpacity>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              isLoading && styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate600,
    marginBottom: 12,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
  },
  roleButtonTextActive: {
    color: COLORS.white,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.slate50,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.slate900,
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  loginSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.slate500,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
