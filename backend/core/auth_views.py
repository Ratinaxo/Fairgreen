from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.cache import cache
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


class HeartbeatView(APIView):
    """
    POST /api/auth/heartbeat
    Actualiza el estado 'en línea' del usuario autenticado.
    Guarda un flag en caché con TTL de 120 segundos.
    Si el frontend deja de enviar heartbeats, el flag expira automáticamente.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cache.set(f'user_online_{request.user.rut}', True, timeout=120)
        return Response({'status': 'ok'})
