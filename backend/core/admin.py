from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario, Seccion, PuntoCritico, Muestra, Foto


# =============================================================================
# Admin personalizado para el Custom User Model
# =============================================================================
class UsuarioAdmin(BaseUserAdmin):
    """
    Configuración del panel de administración para el modelo Usuario.
    Necesario porque usamos AbstractBaseUser en vez del User default de Django.
    """
    # Columnas visibles en la lista de usuarios
    list_display = ('rut', 'correo_electronico', 'nombre', 'apellido', 'rol', 'is_active', 'is_staff')
    list_filter = ('rol', 'is_active', 'is_staff')
    search_fields = ('rut', 'correo_electronico', 'nombre', 'apellido')
    ordering = ('nombre',)

    # Campos que se muestran al EDITAR un usuario existente
    fieldsets = (
        (None, {'fields': ('correo_electronico', 'password')}),
        ('Información Personal', {'fields': ('rut', 'nombre', 'apellido', 'rol', 'ruta_foto')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    # Campos que se muestran al CREAR un usuario nuevo desde el admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('correo_electronico', 'rut', 'nombre', 'apellido', 'rol', 'password1', 'password2'),
        }),
    )


# =============================================================================
# Clase base para administración de mapas GIS (GeoDjango)
# Centrada en Club de Golf Las Palmas, Quillota, Chile (cerca de Viña del Mar)
# =============================================================================
class FairgreenGISAdmin(gis_admin.GISModelAdmin):
    gis_widget_kwargs = {
        'attrs': {
            'default_lon': -71.543055,
            'default_lat': -32.991957,
            'default_zoom': 15,
        }
    }


# =============================================================================
# Registrar todos los modelos en el panel de administración
# =============================================================================
admin.site.register(Usuario, UsuarioAdmin)
admin.site.register(Seccion, FairgreenGISAdmin)
admin.site.register(PuntoCritico, FairgreenGISAdmin)
admin.site.register(Muestra, FairgreenGISAdmin)
admin.site.register(Foto)

