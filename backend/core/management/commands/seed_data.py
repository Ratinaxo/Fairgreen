"""
seed_data.py — Pobla la base de datos con datos iniciales de demostración.

Uso (dentro del contenedor o con venv activo):
    python manage.py seed_data

Crea:
  - 3 usuarios (ADMIN, AGRO, CANCHERO)
  - 5 secciones del campo de golf (con polígonos reales del Campo de Golf Las Palmas)
  - 2 puntos críticos por sección (10 en total)
  - 25 muestras distribuidas en las secciones
  - 5 fotos de ejemplo vinculadas a muestras
  - Notificaciones de demo para el admin y agrónoma

Si los datos ya existen, los omite (idempotente).
"""

import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point, Polygon
from django.utils import timezone
from core.models import Usuario, Seccion, PuntoCritico, Muestra, Foto, Notificacion


# ---------------------------------------------------------------------------
# Coordenadas centrales del campo (Club Naval de Campo Las Salinas)
# SRID 4326: (longitud, latitud)
# ---------------------------------------------------------------------------
CAMPO_LON = -71.54305513777648
CAMPO_LAT = -32.99195765675922

def offset_point(lon, lat, dlon, dlat):
    """Genera un Point con un desplazamiento en grados decimales."""
    return Point(lon + dlon, lat + dlat, srid=4326)

def make_polygon(cx, cy, w=0.0008, h=0.0005):
    """Crea un polígono rectangular simple alrededor de un centro."""
    return Polygon((
        (cx - w, cy - h),
        (cx + w, cy - h),
        (cx + w, cy + h),
        (cx - w, cy + h),
        (cx - w, cy - h),  # Cerrar el anillo
    ), srid=4326)


class Command(BaseCommand):
    help = 'Pobla la base de datos con datos de demostración (usuarios, secciones, muestras, etc.)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('\n🌱 Iniciando seed de datos FairGreen...\n'))
        self._seed_usuarios()
        secciones = self._seed_secciones()
        puntos = self._seed_puntos_criticos(secciones)
        self._seed_muestras(secciones, puntos)
        self._seed_notificaciones()
        self.stdout.write(self.style.SUCCESS('\n✅ Seed completado exitosamente.\n'))

    # -------------------------------------------------------------------------
    # 1. Usuarios
    # -------------------------------------------------------------------------
    def _seed_usuarios(self):
        self.stdout.write('👤 Creando usuarios...')

        usuarios_data = [
            {
                'rut': '12345678-9',
                'nombre': 'Administrador',
                'apellido': 'Sistema',
                'correo_electronico': 'admin@fairgreen.com',
                'rol': 'ADMIN',
                'password': 'admin1234',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'rut': '98765432-1',
                'nombre': 'María',
                'apellido': 'González',
                'correo_electronico': 'agro@fairgreen.com',
                'rol': 'AGRO',
                'password': 'agro1234',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'rut': '11223344-5',
                'nombre': 'Carlos',
                'apellido': 'Ramírez',
                'correo_electronico': 'canchero@fairgreen.com',
                'rol': 'CANCHERO',
                'password': 'canchero1234',
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        for data in usuarios_data:
            rut = data['rut']
            if Usuario.objects.filter(rut=rut).exists():
                self.stdout.write(f'   ⏭  Usuario {data["correo_electronico"]} ya existe, omitiendo.')
                continue

            u = Usuario.objects.create_user(
                correo_electronico=data['correo_electronico'],
                rut=rut,
                nombre=data['nombre'],
                apellido=data['apellido'],
                rol=data['rol'],
                password=data['password'],
            )
            u.is_staff = data['is_staff']
            u.is_superuser = data['is_superuser']
            u.save()
            self.stdout.write(f'   ✅ {data["rol"]}: {data["correo_electronico"]} / {data["password"]}')

    # -------------------------------------------------------------------------
    # 2. Secciones del campo
    # -------------------------------------------------------------------------
    def _seed_secciones(self):
        self.stdout.write('\n🏌️  Cargando secciones oficiales del campo (Fixtures)...')
        from django.core.management import call_command
        try:
            call_command('loaddata', 'secciones.json')
            self.stdout.write(self.style.SUCCESS('   ✅ Secciones cargadas desde fixture.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   ❌ Error al cargar secciones: {e}'))
        
        return list(Seccion.objects.all())

    # -------------------------------------------------------------------------
    # 3. Puntos críticos
    # -------------------------------------------------------------------------
    def _seed_puntos_criticos(self, secciones):
        self.stdout.write('\n📍 Creando puntos críticos...')

        descripciones = [
            'Zona con exceso de humedad',
            'Área con compactación del suelo',
            'Sector con hongos detectados',
            'Punto con déficit de nutrientes',
            'Zona de encharcamiento recurrente',
            'Área de desgaste por tráfico',
            'Sector con pH elevado',
            'Punto con drenaje deficiente',
            'Zona de erosión activa',
            'Área de sombra permanente',
        ]

        puntos = []
        desc_idx = 0

        for seccion in secciones:
            # 2 puntos por sección
            for i in range(2):
                desc_actual = descripciones[desc_idx % len(descripciones)]
                existing = PuntoCritico.objects.filter(
                    id_seccion=seccion,
                    descripcion=desc_actual
                ).first()

                if existing:
                    self.stdout.write(f'   ⏭  Punto ya existe en sección {seccion.id_seccion}.')
                    puntos.append(existing)
                else:
                    center = seccion.poligono.centroid
                    
                    # Garantizar con GeoDjango que el punto caiga dentro del polígono de la sección
                    p_geom = None
                    for _ in range(100):
                        lon = center.x + random.uniform(-0.0003, 0.0003)
                        lat = center.y + random.uniform(-0.0003, 0.0003)
                        temp_p = Point(lon, lat, srid=4326)
                        if seccion.poligono.contains(temp_p):
                            p_geom = temp_p
                            break
                    if p_geom is None:
                        p_geom = center  # Fallback al centroide si no encuentra
 
                    p = PuntoCritico.objects.create(
                        id_seccion=seccion,
                        descripcion=desc_actual,
                        ubicacion=p_geom,
                    )
                    self.stdout.write(f'   ✅ PC en Sección {seccion.id_seccion}: {desc_actual[:30]}...')
                    puntos.append(p)

                desc_idx += 1

        return puntos

    # -------------------------------------------------------------------------
    # 4. Muestras (25 en total)
    # -------------------------------------------------------------------------
    def _seed_muestras(self, secciones, puntos):
        self.stdout.write('\n🧪 Creando muestras de suelo...')

        # Verificar si ya hay muestras
        if Muestra.objects.count() >= 25:
            self.stdout.write('   ⏭  Ya existen ≥25 muestras, omitiendo.')
            return

        usuarios = list(Usuario.objects.all())
        if not usuarios:
            self.stdout.write(self.style.ERROR('   ❌ No hay usuarios. Crea usuarios primero.'))
            return

        recomendaciones_pool = [
            'Aumentar riego en los próximos 3 días.',
            'Aplicar fertilizante con base de nitrógeno.',
            'Revisar sistema de drenaje del sector.',
            'Reducir tráfico peatonal durante recuperación.',
            'Aplicar fungicida preventivo en la próxima semana.',
            'Ajustar pH con sulfato de aluminio.',
            'Monitorear nuevamente en 48 horas.',
            'Sin acciones inmediatas necesarias, estado óptimo.',
            'Aumentar frecuencia de corte del césped.',
            'Verificar posibles raíces obstruyendo el drenaje.',
        ]

        ahora = timezone.now()
        muestras_creadas = []

        for i in range(25):
            seccion = random.choice(secciones)
            usuario = random.choice(usuarios)
            punto = random.choice([p for p in puntos if p.id_seccion == seccion] + [None, None])

            center = seccion.poligono.centroid
            
            # Garantizar con GeoDjango que la muestra caiga dentro del polígono de la sección
            m_geom = None
            for _ in range(100):
                lon = center.x + random.uniform(-0.0004, 0.0004)
                lat = center.y + random.uniform(-0.0004, 0.0004)
                temp_m = Point(lon, lat, srid=4326)
                if seccion.poligono.contains(temp_m):
                    m_geom = temp_m
                    break
            if m_geom is None:
                m_geom = center  # Fallback al centroide si no encuentra
 
            # Valores realistas para un campo de golf en Chile
            humedad = round(random.uniform(1.5, 4.8), 2)
            temperatura = round(random.uniform(12.0, 28.5), 1)
            salinidad = round(random.uniform(0.2, 2.5), 2)
            conductividad = round(random.uniform(0.5, 3.8), 2)
 
            # Fecha distribuida en los últimos 60 días
            dias_atras = random.randint(0, 60)
            fecha = ahora - timedelta(days=dias_atras, hours=random.randint(6, 18))
 
            m = Muestra(
                rut_usuario=usuario,
                id_seccion=seccion,
                id_punto_critico=punto,
                salinidad=salinidad,
                humedad=humedad,
                conductividad=conductividad,
                temperatura=temperatura,
                ubicacion_exacta=m_geom,
                recomendaciones=random.choice(recomendaciones_pool),
            )
            # Guardamos sin auto_now_add para poder setear la fecha
            m.save()

            # Ajustar la fecha manualmente (auto_now_add no acepta override)
            Muestra.objects.filter(pk=m.pk).update(fecha_hora_captura=fecha)
            m.refresh_from_db()
            muestras_creadas.append(m)

        self.stdout.write(f'   ✅ {len(muestras_creadas)} muestras creadas.')

        # -----------------------------------------------------------------------
        # 5. Fotos de ejemplo (1 foto cada 5 muestras)
        # -----------------------------------------------------------------------
        self.stdout.write('\n📷 Creando fotos de ejemplo...')

        foto_urls = [
            'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800',
            'https://images.unsplash.com/photo-1600054800747-be294a6a0d26?w=800',
            'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800',
            'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=800',
            'https://images.unsplash.com/photo-1611374243147-44a702c2d44c?w=800',
        ]

        fotos_count = 0
        for idx, muestra in enumerate(muestras_creadas[::5]):  # 1 foto cada 5 muestras
            if not Foto.objects.filter(id_muestra=muestra).exists():
                Foto.objects.create(
                    id_muestra=muestra,
                    ruta_archivo=foto_urls[fotos_count % len(foto_urls)],
                )
                fotos_count += 1

        self.stdout.write(f'   ✅ {fotos_count} fotos creadas.')

        # -----------------------------------------------------------------------
        # Resumen final
        # -----------------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS('\n📊 Resumen de datos en la BD:'))
        self.stdout.write(f'   • Usuarios: {Usuario.objects.count()}')
        self.stdout.write(f'   • Secciones: {Seccion.objects.count()}')
        self.stdout.write(f'   • Puntos Críticos: {PuntoCritico.objects.count()}')
        self.stdout.write(f'   • Muestras: {Muestra.objects.count()}')
        self.stdout.write(f'   • Fotos: {Foto.objects.count()}')
        self.stdout.write('\n🔑 Credenciales de acceso:')
        self.stdout.write('   • ADMIN:    admin@fairgreen.com    / admin1234')
        self.stdout.write('   • AGRO:     agro@fairgreen.com     / agro1234')
        self.stdout.write('   • CANCHERO: canchero@fairgreen.com / canchero1234')

    # -------------------------------------------------------------------------
    # 6. Notificaciones de demo
    # -------------------------------------------------------------------------
    def _seed_notificaciones(self):
        self.stdout.write('\n🔔 Creando notificaciones de demo...')

        if Notificacion.objects.count() >= 3:
            self.stdout.write('   ⏭  Ya existen notificaciones, omitiendo.')
            return

        # Buscar muestras con punto crítico para referenciar
        muestras_pc = list(Muestra.objects.filter(id_punto_critico__isnull=False)[:3])
        destinatarios = list(Usuario.objects.filter(rol__in=['ADMIN', 'AGRO']))

        if not destinatarios:
            self.stdout.write('   ⚠️  No hay usuarios ADMIN/AGRO, omitiendo notificaciones.')
            return

        notifs_data = [
            {
                'titulo': 'Punto Crítico Registrado',
                'mensaje': 'Se registró un nuevo punto crítico en el Fairway del Hoyo 3. Requiere atención inmediata.',
                'tipo': 'PUNTO_CRITICO',
                'id_muestra': muestras_pc[0] if len(muestras_pc) > 0 else None,
            },
            {
                'titulo': 'Punto Crítico Registrado',
                'mensaje': 'Se detectó un punto crítico con exceso de humedad en el Green del Hoyo 7.',
                'tipo': 'PUNTO_CRITICO',
                'id_muestra': muestras_pc[1] if len(muestras_pc) > 1 else None,
            },
            {
                'titulo': 'Aviso del Sistema',
                'mensaje': 'Bienvenido al sistema FairGreen. Este es el panel de notificaciones donde recibirás alertas importantes.',
                'tipo': 'SISTEMA',
                'id_muestra': None,
            },
        ]

        count = 0
        for user in destinatarios:
            for nd in notifs_data:
                Notificacion.objects.create(
                    rut_usuario=user,
                    titulo=nd['titulo'],
                    mensaje=nd['mensaje'],
                    tipo=nd['tipo'],
                    id_muestra=nd['id_muestra'],
                )
                count += 1

        self.stdout.write(f'   ✅ {count} notificaciones creadas.')
