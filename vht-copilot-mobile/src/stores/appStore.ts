import { create } from "zustand";
import {
  Patient,
  VHTMember,
  Referral,
  AIAction,
  SyncRecord,
  CommunityAlert,
  TriageLevel,
} from "../types";

interface AppState {
  // VHT Member State
  currentUser: VHTMember | null;
  setCurrentUser: (user: VHTMember | null) => void;
  clearAuth: () => void;

  // Patient State
  patients: Patient[];
  selectedPatient: Patient | null;
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  selectPatient: (patient: Patient | null) => void;

  // Voice Intake State
  isRecording: boolean;
  currentSymptoms: string[];
  triageScore: number;
  currentTriageLevel: TriageLevel;
  setIsRecording: (isRecording: boolean) => void;
  addSymptom: (symptom: string) => void;
  clearSymptoms: () => void;
  setTriageScore: (score: number) => void;
  setTriageLevel: (level: TriageLevel) => void;

  // Referral State
  activeReferral: Referral | null;
  referralHistory: Referral[];
  setActiveReferral: (referral: Referral | null) => void;
  addReferral: (referral: Referral) => void;

  // AI Actions State
  aiActions: AIAction[];
  isAIProcessing: boolean;
  addAIAction: (action: AIAction) => void;
  updateAIAction: (id: string, updates: Partial<AIAction>) => void;
  setAIProcessing: (isProcessing: boolean) => void;

  // Sync State
  syncRecords: SyncRecord[];
  lastSyncTime: Date | null;
  syncProgress: number;
  isOnline: boolean;
  addSyncRecord: (record: SyncRecord) => void;
  setLastSyncTime: (time: Date) => void;
  setSyncProgress: (progress: number) => void;
  setIsOnline: (isOnline: boolean) => void;

  // Alert State
  communityAlerts: CommunityAlert[];
  setCommunityAlerts: (alerts: CommunityAlert[]) => void;

  // Settings
  language: "en" | "lg" | "sw";
  voiceFeedbackEnabled: boolean;
  setLanguage: (lang: "en" | "lg" | "sw") => void;
  setVoiceFeedback: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // VHT Member
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearAuth: () => set({ 
    currentUser: null,
    patients: [],
    selectedPatient: null,
    activeReferral: null,
    referralHistory: [],
    aiActions: [],
    syncRecords: [],
  }),

  // Patients
  patients: [],
  selectedPatient: null,
  setPatients: (patients) => set({ patients }),
  addPatient: (patient) =>
    set((state) => ({ patients: [...state.patients, patient] })),
  updatePatient: (id, updates) =>
    set((state) => ({
      patients: state.patients.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),
  selectPatient: (patient) => set({ selectedPatient: patient }),

  // Voice Intake
  isRecording: false,
  currentSymptoms: [],
  triageScore: 0,
  currentTriageLevel: "stable",
  setIsRecording: (isRecording) => set({ isRecording }),
  addSymptom: (symptom) =>
    set((state) => ({ currentSymptoms: [...state.currentSymptoms, symptom] })),
  clearSymptoms: () =>
    set({ currentSymptoms: [], triageScore: 0, currentTriageLevel: "stable" }),
  setTriageScore: (score) => set({ triageScore: score }),
  setTriageLevel: (level) => set({ currentTriageLevel: level }),

  // Referral
  activeReferral: null,
  referralHistory: [],
  setActiveReferral: (referral) => set({ activeReferral: referral }),
  addReferral: (referral) =>
    set((state) => ({ referralHistory: [...state.referralHistory, referral] })),

  // AI Actions
  aiActions: [],
  isAIProcessing: false,
  addAIAction: (action) =>
    set((state) => ({ aiActions: [action, ...state.aiActions] })),
  updateAIAction: (id, updates) =>
    set((state) => ({
      aiActions: state.aiActions.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    })),
  setAIProcessing: (isProcessing) => set({ isAIProcessing: isProcessing }),

  // Sync
  syncRecords: [],
  lastSyncTime: null,
  syncProgress: 98,
  isOnline: true,
  addSyncRecord: (record) =>
    set((state) => ({ syncRecords: [record, ...state.syncRecords] })),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setSyncProgress: (progress) => set({ syncProgress: progress }),
  setIsOnline: (isOnline) => set({ isOnline }),

  // Alerts
  communityAlerts: [],
  setCommunityAlerts: (alerts) => set({ communityAlerts: alerts }),

  // Settings
  language: "en",
  voiceFeedbackEnabled: true,
  setLanguage: (lang) => set({ language: lang }),
  setVoiceFeedback: (enabled) => set({ voiceFeedbackEnabled: enabled }),
}));
