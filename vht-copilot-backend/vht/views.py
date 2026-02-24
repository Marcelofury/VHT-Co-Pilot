"""
VHT Views
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from core.models import User
from core.serializers import UserSerializer


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
