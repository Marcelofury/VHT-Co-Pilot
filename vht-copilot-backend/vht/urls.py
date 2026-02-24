"""
VHT URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VHTMemberViewSet, my_profile

router = DefaultRouter()
router.register(r'members', VHTMemberViewSet, basename='vht-member')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', my_profile, name='my-profile'),
]
