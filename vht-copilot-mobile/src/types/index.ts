// VHT Co-Pilot Type Definitions

export type TriageLevel = "stable" | "moderate" | "highRisk" | "urgent";

export type Language = "en" | "lg" | "sw"; // English, Luganda, Swahili

export interface Patient {
  id: string;
  vhtCode: string;
  firstName: string;
  lastName: string;
  age: string;
  gender: "male" | "female";
  triageLevel: TriageLevel;
  lastVisit: Date;
  photoUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    village: string;
  };
  symptoms?: Symptom[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Symptom {
  id: string;
  nameEnglish: string;
  nameLuganda: string;
  nameSwahili: string;
  severity: number; // 1-10
  timestamp: Date;
  voiceRecordingUrl?: string;
}

export interface VHTMember {
  id: string;
  vhtId: string;
  name: string;
  photoUrl?: string;
  village: string;
  district: string;
  region: string;
  primaryLanguage: Language;
  voiceFeedbackEnabled: boolean;
  phone?: string;
}

export interface Referral {
  id: string;
  patientId: string;
  facilityName: string;
  facilityType: "HCII" | "HCIII" | "HCIV" | "Hospital";
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  estimatedTravelTime: number; // in minutes
  urgencyLevel: TriageLevel;
  status: "pending" | "confirmed" | "in_transit" | "arrived" | "completed";
  firstAidInstructions: FirstAidInstruction[];
  createdAt: Date;
  confirmedAt?: Date;
}

export interface FirstAidInstruction {
  id: string;
  titleEnglish: string;
  titleLuganda: string;
  descriptionEnglish: string;
  descriptionLuganda: string;
  icon: string;
  priority: number;
}

export interface AIAction {
  id: string;
  type: "referral" | "follow_up" | "risk_assessment" | "alert";
  status: "pending" | "in_progress" | "completed" | "paused";
  patientId?: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SyncRecord {
  id: string;
  patientName: string;
  action: string;
  syncedAt: Date;
  vhtCode: string;
  status: "synced" | "pending" | "failed";
}

export interface CommunityAlert {
  id: string;
  title: string;
  severity: "low" | "moderate" | "high";
  zone: string;
  createdAt: Date;
  expiresAt: Date;
}
