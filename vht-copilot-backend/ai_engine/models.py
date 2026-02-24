"""
AI Engine Models - For tracking AI decisions and case submissions
"""
from django.db import models
from patients.models import Patient
from core.models import User


class CaseSubmission(models.Model):
    """
    Tracks every case submitted to the AI engine
    """
    class ProcessingStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='submissions')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Audio Input
    audio_file = models.FileField(upload_to='case_audio/', null=True, blank=True)
    audio_duration = models.FloatField(null=True, blank=True, help_text="Seconds")
    language = models.CharField(max_length=5, default='en')
    
    # Processing Status
    status = models.CharField(max_length=20, choices=ProcessingStatus.choices, default=ProcessingStatus.PENDING)
    processing_time = models.FloatField(null=True, blank=True, help_text="Seconds")
    error_message = models.TextField(blank=True)
    
    # AI Results (stored as JSON)
    transcription = models.TextField(blank=True)
    translation_confidence = models.FloatField(null=True, blank=True)
    triage_result = models.JSONField(default=dict)
    validation_result = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'case_submissions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Case {self.id} - {self.patient.full_name} - {self.status}"
