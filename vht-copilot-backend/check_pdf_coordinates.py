import PyPDF2
import re

pdf_path = r'C:\Users\USER\VHTCo-Pilot\VHT-Co-Pilot\vht-copilot-backend\National Health Facility MasterLlist 2017.pdf'

with open(pdf_path, 'rb') as pdf_file:
    reader = PyPDF2.PdfReader(pdf_file)
    all_text = ''.join([reader.pages[i].extract_text() for i in range(len(reader.pages))])
    
    # Search for numeric coordinate pairs
    coord_matches = re.findall(r'([0-9]{1,2}\.[0-9]{3,8})[,\s]+([0-9]{1,3}\.[0-9]{3,8})', all_text)
    
    print(f'Numeric coordinate pairs found: {len(coord_matches)}')
    print('\nFirst 10 matches:')
    for i, match in enumerate(coord_matches[:10]):
        print(f'{i+1}. Lat: {match[0]}, Lon: {match[1]}')
    
    # Also check for district + facility name patterns
    print('\n=== Sample facility listing (first 3 facilities) ===')
    # Looking for pattern like: "# HSD Name Level Authority"
    facility_pattern = re.findall(r'(\d+\s+\w+\s+HSD\s+[^\n]+Health Centre[^\n]+HC\s+[IVX]+[^\n]+)', all_text)
    for i, fac in enumerate(facility_pattern[:3]):
        print(f'{i+1}. {fac[:150]}...')
