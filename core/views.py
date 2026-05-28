from rest_framework import viewsets
from .models import Seccion, PuntoCritico, Muestra
from .serializers import SeccionSerializer, PuntoCriticoSerializer, MuestraSerializer
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


class MuestraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Muestras de suelo tomadas en terreno.
    - Devuelve datos en formato GeoJSON.
    - Lectura pública.
    - Administradores ('ADMIN') y Agrónomas ('AGRO') pueden registrar, editar o eliminar muestras.
    - Cancheros ('CANCHERO') solo lectura.
    - Enlaza automáticamente la muestra al usuario logueado mediante el token JWT.
    """
    queryset = Muestra.objects.all().order_by('-fecha_hora_captura')
    serializer_class = MuestraSerializer
    permission_classes = [EsAdminOAgronoma]

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

