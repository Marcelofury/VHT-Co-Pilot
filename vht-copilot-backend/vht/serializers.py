"""
VHT Serializers
"""
from rest_framework import serializers
from .models import VHTSettings


class VHTSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for VHT AI Co-Pilot settings
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = VHTSettings
        fields = [
            'id',
            'user',
            'user_name',
            'ai_monitoring_enabled',
            'auto_triage_enabled',
            'notifications_enabled',
            'high_alert_threshold',
            'auto_refresh_interval',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'created_at', 'updated_at']
