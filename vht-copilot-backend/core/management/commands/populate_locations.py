"""
Management command to populate Districts and Villages from uganda_locations.py
"""
from django.core.management.base import BaseCommand
from core.models import District, Village
from core.uganda_locations import UGANDA_LOCATIONS
from core.uganda_villages import UGANDA_VILLAGES


class Command(BaseCommand):
    help = 'Populate Districts and Villages from uganda_locations.py'

    def handle(self, *args, **options):
        self.stdout.write("Populating Districts and Villages...")
        
        districts_created = 0
        villages_created = 0
        
        # Process UGANDA_LOCATIONS to create Districts
        for region_name, region_data in UGANDA_LOCATIONS.items():
            for district_name, district_data in region_data.items():
                # Check if district exists
                district, created = District.objects.get_or_create(
                    name=district_name,
                    defaults={
                        'region': region_name,
                        'latitude': district_data['coordinates']['latitude'],
                        'longitude': district_data['coordinates']['longitude'],
                    }
                )
                
                if created:
                    districts_created += 1
                    self.stdout.write(f"✅ Created district: {district_name}")
                else:
                    self.stdout.write(f"⚪ District already exists: {district_name}")
        
        # Process UGANDA_VILLAGES to create Villages
        for district_name, villages_data in UGANDA_VILLAGES.items():
            # Find the district
            try:
                district = District.objects.get(name=district_name)
            except District.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f"⚠️  District not found for villages: {district_name}"
                ))
                continue
            
            for village_name, coords in villages_data.items():
                # Check if village exists
                village, created = Village.objects.get_or_create(
                    name=village_name,
                    district=district,
                    defaults={
                        'latitude': coords['latitude'],
                        'longitude': coords['longitude'],
                    }
                )
                
                if created:
                    villages_created += 1
                    if villages_created % 50 == 0:
                        self.stdout.write(f"✅ Created {villages_created} villages...")
        
        # Update District.village_count
        for district in District.objects.all():
            district.village_count = district.villages.count()
            district.save()
        
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Successfully created {districts_created} districts and {villages_created} villages"
        ))
        self.stdout.write(self.style.SUCCESS(
            f"📊 Total: {District.objects.count()} districts, {Village.objects.count()} villages"
        ))
