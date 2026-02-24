"""
Patient URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, SymptomViewSet, PatientHistoryViewSet

router = DefaultRouter()
router.register(r'', PatientViewSet, basename='patient')
router.register(r'symptoms', SymptomViewSet, basename='symptom')
router.register(r'history', PatientHistoryViewSet, basename='patient-history')

urlpatterns = [
    path('', include(router.urls)),
]
