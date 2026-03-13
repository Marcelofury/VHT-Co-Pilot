"""
Authentication views and serializers.
"""
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User


class UsernameOrVhtIdTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow login with either username or VHT ID in the username field."""

    def validate(self, attrs):
        identifier = (attrs.get("username") or "").strip()

        if identifier:
            user = User.objects.filter(username=identifier).first()
            if user is None:
                user = User.objects.filter(vht_id=identifier).first()

            if user is not None:
                attrs["username"] = user.username

        return super().validate(attrs)


class UsernameOrVhtIdTokenObtainPairView(TokenObtainPairView):
    serializer_class = UsernameOrVhtIdTokenObtainPairSerializer
