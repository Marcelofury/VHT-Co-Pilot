"""
Merge OSM GPS coordinates into uganda_hospitals_for_gps.csv.
Matches facilities by name and fills in missing GPS coordinates.

Usage:
    python merge_osm_coordinates.py osm_data.txt

This script will:
1. Read your uganda_hospitals_for_gps.csv (178 hospitals without GPS)
2. Read OSM data (hospitals with GPS coordinates)
3. Match by facility name (fuzzy matching)
4. Fill in GPS coordinates where found
5. Output: uganda_hospitals_merged.csv
"""

import csv
import sys
from difflib import SequenceMatcher

# Uganda GPS bounds
UGANDA_BOUNDS = {
    'min_lat': -2.0,
    'max_lat': 5.0,
    'min_lon': 29.0,
    'max_lon': 36.0
}

def is_in_uganda(lat, lon):
    """Check if coordinates are within Uganda bounds."""
    try:
        lat = float(lat)
        lon = float(lon)
        return (UGANDA_BOUNDS['min_lat'] <= lat <= UGANDA_BOUNDS['max_lat'] and
                UGANDA_BOUNDS['min_lon'] <= lon <= UGANDA_BOUNDS['max_lon'])
    except (ValueError, TypeError):
        return False

def normalize_name(name):
    """Normalize facility name for matching."""
    # Remove common prefixes/suffixes and standardize
    name = name.lower()
    # Remove numbers at start
    while name and name[0].isdigit():
        name = name[1:].strip()
    
    # Remove common words
    remove_words = ['hsd', 'general', 'hospital', 'health', 'centre', 'center', 
                    'municipality', 'division', 'county', 'town', 'council']
    words = name.split()
    words = [w for w in words if w not in remove_words]
    
    return ' '.join(words)

def fuzzy_match_score(name1, name2):
    """Calculate similarity score between two facility names."""
    norm1 = normalize_name(name1)
    norm2 = normalize_name(name2)
    return SequenceMatcher(None, norm1, norm2).ratio()

def parse_osm_line(line):
    """Parse a single line from OSM data."""
    parts = line.split('\t')
    if len(parts) < 6:
        return None
    
    name = parts[0].strip()
    district = parts[1].strip() if len(parts) > 1 else ""
    lat = parts[4].strip() if len(parts) > 4 else ""
    lon = parts[5].strip() if len(parts) > 5 else ""
    
    if not name or not lat or not lon:
        return None
    
    if not is_in_uganda(lat, lon):
        return None
    
    return {
        'name': name,
        'district': district,
        'latitude': lat,
        'longitude': lon
    }

def find_best_match(facility_name, facility_district, osm_facilities, threshold=0.6):
    """Find best OSM match for a facility."""
    best_score = 0
    best_match = None
    
    for osm_facility in osm_facilities:
        # Calculate name similarity
        name_score = fuzzy_match_score(facility_name, osm_facility['name'])
        
        # Bonus points if districts match
        district_match = (facility_district.lower() in osm_facility['name'].lower() or
                         osm_facility['district'].lower() == facility_district.lower())
        
        if district_match:
            name_score += 0.2  # 20% bonus for district match
        
        if name_score > best_score:
            best_score = name_score
            best_match = osm_facility
    
    # Return match only if above threshold
    if best_score >= threshold:
        return best_match, best_score
    
    return None, 0

def main():
    if len(sys.argv) < 2:
        print("Usage: python merge_osm_coordinates.py <osm_data.txt>")
        print("\nThis will merge OSM GPS coordinates into uganda_hospitals_for_gps.csv")
        sys.exit(1)
    
    osm_file = sys.argv[1]
    input_csv = 'uganda_hospitals_for_gps.csv'
    output_csv = 'uganda_hospitals_merged.csv'
    
    print("🔄 Merging OSM GPS coordinates into hospital database")
    print("=" * 80)
    
    # Load OSM data
    print(f"\n📖 Reading OSM data from: {osm_file}")
    osm_facilities = []
    with open(osm_file, 'r', encoding='utf-8') as f:
        for line in f:
            facility = parse_osm_line(line)
            if facility:
                osm_facilities.append(facility)
    
    print(f"✓ Loaded {len(osm_facilities)} OSM facilities with GPS coordinates")
    
    # Load existing hospitals
    print(f"\n📖 Reading hospital database from: {input_csv}")
    hospitals = []
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        hospitals = list(reader)
    
    print(f"✓ Loaded {len(hospitals)} hospitals from database")
    
    # Match and merge
    print(f"\n🔍 Matching facilities...")
    print("=" * 80)
    
    matched_count = 0
    already_had_coords = 0
    no_match_found = 0
    
    for i, hospital in enumerate(hospitals, 1):
        facility_name = hospital['facility_name']
        district = hospital['district']
        existing_lat = hospital.get('latitude', '').strip()
        existing_lon = hospital.get('longitude', '').strip()
        
        # Skip if already has coordinates
        if existing_lat and existing_lon:
            already_had_coords += 1
            continue
        
        # Find best OSM match
        match, score = find_best_match(facility_name, district, osm_facilities)
        
        if match:
            hospital['latitude'] = match['latitude']
            hospital['longitude'] = match['longitude']
            hospital['gps_source'] = f'OSM (match: {score:.0%})'
            matched_count += 1
            print(f"[{i:3d}] ✓ {facility_name:50s} → {match['name'][:40]} ({score:.0%})")
        else:
            no_match_found += 1
            hospital['gps_source'] = 'Not found in OSM'
            print(f"[{i:3d}] ✗ {facility_name:50s} → No match found")
    
    # Save merged data
    print(f"\n💾 Saving merged data to: {output_csv}")
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        if hospitals:
            fieldnames = list(hospitals[0].keys())
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(hospitals)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 MERGE SUMMARY")
    print("=" * 80)
    print(f"Total hospitals:           {len(hospitals)}")
    print(f"Already had GPS:           {already_had_coords}")
    print(f"Matched from OSM:          {matched_count}")
    print(f"No match found:            {no_match_found}")
    print(f"Total with GPS now:        {already_had_coords + matched_count}")
    print(f"Success rate:              {(already_had_coords + matched_count)/len(hospitals)*100:.1f}%")
    print("=" * 80)
    
    print(f"\n✅ Done! Merged data saved to: {output_csv}")
    print(f"\n🚀 Next step: Import to database:")
    print(f"   python manage.py import_facilities_with_gps {output_csv} --clear")

if __name__ == '__main__':
    main()
