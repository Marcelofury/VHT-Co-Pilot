"""
Uganda Village GPS Coordinates Database
Used by VHT for patient location tracking and automatic nearest hospital allocation.
"""

UGANDA_VILLAGES = {
    # Kampala District Villages
    "Kampala": {
        "Kololo": {"latitude": 0.3203, "longitude": 32.5958},
        "Nakasero": {"latitude": 0.3262, "longitude": 32.5822},
        "Mengo": {"latitude": 0.2996, "longitude": 32.5583},
        "Rubaga": {"latitude": 0.3039, "longitude": 32.5417},
        "Makindye": {"latitude": 0.2858, "longitude": 32.6014},
        "Kawempe": {"latitude": 0.3742, "longitude": 32.5597},
        "Nakawa": {"latitude": 0.3303, "longitude": 32.6186},
        "Kabalagala": {"latitude": 0.2936, "longitude": 32.5897},
        "Ntinda": {"latitude": 0.3583, "longitude": 32.6214},
        "Wandegeya": {"latitude": 0.3319, "longitude": 32.5689},
    },
    
    # Wakiso District Villages
    "Wakiso": {
        "Entebbe": {"latitude": 0.0564, "longitude": 32.4794},
        "Nansana": {"latitude": 0.3658, "longitude": 32.5256},
        "Kira": {"latitude": 0.3967, "longitude": 32.6336},
        "Mukono": {"latitude": 0.3536, "longitude": 32.7553},
        "Kasangati": {"latitude": 0.4458, "longitude": 32.5964},
        "Namugongo": {"latitude": 0.3681, "longitude": 32.6742},
        "Busega": {"latitude": 0.3092, "longitude": 32.5211},
        "Namasuba": {"latitude": 0.2944, "longitude": 32.5469},
    },
    
    # Mbale District Villages
    "Mbale": {
        "Mbale Town": {"latitude": 1.0821, "longitude": 34.1753},
        "Bufumbo": {"latitude": 1.0500, "longitude": 34.2000},
        "Busoba": {"latitude": 1.1000, "longitude": 34.1500},
        "Namanyonyi": {"latitude": 1.0300, "longitude": 34.1800},
    },
    
    # Gulu District Villages
    "Gulu": {
        "Gulu Town": {"latitude": 2.7742, "longitude": 32.2992},
        "Laroo": {"latitude": 2.7800, "longitude": 32.3100},
        "Pece": {"latitude": 2.7600, "longitude": 32.2850},
        "Bardege": {"latitude": 2.7900, "longitude": 32.3200},
    },
    
    # Mbarara District Villages  
    "Mbarara": {
        "Mbarara Town": {"latitude": 0.6083, "longitude": 30.6589},
        "Kakoba": {"latitude": 0.6100, "longitude": 30.6650},
        "Kamukuzi": {"latitude": 0.6050, "longitude": 30.6530},
        "Nyamitanga": {"latitude": 0.6200, "longitude": 30.6700},
    },
    
    # Jinja District Villages
    "Jinja": {
        "Jinja Town": {"latitude": 0.4244, "longitude": 33.2042},
        "Walukuba": {"latitude": 0.4300, "longitude": 33.2100},
        "Bugembe": {"latitude": 0.4400, "longitude": 33.2200},
        "Budondo": {"latitude": 0.4100, "longitude": 33.1900},
    },
    
    # Lira District Villages
    "Lira": {
        "Lira Town": {"latitude": 2.2394, "longitude": 32.8989},
        "Adyel": {"latitude": 2.2500, "longitude": 32.9100},
        "Ojwina": {"latitude": 2.2300, "longitude": 32.8850},
    },
    
    # Arua District Villages
    "Arua": {
        "Arua Town": {"latitude": 3.0197, "longitude": 30.9108},
        "Aiivu": {"latitude": 3.0300, "longitude": 30.9200},
        "Oli": {"latitude": 3.0100, "longitude": 30.9000},
    },
    
    # Masaka District Villages
    "Masaka": {
        "Masaka Town": {"latitude": 0.3378, "longitude": 31.7336},
        "Nyendo": {"latitude": 0.3200, "longitude": 31.7200},
        "Kitovu": {"latitude": 0.3450, "longitude": 31.7400},
    },
    
    # Fort Portal District Villages
    "Kabarole": {
        "Fort Portal": {"latitude": 0.6711, "longitude": 30.2753},
        "Boma": {"latitude": 0.6750, "longitude": 30.2800},
        "Central": {"latitude": 0.6700, "longitude": 30.2700},
    },
    
    # Kabale District Villages
    "Kabale": {
        "Kabale Town": {"latitude": -1.2486, "longitude": 29.9894},
        "Rwakaraba": {"latitude": -1.2550, "longitude": 30.0000},
        "Kikungiri": {"latitude": -1.2400, "longitude": 29.9800},
    },
    
    # Kisoro District Villages
    "Kisoro": {
        "Kisoro Town": {"latitude": -1.2869, "longitude": 29.6853},
        "Bunagana": {"latitude": -1.2936, "longitude": 29.6342},
        "Nyundo": {"latitude": -1.2800, "longitude": 29.6900},
    },
    
    # Tororo District Villages
    "Tororo": {
        "Tororo Town": {"latitude": 0.6930, "longitude": 34.1808},
        "Mulanda": {"latitude": 0.7000, "longitude": 34.1900},
        "Nagongera": {"latitude": 0.6800, "longitude": 34.1700},
    },
    
    # Soroti District Villages
    "Soroti": {
        "Soroti Town": {"latitude": 1.7147, "longitude": 33.6111},
        "Arapai": {"latitude": 1.7200, "longitude": 33.6200},
        "Opiyai": {"latitude": 1.7100, "longitude": 33.6000},
    },
    
    # Moroto District Villages
    "Moroto": {
        "Moroto Town": {"latitude": 2.5353, "longitude": 34.6664},
        "Nadunget": {"latitude": 2.5400, "longitude": 34.6700},
        "Rupa": {"latitude": 2.5300, "longitude": 34.6600},
    },
    
    # Kitgum District Villages
    "Kitgum": {
        "Kitgum Town": {"latitude": 3.2817, "longitude": 32.8864},
        "Pandwong": {"latitude": 3.2900, "longitude": 32.9000},
        "Mucwini": {"latitude": 3.2700, "longitude": 32.8700},
    },
    
    # Hoima District Villages
    "Hoima": {
        "Hoima Town": {"latitude": 1.4331, "longitude": 31.3522},
        "Kigorobya": {"latitude": 1.4400, "longitude": 31.3600},
        "Bujumbura": {"latitude": 1.4250, "longitude": 31.3450},
    },
    
    # Masindi District Villages
    "Masindi": {
        "Masindi Town": {"latitude": 1.6742, "longitude": 31.7147},
        "Kijunjubwa": {"latitude": 1.6800, "longitude": 31.7200},
        "Karujubu": {"latitude": 1.6700, "longitude": 31.7100},
    },
    
    # Iganga District Villages
    "Iganga": {
        "Iganga Town": {"latitude": 0.6092, "longitude": 33.4686},
        "Nakalama": {"latitude": 0.6150, "longitude": 33.4800},
        "Busembatia": {"latitude": 0.6000, "longitude": 33.4600},
    },
    
    # Bugiri District Villages
    "Bugiri": {
        "Bugiri Town": {"latitude": 0.5714, "longitude": 33.7422},
        "Buluguyi": {"latitude": 0.5800, "longitude": 33.7500},
        "Busitema": {"latitude": 0.5600, "longitude": 33.7300},
    },
    
    # Rukungiri District Villages
    "Rukungiri": {
        "Rukungiri Town": {"latitude": -0.7878, "longitude": 29.9389},
        "Buyanja": {"latitude": -0.7900, "longitude": 29.9450},
        "Kebisoni": {"latitude": -0.7800, "longitude": 29.9300},
    },
    
    # Ntungamo District Villages
    "Ntungamo": {
        "Ntungamo Town": {"latitude": -0.8794, "longitude": 30.2642},
        "Rubaare": {"latitude": -0.8850, "longitude": 30.2700},
        "Rwashamaire": {"latitude": -0.8700, "longitude": 30.2550},
    },
    
    # Mubende District Villages
    "Mubende": {
        "Mubende Town": {"latitude": 0.5836, "longitude": 31.3950},
        "Kassanda": {"latitude": 0.5900, "longitude": 31.4050},
        "Kiganda": {"latitude": 0.5750, "longitude": 31.3850},
    },
    
    # Mukono District Villages
    "Mukono": {
        "Mukono Town": {"latitude": 0.3536, "longitude": 32.7553},
        "Seeta": {"latitude": 0.3600, "longitude": 32.7650},
        "Goma": {"latitude": 0.3450, "longitude": 32.7450},
    },
    
    # Kamuli District Villages
    "Kamuli": {
        "Kamuli Town": {"latitude": 0.9472, "longitude": 33.1197},
        "Bugulumbya": {"latitude": 0.9550, "longitude": 33.1300},
        "Namwendwa": {"latitude": 0.9400, "longitude": 33.1100},
    },
    
    # Kumi District Villages
    "Kumi": {
        "Kumi Town": {"latitude": 1.4608, "longitude": 33.9367},
        "Ongino": {"latitude": 1.4700, "longitude": 33.9450},
        "Mukongoro": {"latitude": 1.4500, "longitude": 33.9250},
    },
    
    # Pallisa District Villages
    "Pallisa": {
        "Pallisa Town": {"latitude": 1.1453, "longitude": 33.7094},
        "Agule": {"latitude": 1.1550, "longitude": 33.7200},
        "Butebo": {"latitude": 1.1350, "longitude": 33.6950},
    },
    
    # Apac District Villages
    "Apac": {
        "Apac Town": {"latitude": 1.9753, "longitude": 32.5381},
        "Akokoro": {"latitude": 1.9850, "longitude": 32.5500},
        "Apoi": {"latitude": 1.9650, "longitude": 32.5250},
    },
    
    # Nebbi District Villages
    "Nebbi": {
        "Nebbi Town": {"latitude": 2.4783, "longitude": 31.0886},
        "Panyango": {"latitude": 2.4900, "longitude": 31.1000},
        "Erussi": {"latitude": 2.4650, "longitude": 31.0750},
    },
    
    # Yumbe District Villages
    "Yumbe": {
        "Yumbe Town": {"latitude": 3.4656, "longitude": 31.2469},
        "Romogi": {"latitude": 3.4750, "longitude": 31.2550},
        "Kuru": {"latitude": 3.4550, "longitude": 31.2350},
    },
    
    # Adjumani District Villages
    "Adjumani": {
        "Adjumani Town": {"latitude": 3.3778, "longitude": 31.7908},
        "Dzaipi": {"latitude": 3.3900, "longitude": 31.8050},
        "Pakele": {"latitude": 3.3650, "longitude": 31.7750},
    },
    
    # Moyo District Villages
    "Moyo": {
        "Moyo Town": {"latitude": 3.6581, "longitude": 31.7244},
        "Metu": {"latitude": 3.6700, "longitude": 31.7350},
        "Lefori": {"latitude": 3.6450, "longitude": 31.7100},
    },
    
    # Koboko District Villages
    "Koboko": {
        "Koboko Town": {"latitude": 3.4194, "longitude": 30.9597},
        "Ludara": {"latitude": 3.4300, "longitude": 30.9700},
        "Kuluba": {"latitude": 3.4100, "longitude": 30.9450},
    },
    
    # Maracha District Villages
    "Maracha": {
        "Maracha Town": {"latitude": 3.2336, "longitude": 30.9306},
        "Oluffe": {"latitude": 3.2450, "longitude": 30.9400},
        "Ovujo": {"latitude": 3.2200, "longitude": 30.9200},
    },
    
    # Zombo District Villages
    "Zombo": {
        "Zombo Town": {"latitude": 2.5239, "longitude": 30.9117},
        "Paidha": {"latitude": 2.5350, "longitude": 30.9250},
        "Warr": {"latitude": 2.5100, "longitude": 30.9000},
    },
    
    # Rakai District Villages
    "Rakai": {
        "Rakai Town": {"latitude": -0.6919, "longitude": 31.4175},
        "Kyotera": {"latitude": -0.6300, "longitude": 31.4833},
        "Kakuuto": {"latitude": -0.7500, "longitude": 31.3500},
    },
    
    # Mityana District Villages
    "Mityana": {
        "Mityana Town": {"latitude": 0.4175, "longitude": 32.0227},
        "Kalangalo": {"latitude": 0.4250, "longitude": 32.0350},
        "Maanyi": {"latitude": 0.4100, "longitude": 32.0100},
    },
    
    # Kiboga District Villages
    "Kiboga": {
        "Kiboga Town": {"latitude": 0.9172, "longitude": 31.7739},
        "Bukomero": {"latitude": 0.9250, "longitude": 31.7850},
        "Kapeke": {"latitude": 0.9100, "longitude": 31.7600},
    },
    
    # Kayunga District Villages
    "Kayunga": {
        "Kayunga Town": {"latitude": 0.7025, "longitude": 32.8889},
        "Kangulumira": {"latitude": 0.7150, "longitude": 32.9000},
        "Busaana": {"latitude": 0.6900, "longitude": 32.8750},
    },
    
    # Nakaseke District Villages
    "Nakaseke": {
        "Nakaseke Town": {"latitude": 0.6778, "longitude": 32.0717},
        "Semuto": {"latitude": 0.6900, "longitude": 32.0850},
        "Kiwoko": {"latitude": 0.6650, "longitude": 32.0550},
    },
    
    # Luwero District Villages
    "Luwero": {
        "Luwero Town": {"latitude": 0.8492, "longitude": 32.4731},
        "Wobulenzi": {"latitude": 0.7250, "longitude": 32.5108},
        "Kikyusa": {"latitude": 0.8600, "longitude": 32.4850},
    },
    
    # Nakasongola District Villages
    "Nakasongola": {
        "Nakasongola Town": {"latitude": 1.3086, "longitude": 32.4539},
        "Kalongo": {"latitude": 1.3200, "longitude": 32.4650},
        "Nabiswera": {"latitude": 1.2950, "longitude": 32.4400},
    },
    
    # Kiryandongo District Villages
    "Kiryandongo": {
        "Kiryandongo Town": {"latitude": 2.0242, "longitude": 32.0811},
        "Bweyale": {"latitude": 2.0350, "longitude": 32.0950},
        "Mutunda": {"latitude": 2.0100, "longitude": 32.0650},
    },
    
    # Bundibugyo District Villages
    "Bundibugyo": {
        "Bundibugyo Town": {"latitude": 0.7089, "longitude": 30.0644},
        "Bubukwanga": {"latitude": 0.7200, "longitude": 30.0750},
        "Ntandi": {"latitude": 0.6950, "longitude": 30.0550},
    },
    
    # Buikwe District Villages
    "Buikwe": {
        "Buikwe Town": {"latitude": 0.3203, "longitude": 33.0425},
        "Lugazi": {"latitude": 0.3869, "longitude": 32.9336},
        "Njeru": {"latitude": 0.4508, "longitude": 33.1725},
    },
    
    # Budaka District Villages
    "Budaka": {
        "Budaka Town": {"latitude": 1.0308, "longitude": 33.9325},
        "Iki-Iki": {"latitude": 1.0400, "longitude": 33.9450},
        "Kamonkoli": {"latitude": 1.0200, "longitude": 33.9200},
    },
    
    # Bududa District Villages
    "Bududa": {
        "Bududa Town": {"latitude": 1.0092, "longitude": 34.3292},
        "Bukalasi": {"latitude": 1.0200, "longitude": 34.3400},
        "Bushika": {"latitude": 0.9950, "longitude": 34.3150},
    },
    
    # Butaleja District Villages
    "Butaleja": {
        "Butaleja Town": {"latitude": 0.8975, "longitude": 33.8803},
        "Busaba": {"latitude": 0.9050, "longitude": 33.8900},
        "Mazimasa": {"latitude": 0.8900, "longitude": 33.8700},
    },
    
    # Kaberamaido District Villages
    "Kaberamaido": {
        "Kaberamaido Town": {"latitude": 1.7258, "longitude": 33.1500},
        "Ochero": {"latitude": 1.7350, "longitude": 33.1600},
        "Kobulubulu": {"latitude": 1.7150, "longitude": 33.1400},
    },
    
    # Katakwi District Villages
    "Katakwi": {
        "Katakwi Town": {"latitude": 1.9058, "longitude": 33.9508},
        "Toroma": {"latitude": 1.9150, "longitude": 33.9600},
        "Usuk": {"latitude": 1.8950, "longitude": 33.9400},
    },
    
    # Ngora District Villages
    "Ngora": {
        "Ngora Town": {"latitude": 1.4353, "longitude": 33.7417},
        "Mukura": {"latitude": 1.4450, "longitude": 33.7550},
        "Kapir": {"latitude": 1.4250, "longitude": 33.7250},
    },
    
    # Amolatar District Villages
    "Amolatar": {
        "Amolatar Town": {"latitude": 1.6600, "longitude": 32.7044},
        "Namasale": {"latitude": 1.6700, "longitude": 32.7150},
        "Aputi": {"latitude": 1.6500, "longitude": 32.6900},
    },
    
    # Oyam District Villages
    "Oyam": {
        "Oyam Town": {"latitude": 2.2375, "longitude": 32.3861},
        "Ngai": {"latitude": 2.2500, "longitude": 32.4000},
        "Iceme": {"latitude": 2.2250, "longitude": 32.3700},
    },
    
    # Nwoya District Villages
    "Nwoya": {
        "Nwoya Town": {"latitude": 2.5208, "longitude": 31.8758},
        "Anaka": {"latitude": 2.5350, "longitude": 31.8900},
        "Koch Goma": {"latitude": 2.5050, "longitude": 31.8600},
    },
    
    # Abim District Villages
    "Abim": {
        "Abim Town": {"latitude": 2.7186, "longitude": 33.6636},
        "Lotome": {"latitude": 2.7300, "longitude": 33.6750},
        "Morulem": {"latitude": 2.7050, "longitude": 33.6500},
    },
    
    # Amudat District Villages
    "Amudat": {
        "Amudat Town": {"latitude": 1.9497, "longitude": 34.9500},
        "Karita": {"latitude": 1.9600, "longitude": 34.9600},
        "Loroo": {"latitude": 1.9350, "longitude": 34.9350},
    },
    
    # Bukwo District Villages
    "Bukwo": {
        "Bukwo Town": {"latitude": 1.2600, "longitude": 34.7344},
        "Suam": {"latitude": 1.2750, "longitude": 34.7500},
        "Kamet": {"latitude": 1.2450, "longitude": 34.7150},
    },
    
    # Kaabong District Villages
    "Kaabong": {
        "Kaabong Town": {"latitude": 3.5033, "longitude": 34.1194},
        "Karenga": {"latitude": 3.5200, "longitude": 34.1300},
        "Sidok": {"latitude": 3.4850, "longitude": 34.1050},
    },
    
    # Napak District Villages
    "Napak": {
        "Napak Town": {"latitude": 2.3408, "longitude": 34.2606},
        "Lokopo": {"latitude": 2.3550, "longitude": 34.2750},
        "Matany": {"latitude": 2.3250, "longitude": 34.2450},
    },
    
    # Ibanda District Villages
    "Ibanda": {
        "Ibanda Town": {"latitude": -0.1336, "longitude": 30.4953},
        "Bisheshe": {"latitude": -0.1200, "longitude": 30.5100},
        "Nyamarebe": {"latitude": -0.1450, "longitude": 30.4800},
    },
    
    # Kiruhura District Villages
    "Kiruhura": {
        "Kiruhura Town": {"latitude": -0.1858, "longitude": 30.8183},
        "Kinoni": {"latitude": -0.1700, "longitude": 30.8350},
        "Sanga": {"latitude": -0.2000, "longitude": 30.8000},
    },
    
    # Bushenyi District Villages
    "Bushenyi": {
        "Bushenyi Town": {"latitude": -0.5494, "longitude": 30.1908},
        "Ishaka": {"latitude": -0.5439, "longitude": 30.1381},
        "Kyabugimbi": {"latitude": -0.5550, "longitude": 30.2050},
    },
    
    # Sheema District Villages
    "Sheema": {
        "Sheema Town": {"latitude": -0.5661, "longitude": 30.4272},
        "Kabwohe": {"latitude": -0.5500, "longitude": 30.4400},
        "Kitagata": {"latitude": -0.5800, "longitude": 30.4100},
    },
    
    # Buhweju District Villages
    "Buhweju": {
        "Buhweju Town": {"latitude": -0.3097, "longitude": 30.2997},
        "Nsiika": {"latitude": -0.2950, "longitude": 30.3150},
        "Engari": {"latitude": -0.3200, "longitude": 30.2850},
    },
    
    # Kanungu District Villages
    "Kanungu": {
        "Kanungu Town": {"latitude": -0.8322, "longitude": 29.7583},
        "Kihiihi": {"latitude": -0.8450, "longitude": 29.7700},
        "Rugyeyo": {"latitude": -0.8150, "longitude": 29.7450},
    },
    
    # Kagadi District Villages
    "Kagadi": {
        "Kagadi Town": {"latitude": 0.9428, "longitude": 30.8094},
        "Muhorro": {"latitude": 0.9550, "longitude": 30.8200},
        "Mabaale": {"latitude": 0.9300, "longitude": 30.7950},
    },
    
    # Buliisa District Villages
    "Buliisa": {
        "Buliisa Town": {"latitude": 2.1811, "longitude": 31.4389},
        "Buliisa Waisoke": {"latitude": 2.1950, "longitude": 31.4500},
        "Kihungya": {"latitude": 2.1650, "longitude": 31.4250},
    },
    
    # Lyantonde District Villages
    "Lyantonde": {
        "Lyantonde Town": {"latitude": -0.4011, "longitude": 31.1600},
        "Kinuuka": {"latitude": -0.3850, "longitude": 31.1750},
        "Mpigi": {"latitude": -0.4150, "longitude": 31.1450},
    },
    
    # Kalungu District Villages
    "Kalungu": {
        "Kalungu Town": {"latitude": -0.0956, "longitude": 31.7522},
        "Lukaya": {"latitude": -0.0800, "longitude": 31.7650},
        "Bukulula": {"latitude": -0.1100, "longitude": 31.7400},
    },
    
    # Sembabule District Villages
    "Sembabule": {
        "Sembabule Town": {"latitude": -0.0953, "longitude": 31.4522},
        "Lwemiyaga": {"latitude": -0.0800, "longitude": 31.4650},
        "Ntusi": {"latitude": -0.1100, "longitude": 31.4350},
    },
}


def get_village_coordinates(village_name, district=None):
    """
    Get GPS coordinates for a village name.
    
    Args:
        village_name: Name of the village
        district: Optional district name to narrow search
    
    Returns:
        tuple: (latitude, longitude) or (None, None) if not found
    """
    village_lower = village_name.lower().strip()
    
    # If district is provided, search in that district first
    if district:
        district_villages = UGANDA_VILLAGES.get(district, {})
        for village, coords in district_villages.items():
            if village.lower() == village_lower or village_lower in village.lower():
                return coords['latitude'], coords['longitude']
    
    # Search all districts
    for district_name, villages in UGANDA_VILLAGES.items():
        for village, coords in villages.items():
            if village.lower() == village_lower or village_lower in village.lower():
                return coords['latitude'], coords['longitude']
    
    return None, None


def get_all_villages():
    """Get all villages with their coordinates."""
    all_villages = []
    for district, villages in UGANDA_VILLAGES.items():
        for village_name, coords in villages.items():
            all_villages.append({
                'name': village_name,
                'district': district,
                'latitude': coords['latitude'],
                'longitude': coords['longitude']
            })
    return all_villages


def add_village_coordinates(district, village_name, latitude, longitude):
    """
    Add new village coordinates to the database.
    This function is for dynamic updates.
    """
    if district not in UGANDA_VILLAGES:
        UGANDA_VILLAGES[district] = {}
    
    UGANDA_VILLAGES[district][village_name] = {
        'latitude': latitude,
        'longitude': longitude
    }
