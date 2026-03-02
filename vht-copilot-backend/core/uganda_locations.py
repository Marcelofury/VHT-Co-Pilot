"""
Uganda Location Data
Real districts, sub-counties, and parishes with GPS coordinates
"""

UGANDA_LOCATIONS = {
    "Central Region": {
        "Kampala": {
            "coordinates": {"latitude": 0.3476, "longitude": 32.5825},
            "sub_counties": {
                "Kawempe": {
                    "coordinates": {"latitude": 0.3783, "longitude": 32.5575},
                    "parishes": ["Kazo", "Makerere", "Mulago", "Wandegeya"],
                },
                "Makindye": {
                    "coordinates": {"latitude": 0.2816, "longitude": 32.5948},
                    "parishes": ["Katwe", "Kibuye", "Lukuli", "Nsambya"],
                },
                "Nakawa": {
                    "coordinates": {"latitude": 0.3358, "longitude": 32.6258},
                    "parishes": ["Bugolobi", "Butabika", "Luzira", "Mbuya"],
                },
                "Rubaga": {
                    "coordinates": {"latitude": 0.2983, "longitude": 32.5617},
                    "parishes": ["Lubaga", "Mengo", "Namirembe", "Rubaga"],
                },
                "Central": {
                    "coordinates": {"latitude": 0.3136, "longitude": 32.5811},
                    "parishes": ["City Center", "Industrial Area", "Kololo", "Nakasero"],
                },
            },
        },
        "Wakiso": {
            "coordinates": {"latitude": 0.4044, "longitude": 32.4594},
            "sub_counties": {
                "Entebbe": {
                    "coordinates": {"latitude": 0.0560, "longitude": 32.4795},
                    "parishes": ["Nakiwogo", "Kigungu", "Kitoro", "Bugonga"],
                },
                "Nansana": {
                    "coordinates": {"latitude": 0.3658, "longitude": 32.5311},
                    "parishes": ["Nabweru", "Gombe", "Busukuma", "Nansana"],
                },
                "Kira": {
                    "coordinates": {"latitude": 0.3944, "longitude": 32.6375},
                    "parishes": ["Bweyogerere", "Kira", "Kimwaanyi", "Kasokoso"],
                },
                "Makindye-Ssabagabo": {
                    "coordinates": {"latitude": 0.2508, "longitude": 32.5517},
                    "parishes": ["Ggaba", "Munyonyo", "Bukasa", "Kiwafu"],
                },
            },
        },
        "Mukono": {
            "coordinates": {"latitude": 0.3531, "longitude": 32.7553},
            "sub_counties": {
                "Mukono Town": {
                    "coordinates": {"latitude": 0.3531, "longitude": 32.7553},
                    "parishes": ["Central", "Nakifuma", "Ttamu", "Nantabulirirwa"],
                },
                "Goma": {
                    "coordinates": {"latitude": 0.2050, "longitude": 32.9400},
                    "parishes": ["Goma", "Seeta", "Namuganga", "Kimenyedde"],
                },
            },
        },
        "Mpigi": {
            "coordinates": {"latitude": 0.2253, "longitude": 32.3142},
            "sub_counties": {
                "Mpigi Town": {
                    "coordinates": {"latitude": 0.2253, "longitude": 32.3142},
                    "parishes": ["Central", "Buwama", "Kitanda", "Mpigi"],
                },
            },
        },
    },
    "Eastern Region": {
        "Mbale": {
            "coordinates": {"latitude": 1.0820, "longitude": 34.1753},
            "sub_counties": {
                "Mbale Municipality": {
                    "coordinates": {"latitude": 1.0820, "longitude": 34.1753},
                    "parishes": ["Industrial", "Wanale", "Namatala", "Namabasa"],
                },
                "Bududa": {
                    "coordinates": {"latitude": 1.0111, "longitude": 34.3264},
                    "parishes": ["Bushika", "Bukalasi", "Bukigai", "Bulucheke"],
                },
            },
        },
        "Jinja": {
            "coordinates": {"latitude": 0.4244, "longitude": 33.2040},
            "sub_counties": {
                "Jinja Municipality": {
                    "coordinates": {"latitude": 0.4244, "longitude": 33.2040},
                    "parishes": ["Mpumudde", "Walukuba", "Bugembe", "Masese"],
                },
            },
        },
        "Soroti": {
            "coordinates": {"latitude": 1.7147, "longitude": 33.6111},
            "sub_counties": {
                "Soroti Municipality": {
                    "coordinates": {"latitude": 1.7147, "longitude": 33.6111},
                    "parishes": ["Eastern", "Western", "Tubur", "Arapai"],
                },
            },
        },
        "Tororo": {
            "coordinates": {"latitude": 0.6927, "longitude": 34.1806},
            "sub_counties": {
                "Tororo Municipality": {
                    "coordinates": {"latitude": 0.6927, "longitude": 34.1806},
                    "parishes": ["Eastern", "Western", "Railway", "Hospital"],
                },
            },
        },
    },
    "Northern Region": {
        "Gulu": {
            "coordinates": {"latitude": 2.7742, "longitude": 32.2992},
            "sub_counties": {
                "Gulu Municipality": {
                    "coordinates": {"latitude": 2.7742, "longitude": 32.2992},
                    "parishes": ["Bardege", "Layibi", "Pece", "Laroo"],
                },
                "Omoro": {
                    "coordinates": {"latitude": 2.6167, "longitude": 32.4667},
                    "parishes": ["Odek", "Lakwana", "Acholibur", "Ongako"],
                },
            },
        },
        "Lira": {
            "coordinates": {"latitude": 2.2397, "longitude": 32.8989},
            "sub_counties": {
                "Lira Municipality": {
                    "coordinates": {"latitude": 2.2397, "longitude": 32.8989},
                    "parishes": ["Adyel", "Ojwina", "Railway", "Central"],
                },
            },
        },
        "Arua": {
            "coordinates": {"latitude": 3.0197, "longitude": 30.9108},
            "sub_counties": {
                "Arua Municipality": {
                    "coordinates": {"latitude": 3.0197, "longitude": 30.9108},
                    "parishes": ["Hill", "River", "Avenue", "Oli"],
                },
            },
        },
    },
    "Western Region": {
        "Mbarara": {
            "coordinates": {"latitude": -0.6138, "longitude": 30.6610},
            "sub_counties": {
                "Mbarara Municipality": {
                    "coordinates": {"latitude": -0.6138, "longitude": 30.6610},
                    "parishes": ["Kakoba", "Nyamitanga", "Kamukuzi", "Biharwe"],
                },
            },
        },
        "Fort Portal": {
            "coordinates": {"latitude": 0.6714, "longitude": 30.2747},
            "sub_counties": {
                "Fort Portal Municipality": {
                    "coordinates": {"latitude": 0.6714, "longitude": 30.2747},
                    "parishes": ["Central", "Mpanga", "Kijanju", "Boma"],
                },
            },
        },
        "Kasese": {
            "coordinates": {"latitude": 0.1833, "longitude": 30.0833},
            "sub_counties": {
                "Kasese Municipality": {
                    "coordinates": {"latitude": 0.1833, "longitude": 30.0833},
                    "parishes": ["Nyamwamba", "Railway", "Rukoki", "Kanyangeya"],
                },
            },
        },
        "Hoima": {
            "coordinates": {"latitude": 1.4333, "longitude": 31.3500},
            "sub_counties": {
                "Hoima Municipality": {
                    "coordinates": {"latitude": 1.4333, "longitude": 31.3500},
                    "parishes": ["Central", "Mparo", "Bugambe", "Kahoora"],
                },
            },
        },
    },
}

# Real hospitals in Uganda with GPS coordinates
UGANDA_HOSPITALS = [
    # Central Region
    {
        "name": "Mulago National Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Kampala",
        "sub_county": "Kawempe",
        "address": "Hill Road, Mulago Hill, Kampala",
        "latitude": 0.3354,
        "longitude": 32.5750,
        "phone_number": "+256414530020",
        "email": "info@mulagohospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery,oncology,cardiology",
        "max_capacity": 1500,
        "operating_hours": "24/7",
    },
    {
        "name": "Mengo Hospital",
        "facility_type": "HOSPITAL",
        "district": "Kampala",
        "sub_county": "Rubaga",
        "address": "Namirembe Road, Mengo, Kampala",
        "latitude": 0.3000,
        "longitude": 32.5617,
        "phone_number": "+256414270401",
        "email": "info@mengohospital.org",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 300,
        "operating_hours": "24/7",
    },
    {
        "name": "Nsambya Hospital",
        "facility_type": "HOSPITAL",
        "district": "Kampala",
        "sub_county": "Makindye",
        "address": "Ggaba Road, Nsambya, Kampala",
        "latitude": 0.2983,
        "longitude": 32.5917,
        "phone_number": "+256414267051",
        "email": "info@nsambyahospital.org",
        "specialties": "general,emergency,pediatrics,maternity,surgery,orthopedics",
        "max_capacity": 350,
        "operating_hours": "24/7",
    },
    {
        "name": "Kiruddu National Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Kampala",
        "sub_county": "Makindye",
        "address": "Kiruddu, Kampala",
        "latitude": 0.2567,
        "longitude": 32.5783,
        "phone_number": "+256414231000",
        "email": "info@kirudduhospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery,icu",
        "max_capacity": 800,
        "operating_hours": "24/7",
    },
    {
        "name": "Entebbe Grade B Hospital",
        "facility_type": "HOSPITAL",
        "district": "Wakiso",
        "sub_county": "Entebbe",
        "address": "Church Road, Entebbe",
        "latitude": 0.0560,
        "longitude": 32.4795,
        "phone_number": "+256414320503",
        "email": "info@entebbehospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity",
        "max_capacity": 200,
        "operating_hours": "24/7",
    },
    # Eastern Region
    {
        "name": "Mbale Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Mbale",
        "sub_county": "Mbale Municipality",
        "address": "Cathedral Avenue, Mbale",
        "latitude": 1.0753,
        "longitude": 34.1778,
        "phone_number": "+256454433471",
        "email": "info@mbalehospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery,orthopedics",
        "max_capacity": 500,
        "operating_hours": "24/7",
    },
    {
        "name": "Jinja Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Jinja",
        "sub_county": "Jinja Municipality",
        "address": "Main Street, Jinja",
        "latitude": 0.4382,
        "longitude": 33.2031,
        "phone_number": "+256434120549",
        "email": "info@jinjahospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 450,
        "operating_hours": "24/7",
    },
    {
        "name": "Soroti Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Soroti",
        "sub_county": "Soroti Municipality",
        "address": "Gweri Road, Soroti",
        "latitude": 1.7147,
        "longitude": 33.6111,
        "phone_number": "+256454461006",
        "email": "info@sorotihospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 350,
        "operating_hours": "24/7",
    },
    # Northern Region
    {
        "name": "Gulu Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Gulu",
        "sub_county": "Gulu Municipality",
        "address": "Pece Stadium Road, Gulu",
        "latitude": 2.7733,
        "longitude": 32.3011,
        "phone_number": "+256471432151",
        "email": "info@guluhospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 400,
        "operating_hours": "24/7",
    },
    {
        "name": "Lira Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Lira",
        "sub_county": "Lira Municipality",
        "address": "Obote Avenue, Lira",
        "latitude": 2.2492,
        "longitude": 32.8989,
        "phone_number": "+256473420206",
        "email": "info@lirahospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 300,
        "operating_hours": "24/7",
    },
    {
        "name": "Arua Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Arua",
        "sub_county": "Arua Municipality",
        "address": "Hospital Road, Arua",
        "latitude": 3.0258,
        "longitude": 30.9167,
        "phone_number": "+256476420206",
        "email": "info@aruahospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 350,
        "operating_hours": "24/7",
    },
    # Western Region
    {
        "name": "Mbarara Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Mbarara",
        "sub_county": "Mbarara Municipality",
        "address": "Mbaguta Street, Mbarara",
        "latitude": -0.6069,
        "longitude": 30.6583,
        "phone_number": "+256485420763",
        "email": "info@mbararahospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery,orthopedics",
        "max_capacity": 500,
        "operating_hours": "24/7",
    },
    {
        "name": "Fort Portal Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Fort Portal",
        "sub_county": "Fort Portal Municipality",
        "address": "Hospital Road, Fort Portal",
        "latitude": 0.6611,
        "longitude": 30.2747,
        "phone_number": "+256483422015",
        "email": "info@fortportalhospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 300,
        "operating_hours": "24/7",
    },
    {
        "name": "Hoima Regional Referral Hospital",
        "facility_type": "REFERRAL",
        "district": "Hoima",
        "sub_county": "Hoima Municipality",
        "address": "Bunyoro Road, Hoima",
        "latitude": 1.4297,
        "longitude": 31.3517,
        "phone_number": "+256465440206",
        "email": "info@hoimahospital.go.ug",
        "specialties": "general,emergency,pediatrics,maternity,surgery",
        "max_capacity": 250,
        "operating_hours": "24/7",
    },
]


def get_all_districts():
    """Get list of all districts"""
    districts = []
    for region, region_data in UGANDA_LOCATIONS.items():
        for district in region_data.keys():
            districts.append(district)
    return sorted(districts)


def get_sub_counties(district):
    """Get sub-counties for a given district"""
    for region_data in UGANDA_LOCATIONS.values():
        if district in region_data:
            return list(region_data[district]["sub_counties"].keys())
    return []


def get_parishes(district, sub_county):
    """Get parishes for a given district and sub-county"""
    for region_data in UGANDA_LOCATIONS.values():
        if district in region_data:
            if sub_county in region_data[district]["sub_counties"]:
                return region_data[district]["sub_counties"][sub_county]["parishes"]
    return []


def get_coordinates(district, sub_county=None):
    """Get GPS coordinates for a location"""
    for region_data in UGANDA_LOCATIONS.values():
        if district in region_data:
            if sub_county and sub_county in region_data[district]["sub_counties"]:
                return region_data[district]["sub_counties"][sub_county]["coordinates"]
            return region_data[district]["coordinates"]
    return None


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two GPS coordinates using Haversine formula
    Returns distance in kilometers
    """
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return distance


def find_nearest_hospitals(latitude, longitude, triage_level="MODERATE", max_results=3):
    """
    Find nearest hospitals based on location and triage level
    
    Args:
        latitude: Patient's latitude
        longitude: Patient's longitude
        triage_level: URGENT, HIGH_RISK, MODERATE, or LOW_RISK
        max_results: Maximum number of hospitals to return
    
    Returns:
        List of hospitals sorted by distance
    """
    # Filter hospitals by facility type based on triage level
    if triage_level in ["URGENT", "CRITICAL"]:
        # For urgent cases, prioritize referral hospitals
        suitable_hospitals = [h for h in UGANDA_HOSPITALS if h["facility_type"] in ["REFERRAL", "HOSPITAL"]]
    elif triage_level == "HIGH_RISK":
        # High risk can go to hospitals or HC IV
        suitable_hospitals = [h for h in UGANDA_HOSPITALS if h["facility_type"] in ["REFERRAL", "HOSPITAL", "HCIV"]]
    else:
        # Moderate and low risk can go to any facility
        suitable_hospitals = UGANDA_HOSPITALS.copy()
    
    # Calculate distances
    hospitals_with_distance = []
    for hospital in suitable_hospitals:
        distance = calculate_distance(
            latitude, longitude,
            hospital["latitude"], hospital["longitude"]
        )
        hospital_data = hospital.copy()
        hospital_data["distance_km"] = round(distance, 2)
        hospitals_with_distance.append(hospital_data)
    
    # Sort by distance
    hospitals_with_distance.sort(key=lambda x: x["distance_km"])
    
    return hospitals_with_distance[:max_results]
