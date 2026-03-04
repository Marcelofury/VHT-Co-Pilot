import axios from "axios";
import { Patient, Symptom, Referral, VHTMember } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Helper to get server base URL
const getServerBaseUrl = () => {
  if (Platform.OS === 'web') {
    return "http://127.0.0.1:8000";
  } else if (Platform.OS === 'android') {
    return "http://10.0.2.2:8000"; // Android emulator
  } else {
    return "http://localhost:8000"; // iOS simulator
  }
};

// Helper to convert relative media URLs to absolute URLs
const getAbsoluteUrl = (relativeUrl: string | undefined | null): string | undefined => {
  if (!relativeUrl) return undefined;
  
  // If already an absolute URL, return as-is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  // Convert relative URL to absolute
  const serverBase = getServerBaseUrl();
  // Remove leading slash if present
  const cleanPath = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
  return `${serverBase}/${cleanPath}`;
};

// Data transformation utilities
const transformPatientFromAPI = (data: any): Patient => ({
  id: data.id,
  vhtCode: data.vht_code,
  firstName: data.first_name,
  lastName: data.last_name,
  age: data.age,
  gender: data.gender?.toLowerCase() === 'male' ? 'male' : 'female',
  triageLevel: data.triage_level?.toLowerCase().replace('_', '') as any || 'stable',
  lastVisit: new Date(data.last_visit || data.created_at),
  photoUrl: getAbsoluteUrl(data.photo),
  location: data.village ? {
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    village: data.village,
  } : undefined,
  symptoms: [],
  createdAt: new Date(data.created_at),
  updatedAt: new Date(data.updated_at),
});

const transformUserFromAPI = (data: any): VHTMember => ({
  id: data.id,
  vhtId: data.vht_id || '',
  name: `${data.first_name} ${data.last_name}`,
  email: data.email || data.username,
  role: data.role,
  photoUrl: getAbsoluteUrl(data.photo),
  village: data.village || '',
  district: data.district || '',
  region: data.region || '',
  primaryLanguage: 'en',
  voiceFeedbackEnabled: false,
  phone: data.phone_number,
  // Hospital fields for hospital staff
  hospitalName: data.hospital_name,
  hospitalDistrict: data.hospital_district,
  hospitalId: data.hospital_id,
});

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
  timeout: 120000, // 2 minutes for Whisper transcription + AI processing
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let authToken: string | null = null;
let onAuthFailureCallback: (() => void) | null = null;

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
  
  // Trigger callback if registered (e.g., to clear store and navigate to login)
  if (onAuthFailureCallback) {
    onAuthFailureCallback();
  }
};

export const setAuthFailureCallback = (callback: () => void) => {
  onAuthFailureCallback = callback;
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
    const data = response.data.results || response.data;
    return Array.isArray(data) ? data.map(transformPatientFromAPI) : [];
  },

  getById: async (id: string): Promise<Patient> => {
    const response = await api.get(`/patients/${id}/`);
    return transformPatientFromAPI(response.data);
  },

  create: async (
    patient: Omit<Patient, "id" | "createdAt" | "updatedAt">,
  ): Promise<Patient> => {
    const response = await api.post("/patients/", patient);
    return transformPatientFromAPI(response.data);
  },

  update: async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    const response = await api.patch(`/patients/${id}/`, patient);
    return transformPatientFromAPI(response.data);
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
    const response = await api.post(`/referrals/${id}/update_status/`, {
      status,
      notes,
    });
    return response.data;
  },

  acceptReferral: async (id: string): Promise<Referral> => {
    const response = await api.post(`/referrals/${id}/accept/`);
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

  acceptReferral: async (referralId: string): Promise<{ success: boolean; message: string; referral: any }> => {
    const response = await api.post(`/referrals/${referralId}/accept/`);
    return response.data;
  },
  
  // VHT-specific endpoints
  getMyReferrals: async (activeOnly?: boolean): Promise<any[]> => {
    const response = await api.get("/referrals/my_referrals/", {
      params: activeOnly ? { active_only: 'true' } : {}
    });
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get("/notifications/");
    return response.data;
  },
  
  markRead: async (notificationId: string): Promise<any> => {
    const response = await api.post(`/notifications/${notificationId}/mark_read/`);
    return response.data;
  },
  
  markAllRead: async (): Promise<{ message: string }> => {
    const response = await api.post("/notifications/mark_all_read/");
    return response.data;
  },
  
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get("/notifications/unread_count/");
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
    patients_this_week: number;
    total_referrals: number;
    active_referrals: number;
    emergency_referrals_today: number;
    available_hospitals: number;
    triage_distribution: any[];
  }> => {
    const response = await api.get("/dashboard/stats/");
    return response.data;
  },
};

// Authentication & VHT Member API
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
    return transformUserFromAPI(response.data);
  },

  uploadPhoto: async (photoUri: string): Promise<string> => {
    // Create FormData for file upload
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = photoUri.split('/').pop() || 'profile.jpg';
    
    // Add the photo file to FormData
    // @ts-ignore - React Native handles this differently than web
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg', // Default to JPEG
      name: filename,
    });

    const response = await api.post("/users/upload-photo/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Convert relative URL to absolute URL
    return getAbsoluteUrl(response.data.url) || response.data.url;
  },

  updateProfile: async (updates: Partial<VHTMember>): Promise<VHTMember> => {
    // Convert camelCase to snake_case for backend
    const backendData: any = {};
    if (updates.name) {
      // Split name into first and last name
      const nameParts = updates.name.trim().split(" ");
      backendData.first_name = nameParts[0];
      backendData.last_name = nameParts.slice(1).join(" ") || nameParts[0];
    }
    if (updates.village) backendData.village = updates.village;
    if (updates.district) backendData.district = updates.district;
    if (updates.region) backendData.region = updates.region;
    if (updates.phone) backendData.phone_number = updates.phone;
    if (updates.photoUrl) backendData.photo = updates.photoUrl;
    
    const response = await api.patch("/users/profile/", backendData);
    return transformUserFromAPI(response.data);
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

// Location API
export const locationAPI = {
  getDistricts: async (): Promise<string[]> => {
    const response = await api.get("/locations/", { params: { action: 'districts' } });
    return response.data.districts;
  },

  getSubCounties: async (district: string): Promise<string[]> => {
    const response = await api.get("/locations/", { 
      params: { action: 'sub_counties', district } 
    });
    return response.data.sub_counties;
  },

  getParishes: async (district: string, subCounty: string): Promise<string[]> => {
    const response = await api.get("/locations/", { 
      params: { action: 'parishes', district, sub_county: subCounty } 
    });
    return response.data.parishes;
  },

  getCoordinates: async (district: string, subCounty?: string): Promise<{ latitude: number; longitude: number }> => {
    const response = await api.get("/locations/", { 
      params: { action: 'coordinates', district, sub_county: subCounty } 
    });
    return response.data;
  },

  getVillages: async (district: string): Promise<Array<{name: string; latitude: number; longitude: number}>> => {
    const response = await api.get("/locations/", {
      params: { action: 'villages', district }
    });
    return response.data.villages;
  },

  getVillageCoordinates: async (village: string, district?: string): Promise<{ latitude: number; longitude: number }> => {
    const response = await api.get("/locations/", {
      params: { action: 'village_coordinates', village, district }
    });
    return response.data;
  },

  findNearestHospitals: async (
    latitude: number,
    longitude: number,
    triageLevel: string = 'MODERATE',
    maxResults: number = 3
  ): Promise<any[]> => {
    const response = await api.post("/hospitals/find-nearest/", {
      latitude,
      longitude,
      triage_level: triageLevel,
      max_results: maxResults
    });
    return response.data.hospitals;
  },
};

// VHT Settings API
export const vhtSettingsAPI = {
  // Get current VHT's settings
  getMySettings: async (): Promise<any> => {
    const response = await api.get("/vht/settings/");
    return response.data;
  },

  // Update settings
  updateSettings: async (settings: {
    ai_monitoring_enabled?: boolean;
    auto_triage_enabled?: boolean;
    notifications_enabled?: boolean;
    high_alert_threshold?: number;
    auto_refresh_interval?: number;
  }): Promise<any> => {
    const response = await api.patch("/vht/settings/", settings);
    return response.data;
  },
};

// AI Override API
export const aiOverrideAPI = {
  // Override triage score
  overrideTriageScore: async (data: {
    referral_id: number;
    new_triage_score: number;
    reason: string;
    clinical_notes?: string;
  }): Promise<any> => {
    const response = await api.post("/ai/override/triage/", data);
    return response.data;
  },

  // Change referral hospital
  overrideReferralHospital: async (data: {
    referral_id: number;
    new_hospital_id: number;
    reason: string;
    clinical_notes?: string;
  }): Promise<any> => {
    const response = await api.post("/ai/override/hospital/", data);
    return response.data;
  },

  // Flag incorrect AI decision
  flagIncorrectDecision: async (data: {
    referral_id?: number;
    case_submission_id?: number;
    reason: string;
    clinical_notes?: string;
    decision_type: string;
  }): Promise<any> => {
    const response = await api.post("/ai/override/flag/", data);
    return response.data;
  },

  // Get my override history
  getMyOverrides: async (): Promise<any[]> => {
    const response = await api.get("/ai/overrides/me/");
    return response.data.overrides;
  },
};

export default api;
