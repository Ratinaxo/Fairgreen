from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import Usuario, Seccion, PuntoCritico, Muestra, Foto, Notificacion


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Usuario.
    Solo expone campos públicos del perfil. El password es write-only.
    """
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Usuario
        fields = ['rut', 'nombre', 'apellido', 'correo_electronico', 'rol', 'ruta_foto', 'is_active', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = Usuario(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user


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
    id_seccion_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = PuntoCritico
        geo_field = 'ubicacion'  # Campo PostGIS PointField serializado como punto GeoJSON
        fields = ['id_punto_critico', 'id_seccion', 'id_seccion_id', 'descripcion', 'ubicacion']


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


class NotificacionSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Notificacion.
    Expone todos los campos necesarios para el panel de alertas del frontend.
    El destinatario se muestra de forma anidada para facilitar la visualización.
    """
    rut_usuario = UsuarioSerializer(read_only=True)
    rut_usuario_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Notificacion
        fields = [
            'id_notificacion',
            'rut_usuario',
            'rut_usuario_id',
            'titulo',
            'mensaje',
            'tipo',
            'leida',
            'fecha_hora',
            'id_seccion',
            'id_muestra',
        ]
        read_only_fields = ['id_notificacion', 'fecha_hora']
