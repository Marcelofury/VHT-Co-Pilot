# VHT Co-Pilot Authentication System

## Overview
The VHT Co-Pilot application supports two distinct user types with separate dashboards and access controls:

1. **VHT Personnel** - Community health workers who assess patients and create referrals
2. **Hospital Staff** - Healthcare facility staff who receive and manage incoming referrals

## User Types & Access

### VHT Personnel
- **Role**: `VHT` in the database
- **Registration Fields**:
  - First Name, Last Name
  - VHT ID (e.g., VHT-8821)
  - Phone Number
  - Village, District
  - Username, Password
  
- **Dashboard Access**:
  - Voice Intake (patient assessment)
  - Patient List (full patient management)
  - AI Monitoring (triage and AI actions)
  - Sync (data synchronization)
  - Profile settings

- **Capabilities**:
  - Record patient symptoms via voice
  - View and manage all patients
  - Create referrals to hospitals
  - Monitor AI triage decisions
  - Sync data offline/online

### Hospital Staff
- **Role**: `HOSPITAL` in the database
- **Registration Fields**:
  - First Name, Last Name
  - Hospital ID (e.g., HOSP-001)
  - Hospital Assignment (linked to specific facility)
  - Username, Password

- **Dashboard Access**:
  - Hospital Dashboard (referral management)
  - Profile settings

- **Capabilities**:
  - View incoming referrals to their hospital only
  - See referral statistics (pending, in-transit, arrived, completed)
  - Accept or reject referrals
  - Update referral status (confirmed, arrived, completed)
  - View patient details for referred cases
  
- **Access Restrictions**:
  - Can only see referrals to their assigned hospital
  - Cannot access voice intake or patient creation
  - Cannot see patients from other hospitals

## Authentication Flow

### Registration
1. User selects their role (VHT Personnel or Hospital Staff)
2. Role-specific form fields are displayed
3. User completes registration
4. Account created with appropriate role in database

### Login
1. User enters username and password
2. Backend validates credentials (JWT authentication)
3. Token issued with user profile including role
4. Frontend checks user's role:
   - If `role === 'HOSPITAL'` → Navigate to Hospital Dashboard
   - If `role === 'VHT'` → Navigate to VHT Main Dashboard

### Session Management
- JWT tokens stored in:
  - `localStorage` for web platform
  - `AsyncStorage` for mobile (iOS/Android)
- Token automatically sent with all API requests
- Logout clears token and redirects to login screen

## Backend API Endpoints

### Hospital-Specific Endpoints

#### Get Hospital Referrals
```
GET /api/referrals/my_hospital/
Authorization: Bearer <token>
```
Returns referrals only for the authenticated hospital staff's hospital.

#### Get Hospital Statistics
```
GET /api/referrals/hospital_stats/
Authorization: Bearer <token>
```
Returns referral counts by status for the hospital:
```json
{
  "pending": 2,
  "in_transit": 1,
  "arrived": 0,
  "completed": 5,
  "total": 8
}
```

#### Update Referral Status
```
POST /api/referrals/{id}/update_status/
Authorization: Bearer <token>
Body: { "status": "ARRIVED" }
```
Hospital staff can update referral status to track patient progress.

### VHT Endpoints
VHT personnel have access to all standard endpoints:
- `/api/patients/` - Full patient CRUD
- `/api/referrals/` - Create and view all referrals
- `/api/ai/submit-case/` - AI triage
- `/api/hospitals/nearby/` - Find nearby hospitals

## Database Schema

### User Model
```python
class User(AbstractUser):
    role = CharField(choices=['VHT', 'HOSPITAL', 'ADMIN', 'VIEWER'])
    vht_id = CharField(blank=True)  # For VHT users
    hospital_id = CharField(blank=True)  # For hospital users
    hospital = ForeignKey(Hospital)  # Linked hospital for staff
    phone_number = CharField()
    village = CharField()
    district = CharField()
```

### Referral Filtering
In `referrals/views.py`, the `get_queryset()` method filters based on user role:
```python
def get_queryset(self):
    queryset = Referral.objects.all()
    
    # Hospital staff see only their hospital's referrals
    if self.request.user.role == 'HOSPITAL' and self.request.user.hospital:
        queryset = queryset.filter(hospital=self.request.user.hospital)
    
    return queryset
```

## Frontend Components

### Login Screen
- `vht-copilot-mobile/src/screens/LoginScreen.tsx`
- Single login form for both user types
- Role-based navigation after authentication

### Register Screen
- `vht-copilot-mobile/src/screens/RegisterScreen.tsx`
- Role selector (VHT Personnel / Hospital Staff)
- Conditional form fields based on role
- Role stored in formData and sent to backend

### VHT Dashboard
- `vht-copilot-mobile/src/screens/DashboardScreen.tsx`
- Full navigation tabs: Dashboard, Patients, Monitoring, Sync, Profile
- Quick actions for patient intake and referrals

### Hospital Dashboard
- `vht-copilot-mobile/src/screens/HospitalDashboardScreen.tsx`
- Simplified navigation: Hospital Dashboard, Profile
- Real-time referral cards with triage levels
- Status filters (pending, in-transit, arrived, completed)
- Accept/View buttons for each referral

### Navigation Router
- `vht-copilot-mobile/src/navigation/AppNavigator.tsx`
- Two separate tab navigators:
  - `MainTabNavigator` for VHT personnel
  - `HospitalTabNavigator` for hospital staff
- Login wrapper checks role and routes accordingly:
```typescript
const user = useAppStore.getState().currentUser;
if (user?.role === 'HOSPITAL') {
  navigation.replace("HospitalMain");
} else {
  navigation.replace("Main");
}
```

## Security Considerations

1. **Role-Based Access Control (RBAC)**
   - All endpoints check user.role before serving data
   - Hospital staff cannot access VHT-specific endpoints
   - QuerySet filtering ensures data isolation

2. **JWT Authentication**
   - Short-lived access tokens (15 min default)
   - Refresh tokens for session renewal
   - Tokens stored securely in platform-specific storage

3. **Data Isolation**
   - Hospital staff can only see referrals to their facility
   - No cross-hospital data leakage
   - VHT users see all data (for coordination)

4. **Future Enhancements**
   - Add district/region-level admin roles
   - Implement patient privacy controls
   - Add audit logging for sensitive operations
   - Two-factor authentication for hospital staff

## Testing the System

### Test as VHT Personnel
1. Register with role "VHT Personnel"
2. Enter VHT ID (e.g., VHT-8821)
3. Login and verify access to all 5 tabs
4. Create a test patient
5. Create a referral to a hospital

### Test as Hospital Staff
1. Register with role "Hospital Staff"
2. Enter Hospital ID (e.g., HOSP-001)
3. Login and verify access to Hospital Dashboard only
4. View incoming referrals (should see only your hospital's)
5. Accept a referral and update status
6. Verify statistics update correctly

## Migration Steps

To apply the database changes:
```bash
cd vht-copilot-backend
.\venv\Scripts\activate
python manage.py makemigrations
python manage.py migrate
```

## Troubleshooting

**Issue**: Hospital staff sees no referrals
- **Solution**: Ensure user.hospital is set in Django admin
- Check that referrals exist with matching hospital_id

**Issue**: Role-based routing not working
- **Solution**: Clear app storage and re-login
- Verify JWT token includes role in payload

**Issue**: 403 Forbidden on hospital endpoints
- **Solution**: Check user.role is exactly "HOSPITAL"
- Verify user.hospital foreign key is set

## Contact & Support
For authentication issues, contact the development team or check logs:
- Frontend: Browser console / React Native debugger
- Backend: `vht-copilot-backend/logs/` or Django shell
