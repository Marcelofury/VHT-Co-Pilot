"""
Create a test referral for St.Mary's Lacor Hospital
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Hospital, User
from patients.models import Patient
from referrals.models import Referral
from datetime import datetime

print("=" * 60)
print("CREATING TEST REFERRAL")
print("=" * 60)

# Find St.Mary's Lacor Hospital
lacor = Hospital.objects.filter(name__icontains="Lacor").first()
if not lacor:
    print("\n❌ St.Mary's Lacor Hospital not found!")
    exit(1)

print(f"\n✅ Found Hospital: {lacor.name}")
print(f"   ID: {lacor.id}")
print(f"   District: {lacor.district}")

# Find a VHT member to create the referral
vht_user = User.objects.filter(role='VHT').first()
if not vht_user:
    print("\n❌ No VHT users found!")
    exit(1)

print(f"\n✅ Using VHT: {vht_user.username}")

# Find or create a test patient in Gulu
patient = Patient.objects.filter(district="Gulu").first()
if not patient:
    # Create a test patient
    patient = Patient.objects.create(
        first_name="Test",
        last_name="Patient",
        age=35,
        gender="M",
        phone_number="0771234567",
        village="Gulu Town",
        district="Gulu",
        latitude=2.7742,
        longitude=32.2992,
        created_by=vht_user
    )
    print(f"\n✅ Created test patient: {patient.full_name}")
else:
    print(f"\n✅ Using existing patient: {patient.full_name}")

# Create test referrals with different triage levels
triage_levels = [
    ("URGENT", 95, "Severe chest pain and difficulty breathing"),
    ("HIGH_RISK", 75, "High fever with persistent cough"),
    ("MODERATE", 55, "Abdominal pain and vomiting"),
]

created_referrals = []
for triage_level, score, chief_complaint in triage_levels:
    # Check if referral already exists
    existing = Referral.objects.filter(
        patient=patient,
        hospital=lacor,
        urgency_level=triage_level,
        status='PENDING'
    ).first()
    
    if existing:
        print(f"\n⚠️  {triage_level} referral already exists (ID: {existing.id})")
        created_referrals.append(existing)
    else:
        referral = Referral.objects.create(
            patient=patient,
            hospital=lacor,
            referral_code=f"REF-{datetime.now().strftime('%Y%m%d%H%M%S')}-{triage_level[:3]}",
            primary_condition=chief_complaint,
            symptoms_summary=f"Test symptoms for {triage_level.lower()} case",
            urgency_level=triage_level,
            triage_score=score,
            confidence_score=0.95 if triage_level == "URGENT" else 0.85,
            estimated_travel_time=15,
            recommended_specialty="general",
            ai_reasoning=f"Test {triage_level.lower()} referral for dashboard verification",
            guideline_citation="Test Guidelines 2024",
            status='PENDING',
            referred_by=vht_user
        )
        created_referrals.append(referral)
        print(f"\n✅ Created {triage_level} referral:")
        print(f"   Code: {referral.referral_code}")
        print(f"   Score: {referral.triage_score}")
        print(f"   Status: {referral.status}")

# Update hospital active referrals count
lacor.current_active_referrals = Referral.objects.filter(
    hospital=lacor,
    status__in=['PENDING', 'IN_TRANSIT']
).count()
lacor.save()

print("\n" + "=" * 60)
print(f"✅ SUCCESS: Created/Found {len(created_referrals)} test referrals")
print(f"   Hospital: {lacor.name}")
print(f"   Patient: {patient.full_name}")
print(f"   Active Referrals: {lacor.current_active_referrals}")
print("\n💡 Login as hospital user 'akandwanirabrian' to see these referrals!")
print("=" * 60)
