"""
Management command to import hospital data from PDF
Extracts hospital names and districts, then uses geocoding API to get GPS coordinates
Supports Uganda National Health Facility Master List format
"""
from django.core.management.base import BaseCommand
from core.models import Hospital
import os
import re
import time


class Command(BaseCommand):
    help = 'Import hospitals from PDF file - auto-geocodes using Maps API'

    def add_arguments(self, parser):
        parser.add_argument(
            'pdf_path',
            type=str,
            help='Path to the PDF file containing hospital data'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing hospitals before importing'
        )
        parser.add_argument(
            '--max-facilities',
            type=int,
            default=None,
            help='Maximum number of facilities to import (for testing)'
        )
        parser.add_argument(
            '--use-google-maps',
            action='store_true',
            help='Use Google Maps API instead of free Nominatim (requires GOOGLE_MAPS_API_KEY in .env)'
        )

    def handle(self, *args, **options):
        pdf_path = options['pdf_path']
        clear_existing = options.get('clear', False)
        max_facilities = options.get('max_facilities')
        use_google_maps = options.get('use_google_maps', False)
        
        # Check if file exists
        if not os.path.exists(pdf_path):
            self.stdout.write(self.style.ERROR(f'File not found: {pdf_path}'))
            return
        
        self.stdout.write(f'\n{"="*70}')
        self.stdout.write(f'📄 UGANDA HEALTH FACILITY IMPORTER')
        self.stdout.write(f'{"="*70}')
        self.stdout.write(f'PDF: {pdf_path}')
        self.stdout.write(f'Geocoding: {"Google Maps" if use_google_maps else "Nominatim (Free)"}')
        self.stdout.write(f'{"="*70}\n')
        
        try:
            # Import dependencies
            try:
                import PyPDF2
                from geopy.geocoders import Nominatim, GoogleV3
                from geopy.exc import GeocoderTimedOut, GeocoderServiceError
            except ImportError as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Missing dependency: {e}\n'
                        'Install with: pip install PyPDF2 geopy'
                    )
                )
                return
            
            # Setup geocoder
            if use_google_maps:
                from django.conf import settings
                api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
                if not api_key:
                    self.stdout.write(
                        self.style.ERROR('GOOGLE_MAPS_API_KEY not found in settings')
                    )
                    return
                geolocator = GoogleV3(api_key=api_key)
                self.stdout.write('Using Google Maps API for geocoding ✓')
            else:
                geolocator = Nominatim(user_agent="vht-copilot-uganda-importer")
                self.stdout.write('Using Nominatim (free) for geocoding ✓')
                self.stdout.write('⚠️  Nominatim rate limit: 1 request/second\n')
            
            # Clear existing hospitals if requested
            if clear_existing:
                count = Hospital.objects.count()
                Hospital.objects.all().delete()
                self.stdout.write(
                    self.style.WARNING(f'Cleared {count} existing hospitals\n')
                )
            
            # Parse PDF
            self.stdout.write('📖 Parsing PDF...')
            facilities_data = self._parse_uganda_facility_pdf(pdf_path)
            
            if not facilities_data:
                self.stdout.write(
                    self.style.ERROR('No facilities found in PDF. Check format.')
                )
                return
            
            self.stdout.write(
                self.style.SUCCESS(f'✓ Extracted {len(facilities_data)} facilities from PDF\n')
            )
            
            # Limit facilities if specified
            if max_facilities:
                facilities_data = facilities_data[:max_facilities]
                self.stdout.write(f'⚠️  Limiting to first {max_facilities} facilities\n')
            
            # Geocode and import hospitals
            self.stdout.write('🌍 Geocoding and importing...\n')
            created_count = 0
            updated_count = 0
            skipped_count = 0
            geocode_failed = 0
            
            for idx, facility_data in enumerate(facilities_data, 1):
                try:
                    facility_name = facility_data['name']
                    district = facility_data.get('district', '')
                    
                    self.stdout.write(
                        f'  [{idx}/{len(facilities_data)}] {facility_name} ({district})...',
                        ending=''
                    )
                    
                    # Geocode to get coordinates
                    latitude, longitude = self._geocode_facility(
                        facility_name, 
                        district, 
                        geolocator,
                        use_google_maps
                    )
                    
                    if not latitude or not longitude:
                        self.stdout.write(self.style.WARNING(' ✗ No coordinates'))
                        geocode_failed += 1
                        skipped_count += 1
                        continue
                    
                    # Create/update hospital
                    hospital, created = Hospital.objects.update_or_create(
                        name=facility_name,
                        defaults={
                            'facility_type': facility_data.get('facility_type', 'HOSPITAL'),
                            'district': district,
                            'address': f"{facility_name}, {district}, Uganda",
                            'latitude': latitude,
                            'longitude': longitude,
                            'phone_number': facility_data.get('phone_number', ''),
                            'email': facility_data.get('email', ''),
                            'specialties': facility_data.get('specialties', 'general'),
                            'max_capacity': facility_data.get('max_capacity', 100),
                            'operating_hours': '24/7',
                            'is_operational': True,
                            'emergency_capacity_status': Hospital.CapacityStatus.AVAILABLE,
                        }
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(self.style.SUCCESS(f' ✓ Created'))
                    else:
                        updated_count += 1
                        self.stdout.write(self.style.WARNING(f' ↻ Updated'))
                    
                    # Rate limiting for free Nominatim (1 req/sec)
                    if not use_google_maps and idx < len(facilities_data):
                        time.sleep(1.1)
                
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f' ✗ Error: {str(e)}'))
                    skipped_count += 1
            
            # Summary
            self.stdout.write(f'\n{"="*70}')
            self.stdout.write(self.style.SUCCESS(f'✅ IMPORT COMPLETE!'))
            self.stdout.write(f'{"="*70}')
            self.stdout.write(f'✓ Created: {created_count}')
            self.stdout.write(f'↻ Updated: {updated_count}')
            self.stdout.write(f'⊗ Skipped: {skipped_count}')
            if geocode_failed > 0:
                self.stdout.write(
                    self.style.WARNING(f'⚠  Geocoding failed: {geocode_failed}')
                )
            self.stdout.write(f'{"="*70}\n')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error processing PDF: {e}')
            )
            import traceback
            traceback.print_exc()
    
    def _geocode_facility(self, facility_name, district, geolocator, use_google_maps=False):
        """
        Geocode a facility using its name and district.
        Returns (latitude, longitude) or (None, None) if geocoding fails.
        Uses fallback strategy: full name → district center → None
        """
        from geopy.exc import GeocoderTimedOut, GeocoderServiceError
        
        # Strategy 1: Try full facility name + district + Uganda
        query = f"{facility_name}, {district}, Uganda"
        
        max_retries = 2
        for attempt in range(max_retries):
            try:
                location = geolocator.geocode(query, timeout=10)
                
                if location:
                    lat, lon = location.latitude, location.longitude
                    
                    # Validate coordinates are in Uganda bounds
                    # Uganda bounds: lat -1.5 to 4.5, lon 29.5 to 35.0
                    if -2 <= lat <= 5 and 29 <= lon <= 36:
                        return lat, lon
                
                # Strategy 2: If full name didn't work, try just district + Uganda
                # This gives us the district center, which is better than nothing
                if attempt == 0:
                    query = f"{district}, Uganda"
                    time.sleep(0.5)  # Small delay before retry
                    continue
                    
                return None, None
                
            except GeocoderTimedOut:
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                # On last retry, try district-only as fallback
                try:
                    location = geolocator.geocode(f"{district}, Uganda", timeout=10)
                    if location:
                        lat, lon = location.latitude, location.longitude
                        if -2 <= lat <= 5 and 29 <= lon <= 36:
                            return lat, lon
                except:
                    pass
                return None, None
                
            except (GeocoderServiceError, Exception) as e:
                # Try district-only as final fallback
                try:
                    location = geolocator.geocode(f"{district}, Uganda", timeout=10)
                    if location:
                        lat, lon = location.latitude, location.longitude
                        if -2 <= lat <= 5 and 29 <= lon <= 36:
                            return lat, lon
                except:
                    pass
                return None, None
        
        return None, None
    
    def _parse_uganda_facility_pdf(self, pdf_path):
        """
        Parse Uganda National Health Facility Master List PDF.
        
        Attempts two methods:
        1. Table extraction using tabula-py (if installed)
        2. Text extraction using PyPDF2
        
        Returns list of facility dictionaries with:
        - name, district, facility_type, etc.
        """
        facilities_data = []
        
        # Try tabula-py first (better for tables)
        try:
            import tabula
            
            # Extract all tables from PDF
            dfs = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True)
            
            for df in dfs:
                # Look for columns with facility data
                # Common column names in Uganda facility lists:
                # "Facility Name", "Name", "Health Facility"
                # "District", "District Name"
                # "Type", "Facility Type", "Level"
                
                # Normalize column names
                df.columns = [col.strip().lower() for col in df.columns]
                
                # Find name column
                name_col = None
                for col in df.columns:
                    if any(x in col for x in ['facility', 'name', 'health']):
                        name_col = col
                        break
                
                # Find district column
                district_col = None
                for col in df.columns:
                    if 'district' in col:
                        district_col = col
                        break
                
                # Find type column
                type_col = None
                for col in df.columns:
                    if 'type' in col or 'level' in col:
                        type_col = col
                        break
                
                # Extract facilities
                if name_col:
                    for _, row in df.iterrows():
                        facility_name = str(row.get(name_col, '')).strip()
                        
                        # Skip empty, headers, or very short names
                        if not facility_name or len(facility_name) < 3:
                            continue
                        if facility_name.lower() in ['facility', 'name', 'nan']:
                            continue
                        
                        district = str(row.get(district_col, '')).strip() if district_col else ''
                        facility_type_raw = str(row.get(type_col, '')).strip() if type_col else 'HOSPITAL'
                        
                        # Map facility types
                        facility_type = self._map_facility_type(facility_type_raw)
                        
                        facilities_data.append({
                            'name': facility_name,
                            'district': district,
                            'facility_type': facility_type,
                            'max_capacity': self._estimate_capacity(facility_type_raw),
                        })
                
                if facilities_data:
                    return facilities_data
        
        except ImportError:
            self.stdout.write('⚠️  tabula-py not installed, using text extraction')
        except Exception as e:
            self.stdout.write(f'⚠️  Table extraction failed: {e}')
        
        # Fallback: Text extraction with PyPDF2
        import PyPDF2
        import re
        
        self.stdout.write('Using text extraction from PDF...')
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Track current district from headers
            current_district = ''
            
            # Skip first few intro pages that have no data (typically pages 1-15)
            start_page = 20
            end_page = len(pdf_reader.pages)
            
            self.stdout.write(f'Scanning pages {start_page} to {end_page}...')
            
            for page_num in range(start_page, end_page):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                lines = text.split('\n')
                
                for line in lines:
                    line = line.strip()
                    
                    # Skip empty lines
                    if not line:
                        continue
                    
                    # Detect district headers (format: "Buhweju District" or "KAMPALA District")
                    if 'district' in line.lower() and len(line.split()) <= 3:
                        # Extract district name without "District" word
                        district_name = line.replace('District', '').replace('DISTRICT', '').strip()
                        if len(district_name) > 2:
                            current_district = district_name.title()
                            continue
                    
                    # Skip table headers
                    if re.match(r'^\d+\s+.*HSD.*Name.*Level.*Authority', line, re.IGNORECASE):
                        continue
                    if 'HSD Name Level Authority Ownership' in line:
                        continue
                    
                    # Parse facility rows
                    # Format: # HSD Name Level Authority Ownership NHPI Code HSDT Code
                    # Example: "1 Buhweju HSD Beverly  Health Centre II HC II NGO PNFP HFNMFJRE0 SC97N78M5/PA36EE5J5/8001"
                    
                    # Look for lines with "HC II", "HC III", "HC IV", or "Hospital"
                    level_patterns = [
                        r'\bHC\s*II\b', r'\bHC\s*III\b', r'\bHC\s*IV\b',
                        r'\bHospital\b', r'\bClinic\b', r'\bHealth Centre II\b',
                        r'\bHealth Centre III\b', r'\bHealth Centre IV\b'
                    ]
                    
                    if any(re.search(pattern, line, re.IGNORECASE) for pattern in level_patterns):
                        # Try to extract facility name and level
                        # Pattern: number, HSD name, facility name, level
                        
                        # Remove leading numbers and HSD names
                        cleaned = re.sub(r'^\d+\s+\w+\s+HSD\s+', '', line, flags=re.IGNORECASE)
                        
                        # Extract facility name (everything before the level indicator)
                        facility_name = None
                        facility_level =None
                        
                        for pattern in ['HC II', 'HC III', 'HC IV', 'Hospital', 'Clinic',
                                      'Health Centre II', 'Health Centre III', 'Health Centre IV']:
                            if pattern in cleaned:
                                parts = cleaned.split(pattern, 1)
                                facility_name = parts[0].strip()
                                facility_level = pattern
                                break
                        
                        if facility_name and len(facility_name) > 2 and current_district:
                            # Clean up facility name (remove trailing spaces, codes, etc.)
                            facility_name = re.sub(r'\s{2,}', ' ', facility_name)
                            facility_name = facility_name.split('  ')[0].strip()
                            
                            # Skip if facility name is too short or looks like a code
                            if len(facility_name) < 3:
                                continue
                            
                            facility_type = self._map_facility_type(facility_level or 'HOSPITAL')
                            
                            facilities_data.append({
                                'name': facility_name,
                                'district': current_district,
                                'facility_type': facility_type,
                                'max_capacity': self._estimate_capacity(facility_level or 'HOSPITAL'),
                            })
        
        return facilities_data
    
    def _map_facility_type(self, raw_type):
        """Map facility type string to Django model choice."""
        raw_type_lower = raw_type.lower()
        
        if 'referral' in raw_type_lower or 'national' in raw_type_lower:
            return 'REFERRAL'
        elif 'regional' in raw_type_lower:
            return 'REGIONAL'
        elif 'general' in raw_type_lower:
            return 'GENERAL'
        elif 'hc iv' in raw_type_lower or 'health centre iv' in raw_type_lower:
            return 'HC_IV'
        elif 'hc iii' in raw_type_lower or 'health centre iii' in raw_type_lower:
            return 'HC_III'
        elif 'hc ii' in raw_type_lower or 'health centre ii' in raw_type_lower:
            return 'HC_II'
        elif 'clinic' in raw_type_lower:
            return 'CLINIC'
        else:
            return 'HOSPITAL'
    
    def _estimate_capacity(self, facility_type_raw):
        """Estimate bed capacity based on facility type."""
        facility_type = self._map_facility_type(facility_type_raw)
        
        capacity_map = {
            'REFERRAL': 1000,
            'REGIONAL': 500,
            'GENERAL': 200,
            'HC_IV': 100,
            'HC_III': 50,
            'HC_II': 20,
            'CLINIC': 10,
            'HOSPITAL': 100,
        }
        
        return capacity_map.get(facility_type, 100)

