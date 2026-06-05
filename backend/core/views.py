from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_gis.pagination import GeoJsonPagination
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Seccion, PuntoCritico, Muestra, Usuario, Foto, Notificacion
from .serializers import SeccionSerializer, PuntoCriticoSerializer, MuestraSerializer, UsuarioSerializer, FotoSerializer, NotificacionSerializer
from .permissions import EsAdmin, EsAdminOAgronoma


class SeccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para listar, crear, editar y eliminar Secciones del campo de golf.
    - Devuelve datos en formato GeoJSON.
    - Lectura pública.
    - Solo administradores ('ADMIN') pueden crear, editar o eliminar.
    """
    queryset = Seccion.objects.all().order_by('numero_de_hoyo')
    serializer_class = SeccionSerializer
    permission_classes = [EsAdmin]
    pagination_class = GeoJsonPagination


class PuntoCriticoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Puntos Críticos.
    - Devuelve datos en formato GeoJSON.
    - Lectura pública.
    - Administradores ('ADMIN') y Agrónomas ('AGRO') pueden crear, editar o eliminar.
    - Cancheros ('CANCHERO') solo lectura.
    """
    queryset = PuntoCritico.objects.all().order_by('id_punto_critico')
    serializer_class = PuntoCriticoSerializer
    permission_classes = [EsAdminOAgronoma]
    pagination_class = GeoJsonPagination


class MuestraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Muestras de suelo tomadas en terreno.
    - Devuelve datos en formato GeoJSON.
    - Lectura pública.
    - Administradores ('ADMIN') y Agrónomas ('AGRO') pueden registrar, editar o eliminar muestras.
    - Cancheros ('CANCHERO') solo lectura.
    - Enlaza automáticamente la muestra al usuario logueado mediante el token JWT.
    - Filtros opcionales: fecha_desde, fecha_hasta (formato YYYY-MM-DD).
    """
    serializer_class = MuestraSerializer
    permission_classes = [EsAdminOAgronoma]
    pagination_class = GeoJsonPagination

    def get_queryset(self):
        qs = Muestra.objects.all().order_by('-fecha_hora_captura')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        if fecha_desde:
            qs = qs.filter(fecha_hora_captura__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_hora_captura__date__lte=fecha_hasta)
        return qs

    def perform_create(self, serializer):
        """
        Sobrescribe la creación para enlazar automáticamente la muestra
        al usuario autenticado mediante su token JWT de sesión.
        """
        if self.request.user and self.request.user.is_authenticated:
            serializer.save(rut_usuario=self.request.user)
        else:
            # Fallback en caso de que falte autenticación (aunque sea atrapada por el permiso)
            serializer.save()

    @action(detail=False, methods=['delete'], url_path='delete_all')
    def delete_all(self, request):
        """
        Elimina TODAS las muestras del sistema.
        Solo accesible por ADMIN y AGRO (mismo permiso que el ViewSet).
        """
        count, _ = Muestra.objects.all().delete()
        return Response({'deleted': count})



class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Usuarios.
    - Solo los administradores pueden crear, editar o eliminar usuarios.
    """
    queryset = Usuario.objects.all().order_by('nombre')
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdmin]
    pagination_class = None


class FotoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Fotos asociadas a las muestras.
    - Administradores y Agrónomas pueden subir o eliminar fotos.
    """
    queryset = Foto.objects.all().order_by('-fecha_hora_subida')
    serializer_class = FotoSerializer
    permission_classes = [EsAdminOAgronoma]


class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para las notificaciones del usuario autenticado.
    - GET /api/notificaciones/          → Lista las notificaciones del usuario
    - GET /api/notificaciones/{id}/     → Detalle de una notificación
    - POST /api/notificaciones/{id}/marcar_leida/  → Marca una como leída
    - POST /api/notificaciones/marcar_todas_leidas/ → Marca todas como leídas
    """
    serializer_class = NotificacionSerializer

    def get_queryset(self):
        """Filtra siempre las notificaciones al usuario autenticado."""
        return Notificacion.objects.filter(
            rut_usuario=self.request.user
        ).select_related('rut_usuario', 'id_seccion', 'id_muestra')

    @action(detail=True, methods=['post'], url_path='marcar_leida')
    def marcar_leida(self, request, pk=None):
        """Marca una notificación individual como leída."""
        notif = self.get_object()
        notif.leida = True
        notif.save(update_fields=['leida'])
        return Response(self.get_serializer(notif).data)

    @action(detail=False, methods=['post'], url_path='marcar_todas_leidas')
    def marcar_todas_leidas(self, request):
        """Marca todas las notificaciones del usuario como leídas."""
        updated = Notificacion.objects.filter(
            rut_usuario=request.user,
            leida=False,
        ).update(leida=True)
        return Response({'marcadas': updated})


# =============================================================================
# Señal: genera notificaciones automáticas al crear una Muestra con PC
# =============================================================================
@receiver(post_save, sender=Muestra)
def notificar_punto_critico(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva Muestra,
    genera una notificación para todos los usuarios ADMIN y AGRO.
    """
    if not created:
        return

    destinatarios = Usuario.objects.filter(rol__in=['ADMIN', 'AGRO'], is_active=True)
    seccion = instance.id_seccion

    if instance.id_punto_critico:
        pc = instance.id_punto_critico
        titulo = 'Punto Crítico Registrado'
        mensaje = (
            f'Se registró un nuevo punto crítico en «{seccion}». '
            f'Descripción: {pc.descripcion}. '
            f'Muestra ID: {instance.id_muestra}.'
        )
    else:
        titulo = 'Nueva Muestra Registrada'
        mensaje = (
            f'Se registró una nueva muestra en «{seccion}». '
            f'Muestra ID: {instance.id_muestra}.'
        )

    notifs = [
        Notificacion(
            rut_usuario=user,
            titulo=titulo,
            mensaje=mensaje,
            tipo='PUNTO_CRITICO' if instance.id_punto_critico else 'SISTEMA',
            id_seccion=seccion,
            id_muestra=instance,
        )
        for user in destinatarios
    ]
    if notifs:
        Notificacion.objects.bulk_create(notifs)
