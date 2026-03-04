"""
VHT Models - VHT-specific functionality and settings
"""
from django.db import models
from core.models import User


class VHTSettings(models.Model):
    """
    AI Co-Pilot settings for individual VHTs
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='vht_settings',
        limit_choices_to={'role': 'VHT'}
    )
    
    # AI Monitoring Settings
    ai_monitoring_enabled = models.BooleanField(
        default=True,
        help_text="Enable continuous AI monitoring for health signals"
    )
    auto_triage_enabled = models.BooleanField(
        default=True,
        help_text="Allow AI to automatically triage patients based on symptoms"
    )
    notifications_enabled = models.BooleanField(
        default=True,
        help_text="Receive push notifications for urgent cases and referral updates"
    )
    
    # Alert Thresholds
    high_alert_threshold = models.IntegerField(
        default=80,
        help_text="AI confidence score threshold (%) that triggers urgent alerts"
    )
    
    # Preferences
    auto_refresh_interval = models.IntegerField(
        default=30,
        help_text="Dashboard auto-refresh interval in seconds (0 = disabled)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vht_settings'
        verbose_name = 'VHT Settings'
        verbose_name_plural = 'VHT Settings'
    
    def __str__(self):
        return f"Settings for {self.user.get_full_name() or self.user.username}"
