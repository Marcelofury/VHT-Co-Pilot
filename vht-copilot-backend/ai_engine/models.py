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


class AIDecisionOverride(models.Model):
    """
    Logs when VHTs override AI decisions for training and audit purposes
    """
    class OverrideType(models.TextChoices):
        TRIAGE_SCORE = 'TRIAGE_SCORE', 'Triage Score Adjusted'
        REFERRAL_HOSPITAL = 'REFERRAL_HOSPITAL', 'Referral Hospital Changed'
        INCORRECT_DECISION = 'INCORRECT_DECISION', 'Flagged as Incorrect'
    
    # Override Details
    override_type = models.CharField(max_length=30, choices=OverrideType.choices)
    overridden_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='ai_overrides')
    
    # Related Objects
    case_submission = models.ForeignKey(
        'CaseSubmission', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='overrides'
    )
    referral = models.ForeignKey(
        'referrals.Referral',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='overrides'
    )
    
    # Original AI Values
    original_value = models.JSONField(
        help_text="Original AI decision/value before override"
    )
    
    # New Values
    new_value = models.JSONField(
        help_text="New value after VHT override"
    )
    
    # Justification
    reason = models.TextField(
        help_text="VHT's explanation for the override"
    )
    clinical_notes = models.TextField(
        blank=True,
        help_text="Additional clinical context or observations"
    )
    
    # Feedback for AI Training
    was_correct_override = models.BooleanField(
        null=True,
        blank=True,
        help_text="Later validation: was this override justified?"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_decision_overrides'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['override_type']),
            models.Index(fields=['overridden_by']),
        ]
    
    def __str__(self):
        return f"{self.get_override_type_display()} by {self.overridden_by} - {self.created_at.strftime('%Y-%m-%d')}"
