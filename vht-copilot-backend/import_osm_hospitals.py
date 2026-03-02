"""
Import hospitals from OpenStreetMap data.
Cleans, deduplicates, and validates GPS coordinates.

Usage:
    python import_osm_hospitals.py osm_hospitals.txt

Output:
    uganda_hospitals_from_osm.csv - Cleaned hospital data ready for import
"""

import csv
import sys
from collections import defaultdict

# Uganda GPS bounds
UGANDA_BOUNDS = {
    'min_lat': -2.0,
    'max_lat': 5.0,
    'min_lon': 29.0,
    'max_lon': 36.0
}

# Keywords to identify actual hospitals
HOSPITAL_KEYWORDS = [
    'hospital', 'referral', 'general', 'regional', 'national',
    'medical centre', 'medical center', 'health centre iv', 'health center iv'
]

# Keywords to EXCLUDE (health centers, clinics, dispensaries)
EXCLUDE_KEYWORDS = [
    'health centre ii', 'health center ii', 'hc ii', 'hcii', 'hc 11', 'hc2',
    'health centre iii', 'health center iii', 'hc iii', 'hciii', 'hc 111', 'hc3',
    'health centre 2', 'health center 2', 'health unit ii',
    'health centre 3', 'health center 3', 'health unit iii',
    'dispensary', 'clinic', 'drug shop', 'aid post', 'pharmacy'
]

def is_in_uganda(lat, lon):
    """Check if coordinates are within Uganda bounds."""
    if lat is None or lon is None:
        return False
    try:
        lat = float(lat)
        lon = float(lon)
        return (UGANDA_BOUNDS['min_lat'] <= lat <= UGANDA_BOUNDS['max_lat'] and
                UGANDA_BOUNDS['min_lon'] <= lon <= UGANDA_BOUNDS['max_lon'])
    except (ValueError, TypeError):
        return False

def is_hospital(name):
    """Determine if facility is a hospital (not HC II/III or clinic)."""
    name_lower = name.lower()
    
    # First check EXCLUDE keywords (HC II, III, clinics, etc.)
    for exclude in EXCLUDE_KEYWORDS:
        if exclude in name_lower:
            return False
    
    # Then check if it contains hospital keywords
    for keyword in HOSPITAL_KEYWORDS:
        if keyword in name_lower:
            return True
    
    return False

def clean_name(name):
    """Clean facility name."""
    # Remove extra whitespace
    name = ' '.join(name.split())
    # Remove trailing/leading special characters
    name = name.strip('.,;-_')
    return name

def extract_district(name, addr_district):
    """Extract district from available data."""
    # If addr:district is provided, use it
    if addr_district and addr_district.strip():
        return addr_district.strip()
    
    # Try to extract from name (some names have district in them)
    # This is less reliable, so we'll return empty if no addr:district
    return ""

def parse_osm_data(input_file):
    """Parse OSM data from tab-separated format."""
    facilities = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line or line_num == 1:  # Skip empty lines and header
                continue
            
            # Split by tab
            parts = line.split('\t')
            if len(parts) < 6:
                continue
            
            name = parts[0].strip()
            addr_district = parts[1].strip() if len(parts) > 1 else ""
            amenity = parts[2].strip() if len(parts) > 2 else ""
            health_level = parts[3].strip() if len(parts) > 3 else ""
            lat = parts[4].strip() if len(parts) > 4 else ""
            lon = parts[5].strip() if len(parts) > 5 else ""
            
            # Skip if no name or no coordinates
            if not name or not lat or not lon:
                continue
            
            # Skip if outside Uganda
            if not is_in_uganda(lat, lon):
                continue
            
            # Skip if not a hospital
            if not is_hospital(name):
                continue
            
            facilities.append({
                'name': clean_name(name),
                'district': extract_district(name, addr_district),
                'latitude': lat,
                'longitude': lon,
                'source': 'OpenStreetMap'
            })
    
    return facilities

def deduplicate_facilities(facilities):
    """
    Deduplicate facilities based on:
    1. Exact name match
    2. Similar GPS coordinates (within 0.01 degrees ~ 1km)
    """
    # Group by name (case-insensitive)
    by_name = defaultdict(list)
    for facility in facilities:
        key = facility['name'].lower().strip()
        by_name[key].append(facility)
    
    deduplicated = []
    
    for name_key, group in by_name.items():
        if len(group) == 1:
            # Only one facility with this name
            deduplicated.append(group[0])
        else:
            # Multiple facilities with same name - keep best one
            # Priority: 1) Has district, 2) First occurrence
            group_sorted = sorted(group, key=lambda x: (
                0 if x['district'] else 1,  # Prefer with district
                facilities.index(x)  # Then by original order
            ))
            deduplicated.append(group_sorted[0])
    
    return deduplicated

def main():
    if len(sys.argv) < 2:
        print("Usage: python import_osm_hospitals.py <osm_data_file.txt>")
        print("\nExpected format: Tab-separated file with columns:")
        print("  name | addr:district | amenity | health_facility:level | @lat | @lon")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = 'uganda_hospitals_from_osm.csv'
    
    print(f"📖 Reading OSM data from: {input_file}")
    print("=" * 80)
    
    # Parse OSM data
    facilities = parse_osm_data(input_file)
    print(f"✓ Found {len(facilities)} hospital entries with GPS coordinates")
    
    # Deduplicate
    unique_facilities = deduplicate_facilities(facilities)
    print(f"✓ After deduplication: {len(unique_facilities)} unique hospitals")
    
    # Count by district
    with_district = sum(1 for f in unique_facilities if f['district'])
    without_district = len(unique_facilities) - with_district
    
    print(f"\n📊 Statistics:")
    print(f"  - With district info: {with_district}")
    print(f"  - Without district:   {without_district}")
    
    # Save to CSV
    print(f"\n💾 Saving to: {output_file}")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['name', 'district', 'latitude', 'longitude', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(unique_facilities)
    
    print(f"✅ Done! Saved {len(unique_facilities)} hospitals")
    print("\n" + "=" * 80)
    print("📋 Summary of unique hospitals by district:")
    print("=" * 80)
    
    # Show hospitals by district
    by_district = defaultdict(list)
    for facility in unique_facilities:
        district = facility['district'] if facility['district'] else 'Unknown'
        by_district[district].append(facility['name'])
    
    for district in sorted(by_district.keys()):
        count = len(by_district[district])
        print(f"{district:20s} : {count:3d} hospitals")
    
    print("\n" + "=" * 80)
    print("🚀 Next steps:")
    print("=" * 80)
    print("1. Review the output file to verify data quality")
    print("2. Optionally merge with your uganda_hospitals_for_gps.csv")
    print("3. Import to database:")
    print(f"   python manage.py import_facilities_with_gps {output_file} --clear")
    print("\n✨ This will replace the 14 sample hospitals with real OSM data!")

if __name__ == '__main__':
    main()
