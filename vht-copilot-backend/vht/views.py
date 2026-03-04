"""
VHT Views
"""
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from core.models import User
from core.serializers import UserSerializer
from .models import VHTSettings
from .serializers import VHTSettingsSerializer


class VHTMemberViewSet(viewsets.ReadOnlyModelViewSet):
    """View VHT members"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(role='VHT', is_active_vht=True)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_profile(request):
    """Get current user's profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def my_settings(request):
    """
    Get or update current VHT's AI Co-Pilot settings
    
    GET: Retrieve current settings (creates default if not exists)
    PUT/PATCH: Update settings
    """
    # Get or create settings for current user
    settings, created = VHTSettings.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = VHTSettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = VHTSettingsSerializer(settings, data=request.data, partial=partial)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
