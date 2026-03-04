"""
AI Engine URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CaseSubmissionViewSet, submit_case, transcribe_only, health_check, translate_text,
    override_triage_score, override_referral_hospital, flag_incorrect_decision, my_overrides
)

router = DefaultRouter()
router.register(r'submissions', CaseSubmissionViewSet, basename='case-submission')

urlpatterns = [
    path('', include(router.urls)),
    path('submit-case/', submit_case, name='submit-case'),
    path('transcribe/', transcribe_only, name='transcribe-only'),
    path('translate/', translate_text, name='translate-text'),
    path('health/', health_check, name='ai-health-check'),
    # Override endpoints
    path('override/triage/', override_triage_score, name='override-triage'),
    path('override/hospital/', override_referral_hospital, name='override-hospital'),
    path('override/flag/', flag_incorrect_decision, name='flag-decision'),
    path('overrides/me/', my_overrides, name='my-overrides'),
]
