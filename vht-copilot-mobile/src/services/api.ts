import axios from "axios";
import { Patient, Symptom, Referral, VHTMember } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// API Base URL - Changes based on platform
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return "http://127.0.0.1:8000/api";
  } else if (Platform.OS === 'android') {
    return "http://10.0.2.2:8000/api"; // Android emulator
  } else {
    return "http://localhost:8000/api"; // iOS simulator
  }
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let authToken: string | null = null;

// Web-compatible storage
const storage = {
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
};

export const setAuthToken = (token: string) => {
  authToken = token;
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  storage.setItem("auth_token", token);
};

export const clearAuthToken = () => {
  authToken = null;
  delete api.defaults.headers.common["Authorization"];
  storage.removeItem("auth_token");
};

export const loadAuthToken = async () => {
  const token = await storage.getItem("auth_token");
  if (token) {
    setAuthToken(token);
  }
  return token;
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
      // Handle logout or token refresh here
    }
    return Promise.reject(error);
  }
);

// Patient API
export const patientAPI = {
  getAll: async (): Promise<Patient[]> => {
    const response = await api.get("/patients/");
    return response.data.results || response.data;
  },

  getById: async (id: string): Promise<Patient> => {
    const response = await api.get(`/patients/${id}/`);
    return response.data;
  },

  create: async (
    patient: Omit<Patient, "id" | "createdAt" | "updatedAt">,
  ): Promise<Patient> => {
    const response = await api.post("/patients/", patient);
    return response.data;
  },

  update: async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    const response = await api.patch(`/patients/${id}/`, patient);
    return response.data;
  },

  getHistory: async (id: string): Promise<any[]> => {
    const response = await api.get(`/patients/${id}/history/`);
    return response.data;
  },

  updateTriage: async (
    id: string,
    triageData: {
      triage_level: string;
      triage_score: number;
      triage_confidence: number;
    },
  ): Promise<Patient> => {
    const response = await api.patch(`/patients/${id}/update-triage/`, triageData);
    return response.data;
  },
};

// AI Processing API (Voice + Triage)
export const aiAPI = {
  // Main AI endpoint - processes audio or transcription and returns full analysis
  submitCase: async (
    patientId: string,
    audioFile?: Blob,
    transcription?: string,
    language?: string,
  ): Promise<{
    transcription: string;
    symptoms: string[];
    triage_score: number;
    triage_level: string;
    recommendations: string[];
    requires_referral: boolean;
    ai_reasoning: string;
    guideline_citation?: string;
    referral?: {
      id: number;
      hospital_name: string;
      referral_code: string;
      distance_km: number;
    };
  }> => {
    const formData = new FormData();
    formData.append("patient_id", patientId);
    
    if (audioFile) {
      formData.append("audio_file", audioFile);
    }
    if (transcription) {
      formData.append("transcription", transcription);
    }
    if (language) {
      formData.append("language", language);
    }

    const response = await api.post("/ai/submit-case/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Transcription only endpoint
  transcribeOnly: async (
    audioFile: Blob,
    language?: string,
  ): Promise<{ transcription: string; detected_language: string }> => {
    const formData = new FormData();
    formData.append("audio_file", audioFile);
    if (language) {
      formData.append("language", language);
    }

    const response = await api.post("/ai/transcribe-only/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

// Note: Triage is now integrated into aiAPI.submitCase()
// Keeping this for backward compatibility
export const triageAPI = {
  analyzeSymptoms: async (
    symptoms: string[],
    patientId: string,
  ): Promise<{
    triageScore: number;
    triageLevel: string;
    recommendations: string[];
    requiresReferral: boolean;
  }> => {
    // Use the AI endpoint with transcription instead
    const transcription = `Patient symptoms: ${symptoms.join(", ")}`;
    const response = await aiAPI.submitCase(patientId, undefined, transcription);
    return {
      triageScore: response.triage_score,
      triageLevel: response.triage_level,
      recommendations: response.recommendations,
      requiresReferral: response.requires_referral,
    };
  },
};

// Referral API
export const referralAPI = {
  create: async (
    referral: Omit<Referral, "id" | "createdAt">,
  ): Promise<Referral> => {
    const response = await api.post("/referrals/", referral);
    return response.data;
  },

  confirm: async (referralId: string): Promise<Referral> => {
    const response = await api.post(`/referrals/${referralId}/confirm/`);
    return response.data;
  },

  getNearbyFacilities: async (
    latitude: number,
    longitude: number,
    max_distance?: number,
  ): Promise<
    Array<{
      id: number;
      name: string;
      hospital_type: string;
      distance_km: number;
      gps_latitude: number;
      gps_longitude: number;
      phone_number?: string;
      specialties?: string[];
    }>
  > => {
    const response = await api.get("/hospitals/nearby/", {
      params: { 
        latitude, 
        longitude,
        max_distance: max_distance || 50,
      },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Referral> => {
    const response = await api.get(`/referrals/${id}/`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: string,
    notes?: string,
  ): Promise<Referral> => {
    const response = await api.patch(`/referrals/${id}/update-status/`, {
      status,
      notes,
    });
    return response.data;
  },

  // Hospital-specific endpoints
  getMyHospitalReferrals: async (): Promise<Referral[]> => {
    const response = await api.get("/referrals/my_hospital/");
    return response.data;
  },

  getHospitalStats: async (): Promise<{
    pending: number;
    in_transit: number;
    arrived: number;
    completed: number;
    total: number;
  }> => {
    const response = await api.get("/referrals/hospital_stats/");
    return response.data;
  },
};

// Sync API
export const syncAPI = {
  syncData: async (data: {
    patients: Patient[];
    referrals: Referral[];
  }): Promise<{ success: boolean; syncedAt: Date }> => {
    const response = await api.post("/sync/", data);
    return response.data;
  },

  getLastSync: async (
    vhtId: string,
  ): Promise<{ lastSyncAt: Date; pendingRecords: number }> => {
    const response = await api.get(`/sync/status/${vhtId}/`);
    return response.data;
  },
};
// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<{
    total_patients: number;
    active_referrals: number;
    emergency_cases: number;
    recent_cases: any[];
  }> => {
    const response = await api.get("/dashboard/stats/");
    return response.data;
  },
};

export { setAuthToken, clearAuthToken, loadAuthToken };// Authentication & VHT Member API
export const authAPI = {
  register: async (data: {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    vht_id?: string;
    hospital_code?: string;
    phone_number?: string;
    village?: string;
    district?: string;
  }): Promise<any> => {
    const response = await api.post("/auth/register/", data);
    return response.data;
  },

  login: async (
    username: string,
    password: string,
  ): Promise<{ access: string; refresh: string }> => {
    const response = await api.post("/auth/token/", { username, password });
    setAuthToken(response.data.access);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await api.post("/auth/token/refresh/", {
      refresh: refreshToken,
    });
    setAuthToken(response.data.access);
    return response.data;
  },

  getProfile: async (): Promise<VHTMember> => {
    const response = await api.get("/users/profile/");
    return response.data;
  },

  updateProfile: async (updates: Partial<VHTMember>): Promise<VHTMember> => {
    const response = await api.patch("/users/profile/", updates);
    return response.data;
  },
};

// Hospital API
export const hospitalAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get("/hospitals/");
    return response.data.results || response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/hospitals/${id}/`);
    return response.data;
  },

  getNearby: async (
    latitude: number,
    longitude: number,
    maxDistance?: number,
  ): Promise<any[]> => {
    const response = await api.get("/hospitals/nearby/", {
      params: { latitude, longitude, max_distance: maxDistance || 50 },
    });
    return response.data;
  },
};

export default api;
