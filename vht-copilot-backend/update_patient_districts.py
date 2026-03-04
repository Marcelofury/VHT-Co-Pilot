"""
Update existing patients with district information
Looks up district from village name or uses VHT's district
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from patients.models import Patient
from core.models import Village

def update_patient_districts():
    """Update patients with district from village or VHT"""
    
    patients = Patient.objects.all()
    updated_count = 0
    vht_fallback_count = 0
    no_update_count = 0
    
    print(f"Checking {patients.count()} patients...")
    
    for patient in patients:
        if patient.district:
            print(f"✅ {patient.full_name}: Already has district {patient.district}")
            continue
        
        updated = False
        
        # Try to get district from village
        if patient.village:
            try:
                village = Village.objects.filter(name=patient.village).first()
                if village:
                    patient.district = village.district.name
                    # Also populate GPS if missing
                    if not patient.latitude:
                        patient.latitude = village.latitude
                        patient.longitude = village.longitude
                    patient.save()
                    print(f"✅ {patient.full_name}: District set to {patient.district} from village {patient.village}")
                    updated_count += 1
                    updated = True
            except Exception as e:
                print(f"⚠️  Could not lookup village {patient.village}: {e}")
        
        # Fallback: Use VHT's district
        if not updated and patient.registered_by and patient.registered_by.district:
            patient.district = patient.registered_by.district
            patient.save()
            print(f"✅ {patient.full_name}: District set to {patient.district} from VHT {patient.registered_by.username}")
            vht_fallback_count += 1
            updated = True
        
        if not updated:
            no_update_count += 1
            print(f"⚠️  {patient.full_name}: No district info available (village: {patient.village or 'None'})")
    
    print(f"\n✅ Updated {updated_count} patients from village data")
    print(f"✅ Updated {vht_fallback_count} patients from VHT district")
    print(f"⚠️  {no_update_count} patients still without district")
    print(f"📊 Total: {Patient.objects.exclude(district='').count()} patients now have district")

if __name__ == '__main__':
    update_patient_districts()
