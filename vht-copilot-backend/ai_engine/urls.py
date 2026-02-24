"""
AI Engine URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseSubmissionViewSet, submit_case, transcribe_only, health_check

router = DefaultRouter()
router.register(r'submissions', CaseSubmissionViewSet, basename='case-submission')

urlpatterns = [
    path('', include(router.urls)),
    path('submit-case/', submit_case, name='submit-case'),
    path('transcribe/', transcribe_only, name='transcribe-only'),
    path('health/', health_check, name='ai-health-check'),
]
