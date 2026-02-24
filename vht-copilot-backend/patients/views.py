"""
Patient Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Patient, Symptom, PatientHistory
from .serializers import (
    PatientSerializer, PatientListSerializer,
    SymptomSerializer, PatientHistorySerializer
)


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        return PatientSerializer
    
    def get_queryset(self):
        queryset = Patient.objects.all()
        
        # Filter by triage level
        triage_level = self.request.query_params.get('triage_level', None)
        if triage_level:
            queryset = queryset.filter(triage_level=triage_level)
        
        # Filter by VHT member
        vht_member = self.request.query_params.get('vht_member', None)
        if vht_member:
            queryset = queryset.filter(registered_by_id=vht_member)
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(vht_code__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(village__icontains=search)
            )
        
        return queryset.select_related('registered_by').prefetch_related('symptoms')
    
    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get patient history"""
        patient = self.get_object()
        history = patient.history.all()
        serializer = PatientHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_symptom(self, request, pk=None):
        """Add symptom to patient"""
        patient = self.get_object()
        serializer = SymptomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(patient=patient)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_triage(self, request, pk=None):
        """Update patient triage status"""
        patient = self.get_object()
        triage_level = request.data.get('triage_level')
        triage_score = request.data.get('triage_score')
        confidence = request.data.get('confidence_score', 0.0)
        
        if triage_level:
            patient.triage_level = triage_level
        if triage_score is not None:
            patient.triage_score = triage_score
        if confidence is not None:
            patient.last_triage_confidence = confidence
        
        patient.save()
        
        # Create history entry
        PatientHistory.objects.create(
            patient=patient,
            vht_member=request.user,
            interaction_type='TRIAGE',
            notes=f"Triage updated to {triage_level} (score: {triage_score})",
            triage_score_at_time=triage_score
        )
        
        serializer = self.get_serializer(patient)
        return Response(serializer.data)


class SymptomViewSet(viewsets.ModelViewSet):
    queryset = Symptom.objects.all()
    serializer_class = SymptomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Symptom.objects.all()
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset


class PatientHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PatientHistory.objects.all()
    serializer_class = PatientHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PatientHistory.objects.all()
        patient_id = self.request.query_params.get('patient_id', None)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset
