"""
VHT Co-Pilot Backend URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API Routes
    path('api/vht/', include('vht.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/referrals/', include('referrals.urls')),
    path('api/ai/', include('ai_engine.urls')),
    path('api/', include('core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Customize admin site
admin.site.site_header = "VHT Co-Pilot Administration"
admin.site.site_title = "VHT Co-Pilot Admin"
admin.site.index_title = "Welcome to VHT Co-Pilot Backend"
