from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from .models import Usuario
from .serializers import (
    UsuarioSerializer, 
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)


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


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset-request/
    Recibe el correo, busca al usuario y le envía el correo de recuperación.
    """
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        correo = serializer.validated_data['correo_electronico']
        
        try:
            user = Usuario.objects.get(correo_electronico=correo, is_active=True)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            
            # En producción, usaríamos el host real. 
            # Aquí asumimos localhost:4200 (Angular dev server).
            reset_url = f"http://localhost:4200/reset-password?uid={uid}&token={token}"
            
            subject = "Recuperación de contraseña — FairGreen"
            message = (
                f"Hola {user.nombre},\n\n"
                f"Has solicitado restablecer tu contraseña en FairGreen.\n"
                f"Por favor, haz clic en el siguiente enlace para crear una nueva contraseña:\n\n"
                f"{reset_url}\n\n"
                f"Si no solicitaste esto, puedes ignorar este correo.\n\n"
                f"Atentamente,\nEl equipo de FairGreen"
            )
            
            send_mail(
                subject,
                message,
                None,  # Usa DEFAULT_FROM_EMAIL
                [user.correo_electronico],
                fail_silently=False,
            )
        except Usuario.DoesNotExist:
            # Por razones de seguridad (evitar enumeración de usuarios),
            # respondemos con éxito incluso si el correo no existe.
            pass
            
        return Response(
            {"detail": "Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña."},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset-confirm/
    Recibe uidb64, token y new_password, valida y cambia la contraseña del usuario.
    """
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = Usuario.objects.get(pk=uid, is_active=True)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            return Response(
                {"detail": "El enlace de recuperación no es válido o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response(
                {"detail": "Tu contraseña ha sido restablecida con éxito."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "El enlace de recuperación no es válido o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST
            )

