"""
AI Engine Admin
"""
from django.contrib import admin
from .models import CaseSubmission


@admin.register(CaseSubmission)
class CaseSubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'submitted_by', 'status', 'language', 
                    'processing_time', 'created_at']
    list_filter = ['status', 'language', 'created_at']
    search_fields = ['patient__vht_code', 'patient__first_name', 'patient__last_name']
    readonly_fields = ['created_at', 'completed_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Submission Info', {
            'fields': ('patient', 'submitted_by', 'status', 'language')
        }),
        ('Audio', {
            'fields': ('audio_file', 'audio_duration')
        }),
        ('Processing', {
            'fields': ('processing_time', 'error_message', 'transcription', 
                       'translation_confidence')
        }),
        ('Results', {
            'fields': ('triage_result', 'validation_result')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at'),
            'classes': ('collapse',)
        }),
    )
