"""
URL configuration for fairgreen_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import SeccionViewSet, PuntoCriticoViewSet, MuestraViewSet, UsuarioViewSet, FotoViewSet, NotificacionViewSet
from core.auth_views import AuthMeView, CustomTokenObtainPairView

# Configuración del enrutador automático de DRF
router = DefaultRouter()
router.register(r'secciones', SeccionViewSet, basename='seccion')
router.register(r'puntos-criticos', PuntoCriticoViewSet, basename='puntocritico')
router.register(r'muestras', MuestraViewSet, basename='muestra')
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'fotos', FotoViewSet, basename='foto')
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Endpoints de autenticación JWT
    # POST /api/token/         → Enviar {"correo_electronico": "...", "password": "..."} → Recibe {access, refresh}
    # POST /api/token/refresh/ → Enviar {"refresh": "..."} → Recibe un nuevo {access}
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Perfil del usuario autenticado (requiere Bearer token)
    path('api/auth/me', AuthMeView.as_view(), name='auth_me'),

    # Endpoints de la API REST / GeoJSON
    path('api/', include(router.urls)),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
