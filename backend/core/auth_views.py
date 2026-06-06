from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UsuarioSerializer


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
