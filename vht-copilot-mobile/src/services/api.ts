import axios from 'axios';
import { Patient, Symptom, Referral, VHTMember } from '../types';

// API Base URL - Change this for production
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:8000/api' // Android emulator
  : 'https://vht-copilot-api.yourserver.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Patient API
export const patientAPI = {
  getAll: async (): Promise<Patient[]> => {
    const response = await api.get('/patients/');
    return response.data;
  },

  getById: async (id: string): Promise<Patient> => {
    const response = await api.get(`/patients/${id}/`);
    return response.data;
  },

  create: async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    const response = await api.post('/patients/', patient);
    return response.data;
  },

  update: async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    const response = await api.patch(`/patients/${id}/`, patient);
    return response.data;
  },

  addSymptom: async (patientId: string, symptom: Omit<Symptom, 'id'>): Promise<Symptom> => {
    const response = await api.post(`/patients/${patientId}/symptoms/`, symptom);
    return response.data;
  },
};

// Voice Processing API
export const voiceAPI = {
  processVoice: async (audioBase64: string, language: string): Promise<{
    transcription: string;
    symptoms: string[];
    triageScore: number;
    triageLevel: string;
  }> => {
    const response = await api.post('/voice/process/', {
      audio: audioBase64,
      language,
    });
    return response.data;
  },

  transcribeOnly: async (audioBase64: string, language: string): Promise<string> => {
    const response = await api.post('/voice/transcribe/', {
      audio: audioBase64,
      language,
    });
    return response.data.transcription;
  },
};

// Triage API
export const triageAPI = {
  analyzeSymptoms: async (symptoms: string[], patientAge: string, patientGender: string): Promise<{
    triageScore: number;
    triageLevel: string;
    recommendations: string[];
    firstAidInstructions: Array<{
      title: string;
      titleLuganda: string;
      description: string;
      descriptionLuganda: string;
      icon: string;
    }>;
    requiresReferral: boolean;
  }> => {
    const response = await api.post('/triage/analyze/', {
      symptoms,
      patientAge,
      patientGender,
    });
    return response.data;
  },
};

// Referral API
export const referralAPI = {
  create: async (referral: Omit<Referral, 'id' | 'createdAt'>): Promise<Referral> => {
    const response = await api.post('/referrals/', referral);
    return response.data;
  },

  confirm: async (referralId: string): Promise<Referral> => {
    const response = await api.post(`/referrals/${referralId}/confirm/`);
    return response.data;
  },

  getNearbyFacilities: async (latitude: number, longitude: number): Promise<Array<{
    id: string;
    name: string;
    type: string;
    distance: number;
    estimatedTime: number;
    latitude: number;
    longitude: number;
  }>> => {
    const response = await api.get('/referrals/nearby-facilities/', {
      params: { latitude, longitude },
    });
    return response.data;
  },
};

// Sync API
export const syncAPI = {
  syncData: async (data: {
    patients: Patient[];
    referrals: Referral[];
  }): Promise<{ success: boolean; syncedAt: Date }> => {
    const response = await api.post('/sync/', data);
    return response.data;
  },

  getLastSync: async (vhtId: string): Promise<{ lastSyncAt: Date; pendingRecords: number }> => {
    const response = await api.get(`/sync/status/${vhtId}/`);
    return response.data;
  },
};

// VHT Member API
export const vhtAPI = {
  login: async (vhtId: string, pin: string): Promise<{ token: string; member: VHTMember }> => {
    const response = await api.post('/auth/login/', { vhtId, pin });
    return response.data;
  },

  getProfile: async (): Promise<VHTMember> => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (updates: Partial<VHTMember>): Promise<VHTMember> => {
    const response = await api.patch('/auth/profile/', updates);
    return response.data;
  },
};

export default api;
