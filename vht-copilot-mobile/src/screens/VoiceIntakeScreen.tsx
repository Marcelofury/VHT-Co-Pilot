import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { useAppStore } from "../stores/appStore";
import { aiAPI } from "../services/api";

// Conditionally import native modules (not available on web)
let Audio: any = null;
let Speech: any = null;

if (Platform.OS !== 'web') {
  try {
    Audio = require('expo-av').Audio;
    Speech = require('expo-speech');
  } catch (e) {
    console.warn('Native audio modules not available:', e);
  }
}

interface VoiceIntakeScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string) => void;
  patientId?: string;
  onTriageComplete?: (triageData: { urgencyLevel: string }) => void;
}

export const VoiceIntakeScreen: React.FC<VoiceIntakeScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const {
    isRecording,
    setIsRecording,
    triageScore,
    currentTriageLevel,
    selectedPatient,
    setTriageScore,
    setTriageLevel,
    addAIAction,
    addSyncRecord,
    setLastSyncTime,
    updatePatient,
  } = useAppStore();

  const [currentSymptom, setCurrentSymptom] = useState({
    english: "High Fever",
    luganda: "Omusujja ogw'amaanyi",
  });
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realTranscription, setRealTranscription] = useState<string>("");
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en");
  const [recording, setRecording] = useState<any | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [lugandaTranslation, setLugandaTranslation] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Platform-aware alert function
  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
  };

  // Request audio recording permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web' && Audio) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Required', 'Audio recording permission is required for voice intake.');
        }
      }
    })();
  }, []);

  // Animated wave bars
  const waveAnimations = useRef(
    Array(11)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (isRecording) {
      startWaveAnimation();
    } else {
      stopWaveAnimation();
    }
  }, [isRecording]);

  const startWaveAnimation = () => {
    waveAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300 + Math.random() * 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  };

  const stopWaveAnimation = () => {
    waveAnimations.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0);
    });
  };

  const handleMicPress = async () => {
    // Web platform doesn't support audio recording
    if (Platform.OS === 'web' || !Audio) {
      showAlert(
        "Not Available on Web",
        "Audio recording is only available on mobile devices. For web testing, the system will use simulated transcription."
      );
      // Toggle recording state for UI testing
      setIsRecording(!isRecording);
      setHasRecorded(true);
      return;
    }

    if (!isRecording) {
      // Starting recording
      try {
        console.log('Requesting audio permissions...');
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        console.log('Starting recording...');
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        setRecording(newRecording);
        setIsRecording(true);
        setHasRecorded(true);
        
        showAlert(
          "Recording Started",
          "Voice capture is now active. Speak clearly to record patient symptoms."
        );
      } catch (err) {
        console.error('Failed to start recording', err);
        showAlert('Recording Failed', 'Could not start audio recording. Please check permissions.');
      }
    } else {
      // Stopping recording
      try {
        console.log('Stopping recording...');
        if (!recording) return;
        
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordingUri(uri);
        setRecording(null);
        
        console.log('Recording saved to:', uri);
        
        showAlert(
          "Recording Stopped",
          "Voice capture has been saved. Translating to Luganda..."
        );
        
        // Auto-translate to Luganda after recording
        await translateToLuganda();
        
      } catch (err) {
        console.error('Failed to stop recording', err);
        showAlert('Stop Recording Failed', 'Could not stop recording properly.');
      }
    }
  };

  // Translate English text to Luganda
  const translateToLuganda = async () => {
    if (!realTranscription && !currentSymptom.english) {
      return;
    }
    
    setIsTranslating(true);
    try {
      const textToTranslate = realTranscription || currentSymptom.english;
      
      // Call Google Translate API through backend
      const response = await fetch(`${Platform.OS === 'web' ? 'http://127.0.0.1:8000' : 'http://10.0.2.2:8000'}/api/ai/translate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToTranslate,
          target_language: 'lg',
          source_language: 'en'
        })
      });
      
      const data = await response.json();
      
      if (data.translated_text) {
        setLugandaTranslation(data.translated_text);
        setCurrentSymptom({
          english: textToTranslate,
          luganda: data.translated_text
        });
        console.log('Translation successful:', data.translated_text);
      } else {
        console.warn('Translation failed, using original');
        setLugandaTranslation(currentSymptom.luganda);
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to original Luganda text
      setLugandaTranslation(currentSymptom.luganda);
    } finally {
      setIsTranslating(false);
    }
  };

  // Speak text using Text-to-Speech
  const speakText = async (text: string, language: string = 'en') => {
    // Web platform fallback
    if (Platform.OS === 'web' || !Speech) {
      // Use Web Speech API if available
      if (window.speechSynthesis) {
        if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          return;
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'lg' ? 'en-US' : 'en-US'; // Luganda not supported, use English
        utterance.rate = 0.85;
        utterance.onend = () => setIsSpeaking(false);
        
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      } else {
        showAlert('Not Available', 'Text-to-Speech is not supported in this browser.');
      }
      return;
    }

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    try {
      setIsSpeaking(true);
      
      // Language code mapping
      const langMap: any = {
        'en': 'en-US',
        'lg': 'en-US', // Luganda not supported by expo-speech, use English voice
        'sw': 'sw-KE'
      };
      
      await Speech.speak(text, {
        language: langMap[language] || 'en-US',
        pitch: 1.0,
        rate: 0.85,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const handleCompleteIntake = async () => {
    if (!hasRecorded) {
      showAlert(
        "No Recording",
        "Please record patient symptoms before completing the intake."
      );
      return;
    }

    if (!selectedPatient) {
      showAlert(
        "No Patient Selected",
        "Please select a patient before submitting intake."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting intake for patient:", selectedPatient);
      
      // Use real transcription if available, otherwise simulated
      let transcription = realTranscription;
      let audioFile = undefined;
      
      if (recordingUri && Platform.OS !== 'web') {
        // Create FormData with actual audio file
        const formData = new FormData();
        formData.append('patient_id', selectedPatient.id);
        formData.append('language', detectedLanguage || 'en');
        
        // Add audio file blob
        const response = await fetch(recordingUri);
        const blob = await response.blob();
        formData.append('audio_file', blob, 'recording.m4a');
        
        // TODO: Update aiAPI.submitCase to accept FormData
        console.log('Submitting with audio file:', recordingUri);
      } else {
        // Fallback to simulated transcription for web or if no recording
        transcription = transcription || `Patient complains of ${currentSymptom.english.toLowerCase()}. Symptoms have been present for a few days.`;
      }
      
      // Call the real AI API
      const result = await aiAPI.submitCase(
        selectedPatient.id,
        undefined, // audioFile - In real app, you'd capture actual audio
        transcription,
        "en"
      );
      
      console.log("AI Triage Result:", result);
      
      // Handle nested result structure from API
      const actualResult = result.result || result;
      
      // Store real transcription from API
      if (actualResult.transcription) {
        setRealTranscription(actualResult.transcription);
        setDetectedLanguage(actualResult.language_detected || "en");
        
        // Update displayed symptom with real transcription
        setCurrentSymptom({
          english: actualResult.transcription,
          luganda: actualResult.language_detected === "lg" 
            ? actualResult.transcription 
            : "[Translation not available]"
        });
      }
      
      // Check if there was a backend error
      if (actualResult.error || actualResult.success === false) {
        throw new Error(actualResult.error || 'Backend processing failed');
      }
      
      // Update triage score and level in store with safe access
      const triageScore = actualResult.triage_score || 5;
      const triageLevelRaw = actualResult.triage_level || 'moderate';
      const triageLevel = (typeof triageLevelRaw === 'string' 
        ? triageLevelRaw.toLowerCase().replace('_', '') 
        : 'moderate') as any;
      
      setTriageScore(triageScore);
      setTriageLevel(triageLevel);
      
      // Update patient with new triage data
      updatePatient(selectedPatient.id, {
        triageLevel: triageLevel,
        lastVisit: new Date(),
      });
      
      // Add AI action to monitoring screen
      const requiresReferral = actualResult.requires_referral || actualResult.auto_referred || false;
      const actionTitle = requiresReferral 
        ? `${selectedPatient.firstName} ${selectedPatient.lastName} Referred to Hospital`
        : `${selectedPatient.firstName} ${selectedPatient.lastName} Triage Complete`;
        
      // Get reasoning from backend (field name: reasoning_summary)
      const aiReasoning = actualResult.reasoning_summary || actualResult.ai_reasoning || '';
      const recommendations = Array.isArray(actualResult.recommendations) 
        ? actualResult.recommendations 
        : [];
        
      addAIAction({
        id: Date.now().toString(),
        type: requiresReferral ? 'referral' : 'triage',
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        description: aiReasoning || `Triage score: ${triageScore}/10. ${recommendations.join(' ')}`,
        timestamp: new Date(),
        status: 'completed',
        confidence: actualResult.confidence_score || 0.9,
        aiReasoning: aiReasoning,
      });
      
      // Add sync record
      addSyncRecord({
        id: Date.now().toString(),
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        action: 'Intake Complete',
        timestamp: new Date(),
        status: 'synced',
        vhtCode: selectedPatient.vhtCode,
      });
      
      // Update last sync time
      setLastSyncTime(new Date());
      
      // Prepare success message with guideline context
      const reasoningText = actualResult.reasoning_summary || actualResult.ai_reasoning || 'Triage assessment completed';
      const citationText = actualResult.guideline_page || actualResult.guideline_citation || '';
      const firstAidText = actualResult.first_aid_steps || '';
      const conditionText = actualResult.condition_detected || '';
      
      // Build comprehensive VHT guidance message
      let vhtGuidance = `🏥 AI Triage Score: ${triageScore}/10\n`;
      if (conditionText) vhtGuidance += `\n📋 Condition: ${conditionText}\n`;
      if (reasoningText) vhtGuidance += `\n💡 Clinical Guidance:\n${reasoningText}\n`;
      if (firstAidText) vhtGuidance += `\n🩹 First Aid:\n${firstAidText}\n`;
      if (citationText) vhtGuidance += `\n📖 Reference: ${citationText}`;
      
      showAlert(
        "Intake Complete!",
        vhtGuidance,
        () => {
          // Navigate back after successful submission
          onBack?.();
        }
      );
    } catch (error: any) {
      console.error("Error submitting intake:", error);
      console.error("Error details:", error.response?.data);
      const errorMessage = error.response?.data?.detail || error.message || "Unknown error occurred";
      showAlert(
        "Submission Failed",
        `Failed to submit patient intake: ${errorMessage}\n\nPlease check your connection and try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTriageColor = () => {
    switch (currentTriageLevel) {
      case "stable":
        return COLORS.triageGreen;
      case "moderate":
        return COLORS.triageYellow;
      case "highRisk":
        return COLORS.triageRed;
      case "urgent":
        return COLORS.emergencyRed;
      default:
        return COLORS.triageYellow;
    }
  };

  const getTriageLabel = () => {
    switch (currentTriageLevel) {
      case "stable":
        return "Stable";
      case "moderate":
        return "Moderate";
      case "highRisk":
        return "High Risk";
      case "urgent":
        return "URGENT";
      default:
        return "Moderate";
    }
  };

  const waveHeights = [32, 64, 96, 128, 80, 112, 144, 96, 48, 80, 40];
  const waveOpacities = [0.3, 0.5, 0.7, 1, 0.8, 0.9, 1, 0.7, 0.5, 0.6, 0.3];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={getTriageColor()} />

      {/* Triage Status Bar */}
      <View style={[styles.triageBar, { backgroundColor: getTriageColor() }]}>
        <View style={styles.triageBarLeft}>
          <MaterialIcons name="warning" size={20} color={COLORS.deepBlue} />
          <Text style={styles.triageBarText}>
            Real-time Triage: {getTriageLabel()}
          </Text>
        </View>
        <View style={styles.triageBarRight}>
          <View style={styles.scoreTag}>
            <Text style={styles.scoreText}>Score: {triageScore}</Text>
          </View>
          <MaterialIcons name="cloud-done" size={20} color={COLORS.deepBlue} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBack}>
          <MaterialIcons
            name="arrow-back-ios"
            size={20}
            color={COLORS.deepBlue}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>VHT Co-Pilot</Text>
          <Text style={styles.headerSubtitle}>ACTIVE INTAKE SESSION</Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={() => setShowInfoModal(true)}>
          <MaterialIcons name="info" size={24} color={COLORS.deepBlue} />
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoModal}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>🤖 VHT Co-Pilot AI System</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.slate600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.infoModalContent}>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Voice Recording:</Text> Uses Google Speech-to-Text (FREE, 60 min/month){"\n\n"}
                <Text style={styles.infoLabel}>Translation:</Text> Real-time English ↔ Luganda translation with Google Translate API{"\n\n"}
                <Text style={styles.infoLabel}>Text-to-Speech:</Text> Tap the speaker icon to hear the translation{"\n\n"}
                <Text style={styles.infoLabel}>AI Analysis:</Text> Groq Llama 3.3 70B for medical triage (FREE, 7k req/day){"\n\n"}
                <Text style={styles.infoLabel}>Clinical Guidance:</Text> Grounded in Uganda MoH Clinical Guidelines (2,111 chunks){"\n\n"}
                <Text style={styles.infoLabel}>Auto-Referral:</Text> GPS-based nearest hospital selection from 161 hospitals{"\n\n"}
                <Text style={styles.infoLabel}>Cost:</Text> $0/month for up to 7,000 patients/day
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.infoModalButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoModalButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Symptom Card */}
        <View style={styles.symptomCard}>
          <View style={styles.symptomSection}>
            <View style={styles.languageHeader}>
              <Text style={styles.languageLabel}>
                English {realTranscription && detectedLanguage === "en" && "(Detected)"}
              </Text>
              <TouchableOpacity onPress={() => speakText(realTranscription || currentSymptom.english, 'en')}>
                <MaterialIcons 
                  name={isSpeaking ? "volume-off" : "volume-up"} 
                  size={20} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.symptomText}>
              {realTranscription || currentSymptom.english}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.symptomSection}>
            <View style={styles.languageHeader}>
              <Text style={styles.languageLabel}>
                Luganda {isTranslating && "(Translating...)"}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  onPress={translateToLuganda} 
                  disabled={isTranslating}
                  style={{ marginRight: 12 }}
                >
                  <MaterialIcons 
                    name="translate" 
                    size={20} 
                    color={isTranslating ? COLORS.slate400 : COLORS.primary} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => speakText(lugandaTranslation || currentSymptom.luganda, 'lg')}>
                  <MaterialIcons 
                    name={isSpeaking ? "volume-off" : "volume-up"} 
                    size={20} 
                    color={COLORS.primary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.symptomText}>
              {lugandaTranslation || currentSymptom.luganda}
            </Text>
          </View>
        </View>

        {/* Voice Capture Section */}
        <View style={styles.voiceCaptureSection}>
          <View style={styles.captureStatusContainer}>
            <Text style={styles.captureStatus}>
              {isRecording ? "Voice Capture Active" : "Tap to Start Recording"}
            </Text>
            <Text style={styles.captureSubtext}>
              {isRecording
                ? "Listening for patient symptoms..."
                : "Hold the button to speak"}
            </Text>
          </View>

          {/* Waveform Visualization */}
          <View style={styles.waveformContainer}>
            {waveAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height: waveHeights[index],
                    opacity: waveOpacities[index],
                    transform: [
                      {
                        scaleY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          {/* Patient Info Badge */}
          <View style={styles.patientBadge}>
            <Image
              source={{
                uri:
                  selectedPatient?.photoUrl ||
                  "https://randomuser.me/api/portraits/women/44.jpg",
              }}
              style={styles.patientBadgeAvatar}
            />
            <View>
              <Text style={styles.patientBadgeName}>
                {selectedPatient
                  ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                  : "Nalubega Sarah"}
              </Text>
              <Text style={styles.patientBadgeId}>
                Patient ID: #{selectedPatient?.vhtCode || "VHT-8821"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Microphone Button Section */}
      <View style={styles.micSection}>
        {/* Complete Button (shown after recording) */}
        {hasRecorded && !isRecording && (
          <TouchableOpacity
            style={[styles.completeButton, isSubmitting && styles.completeButtonDisabled]}
            onPress={handleCompleteIntake}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.completeButtonText}>Submitting...</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
                <Text style={styles.completeButtonText}>Complete Intake</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.micButtonContainer}>
          {isRecording && (
            <>
              <View style={[styles.micPulse, styles.micPulseLarge]} />
              <View style={[styles.micPulse, styles.micPulseSmall]} />
            </>
          )}
          <TouchableOpacity
            style={styles.micButton}
            onPress={handleMicPress}
            activeOpacity={0.9}
          >
            <MaterialIcons
              name={isRecording ? "mic" : "mic-none"}
              size={40}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.micInstructions}>
          <Text style={styles.micInstructionTitle}>
            {isRecording ? "Recording..." : "Hold to Speak"}
          </Text>
          <Text style={styles.micInstructionSubtitle}>
            {isRecording ? "Wogera..." : "Kwata wano okwogera"}
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
  triageBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  triageBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  triageBarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  triageBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreTag: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  mainContent: {
    flex: 1,
    padding: 16,
    gap: 24,
  },
  symptomCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.softBlue,
  },
  symptomSection: {
    gap: 4,
  },
  languageLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  symptomText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.softBlue,
    marginVertical: 16,
  },
  voiceCaptureSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  captureStatusContainer: {
    alignItems: "center",
    gap: 4,
  },
  captureStatus: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  captureSubtext: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate500,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 150,
    width: "100%",
    maxWidth: 280,
  },
  waveBar: {
    width: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 99,
    minHeight: 4,
  },
  patientBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: COLORS.softBlue,
  },
  patientBadgeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  patientBadgeName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.deepBlue,
  },
  patientBadgeId: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    opacity: 0.8,
    textTransform: "uppercase",
  },
  micSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.03,
    shadowRadius: 30,
    elevation: 10,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.successGreen,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 99,
    minWidth: 200,
    shadowColor: COLORS.successGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  languageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.slate900,
  },
  infoModalContent: {
    padding: 20,
    maxHeight: 400,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.slate600,
  },
  infoLabel: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  infoModalButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  infoModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  micButtonContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  micPulse: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  micPulseLarge: {
    width: 96 * 1.5,
    height: 96 * 1.5,
    opacity: 0.1,
  },
  micPulseSmall: {
    width: 96 * 1.25,
    height: 96 * 1.25,
    opacity: 0.2,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  micInstructions: {
    alignItems: "center",
    gap: 4,
  },
  micInstructionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.deepBlue,
  },
  micInstructionSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate500,
  },
});

export default VoiceIntakeScreen;
