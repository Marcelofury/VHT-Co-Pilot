"""
AI Engine Serializers
"""
from rest_framework import serializers
from .models import CaseSubmission, AIDecisionOverride


class CaseSubmissionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    
    class Meta:
        model = CaseSubmission
        fields = [
            'id', 'patient', 'patient_name', 'submitted_by', 'submitted_by_name',
            'audio_file', 'audio_duration', 'language', 'status', 'processing_time',
            'error_message', 'transcription', 'translation_confidence',
            'triage_result', 'validation_result', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class AIDecisionOverrideSerializer(serializers.ModelSerializer):
    """
    Serializer for AI decision overrides
    """
    overridden_by_name = serializers.CharField(source='overridden_by.get_full_name', read_only=True)
    override_type_display = serializers.CharField(source='get_override_type_display', read_only=True)
    
    class Meta:
        model = AIDecisionOverride
        fields = [
            'id',
            'override_type',
            'override_type_display',
            'overridden_by',
            'overridden_by_name',
            'case_submission',
            'referral',
            'original_value',
            'new_value',
            'reason',
            'clinical_notes',
            'was_correct_override',
            'created_at'
        ]
        read_only_fields = ['id', 'overridden_by', 'overridden_by_name', 'created_at']
