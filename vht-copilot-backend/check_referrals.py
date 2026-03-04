"""
Check referrals for St.Mary's Lacor Hospital
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Hospital
from referrals.models import Referral

print("=" * 60)
print("CHECKING REFERRALS IN DATABASE")
print("=" * 60)

# Find St.Mary's Lacor Hospital
lacor = Hospital.objects.filter(name__icontains="Lacor").first()
if lacor:
    print(f"\n✅ Found Hospital: {lacor.name}")
    print(f"   ID: {lacor.id}")
    print(f"   District: {lacor.district}")
    print(f"   Active Referrals: {lacor.current_active_referrals}")
    
    # Get referrals for this hospital
    referrals = Referral.objects.filter(referred_hospital=lacor)
    print(f"\n📋 Total Referrals to {lacor.name}: {referrals.count()}")
    
    if referrals.count() > 0:
        for ref in referrals:
            print(f"\n  - Referral ID: {ref.id}")
            print(f"    Patient: {ref.patient.full_name}")
            print(f"    Status: {ref.status}")
            print(f"    Triage: {ref.recommended_triage_level}")
            print(f"    Specialty: {ref.recommended_specialty}")
            print(f"    Created: {ref.created_at}")
    else:
        print("\n⚠️  No referrals found for this hospital")
else:
    print("\n❌ St.Mary's Lacor Hospital not found in database")
    
print("\n" + "=" * 60)
print("ALL HOSPITALS IN GULU DISTRICT:")
print("=" * 60)
gulu_hospitals = Hospital.objects.filter(district="Gulu")
for h in gulu_hospitals:
    print(f"\n{h.id}. {h.name}")
    ref_count = Referral.objects.filter(referred_hospital=h).count()
    print(f"   Referrals: {ref_count}")

print("\n" + "=" * 60)
print("ALL REFERRALS IN DATABASE:")
print("=" * 60)
all_referrals = Referral.objects.all()
print(f"Total: {all_referrals.count()}")
for ref in all_referrals:
    print(f"\n- ID {ref.id}: {ref.patient.full_name}")
    print(f"  Hospital: {ref.referred_hospital.name}")
    print(f"  Status: {ref.status}")
    print(f"  Triage: {ref.recommended_triage_level}")
