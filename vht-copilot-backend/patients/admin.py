"""
Patients Admin Configuration
"""
from django.contrib import admin
from .models import Patient, Symptom, PatientHistory


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['vht_code', 'full_name', 'age', 'gender', 'triage_level', 
                    'triage_score', 'last_visit', 'registered_by']
    list_filter = ['triage_level', 'gender', 'registered_by']
    search_fields = ['vht_code', 'first_name', 'last_name', 'village']
    readonly_fields = ['created_at', 'updated_at', 'last_visit']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('vht_code', 'first_name', 'last_name', 'age', 'gender', 'photo')
        }),
        ('Triage Status', {
            'fields': ('triage_level', 'triage_score', 'last_triage_confidence')
        }),
        ('Location', {
            'fields': ('village', 'latitude', 'longitude')
        }),
        ('Medical Information', {
            'fields': ('chronic_conditions', 'allergies', 'notes')
        }),
        ('System Information', {
            'fields': ('registered_by', 'last_visit', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Symptom)
class SymptomAdmin(admin.ModelAdmin):
    list_display = ['name_english', 'patient', 'severity', 'detected_by_ai', 
                    'confidence_score', 'timestamp']
    list_filter = ['detected_by_ai', 'severity', 'timestamp']
    search_fields = ['name_english', 'name_luganda', 'patient__vht_code']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(PatientHistory)
class PatientHistoryAdmin(admin.ModelAdmin):
    list_display = ['patient', 'interaction_type', 'vht_member', 'timestamp']
    list_filter = ['interaction_type', 'timestamp']
    search_fields = ['patient__vht_code', 'notes']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
