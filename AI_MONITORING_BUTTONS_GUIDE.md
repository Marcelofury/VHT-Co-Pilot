# AI Monitoring Screen - Settings & Override Guide

## Overview
The AI Monitoring Screen contains two critical control buttons for managing the VHT Co-Pilot's behavior:
- **Settings Button**: Configure AI monitoring preferences
- **Override Button**: Manually adjust AI clinical decisions

---

## Settings Button 🔧

### Purpose
The Settings button allows VHTs to configure how the AI Co-Pilot monitors, processes, and alerts them about patient cases.

### Features

#### 1. **AI Monitoring Toggle**
- **What it does**: Enables/disables continuous AI monitoring for community health signals
- **Use case**: Turn off during breaks or when manually reviewing cases
- **Default**: ON

#### 2. **Auto-Triage Toggle**
- **What it does**: Allows AI to automatically triage patients based on symptom severity
- **Use case**: Disable if you prefer manual triage for all cases
- **Default**: ON
- **Impact**: When OFF, AI provides recommendations but doesn't assign triage scores automatically

#### 3. **Push Notifications Toggle**
- **What it does**: Controls whether you receive push notifications for urgent cases and referral updates
- **Use case**: Disable during off-hours or when you want to check manually
- **Default**: ON

#### 4. **High Alert Threshold Info**
- **What it shows**: The AI confidence score threshold (default: 80%) that triggers urgent alerts
- **Meaning**: Cases with 80%+ AI confidence are marked as high priority
- **Example**: If AI is 85% confident a patient has severe malaria, an urgent alert is sent

### When to Use Settings
- **Daily start**: Enable AI monitoring and notifications
- **Off-duty**: Disable notifications but keep monitoring ON for handover context
- **Low-confidence period**: Review and adjust auto-triage behavior
- **Training new VHTs**: Disable auto-triage to allow manual practice

---

## Override Button ⚠️

### Purpose
The Override button gives VHTs clinical authority to manually adjust AI recommendations based on:
- Local context (e.g., hospital bed availability)
- Patient history not in the system
- Physical examination findings
- Community knowledge
- Recent disease outbreaks

### Features

#### 1. **Adjust Triage Score**
- **What it does**: Manually change the AI-assigned triage score (0-100)
- **Use case examples**:
  - AI scores patient as 65 (moderate), but you know they have chronic conditions → upgrade to 85 (urgent)
  - AI scores patient as 90 (urgent), but symptoms are mild upon examination → downgrade to 60 (moderate)
- **Impact**: Changes referral priority and hospital assignment
- **Logging**: All overrides are recorded for AI training

#### 2. **Change Referral Hospital**
- **What it does**: Manually reassign a patient to a different hospital
- **Use case examples**:
  - Recommended hospital has no beds (you called to check)
  - Alternative hospital is closer for patient's family
  - Patient prefers specific facility for cultural/language reasons
  - Road to recommended hospital is blocked
- **AI behavior**: AI initially assigns based on distance, specialization, and bed capacity
- **Your authority**: You can override based on real-time information

#### 3. **Flag Incorrect Decision**
- **What it does**: Mark an AI decision as incorrect to improve future recommendations
- **Use case examples**:
  - AI misinterpreted symptoms (e.g., "hot" meant weather, not fever)
  - AI missed cultural context in symptom description
  - AI over/under-estimated urgency
  - Hospital assignment was inappropriate
- **Impact**: Feedback is sent to AI training pipeline
- **Result**: Helps AI learn from mistakes and improve accuracy

### When to Use Override

#### ✅ SHOULD Override:
- Patient conditions change rapidly (e.g., worsening symptoms)
- You have critical context AI doesn't (e.g., prior medication reactions)
- Real-time information contradicts AI data (e.g., hospital bed status)
- Physical examination reveals issues not captured in voice intake
- Community outbreak changes triage priorities

#### ⚠️ CONSIDER Override:
- AI confidence score is borderline (e.g., 50-60%)
- Symptoms are ambiguous or patient provided incomplete information
- Cultural/language factors affect symptom interpretation

#### ❌ DON'T Override:
- Just to test the system (use training mode instead)
- Based on personal preferences without clinical justification
- To "game" the system for faster referrals
- Without documenting the reason

---

## Technical Implementation

### Data Flow

#### Settings Button:
```
User Toggles Setting → State Updated → UI Reflects Change → Settings Saved Locally
                                                            ↓
                                            (Future: Sync to backend for analytics)
```

#### Override Button:
```
User Selects Action → Modal Displays Options → User Makes Changes → Alert Confirms
                                                                     ↓
                                            Case Updated → AI Training Pipeline Notified
                                                         ↓
                                            Dashboard Reflects Override (flagged icon)
```

### Current Implementation Status

#### Settings Modal:
- ✅ AI Monitoring toggle (state-based)
- ✅ Auto-Triage toggle (state-based)
- ✅ Push Notifications toggle (state-based)
- ✅ High Alert Threshold display (informational)
- ⏳ Backend persistence (to be implemented)
- ⏳ Sync across devices (to be implemented)

#### Override Modal:
- ✅ UI for 3 override actions
- ✅ Confirmation alerts
- ⏳ Case selection functionality (requires case list integration)
- ⏳ Backend API calls to update cases
- ⏳ Override logging to AI training system

---

## User Workflow Examples

### Example 1: Change Auto-Triage During Outbreak
**Scenario**: Cholera outbreak in Zone 4, AI doesn't know about it yet.

1. Click **Settings** button
2. **Disable** Auto-Triage toggle
3. Review all cases manually, upgrading urgency for diarrhea/vomiting
4. After outbreak data is added to AI, **Re-enable** Auto-Triage

### Example 2: Override Hospital Assignment
**Scenario**: AI recommends Hospital A (10km), but Hospital B (8km) just opened a new ward.

1. Click **Override** button
2. Select **Change Referral Hospital**
3. Choose the specific referral case
4. Select Hospital B from available hospitals
5. Add reason: "New ward opened, shorter distance"
6. Confirm → Patient reassigned

### Example 3: Correct AI Symptom Interpretation
**Scenario**: Patient said "burning everywhere" (sunburn), AI tagged as "fever + widespread pain".

1. Click **Override** button
2. Select **Flag Incorrect Decision**
3. Choose the case
4. Mark symptoms as "Misinterpreted"
5. Add note: "Patient meant sunburn, not fever"
6. Submit → AI learns to ask clarifying questions about "burning"

---

## Future Enhancements

### Settings:
- **Confidence threshold slider**: Adjust the 80% threshold up/down
- **Auto-referral rules**: Configure when AI should auto-refer without VHT approval
- **Notification scheduling**: Set quiet hours for non-urgent alerts
- **Language preferences**: Set patient intake language preferences

### Override:
- **Bulk override**: Adjust multiple cases at once during outbreaks
- **Override templates**: Quick reasons for common overrides
- **Peer review**: Request second opinion from another VHT before override
- **AI explanation**: Show why AI made a decision (transparent AI)

---

## Best Practices

### For VHTs:
1. **Check settings daily** at start of shift
2. **Document override reasons** clearly for audit trail
3. **Trust AI for routine cases**, override for complex/ambiguous ones
4. **Review override history** weekly to spot patterns
5. **Disable auto-triage during known system issues** (e.g., bad speech recognition)

### For Health System Administrators:
1. **Monitor override frequency** per VHT (high rates = AI issues or training needs)
2. **Review flagged decisions** to identify AI gaps
3. **Share learning** from overrides across VHT network
4. **Audit settings** to ensure consistency across team
5. **Provide feedback loops** so VHTs see how AI improves from their overrides

---

## Troubleshooting

### Settings Not Saving
- **Current**: Settings are local to session only
- **Workaround**: Re-apply settings each session until backend persistence is added

### Override Not Affecting Case
- **Current**: Override actions trigger alerts but don't yet modify backend data
- **Workaround**: Override modal confirms intent; manually update case in Patient List

### Can't Find Case to Override
- **Current**: Case selection not yet integrated
- **Next Step**: Will integrate with "My Active Referrals" list for quick selection

---

## Technical Notes for Developers

### State Management:
```typescript
const [aiMonitoringEnabled, setAiMonitoringEnabled] = useState(true);
const [autoTriageEnabled, setAutoTriageEnabled] = useState(true);
const [notificationsEnabled, setNotificationsEnabled] = useState(true);
const [highAlertThreshold, setHighAlertThreshold] = useState(80);
```

### Modal Triggers:
```typescript
// Settings
onPress={() => setShowSettingsModal(true)}

// Override
onPress={() => setShowOverrideModal(true)}
```

### Backend Integration TODO:
1. **POST /api/vht/settings** - Save VHT preferences
2. **PATCH /api/cases/{id}/triage** - Override triage score
3. **PATCH /api/referrals/{id}/hospital** - Change referral hospital
4. **POST /api/ai/feedback** - Log incorrect decision
5. **GET /api/vht/settings** - Load saved preferences

---

## Summary

### Settings Button = "How AI works for me"
- Controls AI behavior
- Configures alerts and automation
- Personal preferences

### Override Button = "I know better than AI in this case"
- Clinical judgment authority
- Context-based decisions
- AI training feedback

**Key Principle**: AI provides intelligent recommendations, VHTs have final authority based on clinical expertise and local context. Settings configure the AI, Override exercises clinical judgment.
