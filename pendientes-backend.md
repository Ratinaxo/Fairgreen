# Tareas Pendientes en el Backend de FairGreen

A continuación se listan las funcionalidades que el Frontend ya está solicitando o que están simuladas/incompletas, y que requieren ser desarrolladas en el Backend en el futuro:

### 1. Gestión Completa de Usuarios (Creación y Contraseñas)
- **Problema:** Actualmente el frontend tiene una tabla con usuarios que se conecta a `GET /api/usuarios/`, pero el botón de "Añadir Nuevo Usuario" muestra una alerta de funcionalidad pendiente.
- **Solución:** Se necesita implementar un endpoint `POST /api/usuarios/` que no solo cree el registro en el modelo `Usuario`, sino que además asocie y cree un `User` nativo de Django para manejar la autenticación y establecer la contraseña.

### 2. Generación de Reportes Semanales (PDF)
- **Problema:** El componente `DashboardComponent` tiene un panel de "Reporte general semanal" con un botón de "Descargar", que actualmente muestra un modal de simulación.
- **Solución:** Crear un endpoint `GET /api/reportes/semanal/` que procese las muestras de la semana, genere un documento en PDF (usando librerías como `ReportLab` o `WeasyPrint` en Django) y retorne el archivo para ser descargado por el navegador.

### 3. Asignación Automática de Sección vía PostGIS (Intersección Espacial)
- **Problema:** En el registro de una nueva muestra (`NewSampleComponent`), el usuario selecciona manualmente la sección en un menú desplegable y luego marca el punto exacto en el mapa.
- **Solución:** Aprovechando que la base de datos es PostGIS, el backend podría recibir solo la `ubicacion_exacta` (Point) y utilizar una consulta espacial (`ST_Contains` o `ST_Intersects`) para determinar automáticamente en qué polígono de `Seccion` se tomó la muestra, validando que el punto no caiga fuera del campo.

### 4. Notificaciones y Alertas (Timeline del Mapa)
- **Problema:** En el `GeomapComponent`, al seleccionar un sector (por ejemplo "Green #3"), se muestra un historial con textos como *"⚠ Conductividad crítica detectada"*. Actualmente el frontend calcula esto de forma rudimentaria basándose en promedios.
- **Solución:** Crear un modelo y endpoint de `Alertas` (`/api/alertas/`). Un proceso en el backend (o signals de Django al guardar una Muestra) debería analizar si los valores exceden los límites (ej. conductividad > 3.5) y generar un registro de alerta que el frontend pueda consumir.

### 5. Edición de Puntos Críticos y Capas Adicionales
- **Problema:** El mapa muestra Puntos Críticos, pero no existe una forma de añadir nuevos puntos críticos desde el frontend (CRUD de Puntos Críticos).
- **Solución:** Desarrollar los endpoints completos (POST/PUT/DELETE) para `PuntoCritico`, junto con la UI correspondiente en el mapa interactivo.
