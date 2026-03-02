"""
Fetch all health facilities from Uganda National Health Facility Registry API
Base URL: https://nhfr.health.go.ug
API Endpoint: /api/orgunits?level=6 (level 6 = facilities)
"""
import requests
from requests.auth import HTTPBasicAuth
import csv
import json

# API Configuration
BASE_URL = "https://nhfr.health.go.ug"
API_ENDPOINT = "/api/orgunits"

# You need to provide credentials (username and password)
# Contact Ministry of Health to get API credentials
USERNAME = input("Enter NHFR API username: ")
PASSWORD = input("Enter NHFR API password: ")

print("\n" + "="*80)
print("UGANDA NATIONAL HEALTH FACILITY REGISTRY - API FETCH")
print("="*80)

def fetch_all_facilities():
    """Fetch all facilities from NHFR API with pagination."""
    all_facilities = []
    page = 1
    page_size = 500  # Max allowed
    
    print(f"\nFetching facilities from {BASE_URL}...")
    
    while True:
        params = {
            'level': 6,  # Level 6 = Facilities
            'status': 'Functional',  # Only functional facilities
            'paging': 'true',
            'page': page,
            'pageSize': page_size
        }
        
        try:
            response = requests.get(
                f"{BASE_URL}{API_ENDPOINT}",
                params=params,
                auth=HTTPBasicAuth(USERNAME, PASSWORD),
                timeout=30
            )
            
            if response.status_code == 401:
                print("\n❌ Authentication failed. Check your username and password.")
                return None
            
            if response.status_code != 200:
                print(f"\n❌ API Error: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            facilities = data.get('orgunits', [])
            
            if not facilities:
                break
            
            all_facilities.extend(facilities)
            
            # Check pagination
            pager = data.get('pager', {})
            total_pages = pager.get('pageCount', 1)
            total_facilities = pager.get('total', len(all_facilities))
            
            print(f"  Page {page}/{total_pages} - Fetched {len(facilities)} facilities (Total: {len(all_facilities)}/{total_facilities})")
            
            if page >= total_pages:
                break
            
            page += 1
            
        except requests.exceptions.RequestException as e:
            print(f"\n❌ Network error: {e}")
            return None
    
    return all_facilities

def filter_hospitals(facilities):
    """Filter only hospitals from all facilities."""
    hospitals = []
    
    for facility in facilities:
        facility_level = facility.get('facility_level', {})
        level_name = facility_level.get('name', '').upper()
        
        # Include facilities with "HOSPITAL" in their level name
        # This includes: "Hospital", "Regional Referral Hospital", "General Hospital", etc.
        if 'HOSPITAL' in level_name or 'HOSPITAL' in facility.get('name', '').upper():
            hospitals.append(facility)
    
    return hospitals

def save_to_csv(facilities, filename='uganda_hospitals_from_api.csv'):
    """Save facilities to CSV with GPS coordinates."""
    print(f"\nSaving to {filename}...")
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = [
            'facility_name', 'district', 'region', 'level', 
            'latitude', 'longitude', 'status', 'ownership', 
            'authority', 'mfl_uid', 'bed_capacity', 'services',
            'address', 'contact_name', 'contact_mobile', 'contact_email'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        
        for facility in facilities:
            district = facility.get('district', {})
            region = facility.get('region', {})
            facility_level = facility.get('facility_level', {})
            ownership = facility.get('ownership', {})
            authority = facility.get('authority', {})
            
            writer.writerow({
                'facility_name': facility.get('name', ''),
                'district': district.get('name', ''),
                'region': region.get('name', ''),
                'level': facility_level.get('name', ''),
                'latitude': facility.get('latitude', ''),
                'longitude': facility.get('longitude', ''),
                'status': facility.get('status', ''),
                'ownership': ownership.get('name', ''),
                'authority': authority.get('name', ''),
                'mfl_uid': facility.get('mfl_uid', ''),
                'bed_capacity': facility.get('bed_capacity', ''),
                'services': facility.get('services', ''),
                'address': facility.get('address', ''),
                'contact_name': facility.get('contact_personname', ''),
                'contact_mobile': facility.get('contact_personmobile', ''),
                'contact_email': facility.get('contact_personemail', '')
            })
    
    print(f"✓ Saved {len(facilities)} facilities")

def save_to_json(facilities, filename='uganda_hospitals_from_api.json'):
    """Save raw facility data to JSON for reference."""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(facilities, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved raw data to {filename}")

# Main execution
if __name__ == '__main__':
    # Fetch all facilities
    all_facilities = fetch_all_facilities()
    
    if not all_facilities:
        print("\n❌ Failed to fetch facilities")
        exit(1)
    
    print(f"\n✓ Total facilities fetched: {len(all_facilities)}")
    
    # Filter hospitals
    hospitals = filter_hospitals(all_facilities)
    print(f"✓ Hospitals found: {len(hospitals)}")
    
    # Save to CSV
    save_to_csv(hospitals, 'uganda_hospitals_from_api.csv')
    
    # Save raw JSON
    save_to_json(hospitals, 'uganda_hospitals_from_api.json')
    
    # Display sample
    print("\n" + "="*80)
    print("SAMPLE HOSPITALS (First 20):")
    print("="*80)
    
    for i, hospital in enumerate(hospitals[:20], 1):
        district = hospital.get('district', {}).get('name', 'Unknown')
        lat = hospital.get('latitude', 'N/A')
        lon = hospital.get('longitude', 'N/A')
        level = hospital.get('facility_level', {}).get('name', 'Unknown')
        
        print(f"{i:3d}. {hospital.get('name', 'Unknown'):50s} | {district:20s} | {level:15s} | GPS: {lat}, {lon}")
    
    print("\n" + "="*80)
    print(f"\n✓ Complete! {len(hospitals)} hospitals saved to:")
    print(f"  - uganda_hospitals_from_api.csv (ready for import)")
    print(f"  - uganda_hospitals_from_api.json (raw data)")
    print(f"\nNext step: python manage.py import_hospitals_from_api uganda_hospitals_from_api.csv")
