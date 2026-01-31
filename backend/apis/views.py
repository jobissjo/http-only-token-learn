from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apis.serializers import LoginSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User


# Create your views here.


class BaseAPIView(APIView):
    def get(self, request):
        return Response({"message": "Hello, World!"})


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []
    serializer_class = LoginSerializer

    def post(self, request):
        user = authenticate(
            username=request.data.get("username"),
            password=request.data.get("password"),
        )

        if not user:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)

        response = Response(
            {"detail": "Login successful", "data": {"is_admin": user.is_staff}},
            status=status.HTTP_200_OK,
        )

        # access token
        response.set_cookie(
            key="access_token",
            value=str(refresh.access_token),
            httponly=True,
            secure=False,  # True in HTTPS
            samesite="Strict",
            max_age=15 * 60,
            path="/",
        )

        # refresh token
        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            secure=False,
            samesite="Strict",
            max_age=7 * 24 * 60 * 60,
            path="/",
        )

        return response


class RefreshView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        old_refresh_token = request.COOKIES.get("refresh_token")

        if not old_refresh_token:
            raise AuthenticationFailed("No refresh token")
        try:
            old_refresh = RefreshToken(old_refresh_token)
        except Exception:
            raise AuthenticationFailed("Invalid refresh token")

        user_id = old_refresh.get("user_id")

        if not user_id:
            raise AuthenticationFailed("Invalid refresh token payload")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found")

        # Blacklist old refresh token (if blacklist app enabled)
        try:
            old_refresh.blacklist()
        except AttributeError:
            pass

        # create NEW refresh token
        new_refresh = RefreshToken.for_user(user)
        new_access = new_refresh.access_token

        response = Response({"detail": "Token refreshed"})

        response.set_cookie(
            key="access_token",
            value=str(new_access),
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=15 * 60,
            path="/",
        )

        response.set_cookie(
            "refresh_token",
            str(new_refresh),
            httponly=True,
            secure=False,
            samesite="Lax",
            max_age=7 * 24 * 60 * 60,
            path="/",
        )

        return response


class ProtectedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "This is a protected endpoint!"})


class LogoutView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        response = Response({"detail": "Logged out"})
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {
                "data": {
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                },
                "message": "User info retrieved successfully",
            }
        )
