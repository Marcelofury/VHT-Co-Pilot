"""
Check which hospital is nearest to Gulu Town village
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Hospital
from geopy.distance import geodesic

# Gulu Town coordinates (from uganda_villages.py)
GULU_TOWN = (2.7742, 32.2992)

print("=" * 60)
print("HOSPITALS NEAR GULU TOWN VILLAGE")
print("=" * 60)
print(f"\nGulu Town GPS: {GULU_TOWN[0]}°N, {GULU_TOWN[1]}°E")
print("\n" + "=" * 60)

# Find all hospitals in Gulu district
gulu_hospitals = Hospital.objects.filter(
    district='Gulu',
    is_operational=True
)

print(f"\n✅ Found {gulu_hospitals.count()} operational hospitals in Gulu district\n")

if gulu_hospitals.count() == 0:
    print("⚠️  No hospitals found in Gulu district!")
    print("\nChecking uganda_locations.py data:")
    from core.uganda_locations import UGANDA_HOSPITALS
    gulu_data = [h for h in UGANDA_HOSPITALS if h['district'] == 'Gulu']
    for h in gulu_data:
        print(f"\n📍 {h['name']}")
        print(f"   Type: {h['facility_type']}")
        print(f"   GPS: {h['latitude']}, {h['longitude']}")
        distance = geodesic(GULU_TOWN, (h['latitude'], h['longitude'])).kilometers
        print(f"   Distance from Gulu Town: {distance:.2f} km")
else:
    distances = []
    for hospital in gulu_hospitals:
        if hospital.latitude and hospital.longitude:
            distance = geodesic(
                GULU_TOWN, 
                (hospital.latitude, hospital.longitude)
            ).kilometers
            distances.append((hospital, distance))
        else:
            print(f"⚠️  {hospital.name}: No GPS coordinates")
    
    # Sort by distance
    distances.sort(key=lambda x: x[1])
    
    print("\n📊 HOSPITALS RANKED BY DISTANCE:")
    print("-" * 60)
    for i, (hospital, distance) in enumerate(distances, 1):
        symbol = "🏆" if i == 1 else f"{i}."
        print(f"\n{symbol} {hospital.name}")
        print(f"   Type: {hospital.facility_type}")
        print(f"   GPS: {hospital.latitude}°N, {hospital.longitude}°E")
        print(f"   Distance: {distance:.2f} km")
        print(f"   Capacity: {hospital.current_active_referrals}/{hospital.max_capacity}")
        print(f"   Status: {hospital.emergency_capacity_status}")
    
    if distances:
        print("\n" + "=" * 60)
        print(f"🎯 NEAREST HOSPITAL: {distances[0][0].name}")
        print(f"   Distance: {distances[0][1]:.2f} km from Gulu Town")
        print("=" * 60)
