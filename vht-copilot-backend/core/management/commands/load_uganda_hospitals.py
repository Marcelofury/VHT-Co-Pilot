"""
Management command to populate Uganda hospitals in database
"""
from django.core.management.base import BaseCommand
from core.models import Hospital
from core.uganda_locations import UGANDA_HOSPITALS


class Command(BaseCommand):
    help = 'Populate database with real Uganda hospitals'

    def handle(self, *args, **options):
        self.stdout.write('Loading Uganda hospitals...')
        
        created_count = 0
        updated_count = 0
        
        for hospital_data in UGANDA_HOSPITALS:
            hospital, created = Hospital.objects.update_or_create(
                name=hospital_data['name'],
                defaults={
                    'facility_type': hospital_data['facility_type'],
                    'district': hospital_data['district'],
                    'address': hospital_data['address'],
                    'latitude': hospital_data['latitude'],
                    'longitude': hospital_data['longitude'],
                    'phone_number': hospital_data['phone_number'],
                    'email': hospital_data['email'],
                    'specialties': hospital_data['specialties'],
                    'max_capacity': hospital_data['max_capacity'],
                    'operating_hours': hospital_data['operating_hours'],
                    'is_operational': True,
                    'emergency_capacity_status': Hospital.CapacityStatus.AVAILABLE,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Created: {hospital.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'  ↻ Updated: {hospital.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully loaded {len(UGANDA_HOSPITALS)} hospitals'
            )
        )
        self.stdout.write(f'   Created: {created_count}')
        self.stdout.write(f'   Updated: {updated_count}')
