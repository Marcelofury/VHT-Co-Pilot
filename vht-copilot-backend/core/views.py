"""
Core Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Hospital, AuditLog
from .serializers import UserSerializer, HospitalSerializer, AuditLogSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [AllowAny]  # Allow unauthenticated access for registration
    pagination_class = None  # Disable pagination - return all hospitals
    
    def get_queryset(self):
        queryset = Hospital.objects.filter(is_operational=True)
        
        specialty = self.request.query_params.get('specialty', None)
        if specialty:
            queryset = queryset.filter(specialties__icontains=specialty)
        
        district = self.request.query_params.get('district', None)
        if district:
            queryset = queryset.filter(district__iexact=district)
        
        available_only = self.request.query_params.get('available_only', None)
        if available_only == 'true':
            queryset = queryset.exclude(
                emergency_capacity_status=Hospital.CapacityStatus.FULL
            )
        
        return queryset


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AuditLog.objects.all()
        
        action_type = self.request.query_params.get('action_type', None)
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring
    """
    return Response({
        'status': 'healthy',
        'service': 'VHT Co-Pilot Backend',
        'version': '1.0.0'
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_uganda_locations(request):
    """
    Get Uganda location data (districts, sub-counties, parishes, villages)
    """
    from .uganda_locations import get_all_districts, get_sub_counties, get_parishes, get_coordinates
    from .uganda_villages import get_all_villages, get_village_coordinates, UGANDA_VILLAGES
    
    action = request.query_params.get('action', 'districts')
    
    if action == 'districts':
        return Response({'districts': get_all_districts()})
    
    elif action == 'sub_counties':
        district = request.query_params.get('district')
        if not district:
            return Response({'error': 'district parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'sub_counties': get_sub_counties(district)})
    
    elif action == 'parishes':
        district = request.query_params.get('district')
        sub_county = request.query_params.get('sub_county')
        if not district or not sub_county:
            return Response({'error': 'district and sub_county parameters required'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'parishes': get_parishes(district, sub_county)})
    
    elif action == 'coordinates':
        district = request.query_params.get('district')
        sub_county = request.query_params.get('sub_county')
        if not district:
            return Response({'error': 'district parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        coords = get_coordinates(district, sub_county)
        if coords:
            return Response(coords)
        return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)
    
    elif action == 'all_villages':
        # Return all villages grouped by district
        return Response({'villages': get_all_villages()})
    
    elif action == 'villages':
        # Get villages for a specific district
        district = request.query_params.get('district')
        if not district:
            return Response({'error': 'district parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        district_villages = UGANDA_VILLAGES.get(district, {})
        villages = [
            {
                'name': village_name,
                'latitude': coords['latitude'],
                'longitude': coords['longitude']
            }
            for village_name, coords in district_villages.items()
        ]
        return Response({'villages': villages})
    
    elif action == 'village_coordinates':
        # Get coordinates for a specific village
        village = request.query_params.get('village')
        district = request.query_params.get('district')
        if not village:
            return Response({'error': 'village parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        lat, lon = get_village_coordinates(village, district)
        if lat and lon:
            return Response({'latitude': lat, 'longitude': lon})
        return Response({'error': 'Village not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def find_nearest_hospitals_api(request):
    """
    Find nearest hospitals based on location and triage level
    POST body: { latitude, longitude, triage_level, max_results }
    """
    from .uganda_locations import find_nearest_hospitals
    
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    triage_level = request.data.get('triage_level', 'MODERATE')
    max_results = request.data.get('max_results', 3)
    
    if latitude is None or longitude is None:
        return Response(
            {'error': 'latitude and longitude required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        latitude = float(latitude)
        longitude = float(longitude)
        max_results = int(max_results)
    except ValueError:
        return Response(
            {'error': 'Invalid coordinate format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    hospitals = find_nearest_hospitals(latitude, longitude, triage_level, max_results)
    return Response({'hospitals': hospitals})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    User registration endpoint
    """
    data = request.data
    
    print(f"Registration attempt with data: {data}")  # Debug logging
    
    # Validate required fields
    required_fields = ['username', 'password', 'first_name', 'last_name', 'role']
    for field in required_fields:
        if not data.get(field):
            print(f"Missing field: {field}")  # Debug logging
            return Response(
                {'detail': f'{field} is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Check if username already exists
    if User.objects.filter(username=data['username']).exists():
        return Response(
            {'detail': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create user
    try:
        print(f"Creating user with data: {data}")
        
        # Prepare user data, converting empty strings to None for nullable fields
        user_data = {
            'username': data['username'],
            'password': data['password'],
            'first_name': data['first_name'],
            'last_name': data['last_name'],
            'email': data.get('email', ''),
            'role': data.get('role', 'VHT'),
            'phone_number': data.get('phone_number', ''),
            'village': data.get('village', ''),
            'district': data.get('district', ''),
        }
        
        # Handle nullable unique fields - convert empty string to None
        vht_id = data.get('vht_id', '')
        user_data['vht_id'] = vht_id if vht_id else None
        
        hospital_code = data.get('hospital_code', '')
        user_data['hospital_code'] = hospital_code if hospital_code else None
        
        user = User.objects.create_user(**user_data)
        
        print(f"User created successfully: {user.username}")
        serializer = UserSerializer(user)
        return Response(
            {
                'message': 'Registration successful',
                'user': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        print(f"Registration error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response(
            {'detail': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Get or update current user's profile
    """
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method in ['PATCH', 'PUT']:
        # Update profile
        serializer = UserSerializer(
            request.user, 
            data=request.data, 
            partial=True  # Allow partial updates
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Dashboard statistics endpoint
    """
    from patients.models import Patient
    from referrals.models import Referral
    from django.db.models import Count, Q
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    
    stats = {
        'total_patients': Patient.objects.count(),
        'patients_this_week': Patient.objects.filter(created_at__gte=week_ago).count(),
        'total_referrals': Referral.objects.count(),
        'active_referrals': Referral.objects.filter(
            status__in=['PENDING', 'CONFIRMED', 'IN_TRANSIT']
        ).count(),
        'emergency_referrals_today': Referral.objects.filter(
            urgency_level='URGENT',
            created_at__date=today
        ).count(),
        'available_hospitals': Hospital.objects.filter(
            is_operational=True,
            emergency_capacity_status=Hospital.CapacityStatus.AVAILABLE
        ).count(),
        'triage_distribution': Patient.objects.values('triage_level').annotate(
            count=Count('id')
        ),
    }
    
    return Response(stats)
