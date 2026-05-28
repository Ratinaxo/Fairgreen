from rest_framework.test import APITestCase
from rest_framework import status
from core.models import Usuario, Seccion

class SeguridadRolesTests(APITestCase):
    def setUp(self):
        # Crear usuarios de prueba con diferentes roles
        self.admin = Usuario.objects.create_user(
            correo_electronico='admin@test.com', rut='11111111-1', nombre='Admin', apellido='Test', rol='ADMIN', password='123'
        )
        self.agro = Usuario.objects.create_user(
            correo_electronico='agro@test.com', rut='22222222-2', nombre='Agro', apellido='Test', rol='AGRO', password='123'
        )
        self.canchero = Usuario.objects.create_user(
            correo_electronico='canchero@test.com', rut='33333333-3', nombre='Canchero', apellido='Test', rol='CANCHERO', password='123'
        )
        
        # Crear una sección de prueba
        from django.contrib.gis.geos import Polygon
        self.seccion = Seccion.objects.create(
            tipo_de_tierra='GREEN',
            numero_de_hoyo=1,
            poligono=Polygon(((0.0, 0.0), (0.0, 1.0), (1.0, 1.0), (1.0, 0.0), (0.0, 0.0)))
        )

    def test_acceso_anonimo_denegado(self):
        """Un usuario sin autenticarse NO debe poder leer las secciones."""
        response = self.client.get('/api/secciones/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_canchero_puede_leer_pero_no_crear_muestras(self):
        """Un CANCHERO puede leer muestras pero NO crear nuevas."""
        self.client.force_authenticate(user=self.canchero)
        
        # Lectura permitida
        res_get = self.client.get('/api/muestras/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        
        # Escritura DENEGADA (403 Forbidden)
        res_post = self.client.post('/api/muestras/', {
            'id_seccion_id': self.seccion.id_seccion,
            'salinidad': 1.0, 'humedad': 1.0, 'conductividad': 1.0, 'temperatura': 20.0,
            'ubicacion_exacta': 'POINT(0.5 0.5)'
        })
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)

    def test_agronoma_puede_crear_muestras(self):
        """Una AGRÓNOMA SÍ puede crear muestras de suelo."""
        self.client.force_authenticate(user=self.agro)
        
        res_post = self.client.post('/api/muestras/', {
            'id_seccion_id': self.seccion.id_seccion,
            'salinidad': 1.5, 'humedad': 12.0, 'conductividad': 3.0, 'temperatura': 22.0,
            'ubicacion_exacta': 'POINT(0.5 0.5)'
        })
        # Debe ser 201 Created
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
        
        # Verificar que la muestra se asignó a la agrónoma automáticamente (perform_create)
        from core.models import Muestra
        muestra_creada = Muestra.objects.get(id_seccion=self.seccion)
        self.assertEqual(muestra_creada.rut_usuario, self.agro)

    def test_agronoma_no_puede_crear_secciones(self):
        """Una AGRÓNOMA NO puede crear SECCIONES del campo de golf (solo ADMIN)."""
        self.client.force_authenticate(user=self.agro)
        
        res_post = self.client.post('/api/secciones/', {
            'tipo_de_tierra': 'FAIRWAY',
            'numero_de_hoyo': 2,
            'poligono': 'POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))'
        })
        self.assertEqual(res_post.status_code, status.HTTP_403_FORBIDDEN)
