from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_gis.pagination import GeoJsonPagination
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Seccion, PuntoCritico, Muestra, Usuario, Foto, Notificacion, HistorialMuestra
from .serializers import SeccionSerializer, PuntoCriticoSerializer, MuestraSerializer, UsuarioSerializer, FotoSerializer, NotificacionSerializer
from .permissions import EsAdmin, EsAdminOAgronoma, PuedeCreadoPorTodos


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
    - Lectura: cualquier usuario autenticado.
    - Crear (POST): cualquier usuario autenticado (Canchero incluido).
    - Editar (PUT/PATCH): solo ADMIN y AGRO.
    - Eliminar (DELETE): NADIE. Las muestras son registros permanentes.
    - Enlaza automáticamente la muestra al usuario logueado mediante el token JWT.
    - Filtros opcionales: fecha_desde, fecha_hasta (formato YYYY-MM-DD).
    """
    serializer_class = MuestraSerializer
    permission_classes = [PuedeCreadoPorTodos]
    pagination_class = GeoJsonPagination

    def destroy(self, request, *args, **kwargs):
        """Las muestras son registros de auditoría permanentes. Eliminación deshabilitada para todos los roles."""
        from rest_framework.response import Response
        from rest_framework import status
        return Response(
            {'detail': 'La eliminación de muestras no está permitida. Las muestras son registros permanentes.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def get_queryset(self):
        qs = Muestra.objects.all().order_by('-fecha_hora_captura')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')
        sector = self.request.query_params.get('sector')
        zona = self.request.query_params.get('zona')
        id_muestra = self.request.query_params.get('id_muestra')

        if fecha_desde:
            qs = qs.filter(fecha_hora_captura__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha_hora_captura__date__lte=fecha_hasta)
        if sector:
            qs = qs.filter(id_seccion__numero_de_hoyo=sector)
        if zona:
            qs = qs.filter(id_seccion__tipo_de_tierra__iexact=zona)
        if id_muestra:
            qs = qs.filter(id_muestra=id_muestra)
        
        punto_critico = self.request.query_params.get('punto_critico')
        if punto_critico:
            if punto_critico.lower() == 'si':
                qs = qs.filter(id_punto_critico__isnull=False)
            elif punto_critico.lower() == 'no':
                qs = qs.filter(id_punto_critico__isnull=True)

        return qs

    # Campos que se auditan en el historial de modificaciones
    CAMPOS_AUDITABLES = ['salinidad', 'humedad', 'conductividad', 'temperatura', 'recomendaciones', 'id_seccion_id', 'id_punto_critico_id']

    def perform_create(self, serializer):
        """
        Sobrescribe la creación para:
        1. Enlazar automáticamente la muestra al usuario autenticado.
        2. Generar un registro de historial tipo CREACION.
        """
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(rut_usuario=user) if user else serializer.save()

        # Registrar creación en el historial
        cambios = {}
        for campo in self.CAMPOS_AUDITABLES:
            valor = getattr(instance, campo, None)
            if valor is not None:
                cambios[campo] = {'nuevo': self._serializar_valor(valor)}

        # Agregar ubicación
        if instance.ubicacion_exacta:
            cambios['ubicacion_exacta'] = {
                'nuevo': [instance.ubicacion_exacta.x, instance.ubicacion_exacta.y]
            }

        HistorialMuestra.objects.create(
            id_muestra=instance,
            rut_usuario=user,
            tipo='CREACION',
            cambios=cambios,
        )

    def perform_update(self, serializer):
        """
        Sobrescribe la actualización para detectar los campos que cambiaron
        y generar un registro de historial tipo EDICION.
        """
        instance = serializer.instance

        # Capturar valores anteriores antes de guardar
        valores_anteriores = {}
        for campo in self.CAMPOS_AUDITABLES:
            valores_anteriores[campo] = getattr(instance, campo, None)

        # Capturar ubicación anterior
        ubicacion_anterior = None
        if instance.ubicacion_exacta:
            ubicacion_anterior = [instance.ubicacion_exacta.x, instance.ubicacion_exacta.y]

        # Guardar los cambios
        instance = serializer.save()

        # Comparar y registrar diferencias
        cambios = {}
        for campo in self.CAMPOS_AUDITABLES:
            valor_nuevo = getattr(instance, campo, None)
            valor_anterior = valores_anteriores[campo]
            if self._serializar_valor(valor_nuevo) != self._serializar_valor(valor_anterior):
                cambios[campo] = {
                    'anterior': self._serializar_valor(valor_anterior),
                    'nuevo': self._serializar_valor(valor_nuevo),
                }

        # Comparar ubicación
        ubicacion_nueva = None
        if instance.ubicacion_exacta:
            ubicacion_nueva = [instance.ubicacion_exacta.x, instance.ubicacion_exacta.y]
        if ubicacion_nueva != ubicacion_anterior:
            cambios['ubicacion_exacta'] = {
                'anterior': ubicacion_anterior,
                'nuevo': ubicacion_nueva,
            }

        # Solo crear registro si hubo cambios reales
        if cambios:
            user = self.request.user if self.request.user.is_authenticated else None
            HistorialMuestra.objects.create(
                id_muestra=instance,
                rut_usuario=user,
                tipo='EDICION',
                cambios=cambios,
            )

    @staticmethod
    def _serializar_valor(valor):
        """Convierte valores a tipos serializables para comparación y almacenamiento JSON."""
        if valor is None:
            return None
        if isinstance(valor, float):
            return round(valor, 6)
        return valor

    @action(detail=False, methods=['delete'], url_path='delete_all')
    def delete_all(self, request):
        """
        Endpoint deshabilitado. Las muestras son registros permanentes de auditoría
        y no pueden eliminarse masivamente.
        """
        return Response(
            {'detail': 'La eliminación masiva de muestras no está permitida.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )



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
    - Crear (POST): cualquier usuario autenticado (necesario para que el Canchero suba fotos al registrar muestras).
    - Editar / Eliminar: solo ADMIN y AGRO.
    """
    queryset = Foto.objects.all().order_by('-fecha_hora_subida')
    serializer_class = FotoSerializer
    permission_classes = [PuedeCreadoPorTodos]


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
# Señal: genera notificaciones automáticas al crear una Muestra
# =============================================================================
@receiver(post_save, sender=Muestra)
def notificar_nueva_muestra(sender, instance, created, **kwargs):
    """
    Cuando se crea una nueva Muestra, genera una notificación para todos
    los usuarios ADMIN y AGRO incluyendo:
    - Quién subió la muestra (nombre completo del usuario)
    - Dónde (sección: tipo de tierra + número de hoyo)
    - Descripción del punto crítico (si aplica)
    - Recomendaciones (si las hay)
    """
    if not created:
        return

    destinatarios = Usuario.objects.filter(rol__in=['ADMIN', 'AGRO'], is_active=True)
    seccion = instance.id_seccion

    # Datos del usuario que subió la muestra
    usuario = instance.rut_usuario
    nombre_usuario = f'{usuario.nombre} {usuario.apellido}' if usuario else 'Usuario desconocido'

    # Ubicación detallada
    ubicacion = f'{seccion.get_tipo_de_tierra_display()} - Hoyo {seccion.numero_de_hoyo}'

    if instance.id_punto_critico:
        pc = instance.id_punto_critico
        titulo = 'Punto Crítico Registrado'
        mensaje = (
            f'{nombre_usuario} registró una muestra en un punto crítico.\n'
            f'📍 Ubicación: {ubicacion}.\n'
            f'⚠️ Punto crítico: {pc.descripcion}.\n'
            f'🆔 Muestra #{instance.id_muestra}.'
        )
    else:
        titulo = 'Nueva Muestra Registrada'
        mensaje = (
            f'{nombre_usuario} registró una nueva muestra.\n'
            f'📍 Ubicación: {ubicacion}.\n'
            f'🆔 Muestra #{instance.id_muestra}.'
        )

    # Agregar recomendaciones si existen
    if instance.recomendaciones:
        mensaje += f'\n📝 Recomendaciones: {instance.recomendaciones}'

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
