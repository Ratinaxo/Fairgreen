# FairGreen — Llamadas a Base de Datos por Pantalla (Análisis Crítico)

> **Fuente del modelo:** [Database-future-implementation.md](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/Database-future-implementation.md)  
> **Fuente de endpoints:** [Database-endpoints-master.md](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/Database-endpoints-master.md)  
> **Código fuente:** Componentes Angular en [src/app](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app)

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 | Observación crítica / riesgo alto |
| 🟡 | Advertencia / punto de atención |
| 🟢 | Observación positiva o validación |
| ⚡ | Dato actualmente hardcodeado en el frontend |

---

## 🔐 1. Login (`/login`)

**Archivo:** [login.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/login/login.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 1.1 | `POST /api/auth/login` | `Usuario`, `Sesion`, `LogActividad` | **WRITE** | Valida correo + contraseña hash (bcrypt), crea registro en `Sesion` con token JWT, registra acción `login` en `LogActividad` |
| 1.2 | `POST /api/auth/logout` | `Sesion`, `LogActividad` | **WRITE** | Invalida sesión activa (`Activa = FALSE`), registra `logout` |
| 1.3 | `POST /api/auth/refresh` | `Sesion` | **WRITE** | Renueva token JWT antes de expiración, actualiza `Fecha_Expiracion` |
| 1.4 | `GET /api/auth/me` | `Usuario` | **READ** | Retorna perfil del usuario autenticado (nombre, apellido, rol, foto) |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **Sin autenticación real.** El componente actual usa un `setTimeout` de 900ms que acepta **cualquier credencial** y navega a `/dashboard`. La línea `if (this.email === 'admin@fairgreen.com' && this.password === '1234')` es decorativa porque el `else` también navega al dashboard. No existe validación contra la DB ni generación de tokens.

> [!WARNING]
> 🟡 **No hay guard de ruta.** No existe un `AuthGuard` que proteja las rutas del layout. Cualquier usuario puede navegar directamente a `/dashboard` sin pasar por login. Cuando se implemente la DB, **se necesita también un interceptor HTTP** que adjunte el token JWT a cada request y un guard Angular.

> [!WARNING]
> 🟡 **La tabla `Sesion` usa UUID como PK.** Esto es adecuado para tokens, pero requiere que el backend genere UUIDs. Verificar que el ORM/motor de base de datos soporte `UUID` como tipo nativo (PostgreSQL sí, MySQL requiere `CHAR(36)` o `BINARY(16)`).

> [!WARNING]
> 🟡 **No se contempla recuperación de contraseña.** El frontend tiene una nota diciendo "contacta a tu administrador", pero no existe flujo de reset de contraseña ni endpoint asociado. Es una decisión válida si es intencional, pero limita la autonomía del usuario.

---

## 📊 2. Dashboard (`/dashboard`)

**Archivo:** [dashboard.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/dashboard/dashboard.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 2.1 | `GET /api/dashboard/kpis` | `Muestra`, `Seccion`, `UmbralSeccion` | **READ** | Promedios globales de humedad, temperatura, salinidad, conductividad + estado calculado vs. umbrales |
| 2.2 | `GET /api/secciones` | `Seccion` | **READ** | Lista de secciones con polígonos para renderizar el mapa overview |
| 2.3 | `GET /api/secciones/{id}/estado` | `Muestra`, `Seccion`, `UmbralSeccion` | **READ** | Estado de salud por sección (color del marcador en el mapa) |
| 2.4 | `GET /api/reportes/ultimo-semanal` | `Reporte`, `Muestra` | **READ** | Último reporte generado para el card de descarga |
| 2.5 | `POST /api/reportes/generar` | `Reporte`, `Muestra`, `Seccion` | **WRITE** | Genera un PDF, lo almacena, crea registro en tabla `Reporte` |
| 2.6 | `GET /api/reportes/{id}/descargar` | `Reporte` | **READ** | Descarga binaria del archivo del reporte |
| 2.7 | `GET /api/campo/configuracion` | `ConfiguracionCampo` | **READ** | Nombre del club y coordenadas centrales del campo |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **Todos los KPIs están hardcodeados.** Los valores `3.8 /5`, `24.3 °C`, `0.8 dS/m`, `2.1 dS/m` están escritos directamente en el array `kpiCards` del componente (líneas 211-252). No existe ninguna llamada al `DataService` ni a ningún endpoint. **Esto significa que la pantalla siempre muestra los mismos datos.**

> [!CAUTION]
> 🔴 **Nombre del club hardcodeado.** `"Club de Golf Las Palmas"` está escrito directamente en el template (línea 100). Debería venir de `ConfiguracionCampo.Nombre`.

> [!WARNING]
> 🟡 **La lógica de cálculo de estado (óptimo/atención/crítico) no está definida.** El documento de DB propone la tabla `UmbralSeccion` con `Min_Optimo`, `Max_Optimo`, `Min_Atencion`, `Max_Atencion`, pero **no define qué pasa fuera de esos rangos**. ¿Fuera de `Max_Atencion` es automáticamente crítico? Falta definir la regla de clasificación explícitamente.

> [!WARNING]
> 🟡 **Los sectores del mapa también están hardcodeados** (líneas 254-260). No se usa `DataService.getZones()`, lo que contradice el propio servicio que ya tiene un método preparado para esto.

> [!WARNING]
> 🟡 **El reporte semanal muestra fechas fijas** ("19/05/2025 · 26/05/2025") y el modal de descarga referencia `reporte_semanal_2025.pdf` hardcodeado. No hay lógica de descarga real.

⚡ **Datos hardcodeados:** KPIs, nombre del club, sectores del mapa, fechas del reporte, nombre del archivo PDF.

---

## 🗺️ 3. Georreferenciación (`/geomap`)

**Archivo:** [geomap.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/geomap/geomap.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 3.1 | `GET /api/secciones/geojson` | `Seccion`, `UmbralSeccion`, `Muestra` | **READ** | Secciones como GeoJSON con polígonos, estado de salud y métricas promedio |
| 3.2 | `GET /api/secciones/{id}/detalle` | `Seccion`, `Muestra`, `PuntoCritico`, `UmbralSeccion`, `Usuario` | **READ** | Detalle completo: métricas, responsable, último registro, estado |
| 3.3 | `GET /api/secciones/{id}/muestras/recientes` | `Muestra`, `Usuario` | **READ** | Timeline de últimas 5-10 muestras de la sección |
| 3.4 | `GET /api/secciones/{id}/puntos-criticos` | `PuntoCritico` | **READ** | Puntos críticos georreferenciados para dibujar en el mapa |
| 3.5 | `GET /api/campo/configuracion` | `ConfiguracionCampo` | **READ** | Coordenadas del centro y zoom para inicializar OpenLayers |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **Datos de zonas completamente hardcodeados.** El componente tiene un diccionario `zonesData` (líneas 254-303) con 5 zonas fijas (`green-1` a `green-5`). Los valores de métricas, timeline y estado nunca se consultan de la DB. El `DataService` tiene `getZones()` pero **este componente no lo utiliza**.

> [!CAUTION]
> 🔴 **El map-georef.component consume `DataService.getZones()` para los polígonos**, pero los datos del panel lateral (métricas, timeline, responsable) vienen del diccionario hardcodeado del componente padre. Hay una **desconexión entre los datos del mapa y los datos del panel.**

> [!WARNING]
> 🟡 **El endpoint 3.2 es complejo.** Involucra 5 tablas (`Seccion`, `Muestra`, `PuntoCritico`, `UmbralSeccion`, `Usuario`). Esto sugiere que el backend necesitará una query con múltiples JOINs o una vista materializada para evitar N+1 queries.

> [!WARNING]
> 🟡 **Coordenadas del campo hardcodeadas en `MapService`.** Las constantes `CAMPO_CENTER`, `CAMPO_ZOOM_OVERVIEW`, `CAMPO_ZOOM_DETAIL`, `CAMPO_ZOOM_PICKER` están definidas como constantes en [map.service.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/services/map.service.ts) (líneas 9-12). El propio código dice `// En el futuro se leerán desde la DB del club`. Requiere endpoint 3.5.

> [!NOTE]
> 🟡 **Punto Crítico tiene cardinalidad 0..1 → N con Muestra.** Esto significa que una muestra puede existir sin punto crítico (`IdPuntoCritico NULL`). El frontend debe manejar este caso: ¿qué mostrar en el mapa cuando la muestra no tiene punto crítico asociado? Actualmente no se contempla.

⚡ **Datos hardcodeados:** Métricas de zonas, timeline, coordenadas del campo, niveles de zoom.

---

## ✍️ 4. Nuevo Registro de Muestra (`/samples/new`)

**Archivo:** [new-sample.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 4.1 | `GET /api/secciones` | `Seccion` | **READ** | Lista de secciones para popular el select de Zona |
| 4.2 | `GET /api/secciones?tipo={tipo}` | `Seccion` | **READ** | Secciones filtradas por tipo para obtener sectores disponibles |
| 4.3 | `GET /api/secciones/{id}/puntos-criticos` | `PuntoCritico` | **READ** | Puntos críticos de la sección para asociar la muestra |
| 4.4 | `POST /api/muestras` | `Muestra`, `LogActividad` | **WRITE** | Crea la muestra con métricas, ubicación, sección, punto crítico, recomendaciones |
| 4.5 | `POST /api/muestras/{id}/fotos` | `Foto` | **WRITE** | Sube evidencia fotográfica (multipart/form-data) |
| 4.6 | `GET /api/campo/configuracion` | `ConfiguracionCampo` | **READ** | Coordenadas y zoom para el mapa point-picker |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **`saveSample()` no guarda nada.** La función (línea 295) solo muestra un toast de éxito y navega a `/samples/history` después de 2 segundos. No llama a `DataService.createSample()` a pesar de que el servicio tiene ese método implementado. **Los datos del formulario se pierden.**

> [!CAUTION]
> 🔴 **No se asocia la muestra a un `Punto Crítico`.** El formulario tiene zona y sector, pero no hay un selector de punto crítico existente. El endpoint 4.3 requiere listar puntos críticos, pero el UI no lo implementa. Según el modelo, `IdPuntoCritico` es nullable, pero sería útil ofrecer la opción.

> [!WARNING]
> 🟡 **Las opciones de zona están hardcodeadas en el template.** Los `<option>` del select (`Green`, `Fairway`, `Rough`, `Tee`) están escritos directamente en el HTML. Si se agrega un nuevo tipo de tierra a la tabla `Seccion`, el frontend no se enterará. Deberían venir del endpoint 4.1.

> [!WARNING]
> 🟡 **La subida de fotos no está implementada.** El componente captura el nombre del archivo (`uploadedFile`) pero nunca envía el archivo al backend. Falta implementar `POST /api/muestras/{id}/fotos` con `FormData` y `multipart/form-data`.

> [!WARNING]
> 🟡 **No se registra `RutUsuario` en la muestra.** El payload `CreateSamplePayload` en el `DataService` no incluye el RUT del usuario. Este dato debería inferirse del token JWT en el backend, pero esa lógica no existe aún.

> [!NOTE]
> 🟡 **Discrepancia en tipos de datos.** El modelo define `Humedad` como `DECIMAL(4,2)` con escala 1-5 y `Temperatura` como `DECIMAL(5,2)`. El formulario usa `type="number"` con `step="0.1"` para humedad y `step="0.1"` para temperatura. Falta validación de rangos en el frontend.

⚡ **Datos hardcodeados:** Opciones de zona, el flujo de guardado completo.

---

## 📋 5. Historial de Muestras (`/samples/history`)

**Archivo:** [sample-history.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 5.1 | `GET /api/muestras?page={p}&size={s}` | `Muestra`, `Usuario`, `Seccion` | **READ** | Lista paginada de muestras con datos del responsable y sección |
| 5.2 | `GET /api/muestras?sector={n}&zona={tipo}&page={p}&size={s}` | `Muestra`, `Usuario`, `Seccion` | **READ** | Lista filtrada por sector y/o zona con paginación |
| 5.3 | `GET /api/muestras/{id}` | `Muestra`, `Foto`, `Usuario`, `Seccion`, `PuntoCritico` | **READ** | Detalle completo de una muestra (botón "Ver Muestra") |
| 5.4 | `GET /api/muestras/exportar?formato={csv\|excel}` | `Muestra`, `Usuario`, `Seccion` | **READ** | Exporta historial filtrado (botón "Exportar") |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **Datos generados localmente con mock.** El método `generateMockSamples(142)` (líneas 237-257) genera 142 muestras aleatorias en el constructor del componente. No existe ninguna llamada HTTP. La paginación funciona, pero sobre datos ficticios.

> [!WARNING]
> 🟡 **La paginación es client-side.** Todo el dataset se carga en memoria y se pagina con `slice()`. Cuando se conecte a la DB, esto debe cambiarse a **paginación server-side** con parámetros `page` y `size` en la query, de lo contrario con miles de muestras habrá problemas de rendimiento.

> [!WARNING]
> 🟡 **El botón "Ver Muestra" no hace nada.** No hay navegación a un detalle ni modal. El endpoint 5.3 (`GET /api/muestras/{id}`) no tiene una vista asociada en el frontend.

> [!WARNING]
> 🟡 **El botón "Exportar" no tiene handler.** No hay `(click)` asociado al botón `#export-btn`. Requiere implementar la llamada al endpoint 5.4.

> [!WARNING]
> 🟡 **Los filtros se aplican sobre data mock.** El `computed` de `filteredSamples` filtra la data en memoria. Con la DB, los filtros deben traducirse a query params del endpoint.

⚡ **Datos hardcodeados:** 142 muestras generadas, opciones de sector (1-5), opciones de zona.

---

## 📈 6. Reportes / Análisis Histórico (`/reports`)

**Archivo:** [reports.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 6.1 | `GET /api/muestras/analisis?desde={f}&hasta={f}&sector={n}&zona={t}&metrica={m}` | `Muestra`, `Seccion`, `PuntoCritico` | **READ** | Datos para gráfico de línea temporal y tabla. Agrupación por fecha/punto |
| 6.2 | `GET /api/secciones` | `Seccion` | **READ** | Lista de secciones para selectores de filtro |
| 6.3 | `GET /api/umbrales?seccion={id}&metrica={m}` | `UmbralSeccion` | **READ** | Línea de referencia del umbral mínimo para el gráfico |
| 6.4 | `POST /api/reportes/exportar-pdf` | `Reporte`, `Muestra`, `Seccion` | **WRITE** | Genera PDF con los filtros aplicados, crea registro en `Reporte` |
| 6.5 | `POST /api/reportes/exportar-excel` | `Reporte`, `Muestra`, `Seccion` | **WRITE** | Genera Excel con los filtros aplicados, crea registro en `Reporte` |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **El gráfico usa datos completamente fijos.** El array `rawData` (línea 293) tiene 12 valores hardcodeados. Las etiquetas del eje X son meses fijos (Jun-May). No se recalculan en función de los filtros aplicados. **`applyFilters()` solo cambia un booleano** para mostrar/ocultar el contenido, pero nunca consulta datos.

> [!CAUTION]
> 🔴 **La tabla de datos también es estática.** `reportRows` (líneas 332-341) tiene 8 filas fijas. No cambian al aplicar filtros.

> [!WARNING]
> 🟡 **La línea de umbral ("Mín") está hardcodeada en Y=125** en el SVG (línea 126). Esto debería calcularse dinámicamente a partir del endpoint 6.3 (`UmbralSeccion`).

> [!WARNING]
> 🟡 **Los botones "Exportar PDF" y "Exportar Excel" no tienen handler.** No hay `(click)` asociado. Requieren implementar los endpoints 6.4 y 6.5.

> [!WARNING]
> 🟡 **Falta el filtro de "Punto Crítico"** en el UI actual, a pesar de que el plan de diseño lo menciona. El select de punto crítico debería popularse dinámicamente según la sección seleccionada.

> [!WARNING]
> 🟡 **El endpoint 6.1 es el más complejo del sistema.** Requiere agregación temporal de datos (agrupación por día/semana/mes), filtrado multi-criterio y potencialmente cálculos estadísticos. Considerar si la lógica va en el backend (query SQL con `GROUP BY`) o en el frontend (procesamiento de datos crudos).

⚡ **Datos hardcodeados:** Puntos del gráfico, etiquetas X, filas de tabla, umbral mínimo, opciones de filtro.

---

## 👥 7. Gestión de Usuarios (`/users`)

**Archivo:** [users.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/users/users.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 7.1 | `GET /api/usuarios` | `Usuario`, `LogActividad` | **READ** | Lista de usuarios con rol, estado activo/offline, última actividad |
| 7.2 | `GET /api/usuarios/{rut}` | `Usuario`, `LogActividad` | **READ** | Detalle de un usuario para el panel de edición |
| 7.3 | `POST /api/usuarios` | `Usuario`, `LogActividad` | **WRITE** | Crea nuevo usuario (botón "Añadir Nuevo Usuario") |
| 7.4 | `PUT /api/usuarios/{rut}` | `Usuario`, `LogActividad` | **WRITE** | Actualiza nombre, email, rol |
| 7.5 | `PATCH /api/usuarios/{rut}/acceso` | `Usuario`, `Sesion`, `LogActividad` | **WRITE** | Toggle de acceso. Si se desactiva, invalida sesiones activas |
| 7.6 | `POST /api/usuarios/{rut}/foto` | `Usuario` | **WRITE** | Sube/actualiza foto de perfil |
| 7.7 | `DELETE /api/usuarios/{rut}` | `Usuario`, `Sesion`, `LogActividad` | **WRITE** | Eliminación de usuario (futuro) |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **Todo opera en memoria local.** La lista de 8 usuarios (líneas 283-291) está hardcodeada. `saveUser()` modifica el array local con spread operator. `addUser()` agrega al array local. **Ningún cambio persiste** entre recargas de página.

> [!CAUTION]
> 🔴 **"Última Actividad" es un string estático** (ej: "Ahora", "Hace 3 horas"). Requiere consultar `LogActividad` y calcular el tiempo relativo (`Fecha_Hora` más reciente vs `NOW()`). Esto implica un JOIN en cada carga de la lista.

> [!WARNING]
> 🟡 **El PK `RUT` como clave foránea tiene implicaciones.** El RUT es un identificador nacional chileno. Usarlo como PK natural simplifica queries pero **es inmutable por diseño**. Si un usuario cambia de RUT (por error de carga), requiere actualizar en cascada en `Muestra`, `Sesion`, `Notificacion`, `Reporte`, `LogActividad`. Considerar un ID surrogate (`INT AUTO_INCREMENT`) con RUT como `UNIQUE`.

> [!WARNING]
> 🟡 **La foto de perfil (`RutaFoto`) no tiene subida implementada.** El botón de cámara en el panel de edición existe en el template, pero no tiene handler `(click)`. Requiere implementar endpoint 7.6 con `multipart/form-data`.

> [!WARNING]
> 🟡 **No hay confirmación de eliminación.** El endpoint 7.7 (`DELETE`) está contemplado en los endpoints pero no existe UI para eliminación. Cuando se implemente, debería tener un diálogo de confirmación y manejar las FK dependientes (muestras históricas, logs, etc.).

> [!WARNING]
> 🟡 **El campo `Activo` (NUEVO en el modelo) mapea al toggle "Acceso al sistema"**, pero el componente usa `status: 'Activo' | 'Offline'` que combina dos conceptos: ¿el usuario está conectado ahora? vs. ¿el usuario tiene permiso de acceder? Estos son estados distintos y deberían separarse.

⚡ **Datos hardcodeados:** 8 usuarios, estado, última actividad, todo el CRUD.

---

## 🔧 8. Layout Global (Topbar + Sidebar)

**Archivos:** [topbar.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/topbar/topbar.component.ts) · [sidebar.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/sidebar/sidebar.component.ts)

### Llamadas a DB requeridas

| # | Operación | Tablas | Tipo | Descripción |
|---|-----------|--------|------|-------------|
| 8.1 | `GET /api/auth/me` | `Usuario` | **READ** | Nombre, rol, iniciales y foto del usuario autenticado para topbar y sidebar |
| 8.2 | `GET /api/notificaciones?leida=false` | `Notificacion` | **READ** | Conteo y listado de notificaciones no leídas (campana) |
| 8.3 | `PATCH /api/notificaciones/{id}/leer` | `Notificacion` | **WRITE** | Marca una notificación como leída |
| 8.4 | `PATCH /api/notificaciones/leer-todas` | `Notificacion` | **WRITE** | Marca todas como leídas |
| 8.5 | `GET /api/campo/configuracion` | `ConfiguracionCampo` | **READ** | Nombre del club para el breadcrumb |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **Nombre del club hardcodeado en topbar.** `"Club de Golf Las Palmas"` está en el template (línea 21). Debería venir del endpoint 8.5.

> [!CAUTION]
> 🔴 **Datos del usuario hardcodeados.** El avatar muestra `"AG"`, el nombre `"Agrónomo Principal"` y el rol `"Administrador"` (líneas 35-38). No existe ninguna llamada a `/api/auth/me`.

> [!WARNING]
> 🟡 **La campana de notificaciones es decorativa.** El botón existe pero no tiene dropdown, no consulta notificaciones, no muestra badge de conteo. Requiere implementar un componente de dropdown que consuma el endpoint 8.2.

> [!WARNING]
> 🟡 **El rol del sidebar está hardcodeado como `'Administrador'`** en [sidebar.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/sidebar/sidebar.component.ts#L527) (línea 527: `userRole = signal<'Administrador' | 'Agrónomo' | 'Canchero'>('Administrador')`). El filtrado de menú por roles funciona correctamente en la lógica, pero siempre muestra todos los ítems porque el rol nunca se obtiene de la DB.

> [!WARNING]
> 🟡 **Las notificaciones deberían usar polling o WebSockets** para mantener actualizadas sin recargar. Definir si se usa `setInterval` con `GET /api/notificaciones` o una conexión WebSocket/SSE.

⚡ **Datos hardcodeados:** Nombre del club, nombre/rol/avatar del usuario, rol para filtrado del menú.

---

## 🔌 9. Servicios Transversales

### [data.service.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/services/data.service.ts)

| # | Método | Endpoint real (cuando `USE_MOCK = false`) | Tablas | Descripción |
|---|--------|------------------------------------------|--------|-------------|
| S.1 | `getZones()` | `GET /api/zones` | `Seccion`, `Muestra`, `UmbralSeccion` | GeoJSON con zonas |
| S.2 | `getSamplesByZone(zoneId)` | `GET /api/zones/{id}/samples` | `Muestra`, `Usuario` | Muestras de una zona |
| S.3 | `createSample(payload)` | `POST /api/samples` | `Muestra` | Crea muestra |

### Observaciones Críticas

> [!CAUTION]
> 🔴 **`USE_MOCK = true` nunca se desactiva.** La constante en línea 65 hace que **todos los métodos retornen datos mock**. No hay forma de cambiar esto dinámicamente (debería ser un environment variable de Angular).

> [!WARNING]
> 🟡 **Los endpoints del servicio no coinciden con los del documento maestro.** El servicio usa `/api/zones` y `/api/samples`, pero el documento de endpoints propone `/api/secciones` y `/api/muestras`. **Se necesita alinear la nomenclatura** antes de implementar el backend.

> [!WARNING]
> 🟡 **Faltan muchos métodos.** El `DataService` solo tiene 3 métodos pero se requieren ~40 endpoints. Faltan servicios para: autenticación, usuarios, reportes, notificaciones, umbrales, configuración del campo, logs de actividad, y fotos.

> [!WARNING]
> 🟡 **`createSample` no envía fotos.** El payload no incluye archivo binario. La subida de fotos requiere un método separado con `FormData`.

### [map.service.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/services/map.service.ts)

| # | Dato | Tabla futura | Descripción |
|---|------|-------------|-------------|
| M.1 | `CAMPO_CENTER` | `ConfiguracionCampo` | Coordenadas del centro: `[-71.543, -32.991]` |
| M.2 | `CAMPO_ZOOM_OVERVIEW` | `ConfiguracionCampo` | Zoom overview: `15` |
| M.3 | `CAMPO_ZOOM_DETAIL` | `ConfiguracionCampo` | Zoom detalle: `16` |
| M.4 | `CAMPO_ZOOM_PICKER` | `ConfiguracionCampo` | Zoom picker: `17` |

> [!WARNING]
> 🟡 **Todas las constantes del mapa deben migrar a la tabla `ConfiguracionCampo`.** El servicio necesitará volverse asíncrono (`async createDefaultView()`) y cachear la configuración para no hacer un request en cada navegación.

---

## 📊 Resumen Consolidado

### Total de llamadas a DB por pantalla

| Pantalla | Lecturas (GET) | Escrituras (POST/PUT/PATCH/DELETE) | Total | Actualmente implementadas |
|----------|:-:|:-:|:-:|:-:|
| Login | 1 | 3 | 4 | **0** ❌ |
| Dashboard | 5 | 2 | 7 | **0** ❌ |
| Georreferenciación | 5 | 0 | 5 | **1** parcial (GeoJSON mock) |
| Nuevo Registro | 4 | 2 | 6 | **0** ❌ |
| Historial Muestras | 4 | 0 | 4 | **0** ❌ |
| Reportes | 3 | 2 | 5 | **0** ❌ |
| Gestión Usuarios | 2 | 5 | 7 | **0** ❌ |
| Layout Global | 3 | 2 | 5 | **0** ❌ |
| **TOTAL** | **27** | **16** | **43** | **~1** |

### Tablas más consultadas

| Tabla | Lecturas | Escrituras | Total menciones |
|-------|:--------:|:----------:|:-:|
| `Muestra` | 10 | 1 | 11 |
| `Seccion` | 9 | 0 | 9 |
| `Usuario` | 7 | 5 | 12 |
| `LogActividad` | 3 | 7 (implícitas) | 10 |
| `ConfiguracionCampo` | 4 | 0 | 4 |
| `Notificacion` | 1 | 3 | 4 |
| `UmbralSeccion` | 3 | 0 | 3 |
| `Reporte` | 2 | 3 | 5 |
| `Sesion` | 0 | 4 | 4 |
| `Foto` | 1 | 1 | 2 |
| `PuntoCritico` | 4 | 0 | 4 |

---

## 🔴 Top 5 Observaciones Críticas Globales

1. **El 100% de los datos del frontend son mock o hardcodeados.** No existe una sola llamada real a una API o base de datos en todo el proyecto. Todo es simulado con constantes en TypeScript, arrays locales, o archivos JSON estáticos.

2. **Faltan servicios Angular para la mayoría de las entidades.** Solo existen `DataService` (3 métodos) y `MapService` (sin DB). Se necesitan al menos: `AuthService`, `UserService`, `ReportService`, `NotificationService`, `ConfigService`, y reestructurar `DataService`.

3. **No hay manejo de errores HTTP.** Los 3 métodos existentes en `DataService` usan `fetch()` sin `try/catch`, sin manejo de errores de red, sin reintentos, sin feedback al usuario en caso de fallo.

4. **El modelo relacional propuesto tiene una brecha arquitectónica: falta un endpoint de escritura para `Seccion`, `PuntoCritico` y `UmbralSeccion`.** ¿Quién los crea? No hay UI para administrar secciones, crear puntos críticos, ni configurar umbrales. ¿Es una carga inicial por base de datos directamente?

5. **Inconsistencia en la nomenclatura de endpoints:** El `DataService` usa inglés (`/api/zones`, `/api/samples`) mientras que el documento maestro usa español (`/api/secciones`, `/api/muestras`). Esto debe unificarse antes de empezar el backend.
