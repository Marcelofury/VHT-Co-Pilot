"""
Fix Hospital Users - Link hospital_code to Hospital objects
Run this once to fix existing hospital users who registered before the fix
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Hospital

def fix_hospital_users():
    """Link hospital users to their Hospital objects"""
    
    # Find all users with HOSPITAL role who have hospital_code but no hospital link
    hospital_users = User.objects.filter(
        role='HOSPITAL',
        hospital_code__isnull=False
    ).exclude(hospital_code='')
    
    print(f"Found {hospital_users.count()} hospital users to check")
    
    fixed_count = 0
    for user in hospital_users:
        if user.hospital:
            print(f"✅ {user.username} already linked to {user.hospital.name}")
            continue
        
        # Try to find hospital by ID
        try:
            hospital = Hospital.objects.filter(id=user.hospital_code).first()
            if hospital:
                user.hospital = hospital
                user.save()
                print(f"✅ Fixed {user.username} -> linked to {hospital.name} (ID: {hospital.id})")
                fixed_count += 1
            else:
                print(f"⚠️  {user.username}: Hospital ID {user.hospital_code} not found in database")
                # List available hospitals
                nearby_hospitals = Hospital.objects.filter(
                    district=user.district
                )[:3]
                if nearby_hospitals:
                    print(f"   Available hospitals in {user.district}:")
                    for h in nearby_hospitals:
                        print(f"      - ID {h.id}: {h.name}")
        except Exception as e:
            print(f"❌ Error fixing {user.username}: {e}")
    
    print(f"\n✅ Fixed {fixed_count} hospital users")
    print(f"⚠️  {hospital_users.count() - fixed_count} users need manual fixing")

if __name__ == '__main__':
    fix_hospital_users()
