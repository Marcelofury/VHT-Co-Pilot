"""
AI Engine Serializers
"""
from rest_framework import serializers
from .models import CaseSubmission


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
