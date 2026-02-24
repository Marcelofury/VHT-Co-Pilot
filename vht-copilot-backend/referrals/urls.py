"""
Referral URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReferralViewSet, EmergencyAlertViewSet

router = DefaultRouter()
router.register(r'', ReferralViewSet, basename='referral')
router.register(r'alerts', EmergencyAlertViewSet, basename='emergency-alert')

urlpatterns = [
    path('', include(router.urls)),
]
