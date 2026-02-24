"""
Core URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, HospitalViewSet, AuditLogViewSet, health_check, dashboard_stats, register_user

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health-check'),
    path('auth/register/', register_user, name='register'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
]
