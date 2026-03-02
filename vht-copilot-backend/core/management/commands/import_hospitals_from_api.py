"""
Management command to import hospitals directly from Uganda NHFR API
or from CSV exported by the API fetch script.
"""
import csv
import requests
from requests.auth import HTTPBasicAuth
from django.core.management.base import BaseCommand
from core.models import Hospital


class Command(BaseCommand):
    help = 'Import hospitals from Uganda NHFR API or from API-exported CSV'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--csv',
            type=str,
            help='Path to CSV file from API (optional, will fetch from API if not provided)'
        )
        parser.add_argument(
            '--username',
            type=str,
            help='NHFR API username (required if fetching from API)'
        )
        parser.add_argument(
            '--password',
            type=str,
            help='NHFR API password (required if fetching from API)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing hospitals before import'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Limit number of hospitals to import (for testing)'
        )
    
    def handle(self, *args, **options):
        csv_path = options.get('csv')
        username = options.get('username')
        password = options.get('password')
        clear_existing = options.get('clear', False)
        limit = options.get('limit')
        
        self.stdout.write(f'\n{"="*70}')
        self.stdout.write(f'🏥 UGANDA HOSPITALS - NHFR API IMPORT')
        self.stdout.write(f'{"="*70}\n')
        
        # Clear existing if requested
        if clear_existing:
            count = Hospital.objects.count()
            Hospital.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing hospitals\n'))
        
        if csv_path:
            # Import from CSV
            self._import_from_csv(csv_path, limit)
        elif username and password:
            # Fetch from API and import
            self._import_from_api(username, password, limit)
        else:
            self.stdout.write(
                self.style.ERROR(
                    'Please provide either:\n'
                    '  --csv path/to/file.csv\n'
                    '  OR\n'
                    '  --username YOUR_USERNAME --password YOUR_PASSWORD'
                )
            )
    
    def _import_from_csv(self, csv_path, limit=None):
        """Import hospitals from API-exported CSV."""
        self.stdout.write(f'Reading from CSV: {csv_path}\n')
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                created_count = 0
                updated_count = 0
                skipped_count = 0
                
                for idx, row in enumerate(reader, 1):
                    if limit and idx > limit:
                        break
                    
                    # Skip if no GPS coordinates
                    if not row.get('latitude') or not row.get('longitude'):
                        skipped_count += 1
                        continue
                    
                    try:
                        lat = float(row['latitude'])
                        lon = float(row['longitude'])
                    except (ValueError, TypeError):
                        skipped_count += 1
                        continue
                    
                    # Validate Uganda bounds
                    if not (-2 <= lat <= 5 and 29 <= lon <= 36):
                        skipped_count += 1
                        continue
                    
                    # Map facility type
                    facility_type = self._map_facility_type(row.get('level', ''))
                    
                    # Estimate capacity from bed_capacity or facility type
                    bed_capacity = row.get('bed_capacity', '')
                    if bed_capacity and bed_capacity.strip():
                        try:
                            max_capacity = int(bed_capacity)
                        except ValueError:
                            max_capacity = self._estimate_capacity(facility_type)
                    else:
                        max_capacity = self._estimate_capacity(facility_type)
                    
                    # Create/update hospital
                    hospital, created = Hospital.objects.update_or_create(
                        name=row['facility_name'],
                        defaults={
                            'facility_type': facility_type,
                            'district': row.get('district', ''),
                            'address': row.get('address', f"{row['facility_name']}, {row.get('district', '')}, Uganda"),
                            'latitude': lat,
                            'longitude': lon,
                            'phone_number': row.get('contact_mobile', ''),
                            'email': row.get('contact_email', ''),
                            'specialties': row.get('services', 'general'),
                            'max_capacity': max_capacity,
                            'operating_hours': '24/7',
                            'is_operational': row.get('status', 'Functional') == 'Functional',
                            'emergency_capacity_status': Hospital.CapacityStatus.AVAILABLE,
                        }
                    )
                    
                    if created:
                        created_count += 1
                        if created_count % 50 == 0:
                            self.stdout.write(f'  Processed {created_count} hospitals...')
                    else:
                        updated_count += 1
                
                # Summary
                self.stdout.write(f'\n{"="*70}')
                self.stdout.write(self.style.SUCCESS(f'✅ IMPORT COMPLETE!'))
                self.stdout.write(f'{"="*70}')
                self.stdout.write(f'✓ Created: {created_count}')
                self.stdout.write(f'↻ Updated: {updated_count}')
                self.stdout.write(f'⊗ Skipped: {skipped_count}')
                self.stdout.write(f'{"="*70}\n')
                
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {csv_path}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            import traceback
            traceback.print_exc()
    
    def _import_from_api(self, username, password, limit=None):
        """Fetch hospitals directly from NHFR API and import."""
        BASE_URL = "https://nhfr.health.go.ug"
        API_ENDPOINT = "/api/orgunits"
        
        self.stdout.write(f'Fetching from API: {BASE_URL}\n')
        
        page = 1
        page_size = 500
        created_count = 0
        updated_count = 0
        skipped_count = 0
        total_fetched = 0
        
        while True:
            params = {
                'level': 6,  # Facilities
                'status': 'Functional',
                'paging': 'true',
                'page': page,
                'pageSize': page_size
            }
            
            try:
                response = requests.get(
                    f"{BASE_URL}{API_ENDPOINT}",
                    params=params,
                    auth=HTTPBasicAuth(username, password),
                    timeout=30
                )
                
                if response.status_code == 401:
                    self.stdout.write(self.style.ERROR('Authentication failed'))
                    return
                
                if response.status_code != 200:
                    self.stdout.write(self.style.ERROR(f'API Error: {response.status_code}'))
                    return
                
                data = response.json()
                facilities = data.get('orgunits', [])
                
                if not facilities:
                    break
                
                # Filter hospitals
                hospitals = [f for f in facilities if self._is_hospital(f)]
                
                self.stdout.write(f'  Page {page}: {len(hospitals)} hospitals')
                
                # Import hospitals
                for facility in hospitals:
                    if limit and (created_count + updated_count) >= limit:
                        break
                    
                    result = self._import_facility(facility)
                    if result == 'created':
                        created_count += 1
                    elif result == 'updated':
                        updated_count += 1
                    else:
                        skipped_count += 1
                
                total_fetched += len(facilities)
                
                # Check if we should continue
                pager = data.get('pager', {})
                if page >= pager.get('pageCount', 1):
                    break
                
                if limit and (created_count + updated_count) >= limit:
                    break
                
                page += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error: {e}'))
                break
        
        # Summary
        self.stdout.write(f'\n{"="*70}')
        self.stdout.write(self.style.SUCCESS(f'✅ API IMPORT COMPLETE!'))
        self.stdout.write(f'{"="*70}')
        self.stdout.write(f'📊 Facilities fetched: {total_fetched}')
        self.stdout.write(f'✓ Hospitals created: {created_count}')
        self.stdout.write(f'↻ Hospitals updated: {updated_count}')
        self.stdout.write(f'⊗ Skipped: {skipped_count}')
        self.stdout.write(f'{"="*70}\n')
    
    def _is_hospital(self, facility):
        """Check if facility is a hospital."""
        facility_level = facility.get('facility_level', {})
        level_name = facility_level.get('name', '').upper()
        facility_name = facility.get('name', '').upper()
        
        return 'HOSPITAL' in level_name or 'HOSPITAL' in facility_name
    
    def _import_facility(self, facility):
        """Import a single facility from API response."""
        lat = facility.get('latitude')
        lon = facility.get('longitude')
        
        # Skip if no coordinates
        if not lat or not lon:
            return 'skipped'
        
        # Validate bounds
        if not (-2 <= lat <= 5 and 29 <= lon <= 36):
            return 'skipped'
        
        district = facility.get('district', {}).get('name', '')
        facility_level = facility.get('facility_level', {}).get('name', '')
        ownership = facility.get('ownership', {}).get('name', '')
        authority = facility.get('authority', {}).get('name', '')
        
        facility_type = self._map_facility_type(facility_level)
        
        bed_capacity = facility.get('bed_capacity')
        max_capacity = bed_capacity if bed_capacity else self._estimate_capacity(facility_type)
        
        hospital, created = Hospital.objects.update_or_create(
            name=facility['name'],
            defaults={
                'facility_type': facility_type,
                'district': district,
                'address': facility.get('address', f"{facility['name']}, {district}, Uganda"),
                'latitude': lat,
                'longitude': lon,
                'phone_number': facility.get('contact_personmobile', ''),
                'email': facility.get('contact_personemail', ''),
                'specialties': facility.get('services', 'general'),
                'max_capacity': max_capacity,
                'operating_hours': '24/7',
                'is_operational': facility.get('status') == 'Functional',
                'emergency_capacity_status': Hospital.CapacityStatus.AVAILABLE,
            }
        )
        
        return 'created' if created else 'updated'
    
    def _map_facility_type(self, level):
        """Map facility level to Django model choice."""
        level_upper = level.upper()
        
        if 'NATIONAL' in level_upper or 'REFERRAL' in level_upper:
            return 'REFERRAL'
        elif 'REGIONAL' in level_upper:
            return 'REGIONAL'
        elif 'GENERAL' in level_upper or 'HOSPITAL' in level_upper:
            return 'HOSPITAL'
        elif 'HC IV' in level_upper:
            return 'HC_IV'
        elif 'HC III' in level_upper:
            return 'HC_III'
        elif 'HC II' in level_upper:
            return 'HC_II'
        elif 'CLINIC' in level_upper:
            return 'CLINIC'
        else:
            return 'HOSPITAL'
    
    def _estimate_capacity(self, facility_type):
        """Estimate bed capacity based on facility type."""
        capacity_map = {
            'REFERRAL': 1000,
            'REGIONAL': 500,
            'GENERAL': 200,
            'HOSPITAL': 100,
            'HC_IV': 100,
            'HC_III': 50,
            'HC_II': 20,
            'CLINIC': 10,
        }
        return capacity_map.get(facility_type, 100)
