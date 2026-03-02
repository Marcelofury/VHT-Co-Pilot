"""
Management command to import health facilities from CSV with manually provided GPS coordinates.
Also imports village GPS coordinates for patient location tracking.
"""
import csv
from django.core.management.base import BaseCommand
from core.models import Hospital


class Command(BaseCommand):
    help = 'Import health facilities from CSV file with GPS coordinates'
    
    def add_arguments(self, parser):
        parser.add_argument('csv_path', type=str, help='Path to CSV file with facility data')
        parser.add_argument('--clear', action='store_true', help='Clear existing hospitals before import')
    
    def handle(self, *args, **options):
        csv_path = options['csv_path']
        clear_existing = options.get('clear', False)
        
        self.stdout.write(f'\n{"="*70}')
        self.stdout.write(f'📍 UGANDA HEALTH FACILITY GPS IMPORT')
        self.stdout.write(f'{"="*70}')
        self.stdout.write(f'CSV: {csv_path}')
        self.stdout.write(f'{"="*70}\n')
        
        # Clear existing if requested
        if clear_existing:
            count = Hospital.objects.count()
            Hospital.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Cleared {count} existing hospitals\n'))
        
        # Read CSV
        try:
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                created_count = 0
                updated_count = 0
                skipped_count = 0
                
                for idx, row in enumerate(reader, 1):
                    facility_name = row.get('facility_name', '').strip()
                    district = row.get('district', '').strip()
                    level = row.get('level', '').strip()
                    latitude = row.get('latitude', '').strip()
                    longitude = row.get('longitude', '').strip()
                    
                    # Skip if no GPS coordinates provided
                    if not latitude or not longitude:
                        skipped_count += 1
                        continue
                    
                    try:
                        lat = float(latitude)
                        lon = float(longitude)
                    except ValueError:
                        self.stdout.write(
                            self.style.ERROR(f'  [{idx}] Invalid coordinates for {facility_name}')
                        )
                        skipped_count += 1
                        continue
                    
                    # Validate Uganda bounds
                    if not (-2 <= lat <= 5 and 29 <= lon <= 36):
                        self.stdout.write(
                            self.style.ERROR(f'  [{idx}] Coordinates outside Uganda for {facility_name}')
                        )
                        skipped_count += 1
                        continue
                    
                    # Map facility type
                    facility_type = self._map_facility_type(level)
                    max_capacity = self._estimate_capacity(level)
                    
                    # Create/update hospital
                    hospital, created = Hospital.objects.update_or_create(
                        name=facility_name,
                        defaults={
                            'facility_type': facility_type,
                            'district': district,
                            'address': f"{facility_name}, {district}, Uganda",
                            'latitude': lat,
                            'longitude': lon,
                            'phone_number': '',
                            'email': '',
                            'specialties': 'general',
                            'max_capacity': max_capacity,
                            'operating_hours': '24/7',
                            'is_operational': True,
                            'emergency_capacity_status': Hospital.CapacityStatus.AVAILABLE,
                        }
                    )
                    
                    if created:
                        created_count += 1
                        if created_count % 100 == 0:
                            self.stdout.write(f'  Processed {created_count} facilities...')
                    else:
                        updated_count += 1
                
                # Summary
                self.stdout.write(f'\n{"="*70}')
                self.stdout.write(self.style.SUCCESS(f'✅ IMPORT COMPLETE!'))
                self.stdout.write(f'{"="*70}')
                self.stdout.write(f'✓ Created: {created_count}')
                self.stdout.write(f'↻ Updated: {updated_count}')
                self.stdout.write(f'⊗ Skipped (no GPS): {skipped_count}')
                self.stdout.write(f'{"="*70}\n')
                
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {csv_path}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            import traceback
            traceback.print_exc()
    
    def _map_facility_type(self, level):
        """Map facility level to Django model choice."""
        level_lower = level.lower()
        
        if 'hospital' in level_lower:
            if 'referral' in level_lower or 'national' in level_lower:
                return 'REFERRAL'
            elif 'regional' in level_lower:
                return 'REGIONAL'
            elif 'general' in level_lower:
                return 'GENERAL'
            else:
                return 'HOSPITAL'
        elif 'hc iv' in level_lower or 'health centre iv' in level_lower:
            return 'HC_IV'
        elif 'hc iii' in level_lower or 'health centre iii' in level_lower:
            return 'HC_III'
        elif 'hc ii' in level_lower or 'health centre ii' in level_lower:
            return 'HC_II'
        elif 'clinic' in level_lower:
            return 'CLINIC'
        else:
            return 'HOSPITAL'
    
    def _estimate_capacity(self, level):
        """Estimate bed capacity based on facility level."""
        facility_type = self._map_facility_type(level)
        
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
