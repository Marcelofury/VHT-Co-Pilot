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
    permission_classes = [IsAuthenticated]
    
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


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    User registration endpoint
    """
    data = request.data
    
    # Validate required fields
    required_fields = ['username', 'password', 'first_name', 'last_name', 'role']
    for field in required_fields:
        if not data.get(field):
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
        user = User.objects.create_user(
            username=data['username'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            email=data.get('email', ''),
            role=data.get('role', 'VHT'),
            vht_id=data.get('vht_id', ''),
            hospital_code=data.get('hospital_code', ''),
            phone_number=data.get('phone_number', ''),
            village=data.get('village', ''),
            district=data.get('district', ''),
        )
        
        serializer = UserSerializer(user)
        return Response(
            {
                'message': 'Registration successful',
                'user': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {'detail': str(e)},
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
