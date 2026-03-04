"""
Core Models - User and Shared Entities
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    """
    class UserRole(models.TextChoices):
        VHT_MEMBER = 'VHT', _('VHT Member')
        HOSPITAL_STAFF = 'HOSPITAL', _('Hospital Staff')
        ADMIN = 'ADMIN', _('Administrator')
        VIEWER = 'VIEWER', _('Viewer')
    
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.VHT_MEMBER,
    )
    phone_number = models.CharField(max_length=20, blank=True)
    vht_id = models.CharField(max_length=50, blank=True, unique=True, null=True)
    hospital_code = models.CharField(max_length=50, blank=True, null=True, help_text="Hospital ID code entered during registration")
    hospital = models.ForeignKey('Hospital', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    village = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    primary_language = models.CharField(
        max_length=5,
        choices=[('en', 'English'), ('lg', 'Luganda'), ('sw', 'Swahili')],
        default='en'
    )
    voice_feedback_enabled = models.BooleanField(default=True)
    is_active_vht = models.BooleanField(default=True)
    photo = models.CharField(max_length=500, blank=True, null=True, help_text="Photo URL or path")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class Hospital(models.Model):
    """
    Hospital/Health Facility Model
    """
    class FacilityType(models.TextChoices):
        HCII = 'HCII', _('Health Center II')
        HCIII = 'HCIII', _('Health Center III')
        HCIV = 'HCIV', _('Health Center IV')
        HOSPITAL = 'HOSPITAL', _('Hospital')
        REFERRAL = 'REFERRAL', _('Referral Hospital')
    
    class CapacityStatus(models.TextChoices):
        AVAILABLE = 'AVAILABLE', _('Available')
        LIMITED = 'LIMITED', _('Limited Capacity')
        FULL = 'FULL', _('Full')
        EMERGENCY_ONLY = 'EMERGENCY_ONLY', _('Emergency Only')
    
    name = models.CharField(max_length=200)
    facility_type = models.CharField(max_length=20, choices=FacilityType.choices)
    district = models.CharField(max_length=100)
    sub_county = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    
    # Capacity tracking
    emergency_capacity_status = models.CharField(
        max_length=20,
        choices=CapacityStatus.choices,
        default=CapacityStatus.AVAILABLE
    )
    current_active_referrals = models.IntegerField(default=0)
    max_capacity = models.IntegerField(default=50)
    
    # Specialties (stored as comma-separated values)
    specialties = models.TextField(
        help_text="Comma-separated specialties: general,pediatrics,maternity,surgery"
    )
    
    # Operational
    is_operational = models.BooleanField(default=True)
    operating_hours = models.CharField(max_length=100, default="24/7")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hospitals'
        ordering = ['name']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['emergency_capacity_status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_facility_type_display()})"
    
    def get_specialties_list(self):
        """Return specialties as a list"""
        return [s.strip() for s in self.specialties.split(',') if s.strip()]
    
    def is_available(self):
        """Check if hospital can accept referrals"""
        return (
            self.is_operational and 
            self.emergency_capacity_status != self.CapacityStatus.FULL and
            self.current_active_referrals < self.max_capacity
        )


class District(models.Model):
    """
    Uganda Districts with GPS coordinates
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    region = models.CharField(max_length=50, help_text="Central, Eastern, Northern, Western")
    latitude = models.FloatField()
    longitude = models.FloatField()
    village_count = models.IntegerField(default=0, help_text="Number of villages in this district")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'districts'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['region']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.region})"


class Village(models.Model):
    """
    Uganda Villages with GPS coordinates
    """
    name = models.CharField(max_length=100, db_index=True)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='villages')
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'villages'
        ordering = ['district', 'name']
        unique_together = [['name', 'district']]
        indexes = [
            models.Index(fields=['district', 'name']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.district.name}"


class AuditLog(models.Model):
    """
    Comprehensive audit logging for compliance and analytics
    """
    class ActionType(models.TextChoices):
        TRIAGE = 'TRIAGE', _('Triage Performed')
        REFERRAL = 'REFERRAL', _('Referral Created')
        ALERT = 'ALERT', _('Emergency Alert Sent')
        AI_DECISION = 'AI_DECISION', _('AI Decision Made')
        VALIDATION = 'VALIDATION', _('AI Validation')
        USER_ACTION = 'USER_ACTION', _('User Action')
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    description = models.TextField()
    metadata = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['action_type']),
        ]
    
    def __str__(self):
        return f"{self.get_action_type_display()} by {self.user} at {self.timestamp}"


class Notification(models.Model):
    """
    User notifications for referrals, alerts, etc.
    """
    class NotificationType(models.TextChoices):
        REFERRAL_ACCEPTED = 'REFERRAL_ACCEPTED', _('Referral Accepted')
        REFERRAL_UPDATED = 'REFERRAL_UPDATED', _('Referral Updated')
        PATIENT_ARRIVED = 'PATIENT_ARRIVED', _('Patient Arrived')
        COMPLETED = 'COMPLETED', _('Treatment Completed')
        ALERT = 'ALERT', _('Emergency Alert')
        INFO = 'INFO', _('Information')
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    metadata = models.JSONField(default=dict, help_text="Additional data like referral_id, patient_id")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_read']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
