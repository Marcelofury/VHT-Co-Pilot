"""
Core URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, HospitalViewSet, AuditLogViewSet, 
    health_check, dashboard_stats, register_user, get_profile,
    get_uganda_locations, find_nearest_hospitals_api, upload_profile_photo
)
from .notification_views import NotificationViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('auth/register/', register_user, name='register'),
    path('users/profile/', get_profile, name='user-profile'),
    path('users/upload-photo/', upload_profile_photo, name='upload-profile-photo'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('locations/', get_uganda_locations, name='uganda-locations'),
    path('hospitals/find-nearest/', find_nearest_hospitals_api, name='find-nearest-hospitals'),
    path('', include(router.urls)),
]
