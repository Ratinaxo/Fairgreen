from django.contrib.gis.db import models 

class Usuario(models.Model):
    ROLES_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('AGRO', 'Agrónoma'),
        ('CANCHERO', 'Canchero'),
    ]

    rut = models.CharField(max_length=12, primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    correo_electronico = models.EmailField(unique=True)
    contrasena = models.CharField(max_length=128)
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES)
    ruta_foto = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.get_rol_display()}"

class Seccion(models.Model):
    TIPO_TIERRA_CHOICES = [
        ('GREEN', 'Green'),
        ('FAIRWAY', 'Fairway'),
    ]

    id_seccion = models.AutoField(primary_key=True)
    tipo_de_tierra = models.CharField(max_length=20, choices=TIPO_TIERRA_CHOICES)
    numero_de_hoyo = models.IntegerField()
    
    # Campo PostGIS para el polígono irregular. 
    # SRID 4326 es el estándar mundial de latitud/longitud (WGS 84)
    poligono = models.PolygonField(srid=4326) 

    def __str__(self):
        return f"{self.get_tipo_de_tierra_display()} - Hoyo {self.numero_de_hoyo}"

class PuntoCritico(models.Model):
    id_punto_critico = models.AutoField(primary_key=True)
    id_seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='puntos_criticos')
    descripcion = models.CharField(max_length=100, help_text="Ej: Hundimiento por humedad")
    
    # Campo PostGIS para un punto exacto
    ubicacion = models.PointField(srid=4326)

    def __str__(self):
        return f"Punto Crítico {self.id_punto_critico} en {self.id_seccion}"

class Muestra(models.Model):
    id_muestra = models.AutoField(primary_key=True)
    rut_usuario = models.ForeignKey(Usuario, on_delete=models.RESTRICT, related_name='muestras_tomadas')
    id_seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='muestras')
    
    # Opcional: Solo si la muestra se tomó exactamente en un Punto Crítico mapeado
    id_punto_critico = models.ForeignKey(PuntoCritico, on_delete=models.SET_NULL, null=True, blank=True, related_name='muestras')
    
    salinidad = models.FloatField()
    humedad = models.FloatField()
    conductividad = models.FloatField()
    temperatura = models.FloatField()
    
    # Dónde exactamente se paró la agrónoma a tomar la muestra
    ubicacion_exacta = models.PointField(srid=4326)
    
    recomendaciones = models.TextField(blank=True, null=True)
    
    # Nuestro Timestamp unificado
    fecha_hora_captura = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return f"Muestra {self.id_muestra} - {self.fecha_hora_captura.strftime('%d/%m/%Y %H:%M')}"

class Foto(models.Model):
    id_foto = models.AutoField(primary_key=True)
    id_muestra = models.ForeignKey(Muestra, on_delete=models.CASCADE, related_name='fotos')
    ruta_archivo = models.URLField() # URL de Amazon S3
    
    # Cuándo se subió al sistema
    fecha_hora_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de Muestra {self.id_muestra.id_muestra}"