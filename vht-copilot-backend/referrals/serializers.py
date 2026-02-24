"""
Referral Serializers
"""
from rest_framework import serializers
from .models import Referral, EmergencyAlert
from patients.serializers import PatientListSerializer
from core.serializers import HospitalSerializer


class EmergencyAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyAlert
        fields = [
            'id', 'referral', 'alert_type', 'severity', 'recipient_phone',
            'recipient_name', 'message_content', 'sent_successfully',
            'error_message', 'delivered_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'delivered_at']


class ReferralSerializer(serializers.ModelSerializer):
    patient_details = PatientListSerializer(source='patient', read_only=True)
    hospital_details = HospitalSerializer(source='hospital', read_only=True)
    referred_by_name = serializers.CharField(
        source='referred_by.get_full_name',
        read_only=True
    )
    alerts = EmergencyAlertSerializer(many=True, read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'referral_code', 'patient', 'patient_details', 'hospital', 
            'hospital_details', 'referred_by', 'referred_by_name',
            'urgency_level', 'triage_score', 'confidence_score',
            'status', 'estimated_travel_time', 'estimated_arrival_time', 
            'actual_arrival_time', 'primary_condition', 'symptoms_summary',
            'recommended_specialty', 'first_aid_instructions', 
            'ai_reasoning', 'guideline_citation', 'validation_passed', 
            'validation_notes', 'alert_sent', 'alert_sent_at', 
            'hospital_notified', 'hospital_notified_at', 'alerts',
            'created_at', 'confirmed_at', 'updated_at'
        ]
        read_only_fields = ['id', 'referral_code', 'created_at', 'updated_at']


class ReferralListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    
    class Meta:
        model = Referral
        fields = [
            'id', 'referral_code', 'patient_name', 'hospital_name',
            'urgency_level', 'status', 'triage_score', 'created_at'
        ]
