"""
Referral Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Referral, EmergencyAlert
from .serializers import ReferralSerializer, ReferralListSerializer, EmergencyAlertSerializer


class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ReferralListSerializer
        return ReferralSerializer
    
    def get_queryset(self):
        queryset = Referral.objects.all()
        
        # If user is hospital staff, only show referrals for their hospital
        if self.request.user.role == 'HOSPITAL' and self.request.user.hospital:
            queryset = queryset.filter(hospital=self.request.user.hospital)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by urgency
        urgency = self.request.query_params.get('urgency', None)
        if urgency:
            queryset = queryset.filter(urgency_level=urgency)
        
        # Filter by hospital
        hospital_id = self.request.query_params.get('hospital_id', None)
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        
        # Filter by patient
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Active referrals only
        active_only = self.request.query_params.get('active_only', None)
        if active_only == 'true':
            queryset = queryset.filter(
                status__in=['PENDING', 'CONFIRMED', 'IN_TRANSIT']
            )
        
        return queryset.select_related('patient', 'hospital', 'referred_by')
    
    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm referral"""
        referral = self.get_object()
        referral.status = Referral.Status.CONFIRMED
        referral.confirmed_at = timezone.now()
        referral.save()
        
        serializer = self.get_serializer(referral)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update referral status"""
        referral = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Referral.Status.choices):
            referral.status = new_status
            
            if new_status == Referral.Status.ARRIVED:
                referral.actual_arrival_time = timezone.now()
            
            referral.save()
            
            serializer = self.get_serializer(referral)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=False, methods=['get'])
    def my_hospital(self, request):
        """Get referrals for the current user's hospital (hospital staff only)"""
        if request.user.role != 'HOSPITAL' or not request.user.hospital:
            return Response(
                {'error': 'Only hospital staff can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = Referral.objects.filter(hospital=request.user.hospital)
        
        # Apply status filters if provided
        status_filter = request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        queryset = queryset.select_related('patient', 'hospital', 'referred_by')
        serializer = ReferralListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def hospital_stats(self, request):
        """Get referral statistics for the current user's hospital"""
        if request.user.role != 'HOSPITAL' or not request.user.hospital:
            return Response(
                {'error': 'Only hospital staff can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        hospital_referrals = Referral.objects.filter(hospital=request.user.hospital)
        
        stats = {
            'pending': hospital_referrals.filter(status='PENDING').count(),
            'in_transit': hospital_referrals.filter(status='IN_TRANSIT').count(),
            'arrived': hospital_referrals.filter(status='ARRIVED').count(),
            'completed': hospital_referrals.filter(status='COMPLETED').count(),
            'total': hospital_referrals.count(),
        }
        
        return Response(stats)


class EmergencyAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EmergencyAlert.objects.all()
    serializer_class = EmergencyAlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = EmergencyAlert.objects.all()
        
        alert_type = self.request.query_params.get('alert_type', None)
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        
        return queryset
