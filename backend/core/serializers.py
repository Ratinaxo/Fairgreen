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
    Acepta subida de archivos y guarda la URL resultante en ruta_archivo.
    """
    ruta_archivo = serializers.FileField(write_only=True)
    url = serializers.CharField(source='ruta_archivo', read_only=True)

    class Meta:
        model = Foto
        fields = ['id_foto', 'id_muestra', 'ruta_archivo', 'url', 'fecha_hora_subida']
        read_only_fields = ['id_foto', 'fecha_hora_subida']

    def create(self, validated_data):
        import os
        from django.conf import settings
        from core.utils.s3_utils import upload_file_to_s3

        archivo = validated_data.pop('ruta_archivo')
        muestra = validated_data['id_muestra']
        nombre_base = f"muestra_{muestra.pk}_{archivo.name}"

        # Intentar subir a S3 primero
        s3_url = upload_file_to_s3(archivo, nombre_base, folder='fotos')

        if s3_url:
            # S3 fue exitoso
            ruta_final = s3_url
        else:
            # Fallback a disco local
            fotos_dir = os.path.join(settings.BASE_DIR, 'media', 'fotos')
            os.makedirs(fotos_dir, exist_ok=True)
            
            ruta_local = os.path.join(fotos_dir, nombre_base)
            # Rebobinar el archivo por si boto3 lo leyó y falló
            archivo.seek(0)
            with open(ruta_local, 'wb+') as dest:
                for chunk in archivo.chunks():
                    dest.write(chunk)
            ruta_final = f"/media/fotos/{nombre_base}"

        foto = Foto.objects.create(
            id_muestra=muestra,
            ruta_archivo=ruta_final,
        )
        return foto


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