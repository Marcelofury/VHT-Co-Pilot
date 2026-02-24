# 🚀 VHT Co-Pilot API Quick Reference

## Base URL
```
http://127.0.0.1:8000/api/
```

---

## 🔐 Authentication

### Get Token
```bash
POST /api/auth/token/
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refresh Token
```bash
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "your-refresh-token"
}
```

**Use Token**:
```
Authorization: Bearer your-access-token
```

---

## 🤖 AI Engine (Main Feature)

### Submit Case for AI Triage ⭐
```bash
POST /api/ai/submit-case/
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

# With audio file
- patient_id: 1
- audio_file: [file]
- language: "lg"  # en, lg, sw

# Or with text transcription
- patient_id: 1
- transcription: "Patient has fever and headache"
- language: "en"

Response:
{
  "success": true,
  "submission_id": 123,
  "result": {
    "transcription": "Patient reports...",
    "language_detected": "lg",
    "translation_confidence": 0.87,
    "symptoms_raw": ["omusujja", "omutwe"],
    "symptoms_normalized": ["fever", "headache"],
    "triage_score": 8,
    "confidence_score": 0.85,
    "condition_detected": "Suspected severe malaria",
    "emergency": true,
    "recommended_specialty": "emergency",
    "first_aid_steps": "Keep patient hydrated...",
    "reasoning_summary": "Patient presents with...",
    "guideline_page": "Page 45",
    "validation": {
      "validated": true,
      "risk_flag": "none"
    },
    "referral": {
      "referral_code": "REF-ABC123",
      "hospital_name": "Mulago Hospital",
      "hospital_contact": "+256414554000",
      "estimated_travel_time": 25,
      "capacity_status": "AVAILABLE"
    },
    "alert_sent": true,
    "processing_time_seconds": 4.5
  }
}
```

### Transcribe Audio Only
```bash
POST /api/ai/transcribe/
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

- audio_file: [file]
- language: "lg"

Response:
{
  "transcription": "Omulwadde alina omusujja...",
  "language_detected": "lg",
  "confidence": 0.9,
  "duration": 15.3
}
```

### Check AI Health
```bash
GET /api/ai/health/
Authorization: Bearer YOUR_TOKEN

Response:
{
  "status": "healthy",
  "rag_initialized": true,
  "openai_configured": true
}
```

---

## 👥 Patients

### List Patients
```bash
GET /api/patients/
GET /api/patients/?triage_level=URGENT
GET /api/patients/?search=John
```

### Create Patient
```bash
POST /api/patients/
Content-Type: application/json

{
  "vht_code": "VHT-001",
  "first_name": "John",
  "last_name": "Doe",
  "age": "42",
  "gender": "MALE",
  "village": "Kampala"
}
```

### Get Patient Details
```bash
GET /api/patients/{id}/
```

### Update Triage
```bash
POST /api/patients/{id}/update_triage/
Content-Type: application/json

{
  "triage_level": "URGENT",
  "triage_score": 9,
  "confidence_score": 0.88
}
```

### Add Symptom
```bash
POST /api/patients/{id}/add_symptom/
Content-Type: application/json

{
  "name_english": "Fever",
  "name_luganda": "Omusujja",
  "severity": 8,
  "detected_by_ai": true,
  "confidence_score": 0.92
}
```

---

## 🏥 Hospitals

### List Hospitals
```bash
GET /api/hospitals/
GET /api/hospitals/?specialty=emergency
GET /api/hospitals/?district=Kampala
GET /api/hospitals/?available_only=true
```

### Create Hospital
```bash
POST /api/hospitals/
Content-Type: application/json

{
  "name": "Mulago Hospital",
  "facility_type": "HOSPITAL",
  "district": "Kampala",
  "latitude": 0.3376,
  "longitude": 32.5825,
  "phone_number": "+256414554000",
  "specialties": "emergency,pediatrics,surgery",
  "emergency_capacity_status": "AVAILABLE"
}
```

---

## 🚨 Referrals

### List Referrals
```bash
GET /api/referrals/
GET /api/referrals/?status=PENDING
GET /api/referrals/?urgency=URGENT
GET /api/referrals/?active_only=true
```

### Create Manual Referral
```bash
POST /api/referrals/
Content-Type: application/json

{
  "patient": 1,
  "hospital": 2,
  "urgency_level": "URGENT",
  "triage_score": 9,
  "confidence_score": 0.9,
  "primary_condition": "Severe malaria",
  "symptoms_summary": "High fever, vomiting...",
  "estimated_travel_time": 30
}
```

### Confirm Referral
```bash
POST /api/referrals/{id}/confirm/
```

### Update Status
```bash
POST /api/referrals/{id}/update_status/
Content-Type: application/json

{
  "status": "IN_TRANSIT"  # PENDING, CONFIRMED, IN_TRANSIT, ARRIVED, COMPLETED
}
```

---

## 📊 Dashboard

### Get Statistics
```bash
GET /api/dashboard/stats/

Response:
{
  "total_patients": 150,
  "patients_this_week": 23,
  "total_referrals": 45,
  "active_referrals": 8,
  "emergency_referrals_today": 3,
  "available_hospitals": 12,
  "triage_distribution": [
    {"triage_level": "STABLE", "count": 80},
    {"triage_level": "MODERATE", "count": 45},
    {"triage_level": "HIGH_RISK", "count": 15},
    {"triage_level": "URGENT", "count": 10}
  ]
}
```

---

## 📝 Query Parameters

### Pagination
```
?page=1&page_size=20
```

### Filtering
```
?triage_level=URGENT
?status=PENDING
?urgency=HIGH_RISK
?specialty=emergency
?district=Kampala
```

### Search
```
?search=John
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "error": true,
  "message": "Invalid patient_id",
  "status_code": 400
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 404 Not Found
```json
{
  "error": true,
  "message": "Patient 999 not found",
  "status_code": 404
}
```

### 500 Internal Server Error
```json
{
  "error": true,
  "message": "AI processing failed: OpenAI API key not configured",
  "status_code": 500
}
```

---

## 🧪 Testing with curl

### Complete Workflow
```bash
# 1. Get token
TOKEN=$(curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  | jq -r '.access')

# 2. Create patient
PATIENT_ID=$(curl -X POST http://127.0.0.1:8000/api/patients/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vht_code":"VHT-TEST-001","first_name":"Test","last_name":"Patient","age":"35","gender":"MALE"}' \
  | jq -r '.id')

# 3. Submit case
curl -X POST http://127.0.0.1:8000/api/ai/submit-case/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "patient_id=$PATIENT_ID" \
  -F "transcription=High fever, severe headache, vomiting for 3 days"

# 4. Get dashboard stats
curl http://127.0.0.1:8000/api/dashboard/stats/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📱 Mobile App Integration

The mobile app should:

1. **Get JWT token** on login
2. **Store token** securely
3. **Call `/api/ai/submit-case/`** with audio/text
4. **Display results** from `result` object
5. **Show referral** details if `emergency: true`
6. **Refresh token** when expired

### Example React Native Integration
```javascript
const submitCase = async (patientId, audioUri, language) => {
  const formData = new FormData();
  formData.append('patient_id', patientId);
  formData.append('audio_file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'symptom.m4a'
  });
  formData.append('language', language);

  const response = await fetch('http://YOUR_SERVER/api/ai/submit-case/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData
  });

  const data = await response.json();
  return data.result;
};
```

---

## 🎯 Key Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/submit-case/` | POST | **Main AI triage endpoint** ⭐ |
| `/api/patients/` | GET/POST | Patient management |
| `/api/referrals/` | GET/POST | Referral management |
| `/api/hospitals/` | GET | Hospital directory |
| `/api/dashboard/stats/` | GET | Analytics |

Start with `/api/ai/submit-case/` - it's the heart of the system! 🚀
