# VHT Co-Pilot: AI-Powered Healthcare Assistant System

## Problem Statement

### The Challenge: Healthcare Access in Rural Uganda

Village Health Teams (VHTs) serve as the critical first point of contact for healthcare in rural Ugandan communities. However, they face significant challenges:

1. **Limited Medical Training**: VHTs are community volunteers with basic health training, not medical professionals. They must make critical decisions about patient triage and referrals without extensive medical knowledge.

2. **Language Barriers**: Patients speak local languages (Luganda, Runyankole, etc.), while medical documentation and hospital communication require English or standardized terminology.

3. **Manual Documentation**: Traditional paper-based systems slow down patient intake, making it difficult to track patient histories and referral outcomes.

4. **Hospital Selection Challenges**: Without real-time hospital data, VHTs struggle to refer patients to the nearest appropriate facility with available capacity.

5. **Lack of Decision Support**: VHTs must rely on memory and basic guidelines to assess symptom severity, often leading to delayed referrals for critical cases or unnecessary referrals for minor issues.

6. **Communication Gaps**: Once a patient is referred, VHTs have no visibility into whether the patient arrived at the hospital, was admitted, or received treatment.

### The Impact

These challenges result in:
- Delayed care for critical patients
- Overburdened hospitals receiving non-urgent cases
- Poor patient tracking and health outcome data
- VHT burnout from difficult decision-making
- Inefficient use of limited healthcare resources

---

## Solution: VHT Co-Pilot System

### Overview

VHT Co-Pilot is an **AI-powered mobile and web platform** that transforms VHT workflows with intelligent automation, multilingual support, and real-time decision support.

### How It Works

#### 1. **Voice-First Patient Intake**
- VHTs record patient symptoms in **local languages** (Luganda, Runyankole, Lusoga)
- **Automatic transcription** using free speech recognition (Google Web Speech API) with Whisper fallback
- **AI-powered translation** to English using GROQ AI models
- **Automatic symptom extraction** from natural language descriptions

**Technology Stack:**
- Frontend: React Native (Expo) for cross-platform mobile support
- Audio Processing: FFmpeg for format conversion
- Speech Recognition: Google Web Speech API (free, no authentication) → OpenAI Whisper (fallback)
- Translation: GROQ AI models (fast, cost-effective)

#### 2. **Intelligent Triage System**
- **AI Agent analyzes** extracted symptoms against clinical guidelines
- Assigns **triage scores** (1-10 scale) based on urgency
- Provides **clinical reasoning** and **guideline citations**
- Flags high-risk cases requiring immediate attention

#### 3. **Smart Hospital Matching**
- **Location-aware**: Finds hospitals in the patient's district
- **Capacity-aware**: Prioritizes hospitals with available beds
- **Distance optimization**: Selects nearest appropriate facility
- Provides hospital contact information for coordination

#### 4. **Real-Time Referral Tracking**
- VHTs create digital referrals with full patient information
- **Notification system** alerts VHTs when:
  - Hospital accepts/rejects referral
  - Hospital updates referral status
  - Patient arrives at hospital
- **Referral history** enables follow-up and outcome tracking

#### 5. **AI Monitoring Dashboard**
- VHTs can **review and override** AI decisions
- **Flag incorrect recommendations** for AI training
- Adjust triage scores with clinical reasoning
- Change recommended hospital if needed
- All overrides tracked for continuous AI improvement

#### 6. **Profile Management & Persistence**
- **Photo upload system** with server-side storage
- Profile pictures persist across devices and sessions
- Secure multipart upload with validation (max 5MB, image formats only)
- Converts local file URIs to permanent server URLs

---

## AI Agents in the System

### 1. **Symptom Extraction Agent** (GROQ AI)

**Purpose**: Convert natural language patient descriptions into structured symptom data.

**How It Works:**
```
Input: "Omwana alina omusujja era akuusa"
       (Translation: "The child has fever and is vomiting")

Processing:
1. Transcribe audio → text (local language)
2. Translate to English
3. AI extracts symptoms: ["fever", "vomiting"]
4. Normalizes to standard medical terminology

Output: ["fever", "vomiting", "pediatric_case"]
```

**Technology**: GROQ AI with Llama models for fast, accurate extraction

**Replaces**: Manual keyword matching that missed complex descriptions

---

### 2. **Clinical Triage Agent** (GROQ AI)

**Purpose**: Assess symptom severity and determine appropriate urgency level.

**How It Works:**
```
Input: 
- Symptoms: ["severe_headache", "stiff_neck", "fever", "photophobia"]
- Patient Age: 25
- Gender: Female
- Duration: 2 days

AI Analysis:
1. Matches symptoms against clinical guidelines
2. Identifies potential conditions (e.g., meningitis)
3. Calculates risk score based on danger signs
4. Provides clinical reasoning

Output:
- Triage Score: 9/10 (Critical)
- Reasoning: "Combination of severe headache, stiff neck, and fever 
              suggests possible meningitis - a medical emergency"
- Guideline: "Uganda Clinical Guidelines 2016, Section 4.2: Meningitis"
- Recommendation: "Immediate hospital referral required"
```

**Technology**: GROQ AI with medical knowledge base and Uganda clinical guidelines

**Benefits**:
- Reduces delayed referrals for critical cases
- Prevents over-referral of minor cases
- Provides VHTs with clinical confidence

---

### 3. **Hospital Matching Agent** (Rule-Based + Database)

**Purpose**: Find the optimal hospital for patient referral based on location and capacity.

**How It Works:**
```
Input:
- Patient District: "Kampala"
- Triage Score: 8 (High urgency)
- Required Services: Emergency care

Processing:
1. Query hospitals in patient's district
2. Filter by available capacity (bed count > 0)
3. Calculate distance from patient's village
4. Sort by: Urgency → Capacity → Distance

Output:
- Recommended Hospital: "Mulago National Referral Hospital"
- Distance: 12 km
- Available Beds: 15
- Contact: +256-XXX-XXXXXX
- Alternative Options: [Hospital 2, Hospital 3]
```

**Technology**: Django ORM queries + geographic district hierarchy

**Benefits**:
- Reduces ambulance routing time
- Balances hospital load
- Ensures patients reach facilities with capacity

---

### 4. **Translation Agent** (GROQ AI)

**Purpose**: Bidirectional translation between local languages and English for medical communication.

**How It Works:**
```
Luganda → English:
"Omwana alina omusujja gwa wiiki bbiri" 
→ "The child has had fever for two weeks"

English → Luganda (for educational materials):
"Take the medication twice daily"
→ "Mira eddagala emirundi ebiri olunaku"
```

**Technology**: GROQ-powered translation with medical terminology awareness

**Supported Languages**:
- Luganda (Central Uganda)
- Runyankole (Western Uganda)
- Lusoga (Eastern Uganda)
- English (Medical documentation)

---

### 5. **Override Tracking Agent** (Data Collection)

**Purpose**: Learn from VHT corrections to improve AI accuracy over time.

**How It Works:**
```
When VHT Overrides AI:
1. Record original AI decision
2. Capture VHT's correction
3. Store reasoning for override
4. Flag case for AI retraining

Example Override:
- AI Triage Score: 6/10
- VHT Override: 8/10
- Reason: "Patient has history of heart disease not captured in intake"
- Action: Update AI model to consider medical history more heavily
```

**Technology**: Django models for override tracking + future ML retraining pipeline

**Benefits**:
- Continuous AI improvement from field experience
- Identifies gaps in symptom extraction
- Builds trust through VHT control

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VHT Mobile App                          │
│                  (React Native/Expo)                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Voice Intake  │  │AI Monitoring │  │Patient List  │    │
│  │Screen        │  │Dashboard     │  │Screen        │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JWT Auth)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Django REST Framework Backend                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Core Module   │  │AI Engine     │  │Referrals     │    │
│  │- Users       │  │- Symptom Ext │  │- Tracking    │    │
│  │- Auth        │  │- Triage      │  │- Hospitals   │    │
│  │- Photo Upload│  │- Translation │  │- Notifications    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   GROQ AI    │  │  PostgreSQL  │  │  Media       │
│   API        │  │  Database    │  │  Storage     │
│              │  │              │  │  (Photos)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Key Features

### For VHTs:
✅ **Voice-first interface** - No typing required, speak in local language  
✅ **AI decision support** - Confidence in triage decisions  
✅ **Real-time referral tracking** - Know patient outcomes  
✅ **Offline-ready** - Works in areas with poor connectivity  
✅ **Override control** - VHT has final say on all decisions  

### For Hospitals:
✅ **Digital referral intake** - No more lost paper forms  
✅ **Patient pre-screening** - Know urgency before arrival  
✅ **Capacity management** - Receive appropriate case load  
✅ **Communication tools** - Update VHTs on patient status  

### For Health System:
✅ **Data collection** - Track disease patterns and outcomes  
✅ **Performance metrics** - Monitor VHT effectiveness  
✅ **Resource optimization** - Balance hospital loads  
✅ **Continuous improvement** - AI learns from field usage  

---

## Technical Highlights

### Why GROQ AI?
- **Speed**: 10x faster than traditional LLMs for real-time responses
- **Cost**: Significantly cheaper than OpenAI GPT models
- **Accuracy**: Medical-grade symptom extraction and triage
- **Offline**: Can cache common cases for offline AI decisions

### Why Free Speech Recognition?
- **No API costs**: Google Web Speech API is free (browser-based)
- **No authentication**: Zero setup barrier for VHTs
- **Fallback**: Whisper handles complex/noisy audio
- **Multi-language**: Supports all major Ugandan languages

### Why Django REST + React Native?
- **Cross-platform**: One codebase for Android & iOS
- **Scalability**: Django handles thousands of VHTs
- **Security**: JWT authentication, encrypted data
- **Maintainability**: Well-documented, large community

---

## Impact Metrics (Projected)

| Metric | Before VHT Co-Pilot | After VHT Co-Pilot |
|--------|--------------------|--------------------|
| Patient intake time | 15-20 minutes | 5-8 minutes |
| Triage accuracy | 65-70% | 85-90% |
| Critical case delays | 30% miss urgency | <5% miss urgency |
| Referral tracking | Paper-based, lost | 100% digital |
| VHT confidence | Low (45% confident) | High (85% confident) |
| Hospital coordination | Phone calls, delays | Real-time notifications |

---

## Future Enhancements

1. **Predictive Analytics**: Identify disease outbreaks from symptom patterns
2. **Telemedicine**: Connect VHTs with doctors for complex cases
3. **Medication Inventory**: Track drug supplies at village level
4. **Health Education**: AI-generated patient education in local languages
5. **Integration**: Connect with national health information systems

---

## Getting Started

### Prerequisites
- Node.js 16+ (for mobile app)
- Python 3.10+ (for backend)
- PostgreSQL 13+ (for database)
- FFmpeg (for audio processing)

### Quick Start

```bash
# Backend setup
cd vht-copilot-backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Mobile app setup
cd vht-copilot-mobile
npm install
npx expo start
```

For detailed setup instructions, see [SYSTEM_CONFIGURATION.md](SYSTEM_CONFIGURATION.md)

---

## License

This project is built for public health impact in Uganda. Contact the development team for collaboration opportunities.

---

## Contact & Support

For technical support or collaboration:
- GitHub: [VHT-Co-Pilot Repository](https://github.com/Marcelofury/VHT-Co-Pilot)
- Documentation: See `/vht-copilot-backend/API_REFERENCE.md`

---

**Built with ❤️ for Village Health Teams in Uganda**
