"""
Geocode Uganda hospitals using Geopy/Nominatim (OpenStreetMap).
Includes district names in queries for better accuracy.

Usage:
    python geocode_hospitals.py

Features:
- Rate limiting (1 request per second)
- District-based queries for accuracy
- GPS validation (Uganda bounds)
- Progress tracking
- Failed geocoding report
"""

import csv
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

# Uganda GPS bounds (approximate)
UGANDA_BOUNDS = {
    'min_lat': -2.0,
    'max_lat': 5.0,
    'min_lon': 29.0,
    'max_lon': 36.0
}

def is_in_uganda(lat, lon):
    """Check if coordinates are within Uganda bounds."""
    return (UGANDA_BOUNDS['min_lat'] <= lat <= UGANDA_BOUNDS['max_lat'] and
            UGANDA_BOUNDS['min_lon'] <= lon <= UGANDA_BOUNDS['max_lon'])

def clean_facility_name(name):
    """Remove prefixes like '15 Arua Municipality HSD' from facility names."""
    # Remove leading numbers and codes
    parts = name.split()
    cleaned_parts = []
    skip_next = False
    
    for i, part in enumerate(parts):
        # Skip leading numbers
        if i == 0 and part.replace('.', '').isdigit():
            continue
        # Skip HSD (Health Sub-District)
        if part.upper() == 'HSD':
            continue
        # Skip abbreviations like 'RR' (Regional Referral)
        if part.upper() in ['RR', 'HC', 'HCII', 'HCIII', 'HCIV']:
            continue
        cleaned_parts.append(part)
    
    return ' '.join(cleaned_parts)

def geocode_hospital(geolocator, facility_name, district, retry=3):
    """
    Geocode a hospital using district-based query.
    
    Args:
        geolocator: Nominatim geolocator instance
        facility_name: Name of the facility
        district: District name
        retry: Number of retry attempts
    
    Returns:
        tuple: (latitude, longitude, match_quality) or (None, None, error_message)
    """
    # Clean facility name
    clean_name = clean_facility_name(facility_name)
    
    # Try multiple query variations (best to worst)
    queries = [
        f"{clean_name}, {district} District, Uganda",
        f"{clean_name}, {district}, Uganda",
        f"{facility_name}, {district} District, Uganda",
        f"{facility_name}, {district}, Uganda",
        f"{clean_name} Hospital, {district}, Uganda",
    ]
    
    for attempt in range(retry):
        for i, query in enumerate(queries):
            try:
                print(f"  Trying: {query}")
                location = geolocator.geocode(query, timeout=10)
                
                if location:
                    lat, lon = location.latitude, location.longitude
                    
                    # Validate coordinates are in Uganda
                    if is_in_uganda(lat, lon):
                        match_quality = f"Match {i+1}/5: {location.address}"
                        print(f"  ✓ Found: {lat:.6f}, {lon:.6f}")
                        return lat, lon, match_quality
                    else:
                        print(f"  ✗ Outside Uganda bounds: {lat:.6f}, {lon:.6f}")
                
                # Rate limiting: 1 request per second
                time.sleep(1.1)
                
            except GeocoderTimedOut:
                print(f"  ⚠ Timeout on attempt {attempt+1}, retrying...")
                time.sleep(2)
                continue
            except GeocoderServiceError as e:
                print(f"  ✗ Service error: {e}")
                time.sleep(2)
                continue
    
    return None, None, "Not found"

def main():
    """Main function to geocode all hospitals."""
    INPUT_FILE = 'uganda_hospitals_for_gps.csv'
    OUTPUT_FILE = 'uganda_hospitals_geocoded.csv'
    FAILED_FILE = 'geocoding_failed.csv'
    
    # Initialize geolocator with user agent
    geolocator = Nominatim(user_agent="uganda_vht_hospital_geocoder_v1.0")
    
    # Read hospitals
    hospitals = []
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        hospitals = list(reader)
    
    print(f"📍 Geocoding {len(hospitals)} hospitals from {INPUT_FILE}\n")
    print("=" * 80)
    
    geocoded_count = 0
    failed_count = 0
    skipped_count = 0
    failed_hospitals = []
    
    # Process each hospital
    for i, hospital in enumerate(hospitals, 1):
        facility_name = hospital['facility_name']
        district = hospital['district']
        existing_lat = hospital.get('latitude', '').strip()
        existing_lon = hospital.get('longitude', '').strip()
        
        print(f"\n[{i}/{len(hospitals)}] {facility_name} ({district})")
        
        # Skip if already has coordinates
        if existing_lat and existing_lon:
            print("  ⊙ Already has coordinates, skipping")
            skipped_count += 1
            continue
        
        # Geocode
        lat, lon, match_info = geocode_hospital(geolocator, facility_name, district)
        
        if lat and lon:
            hospital['latitude'] = f"{lat:.6f}"
            hospital['longitude'] = f"{lon:.6f}"
            hospital['geocode_notes'] = match_info
            geocoded_count += 1
        else:
            hospital['latitude'] = ''
            hospital['longitude'] = ''
            hospital['geocode_notes'] = match_info
            failed_count += 1
            failed_hospitals.append({
                'facility_name': facility_name,
                'district': district,
                'reason': match_info
            })
            print(f"  ✗ Failed: {match_info}")
        
        # Progress update every 10 hospitals
        if i % 10 == 0:
            print(f"\n{'─' * 80}")
            print(f"Progress: {i}/{len(hospitals)} | "
                  f"Geocoded: {geocoded_count} | "
                  f"Failed: {failed_count} | "
                  f"Skipped: {skipped_count}")
            print(f"{'─' * 80}")
    
    # Save results
    print(f"\n\n{'=' * 80}")
    print("💾 Saving results...")
    
    # Save all results (including failed)
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        if hospitals:
            fieldnames = list(hospitals[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(hospitals)
    print(f"✓ Saved to: {OUTPUT_FILE}")
    
    # Save failed geocoding list
    if failed_hospitals:
        with open(FAILED_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['facility_name', 'district', 'reason'])
            writer.writeheader()
            writer.writerows(failed_hospitals)
        print(f"✓ Failed list saved to: {FAILED_FILE}")
    
    # Final summary
    print(f"\n{'=' * 80}")
    print("📊 FINAL SUMMARY")
    print(f"{'=' * 80}")
    print(f"Total hospitals:     {len(hospitals)}")
    print(f"Successfully geocoded: {geocoded_count} ({geocoded_count/len(hospitals)*100:.1f}%)")
    print(f"Failed:              {failed_count} ({failed_count/len(hospitals)*100:.1f}%)")
    print(f"Already had coords:  {skipped_count} ({skipped_count/len(hospitals)*100:.1f}%)")
    print(f"{'=' * 80}")
    
    if failed_count > 0:
        print(f"\n⚠️  {failed_count} hospitals failed to geocode.")
        print(f"   Check {FAILED_FILE} for the list.")
        print(f"   You may need to manually add GPS coordinates for these facilities.")
    
    print(f"\n✅ Done! Import with:")
    print(f"   python manage.py import_facilities_with_gps {OUTPUT_FILE} --clear")

if __name__ == '__main__':
    main()
