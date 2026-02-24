// VHT Co-Pilot Brand Colors
export const COLORS = {
  // Primary Colors
  primary: "#007BFF",
  primaryLight: "#F0F7FF",
  deepBlue: "#003366",
  healthBlue: "#005EB8",

  // Triage Status Colors
  triageGreen: "#28A745",
  triageYellow: "#FFD700",
  triageRed: "#DC3545",
  urgentRed: "#DC2626",
  emergencyRed: "#D50000",

  // UI Colors
  softBlue: "#E3F2FD",
  aiGreen: "#10B981",
  successGreen: "#28A745",

  // Neutral Colors
  white: "#FFFFFF",
  background: "#F8FAFC",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate900: "#0F172A",

  // Transparency
  blackOverlay: "rgba(0, 0, 0, 0.5)",
  whiteOverlay: "rgba(255, 255, 255, 0.8)",
};

export const TRIAGE_STATUS = {
  stable: {
    color: COLORS.triageGreen,
    bgColor: "#F2FDF5",
    label: "Stable",
    labelLuganda: "Bulungi",
  },
  moderate: {
    color: COLORS.triageYellow,
    bgColor: "#FFF9E6",
    label: "Moderate",
    labelLuganda: "Wakati",
  },
  highRisk: {
    color: COLORS.triageRed,
    bgColor: "#FEF2F2",
    label: "High Risk",
    labelLuganda: "Bulabe",
  },
  urgent: {
    color: COLORS.emergencyRed,
    bgColor: "#FEE2E2",
    label: "Urgent",
    labelLuganda: "Kyanguwa",
  },
};
