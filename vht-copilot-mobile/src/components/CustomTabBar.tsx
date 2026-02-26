import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

// Professional color palette for healthcare app
const COLORS = {
  // Primary brand colors
  primary: "#0EA5E9", // Sky blue - trust, care
  primaryDark: "#0284C7",
  primaryLight: "#E0F2FE",

  // Neutral colors
  white: "#FFFFFF",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  deepBlue: "#0F172A",

  // Status colors
  successGreen: "#10B981",
  warningYellow: "#F59E0B",
  dangerRed: "#EF4444",
};

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
}

const TAB_CONFIG: Record<string, TabItem> = {
  Dashboard: {
    name: "Dashboard",
    label: "Home",
    icon: "home",
  },
  Patients: {
    name: "Patients",
    label: "Patients",
    icon: "people",
  },
  Monitoring: {
    name: "Monitoring",
    label: "AI Monitor",
    icon: "insights",
  },
  Sync: {
    name: "Sync",
    label: "Sync",
    icon: "cloud-sync",
  },
  Profile: {
    name: "Profile",
    label: "Profile",
    icon: "person",
  },
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.container}>
      {/* Gradient accent line at top */}
      <View style={styles.accentLine} />

      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const tabConfig = TAB_CONFIG[route.name] || {
            name: route.name,
            label: route.name,
            icon: "circle" as keyof typeof MaterialIcons.glyphMap,
          };

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              {/* Active indicator */}
              {isFocused && <View style={styles.activeIndicator} />}

              {/* Icon with animated background */}
              <View
                style={[
                  styles.iconContainer,
                  isFocused && styles.iconContainerActive,
                ]}
              >
                <MaterialIcons
                  name={tabConfig.icon}
                  size={24}
                  color={isFocused ? COLORS.primary : COLORS.slate400}
                />

                {/* Badge */}
                {tabConfig.badge && tabConfig.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {tabConfig.badge > 99 ? "99+" : tabConfig.badge}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {tabConfig.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom safe area padding for iOS */}
      {Platform.OS === "ios" && <View style={styles.bottomSafeArea} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px -4px 12px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: COLORS.slate800,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }
    ),
    elevation: 12,
  },
  accentLine: {
    height: 3,
    backgroundColor: COLORS.primaryLight,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    width: 32,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  iconContainer: {
    width: 44,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 4,
    position: "relative",
  },
  iconContainerActive: {
    backgroundColor: COLORS.primaryLight,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.dangerRed,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.slate400,
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  bottomSafeArea: {
    height: 20,
    backgroundColor: COLORS.white,
  },
});

export default CustomTabBar;
