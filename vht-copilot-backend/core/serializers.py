"""
Core Serializers
"""
from rest_framework import serializers
from .models import User, Hospital, AuditLog


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'vht_id', 'village', 'district', 'region',
            'primary_language', 'voice_feedback_enabled', 'is_active_vht',
            'photo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HospitalSerializer(serializers.ModelSerializer):
    specialties_list = serializers.ListField(
        child=serializers.CharField(),
        source='get_specialties_list',
        read_only=True
    )
    is_available = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'facility_type', 'district', 'address',
            'latitude', 'longitude', 'phone_number', 'email',
            'emergency_capacity_status', 'current_active_referrals', 'max_capacity',
            'specialties', 'specialties_list', 'is_operational', 'operating_hours',
            'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_active_referrals', 'created_at', 'updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_display = serializers.CharField(source='user.__str__', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_display', 'action_type', 'description',
            'metadata', 'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
