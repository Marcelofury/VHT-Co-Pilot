"""
Notification Serializers
"""
from rest_framework import serializers
from core.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for user notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'metadata',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
