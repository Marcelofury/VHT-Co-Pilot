# VHT Co-Pilot Backend 

## 🏥 Production-Grade AI Triage System for Village Health Teams

A comprehensive Django backend with autonomous AI agent for medical triage, emergency referrals, and clinical decision support, grounded in Uganda Ministry of Health guidelines.

---

## 🎯 System Architecture

### **Core Components**

1. **RAG Engine** - Retrieval-Augmented Generation with ChromaDB
2. **Whisper Service** - Multilingual audio transcription
3. **Symptom Normalizer** - Standardizes medical terminology
4. **Triage Engine** - GPT-4o-mini deterministic medical decisions
5. **AI Validator** - Self-validation layer for safety
6. **Autonomous Tools** - Referral assignment, alerts, logging
7. **Agent Runner** - Orchestrates the complete AI pipeline

### **Tech Stack**

- **Framework**: Django 5.0 + Django REST Framework
- **Database**: SQLite3 (development) / PostgreSQL (production)
- **AI/ML**: OpenAI GPT-4o-mini, Whisper API, LangChain, ChromaDB
- **Async**: Celery + Redis (optional)
- **Authentication**: JWT (SimpleJWT)

---

## 🚀 Quick Start

### **Prerequisites**

- Python 3.11+
- pip
- OpenAI API Key (required for full functionality)

### **Installation**

```bash
# 1. Navigate to backend directory
cd vht-copilot-backend

# 2. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment template
copy .env.example .env

# 5. Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here

# 6. Run migrations
python manage.py makemigrations
python manage.py migrate

# 7. Create superuser
python manage.py createsuperuser

# 8. Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json

# 9. Run development server
python manage.py runserver
```

Server will start at: `http://127.0.0.1:8000`

---

## 🔑 Required Integrations

### **1. OpenAI API Key** ⚠️ REQUIRED

```bash
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-key-here
```

**Estimated Cost**: $0.50-2.00 per 100 cases

### **2. Uganda MoH Clinical Guidelines PDF** 📄 REQUIRED FOR RAG

Place PDF in: `vht-copilot-backend/guidelines/`

Initialize RAG:
```bash
python manage.py ingest_guidelines guidelines/uganda_moh_guidelines.pdf
```

**Fallback**: System works without RAG but uses general medical reasoning

### **3. SMS Provider (Optional for Alerts)**

**Africa's Talking** (Recommended for Uganda):
```bash
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_API_KEY=your-api-key
```

**Twilio** (Global):
```bash
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📡 API Endpoints

### **Authentication**
```
POST /api/auth/token/          # Get JWT token
POST /api/auth/token/refresh/  # Refresh token
```

### **AI Engine** (Main Entry Point)
```
POST /api/ai/submit-case/       # Submit case for AI triage
POST /api/ai/transcribe/        # Transcribe audio only
GET  /api/ai/submissions/       # View past submissions
GET  /api/ai/health/            # Check AI engine status
```

### **Patients**
```
GET    /api/patients/           # List patients
POST   /api/patients/           # Create patient
GET    /api/patients/{id}/      # Get patient details
PATCH  /api/patients/{id}/      # Update patient
POST   /api/patients/{id}/add_symptom/  # Add symptom
POST   /api/patients/{id}/update_triage/ # Update triage
GET    /api/patients/{id}/history/       # Get history
```

### **Referrals**
```
GET    /api/referrals/          # List referrals
POST   /api/referrals/          # Create referral
GET    /api/referrals/{id}/     # Get referral details
POST   /api/referrals/{id}/confirm/  # Confirm referral
POST   /api/referrals/{id}/update_status/  # Update status
```

### **Hospitals**
```
GET    /api/hospitals/          # List hospitals
GET    /api/hospitals/?specialty=pediatrics  # Filter by specialty
GET    /api/hospitals/?available_only=true   # Available only
```

### **Dashboard**
```
GET    /api/dashboard/stats/    # Get dashboard statistics
```

---

## 🧪 Testing the AI Engine

### **Test Case Submission**

```bash
# Using curl
curl -X POST http://127.0.0.1:8000/api/ai/submit-case/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "patient_id=1" \
  -F "transcription=Patient has high fever, severe headache, and vomiting for 3 days" \
  -F "language=en"

# Or with audio file
curl -X POST http://127.0.0.1:8000/api/ai/submit-case/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "patient_id=1" \
  -F "audio_file=@symptom_recording.wav" \
  -F "language=lg"
```

### **Expected Response**

```json
{
  "success": true,
  "submission_id": 1,
  "result": {
    "transcription": "Patient has high fever...",
    "language_detected": "en",
    "triage_score": 8,
    "confidence_score": 0.87,
    "condition_detected": "Suspected severe malaria",
    "emergency": true,
    "recommended_specialty": "emergency",
    "first_aid_steps": "Keep patient hydrated...",
    "reasoning_summary": "Patient presents with...",
    "guideline_page": "Page 45",
    "referral": {
      "referral_code": "REF-ABC123",
      "hospital_name": "Mulago Hospital",
      "estimated_travel_time": 25
    },
    "alert_sent": true,
    "processing_time_seconds": 3.45
  }
}
```

---

## 🔒 Security Features

- ✅ JWT authentication
- ✅ CORS protection
- ✅ Role-based access control
- ✅ Audit logging for all AI decisions
- ✅ Validation layer prevents hallucination
- ✅ Confidence threshold for emergencies

---

## 📊 Admin Interface

Access at: `http://127.0.0.1:8000/admin/`

**Features**:
- Manage users, patients, hospitals
- View referrals and emergency alerts
- Monitor AI case submissions
- Access audit logs

---

## 🐛 Troubleshooting

### **Issue: OpenAI API errors**
```
Error: OpenAI API key not configured
```
**Solution**: Add `OPENAI_API_KEY` to `.env` file

### **Issue: ChromaDB initialization failed**
```
Failed to initialize RAG Engine
```
**Solution**: Ensure `chromadb` is installed and `CHROMA_PERSIST_DIRECTORY` is writable

### **Issue: Audio transcription not working**
```
Whisper transcription failed
```
**Solution**:
1. Check audio file format (must be .wav, .mp3, .m4a)
2. Verify file size < 10MB
3. Ensure OpenAI API key has Whisper access

### **Issue: No hospitals found for referral**
```
No available hospitals found
```
**Solution**: Add hospitals via admin interface with GPS coordinates

---

## 📁 Project Structure

```
vht-copilot-backend/
├── config/              # Django settings
├── core/                # User, Hospital, AuditLog models
├── patients/            # Patient management
├── referrals/           # Referral system
├── ai_engine/           # AI/ML components
│   ├── rag_engine.py              # RAG with ChromaDB
│   ├── whisper_service.py         # Audio transcription
│   ├── symptom_normalizer.py     # Symptom mapping
│   ├── triage_engine.py           # GPT-4o-mini triage
│   ├── validator.py               # Self-validation
│   ├── tools.py                   # Autonomous actions
│   └── agent_runner.py            # Main orchestrator
├── vht/                 # VHT member management
├── manage.py
├── requirements.txt
└── .env
```

---

## 🎓 Next Steps

1. **Add OpenAI API Key** to `.env`
2. **Ingest Clinical Guidelines** PDF
3. **Create Sample Hospitals** via admin
4. **Configure SMS Provider** (optional)
5. **Test Case Submission** with sample patient
6. **Review Audit Logs** for AI decisions

---

## 📞 Support

For issues or questions:
- Check logs: `logs/vht_copilot.log`
- Review audit logs in admin interface
- Verify AI engine health: `/api/ai/health/`

---

## 📝 License

Proprietary - VHT Co-Pilot System

---

## 🙏 Acknowledgments

Built for Uganda's Village Health Teams with AI-powered clinical decision support.
