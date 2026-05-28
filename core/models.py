from django.contrib.gis.db import models 
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# =============================================================================
# Manager personalizado para el modelo Usuario
# =============================================================================
class CustomUserManager(BaseUserManager):
    """
    Manager que permite crear usuarios y superusuarios usando el correo
    electrónico como identificador principal de login (en vez de 'username').
    """

    def create_user(self, correo_electronico, rut, nombre, apellido, rol, password=None, **extra_fields):
        """
        Crea y retorna un usuario regular.
        - 'password' se hashea automáticamente con set_password().
        - 'correo_electronico' se normaliza (minúsculas en el dominio).
        """
        if not correo_electronico:
            raise ValueError('El usuario debe tener un correo electrónico.')
        if not rut:
            raise ValueError('El usuario debe tener un RUT.')

        correo_electronico = self.normalize_email(correo_electronico)
        user = self.model(
            correo_electronico=correo_electronico,
            rut=rut,
            nombre=nombre,
            apellido=apellido,
            rol=rol,
            **extra_fields,
        )
        user.set_password(password)  # Hashea la contraseña con PBKDF2-SHA256
        user.save(using=self._db)
        return user

    def create_superuser(self, correo_electronico, rut, nombre, apellido, rol='ADMIN', password=None, **extra_fields):
        """
        Crea y retorna un superusuario (para el panel /admin/).
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Un superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Un superusuario debe tener is_superuser=True.')

        return self.create_user(correo_electronico, rut, nombre, apellido, rol, password, **extra_fields)


# =============================================================================
# Modelo de Usuario (Custom User Model de Django)
# =============================================================================
class Usuario(AbstractBaseUser, PermissionsMixin):
    ROLES_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('AGRO', 'Agrónoma'),
        ('CANCHERO', 'Canchero'),
    ]

    rut = models.CharField(max_length=12, primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    correo_electronico = models.EmailField(unique=True)
    # El campo 'password' lo hereda automáticamente de AbstractBaseUser.
    # Ya NO existe el campo 'contrasena'. Django hashea internamente con set_password().
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES)
    ruta_foto = models.URLField(blank=True, null=True)

    # Campos requeridos por el sistema de autenticación de Django
    is_active = models.BooleanField(default=True)   # Para desactivar cuentas sin borrarlas
    is_staff = models.BooleanField(default=False)    # Acceso al panel /admin/

    objects = CustomUserManager()

    # El campo que se usa para hacer LOGIN (lo que Angular enviará como "username")
    USERNAME_FIELD = 'correo_electronico'
    # Campos que 'createsuperuser' pedirá obligatoriamente en la terminal
    REQUIRED_FIELDS = ['rut', 'nombre', 'apellido', 'rol']

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.get_rol_display()}"


# =============================================================================
# Modelo de Sección (Green o Fairway del campo de golf)
# =============================================================================
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


# =============================================================================
# Modelo de Punto Crítico (ubicación problemática dentro de una sección)
# =============================================================================
class PuntoCritico(models.Model):
    id_punto_critico = models.AutoField(primary_key=True)
    id_seccion = models.ForeignKey(Seccion, on_delete=models.CASCADE, related_name='puntos_criticos')
    descripcion = models.CharField(max_length=100, help_text="Ej: Hundimiento por humedad")
    
    # Campo PostGIS para un punto exacto
    ubicacion = models.PointField(srid=4326)

    def __str__(self):
        return f"Punto Crítico {self.id_punto_critico} en {self.id_seccion}"


# =============================================================================
# Modelo de Muestra (datos sensoriales tomados en terreno)
# =============================================================================
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


# =============================================================================
# Modelo de Foto (imagen asociada a una muestra, almacenada en S3)
# =============================================================================
class Foto(models.Model):
    id_foto = models.AutoField(primary_key=True)
    id_muestra = models.ForeignKey(Muestra, on_delete=models.CASCADE, related_name='fotos')
    ruta_archivo = models.URLField() # URL de Amazon S3
    
    # Cuándo se subió al sistema
    fecha_hora_subida = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto de Muestra {self.id_muestra.id_muestra}"