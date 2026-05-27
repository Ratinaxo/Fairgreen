from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Usuario, Seccion, PuntoCritico, Muestra, Foto


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Usuario.
    El campo 'contrasena' está excluido intencionalmente para no
    exponer información sensible a través de la API.
    """
    class Meta:
        model = Usuario
        fields = ['rut', 'nombre', 'apellido', 'correo_electronico', 'rol', 'ruta_foto']
        # 'contrasena' se excluye explícitamente por seguridad


class SeccionSerializer(GeoFeatureModelSerializer):
    """
    Serializador para el modelo Seccion.
    Devuelve cada sección del campo de golf como una Feature GeoJSON,
    con el polígono PostGIS serializado en la clave 'geometry'.
    """
    class Meta:
        model = Seccion
        geo_field = 'poligono'  # Campo PostGIS que se serializa como geometría GeoJSON
        fields = ['id_seccion', 'tipo_de_tierra', 'numero_de_hoyo', 'poligono']


class PuntoCriticoSerializer(GeoFeatureModelSerializer):
    """
    Serializador para el modelo PuntoCritico.
    Devuelve cada punto crítico del campo como una Feature GeoJSON de tipo Point.
    Incluye información de su sección padre en modo de solo lectura.
    """
    id_seccion = SeccionSerializer(read_only=True)

    class Meta:
        model = PuntoCritico
        geo_field = 'ubicacion'  # Campo PostGIS PointField serializado como punto GeoJSON
        fields = ['id_punto_critico', 'id_seccion', 'descripcion', 'ubicacion']


class FotoSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Foto.
    Devuelve la URL del archivo en S3 y la fecha de subida.
    """
    class Meta:
        model = Foto
        fields = ['id_foto', 'ruta_archivo', 'fecha_hora_subida']


class MuestraSerializer(GeoFeatureModelSerializer):
    """
    Serializador para el modelo Muestra.
    Devuelve cada muestra agronómica como una Feature GeoJSON de tipo Point,
    con todos los datos sensoriales (humedad, temperatura, etc.) en 'properties'.
    El usuario y la sección se muestran en modo de solo lectura (anidados).
    Las fotos asociadas también se incluyen.
    """
    # Campos de solo lectura anidados para lectura
    rut_usuario = UsuarioSerializer(read_only=True)
    id_seccion = SeccionSerializer(read_only=True)
    fotos = FotoSerializer(many=True, read_only=True)

    # Campos de escritura (claves foráneas) para crear/actualizar muestras
    rut_usuario_id = serializers.CharField(write_only=True, required=False)
    id_seccion_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Muestra
        geo_field = 'ubicacion_exacta'  # Campo PostGIS PointField serializado como punto GeoJSON
        fields = [
            'id_muestra',
            'rut_usuario',
            'rut_usuario_id',
            'id_seccion',
            'id_seccion_id',
            'id_punto_critico',
            'salinidad',
            'humedad',
            'conductividad',
            'temperatura',
            'ubicacion_exacta',
            'recomendaciones',
            'fecha_hora_captura',
            'fotos',
        ]
        read_only_fields = ['id_muestra', 'fecha_hora_captura']
