"""
Test hospital referrals API endpoint
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User
from referrals.models import Referral
import json

print("=" * 60)
print("TESTING HOSPITAL REFERRALS API")
print("=" * 60)

# Find hospital user
hospital_user = User.objects.filter(username='akandwanirabrian').first()
if not hospital_user:
    print("\n❌ Hospital user 'akandwanirabrian' not found!")
    exit(1)

print(f"\n✅ Found Hospital User: {hospital_user.username}")
print(f"   Role: {hospital_user.role}")
print(f"   Hospital: {hospital_user.hospital.name if hospital_user.hospital else 'None'}")

if not hospital_user.hospital:
    print("\n❌ User is not linked to a hospital!")
    exit(1)

# Get referrals for this hospital
referrals = Referral.objects.filter(hospital=hospital_user.hospital).select_related('patient', 'referred_by', 'hospital')

print(f"\n📋 Referrals for {hospital_user.hospital.name}: {referrals.count()}")

for ref in referrals:
    print(f"\n  Referral #{ref.id}:")
    print(f"    Code: {ref.referral_code}")
    print(f"    Patient: {ref.patient.full_name}")
    print(f"    VHT: {ref.referred_by.username if ref.referred_by else 'None'}")
    print(f"    Triage Level: {ref.urgency_level}")
    print(f"    Score: {ref.triage_score}")
    print(f"    Status: {ref.status}")
    print(f"    Created: {ref.created_at}")

# Test serializer output
from referrals.serializers import ReferralListSerializer

print("\n" + "=" * 60)
print("SERIALIZER OUTPUT (as API will return):")
print("=" * 60)

serializer = ReferralListSerializer(referrals, many=True)
print(json.dumps(serializer.data, indent=2, default=str))

print("\n" + "=" * 60)
print("✅ TEST COMPLETE")
print("=" * 60)
