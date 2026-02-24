"""
Referral Models
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from patients.models import Patient
from core.models import Hospital, User


class Referral(models.Model):
    """
    Emergency Referral Model - Core to autonomous AI decision making
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        CONFIRMED = 'CONFIRMED', _('Confirmed')
        IN_TRANSIT = 'IN_TRANSIT', _('In Transit')
        ARRIVED = 'ARRIVED', _('Arrived')
        COMPLETED = 'COMPLETED', _('Completed')
        CANCELLED = 'CANCELLED', _('Cancelled')
    
    class UrgencyLevel(models.TextChoices):
        STABLE = 'STABLE', _('Stable')
        MODERATE = 'MODERATE', _('Moderate')
        HIGH_RISK = 'HIGH_RISK', _('High Risk')
        URGENT = 'URGENT', _('Urgent')
    
    # Referral ID (auto-generated)
    referral_code = models.CharField(max_length=50, unique=True)
    
    # Patient and Hospital
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='referrals'
    )
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.PROTECT,
        related_name='referrals'
    )
    
    # VHT Member
    referred_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='referrals_made'
    )
    
    # Urgency and Triage
    urgency_level = models.CharField(
        max_length=20,
        choices=UrgencyLevel.choices
    )
    triage_score = models.IntegerField(help_text="1-10 scale")
    confidence_score = models.FloatField(help_text="AI confidence 0-1")
    
    # Status and Timing
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    estimated_travel_time = models.IntegerField(help_text="Minutes")
    estimated_arrival_time = models.DateTimeField(null=True, blank=True)
    actual_arrival_time = models.DateTimeField(null=True, blank=True)
    
    # Medical Information
    primary_condition = models.CharField(max_length=200)
    symptoms_summary = models.TextField()
    recommended_specialty = models.CharField(max_length=100, blank=True)
    first_aid_instructions = models.JSONField(default=list)
    
    # AI Decision Tracking
    ai_reasoning = models.TextField(blank=True, help_text="AI's reasoning for this referral")
    guideline_citation = models.CharField(max_length=500, blank=True)
    validation_passed = models.BooleanField(default=True)
    validation_notes = models.TextField(blank=True)
    
    # Alert Tracking
    alert_sent = models.BooleanField(default=False)
    alert_sent_at = models.DateTimeField(null=True, blank=True)
    hospital_notified = models.BooleanField(default=False)
    hospital_notified_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'referrals'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['referral_code']),
            models.Index(fields=['status']),
            models.Index(fields=['urgency_level']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.referral_code} - {self.patient.full_name} → {self.hospital.name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate referral code
        if not self.referral_code:
            import uuid
            self.referral_code = f"REF-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)


class EmergencyAlert(models.Model):
    """
    Emergency Alert Log - For SMS/Push notifications
    """
    class AlertType(models.TextChoices):
        REFERRAL = 'REFERRAL', _('Emergency Referral')
        CRITICAL = 'CRITICAL', _('Critical Patient')
        FOLLOWUP = 'FOLLOWUP', _('Follow-up Required')
        COMMUNITY = 'COMMUNITY', _('Community Alert')
    
    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='alerts'
    )
    
    alert_type = models.CharField(max_length=20, choices=AlertType.choices)
    severity = models.CharField(
        max_length=20,
        choices=[('LOW', 'Low'), ('MODERATE', 'Moderate'), ('HIGH', 'High'), ('CRITICAL', 'Critical')]
    )
    
    # Recipients
    recipient_phone = models.CharField(max_length=20)
    recipient_name = models.CharField(max_length=200)
    
    # Message
    message_content = models.TextField()
    sms_provider = models.CharField(max_length=50, blank=True)
    sms_id = models.CharField(max_length=200, blank=True)
    
    # Status
    sent_successfully = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'emergency_alerts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.alert_type} Alert to {self.recipient_name}"
