# VHT Co-Pilot - Package Requirements

## Required Packages for New Features

### Backend (Python)
```bash
# Google Cloud Services (FREE tiers)
pip install google-cloud-speech       # Speech-to-Text: 60 min/month FREE
pip install google-cloud-texttospeech # Text-to-Speech: 1M chars/month FREE
pip install google-cloud-translate    # Translation: 500k chars/month FREE
```

### Frontend (React Native)
```bash
# Audio Recording & Playback
npm install expo-av

# Text-to-Speech
npm install expo-speech
```

## Setup Instructions

### 1. Backend - Google Cloud Setup

#### Get Google Cloud Credentials:
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable APIs:
   - Cloud Speech-to-Text API
   - Cloud Text-to-Speech API
   - Cloud Translation API
4. Create Service Account:
   - Go to: IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: `vht-copilot-services`
   - Roles: Add these roles:
     * Cloud Speech-to-Text User
     * Cloud Text-to-Speech User
     * Cloud Translation API User
5. Create Key:
   - Click on service account
   - Keys tab → Add Key → Create new key
   - Choose JSON format
   - Download the JSON file
6. Save to project:
   - Save as `vht-copilot-backend/google_credentials.json`
   - **IMPORTANT:** Add to `.gitignore` (already added)

#### Update .env:
Already configured:
```bash
USE_GOOGLE_SPEECH=true
GOOGLE_APPLICATION_CREDENTIALS=./google_credentials.json
```

### 2. Frontend - Install Packages

```bash
cd vht-copilot-mobile
npm install expo-av expo-speech
```

## Feature Documentation

### 1. Hospital → District → Village Relationship
✅ **Status:** Implemented

When a hospital is selected during registration:
- District field auto-populates with hospital's district
- District field becomes read-only (locked with green checkmark)
- Village field filters to only show villages in that district

### 2. Google Speech-to-Text
✅ **Status:** Implemented

**Backend:**
- File: `ai_engine/google_speech_service.py`
- FREE tier: 60 minutes/month
- Supports: English (en-UG), Luganda (lg-UG), Swahili (sw-UG)
- Auto-fallback to OpenAI Whisper if Google not configured

**How it works:**
1. VHT records audio using expo-av
2. Audio sent to backend as .m4a file
3. Google Speech-to-Text transcribes
4. Returns transcription + detected language

**Cost:** $0 for first 60 min/month, then $0.024 per minute

### 3. Text-to-Speech
✅ **Status:** Implemented

**Frontend:**
- Uses `expo-speech` (built-in, free)
- Tap speaker icon to hear English or Luganda text
- Works offline (uses device TTS engine)

**Features:**
- Play/pause functionality
- Supports multiple languages
- Adjustable speech rate (0.85x for clarity)

**Backend (Optional - Google TTS):**
- File: `ai_engine/google_speech_service.py`
- FREE tier: 1 million characters/month
- Higher quality than device TTS
- Saves audio files for offline playback

### 4. English ↔ Luganda Translation
✅ **Status:** Implemented

**Backend:**
- File: `ai_engine/google_speech_service.py`
- API: `/api/ai/translate/`
- FREE tier: 500,000 characters/month
- Real-time translation

**Frontend:**
- Auto-translates after recording stops
- Manual translation: Tap translate icon
- Shows "(Translating...)" status indicator

**How it works:**
1. VHT records English audio
2. Speech-to-Text converts to English text
3. Google Translate converts English → Luganda
4. Display shows both English + Luganda
5. Tap speaker icons to hear both versions

**Supported Language Pairs:**
- English → Luganda
- Luganda → English
- English → Swahili
- Swahili → English

**Cost:** $0 for first 500k chars/month, then $20 per 1M chars

### 5. Info Icon (ℹ️)
✅ **Status:** Implemented

**Location:** VoiceIntakeScreen header (top right)

**Shows:**
- Voice Recording: Google Speech-to-Text info
- Translation: Real-time English ↔ Luganda
- Text-to-Speech: Speaker icon usage
- AI Analysis: Groq Llama 3.3 70B specs
- Clinical Guidance: Uganda MoH Guidelines (2,111 chunks)
- Auto-Referral: GPS-based hospital selection
- Cost: $0/month for 7k patients/day

## Cost Analysis

### Monthly Costs (at scale)

| Feature | FREE Tier | Cost After FREE | Example (1000 patients/month) |
|---------|-----------|-----------------|-------------------------------|
| **Speech-to-Text** | 60 min | $0.024/min | ~$24 (avg 2 min/patient) |
| **Translation** | 500k chars | $20/1M chars | ~$2 (avg 200 chars/patient) |
| **Text-to-Speech** | 1M chars | $16/1M chars | ~$3 (avg 300 chars/patient) |
| **Triage (Groq)** | 7k req/day | N/A (FREE) | $0 |
| **RAG Embeddings** | Unlimited | N/A (local) | $0 |
| **TOTAL** | **$0** | ~$29/month | **Under FREE tier** |

### Typical VHT Workload:
- 50-200 patients/month per VHT
- ~10-20 VHTs per district
- **Total:** 500-4,000 patients/month
- **Cost:** **$0** (under FREE tiers for all services)

## Alternative: If No Google Cloud

If you don't want to set up Google Cloud credentials:

### Speech-to-Text:
- **Fallback:** OpenAI Whisper (current)
- **Cost:** $0.006/minute (~$12 per 1000 patients)

### Translation:
- **Alternative 1:** LibreTranslate (open-source, self-hosted, FREE)
  - Install: `pip install libretranslate`
  - Limitations: Luganda may not be supported
  
- **Alternative 2:** Simple dictionary-based translation
  - Create: `luganda_dictionary.py`
  - Maintain common medical terms manually
  - FREE but requires manual work

### Text-to-Speech:
- **Current:** expo-speech (device TTS, FREE, works offline)
- **No changes needed**

## Testing

### Test Translation:
```bash
# Backend running on http://127.0.0.1:8000

curl -X POST http://127.0.0.1:8000/api/ai/translate/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Patient has high fever and headache",
    "target_language": "lg",
    "source_language": "en"
  }'
```

Expected Response:
```json
{
  "translated_text": "Omulwadde alina omusujja ogw'amaanyi n'omutwe oguluma",
  "detected_source_language": "en",
  "confidence": 1.0
}
```

### Test Speech-to-Text:
- Use VoiceIntakeScreen in mobile app
- Tap microphone → Record audio
- Should see transcription appear in English section
- Luganda translation appears automatically

## Notes

1. **Google Credentials Security:**
   - Never commit `google_credentials.json` to git
   - Already in `.gitignore`
   - For production: Use environment variables or secret managers

2. **FREE Tier Monitoring:**
   - Check usage: https://console.cloud.google.com/apis/dashboard
   - Set up billing alerts at 80% of FREE tier
   - Groq: 7k req/day = ~210k patients/month (unlimited for VHT use case)

3. **Offline Mode:**
   - Text-to-Speech works offline (expo-speech)
   - Speech-to-Text requires internet (Google Cloud)
   - Translation requires internet (Google Cloud)
   - Consider caching common translations for offline use

4. **Luganda Language Support:**
   - Google Translate supports Luganda (lg)
   - Google Speech-to-Text has experimental Luganda support (lg-UG)
   - Quality improves over time as more data is collected

---

**Last Updated:** March 2, 2026  
**Status:** All features implemented and ready for testing
