from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UsuarioSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para obtener el par de tokens JWT,
    utilizando el serializador CustomTokenObtainPairSerializer.
    """
    serializer_class = CustomTokenObtainPairSerializer


class AuthMeView(APIView):
    """
    GET /api/auth/me
    Retorna el perfil completo del usuario autenticado mediante el token JWT.
    Requiere header: Authorization: Bearer <access_token>
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)
