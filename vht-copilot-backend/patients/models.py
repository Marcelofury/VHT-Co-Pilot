"""
Patient Models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import User


class Patient(models.Model):
    """
    Patient Model - Central to the VHT workflow
    """
    class Gender(models.TextChoices):
        MALE = 'MALE', _('Male')
        FEMALE = 'FEMALE', _('Female')
        OTHER = 'OTHER', _('Other')
    
    class TriageLevel(models.TextChoices):
        STABLE = 'STABLE', _('Stable')
        MODERATE = 'MODERATE', _('Moderate')
        HIGH_RISK = 'HIGH_RISK', _('High Risk')
        URGENT = 'URGENT', _('Urgent')
    
    # Basic Information
    vht_code = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    age = models.CharField(max_length=20, help_text="Can be '8mo' or '42' years")
    gender = models.CharField(max_length=10, choices=Gender.choices)
    
    # Triage Information
    triage_level = models.CharField(
        max_length=20,
        choices=TriageLevel.choices,
        default=TriageLevel.STABLE
    )
    triage_score = models.IntegerField(default=0, help_text="1-10 scale")
    last_triage_confidence = models.FloatField(default=0.0, help_text="AI confidence 0-1")
    
    # Location
    village = models.CharField(max_length=100, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # VHT Association
    registered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='registered_patients'
    )
    
    # Medical History
    chronic_conditions = models.TextField(blank=True, help_text="JSON or comma-separated")
    allergies = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    # Media
    photo = models.CharField(max_length=500, blank=True, null=True, help_text="Photo URL or path")
    
    # Timestamps
    last_visit = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patients'
        ordering = ['-last_visit']
        indexes = [
            models.Index(fields=['vht_code']),
            models.Index(fields=['triage_level']),
            models.Index(fields=['-last_visit']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.vht_code})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Symptom(models.Model):
    """
    Symptom records for patients
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='symptoms'
    )
    
    # Multilingual symptom names
    name_english = models.CharField(max_length=200)
    name_luganda = models.CharField(max_length=200, blank=True)
    name_swahili = models.CharField(max_length=200, blank=True)
    
    # Symptom details
    severity = models.IntegerField(default=5, help_text="1-10 scale")
    duration = models.CharField(max_length=100, blank=True, help_text="e.g., '3 days'")
    description = models.TextField(blank=True)
    
    # Source tracking
    detected_by_ai = models.BooleanField(default=False)
    confidence_score = models.FloatField(default=0.0)
    voice_recording = models.FileField(upload_to='symptom_audio/', blank=True, null=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'symptoms'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.name_english} - {self.patient.full_name}"


class PatientHistory(models.Model):
    """
    Historical tracking of patient interactions
    """
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='history'
    )
    vht_member = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='patient_interactions'
    )
    
    interaction_type = models.CharField(
        max_length=50,
        choices=[
            ('INTAKE', 'Voice Intake'),
            ('TRIAGE', 'Triage Assessment'),
            ('FOLLOWUP', 'Follow-up'),
            ('REFERRAL', 'Referral'),
            ('TREATMENT', 'Treatment Update'),
        ]
    )
    
    notes = models.TextField()
    triage_score_at_time = models.IntegerField(null=True, blank=True)
    symptoms_at_time = models.JSONField(default=list)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'patient_history'
        ordering = ['-timestamp']
        verbose_name_plural = 'Patient histories'
    
    def __str__(self):
        return f"{self.interaction_type} - {self.patient.full_name} - {self.timestamp}"
