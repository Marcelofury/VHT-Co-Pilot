"""
Extract all health facilities from Uganda National Health Facility Master List PDF
and generate a CSV file for GPS coordinate entry.
"""
import PyPDF2
import re
import csv

pdf_path = "National Health Facility MasterLlist 2017.pdf"

facilities = []
current_district = ''

print("Extracting facilities from PDF...")

with open(pdf_path, 'rb') as pdf_file:
    reader = PyPDF2.PdfReader(pdf_file)
    
    # Skip intro pages (start from page 20)
    for page_num in range(20, len(reader.pages)):
        text = reader.pages[page_num].extract_text()
        
        for line in text.split('\n'):
            line = line.strip()
            
            if not line:
                continue
            
            # Detect district headers
            if 'district' in line.lower() and len(line.split()) <= 3:
                district_name = line.replace('District', '').replace('DISTRICT', '').strip()
                if len(district_name) > 2:
                    current_district = district_name.title()
                    continue
            
            # Detect facility rows
            if re.search(r'\bHC\s*II\b|\bHC\s*III\b|\bHC\s*IV\b|\bHospital\b|\bClinic\b', line, re.IGNORECASE):
                # Clean up the line
                cleaned = re.sub(r'^\d+\s+\w+\s+HSD\s+', '', line, flags=re.IGNORECASE)
                
                facility_name = None
                facility_level = None
                
                # Extract name and level
                for pattern in ['HC II', 'HC III', 'HC IV', 'Hospital', 'Clinic',
                              'Health Centre II', 'Health Centre III', 'Health Centre IV']:
                    if pattern in cleaned:
                        parts = cleaned.split(pattern, 1)
                        facility_name = re.sub(r'\s{2,}', ' ', parts[0].strip()).split('  ')[0].strip()
                        facility_level = pattern
                        break
                
                if facility_name and len(facility_name) > 2 and current_district:
                    # Filter: Only include facilities with "Hospital" in the level
                    if 'Hospital' in facility_level:
                        facilities.append({
                            'name': facility_name,
                            'district': current_district,
                            'level': facility_level
                        })

print(f"\nTotal facilities extracted: {len(facilities)}")

# Save to CSV for GPS coordinate entry
csv_path = "uganda_hospitals_for_gps.csv"
with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['facility_name', 'district', 'level', 'latitude', 'longitude']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    
    writer.writeheader()
    for facility in facilities:
        writer.writerow({
            'facility_name': facility['name'],
            'district': facility['district'],
            'level': facility['level'],
            'latitude': '',  # Empty for user to fill
            'longitude': ''  # Empty for user to fill
        })

print(f"Saved to: {csv_path}")
print("\nFirst 100 hospitals:")
print("=" * 80)

for i, facility in enumerate(facilities[:100], 1):
    print(f"{i:3d}. {facility['name']:50s} | {facility['level']:20s} | {facility['district']}")

print("\n" + "=" * 80)
print(f"\nPlease fill in latitude and longitude columns in '{csv_path}'")
print("Then run: python manage.py import_facilities_with_gps " + csv_path)
