"""
Referral Admin Configuration
"""
from django.contrib import admin
from .models import Referral, EmergencyAlert


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ['referral_code', 'patient', 'hospital', 'urgency_level', 'status', 
                    'triage_score', 'alert_sent', 'created_at']
    list_filter = ['status', 'urgency_level', 'alert_sent', 'validation_passed']
    search_fields = ['referral_code', 'patient__vht_code', 'patient__first_name', 
                     'patient__last_name', 'hospital__name']
    readonly_fields = ['referral_code', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Referral Information', {
            'fields': ('referral_code', 'patient', 'hospital', 'referred_by')
        }),
        ('Urgency & Triage', {
            'fields': ('urgency_level', 'triage_score', 'confidence_score')
        }),
        ('Status & Timing', {
            'fields': ('status', 'estimated_travel_time', 'estimated_arrival_time', 
                       'actual_arrival_time', 'confirmed_at')
        }),
        ('Medical Details', {
            'fields': ('primary_condition', 'symptoms_summary', 'recommended_specialty', 
                       'first_aid_instructions')
        }),
        ('AI Decision Tracking', {
            'fields': ('ai_reasoning', 'guideline_citation', 'validation_passed', 
                       'validation_notes')
        }),
        ('Alert Status', {
            'fields': ('alert_sent', 'alert_sent_at', 'hospital_notified', 
                       'hospital_notified_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EmergencyAlert)
class EmergencyAlertAdmin(admin.ModelAdmin):
    list_display = ['alert_type', 'severity', 'recipient_name', 'recipient_phone', 
                    'sent_successfully', 'created_at']
    list_filter = ['alert_type', 'severity', 'sent_successfully']
    search_fields = ['recipient_name', 'recipient_phone', 'message_content']
    readonly_fields = ['created_at', 'delivered_at']
    date_hierarchy = 'created_at'
