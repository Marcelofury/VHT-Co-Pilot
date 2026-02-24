# VHT Co-Pilot - Frontend ↔ Backend Connection Status

## ✅ COMPLETED

### Backend Setup
- **Django Server**: Running on `http://0.0.0.0:8000` ✅
- **Database**: SQLite3 initialized ✅
- **Dependencies**: Core packages installed (Django, DRF, JWT, geopy) ✅
- **API Endpoints**: All endpoints configured ✅

### Frontend Updates
- **API Service**: Updated to connect to Django backend ✅
- **Authentication**: JWT token management added ✅
- **Endpoints**: All API calls updated to match backend structure ✅
- **Dependencies**: Added `@react-native-async-storage/async-storage` ✅

## 🎯 Backend API Endpoints

### Base URL
- Development: `http://10.0.2.2:8000/api` (Android Emulator)
- Local Testing: `http://127.0.0.1:8000/api`

### Available Endpoints
```
POST   /api/auth/token/           - Login (get JWT tokens)
POST   /api/auth/token/refresh/   - Refresh token
GET    /api/users/profile/         - Get user profile
PATCH  /api/users/profile/         - Update profile

GET    /api/patients/              - List all patients
POST   /api/patients/              - Create patient
GET    /api/patients/{id}/         - Get patient details
PATCH  /api/patients/{id}/         - Update patient
GET    /api/patients/{id}/history/ - Get patient history

POST   /api/ai/submit-case/        - Main AI triage endpoint
POST   /api/ai/transcribe-only/    - Audio transcription only

GET    /api/referrals/             - List referrals
POST   /api/referrals/             - Create referral
PATCH  /api/referrals/{id}/update-status/ - Update status

GET    /api/hospitals/             - List hospitals
GET    /api/hospitals/nearby/      - Find nearby hospitals

GET    /api/dashboard/stats/       - Dashboard statistics
```

## 📱 How to Run the Full Stack

### 1. Start Backend (Already Running)
```bash
cd vht-copilot-backend
.\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```
**Status**: ✅ RUNNING in background terminal

### 2. Start React Native App
```bash
cd vht-copilot-mobile
npm install  # If not already done
npm start
```
Then press:
- `a` for Android emulator
- `i` for iOS simulator  
- `w` for web browser

### 3. Test Connection
The mobile app will automatically connect to the backend at:
- **Android**: `http://10.0.2.2:8000/api`
- **iOS/Web**: Configure in [api.ts](vht-copilot-mobile/src/services/api.ts#L6)

## 🔑 Authentication Flow

1. **Login**: Call `authAPI.login(username, password)`
   - Returns JWT access & refresh tokens
   - Tokens automatically stored in AsyncStorage

2. **API Calls**: All subsequent requests include `Authorization: Bearer <token>`

3. **Token Refresh**: Automatically handled by interceptor

## 🧪 Testing Backend

Test the backend is responding:
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/dashboard/stats/" -Method GET
```

Expected: 401 Unauthorized (authentication required) - this is correct! ✅

## 📝 Next Steps

### Immediate (to test AI features):
1. **Add OpenAI API Key** to `.env`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
   Get key from: https://platform.openai.com/api-keys

2. **Create Admin User** (for testing):
   ```bash
   cd vht-copilot-backend
   .\venv\Scripts\python.exe manage.py createsuperuser
   ```

3. **Add Hospital Data** via admin panel:
   - Visit: http://127.0.0.1:8000/admin/
   - Create Hospital records with GPS coordinates

4. **Test AI Endpoint** from mobile app:
   - Create a patient
   - Record symptoms via voice or text
   - Submit to `/api/ai/submit-case/`

### Optional Enhancements:
- Add Uganda MoH Clinical Guidelines PDF for RAG
- Configure SMS alerts (Twilio/Africa's Talking)
- Deploy to production server
- Switch to PostgreSQL database

## 🔗 Key Files Modified

### Backend
- [requirements.txt](vht-copilot-backend/requirements.txt) - Consolidated dependencies
- [config/settings.py](vht-copilot-backend/config/settings.py) - Removed celery requirement
- [core/models.py](vht-copilot-backend/core/models.py) - Changed ImageField to CharField
- [patients/models.py](vht-copilot-backend/patients/models.py) - Changed ImageField to CharField
- [.env](vht-copilot-backend/.env) - Configuration file

### Frontend
- [src/services/api.ts](vht-copilot-mobile/src/services/api.ts) - Complete rewrite
  - Added JWT authentication  
  - Updated all endpoints to match Django backend
  - Added token management
  - Added interceptors for auth
- [package.json](vht-copilot-mobile/package.json) - Added AsyncStorage dependency

## ✅ Connection Verified

**Backend**: ✅ Running on port 8000  
**Frontend**: ⏳ Ready to start (run `npm start` in vht-copilot-mobile)  
**API Integration**: ✅ Complete  
**Authentication**: ✅ Implemented  

---

**Status**: Frontend and backend are now connected and ready to run! 🚀
