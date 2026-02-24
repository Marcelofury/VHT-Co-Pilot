"""
Core Admin Configuration
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Hospital, AuditLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'vht_id', 'village', 'is_active_vht']
    list_filter = ['role', 'is_active_vht', 'primary_language', 'region']
    search_fields = ['username', 'email', 'vht_id', 'village', 'district']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('VHT Information', {
            'fields': ('role', 'vht_id', 'phone_number', 'village', 'district', 'region')
        }),
        ('Preferences', {
            'fields': ('primary_language', 'voice_feedback_enabled', 'photo')
        }),
        ('Status', {
            'fields': ('is_active_vht',)
        }),
    )


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['name', 'facility_type', 'district', 'emergency_capacity_status', 
                    'current_active_referrals', 'is_operational']
    list_filter = ['facility_type', 'emergency_capacity_status', 'is_operational', 'district']
    search_fields = ['name', 'district', 'address']
    readonly_fields = ['current_active_referrals', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'facility_type', 'district', 'address', 'phone_number', 'email')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude')
        }),
        ('Capacity Management', {
            'fields': ('emergency_capacity_status', 'current_active_referrals', 'max_capacity')
        }),
        ('Medical Capabilities', {
            'fields': ('specialties',)
        }),
        ('Operational Status', {
            'fields': ('is_operational', 'operating_hours')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action_type', 'user', 'description', 'timestamp', 'ip_address']
    list_filter = ['action_type', 'timestamp']
    search_fields = ['description', 'user__username']
    readonly_fields = ['user', 'action_type', 'description', 'metadata', 'ip_address', 'timestamp']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
