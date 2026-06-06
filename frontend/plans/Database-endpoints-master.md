# FairGreen — Documento Maestro: Endpoints del Frontend y Modelo de Datos Actualizado

---

## Índice

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Nuevas tablas identificadas](#nuevas-tablas-identificadas)
3. [Diagrama de entidades actualizado](#diagrama-de-entidades-actualizado)
4. [Relaciones actualizadas](#relaciones-actualizadas)
5. [Endpoints por pantalla](#endpoints-por-pantalla)
6. [Resumen consolidado de endpoints](#resumen-consolidado-de-endpoints)

---

## Resumen ejecutivo

Tras el análisis exhaustivo de los 7 componentes de página del frontend (`login`, `dashboard`, `geomap`, `new-sample`, `sample-history`, `reports`, `users`) junto con los servicios (`DataService`, `MapService`), los layouts (`sidebar`, `topbar`) y los componentes auxiliares del mapa, se identificaron las siguientes brechas entre el modelo relacional actual y los datos que el frontend necesita para funcionar:

### Brechas principales detectadas

| Concepto del Frontend | ¿Existe tabla en la DB? | Acción requerida |
|---|---|---|
| **Sesión / Autenticación** (token JWT, sesiones) | ❌ No | Nueva tabla `Sesion` |
| **Notificaciones** (campana del topbar) | ❌ No | Nueva tabla `Notificacion` |
| **Alertas / Umbrales por sección** (estados óptimo/atención/crítico) | ❌ No | Nueva tabla `UmbralSeccion` |
| **Configuración del campo / club** (nombre, coordenadas centro, zoom) | ❌ No | Nueva tabla `ConfiguracionCampo` |
| **Reportes generados** (PDF/Excel exportados) | ❌ No | Nueva tabla `Reporte` |
| **Auditoría / Log de actividad** (última actividad de usuarios) | ❌ No | Nueva tabla `LogActividad` |

---

## Nuevas tablas identificadas

### `Sesion`

Almacena las sesiones activas de los usuarios para autenticación y control de acceso.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdSesion` | `UUID` | `PK` | Identificador único de la sesión |
| `RutUsuario` | `VARCHAR(12)` | `FK → Usuario.RUT`, `NOT NULL` | Usuario propietario de la sesión |
| `Token` | `TEXT` | `NOT NULL`, `UNIQUE` | Token JWT o de sesión |
| `Fecha_Inicio` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha y hora de inicio de sesión |
| `Fecha_Expiracion` | `TIMESTAMPTZ` | `NOT NULL` | Fecha y hora de expiración del token |
| `IP` | `VARCHAR(45)` | | Dirección IP desde la que se autenticó |
| `Activa` | `BOOLEAN` | `DEFAULT TRUE` | Si la sesión sigue activa |

**Justificación:** El frontend tiene pantalla de login con email + contraseña. Actualmente navega directamente al dashboard sin validación real. Se necesita un endpoint de autenticación que genere y valide tokens.

---

### `Notificacion`

Almacena las notificaciones para cada usuario (alertas, eventos, recordatorios).

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdNotificacion` | `INT` | `PK` | Identificador único |
| `RutUsuario` | `VARCHAR(12)` | `FK → Usuario.RUT`, `NOT NULL` | Usuario destinatario |
| `Titulo` | `VARCHAR(200)` | `NOT NULL` | Título de la notificación |
| `Mensaje` | `TEXT` | | Detalle de la notificación |
| `Tipo` | `VARCHAR(30)` | `NOT NULL` | Tipo: `alerta`, `info`, `critico`, `sistema` |
| `Leida` | `BOOLEAN` | `DEFAULT FALSE` | Si el usuario la ha visto |
| `Fecha_Hora` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Fecha de creación |
| `IdSeccion` | `INT` | `FK → Seccion.IdSeccion`, `NULL` | Sección relacionada (opcional) |
| `IdMuestra` | `INT` | `FK → Muestra.IdMuestra`, `NULL` | Muestra relacionada (opcional) |

**Justificación:** El topbar tiene un botón de campana para notificaciones. El dashboard muestra alertas de parámetros críticos. Se necesita persistir y consultar notificaciones por usuario.

---

### `UmbralSeccion`

Define los umbrales de cada métrica para clasificar automáticamente el estado de una sección como **óptimo**, **atención** o **crítico**.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdUmbral` | `INT` | `PK` | Identificador único |
| `IdSeccion` | `INT` | `FK → Seccion.IdSeccion`, `NOT NULL` | Sección asociada |
| `Metrica` | `VARCHAR(30)` | `NOT NULL` | Métrica: `humedad`, `temperatura`, `salinidad`, `conductividad` |
| `Min_Optimo` | `DECIMAL(5,3)` | | Valor mínimo para estado óptimo |
| `Max_Optimo` | `DECIMAL(5,3)` | | Valor máximo para estado óptimo |
| `Min_Atencion` | `DECIMAL(5,3)` | | Valor mínimo para atención |
| `Max_Atencion` | `DECIMAL(5,3)` | | Valor máximo para atención |

**Constraint único:** `UNIQUE (IdSeccion, Metrica)` — solo un umbral por métrica por sección.

**Justificación:** El dashboard muestra KPIs con estados de color (verde/amarillo/rojo). El geomap clasifica las zonas por salud. Estos umbrales deben ser configurables por sección, no hardcodeados en el frontend.

---

### `ConfiguracionCampo`

Almacena la configuración general del campo de golf (metadatos del club).

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdCampo` | `INT` | `PK` | Identificador único del campo |
| `Nombre` | `VARCHAR(200)` | `NOT NULL` | Nombre del club (ej: "Club de Golf Las Palmas") |
| `CentroLat` | `DECIMAL(10,8)` | `NOT NULL` | Latitud del centro del campo |
| `CentroLon` | `DECIMAL(11,8)` | `NOT NULL` | Longitud del centro del campo |
| `ZoomOverview` | `INT` | `DEFAULT 15` | Zoom para vista general |
| `ZoomDetalle` | `INT` | `DEFAULT 16` | Zoom para vista detallada |
| `ZoomPicker` | `INT` | `DEFAULT 17` | Zoom para selector de puntos |
| `LogoURL` | `TEXT` | | URL del logo del club |
| `FechaCreacion` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Cuándo se configuró |

**Justificación:** El `MapService` tiene las coordenadas del campo y niveles de zoom hardcodeados. El topbar muestra "Club de Golf Las Palmas" hardcodeado. Estos valores deben venir de la base de datos para soportar múltiples campos.

---

### `Reporte`

Registra los reportes generados (PDF, Excel) para trazabilidad.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdReporte` | `INT` | `PK` | Identificador único |
| `RutUsuario` | `VARCHAR(12)` | `FK → Usuario.RUT`, `NOT NULL` | Usuario que generó el reporte |
| `Tipo` | `VARCHAR(10)` | `NOT NULL` | Formato: `pdf`, `excel` |
| `FechaDesde` | `DATE` | | Fecha inicio del rango del reporte |
| `FechaHasta` | `DATE` | | Fecha fin del rango del reporte |
| `Filtro_Seccion` | `INT` | `FK → Seccion.IdSeccion`, `NULL` | Sección filtrada (si aplica) |
| `Filtro_Metrica` | `VARCHAR(30)` | | Métrica filtrada (si aplica) |
| `RutaArchivo` | `TEXT` | | Path o URL del archivo generado |
| `Fecha_Generacion` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Cuándo se generó |

**Justificación:** Las pantallas de dashboard y reportes permiten exportar a PDF/Excel. Se necesita registrar qué reportes se generaron, por quién y con qué filtros.

---

### `LogActividad`

Registro de auditoría para rastrear acciones y última actividad de los usuarios.

| Columna | Tipo | Restricción | Descripción |
|---|---|---|---|
| `IdLog` | `BIGINT` | `PK` | Identificador único |
| `RutUsuario` | `VARCHAR(12)` | `FK → Usuario.RUT`, `NOT NULL` | Usuario que realizó la acción |
| `Accion` | `VARCHAR(50)` | `NOT NULL` | Acción: `login`, `logout`, `crear_muestra`, `editar_usuario`, `generar_reporte`, etc. |
| `Detalle` | `TEXT` | | Contexto adicional de la acción |
| `Fecha_Hora` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Cuándo ocurrió |
| `IP` | `VARCHAR(45)` | | IP desde donde se realizó |

**Justificación:** La pantalla de usuarios muestra "Última Actividad" (ej: "Hace 3 horas", "Hace 2 días"). También se necesita para la línea de sincronización de los KPIs del dashboard.

---

## Diagrama de entidades actualizado

```
┌─────────────────────────┐         ┌───────────────────────────┐
│   ConfiguracionCampo    │         │       Sección             │
├─────────────────────────┤         ├───────────────────────────┤
│ PK  IdCampo             │         │ PK  IdSección             │
│     Nombre              │         │     Polígono              │
│     CentroLat           │         │     Tipo de Tierra        │
│     CentroLon           │         │     Numero de Hoyo        │
│     ZoomOverview        │         └──────┬────────┬───────────┘
│     ZoomDetalle         │                │ 1      │ 1
│     ZoomPicker          │                │        │
│     LogoURL             │                │ ∞      │ ∞
└─────────────────────────┘                │        │
                                           │   ┌────┴───────────────────┐
                                           │   │   UmbralSeccion       │
                                           │   ├───────────────────────┤
                                           │   │ PK  IdUmbral          │
                                           │   │ FK  IdSección         │
                                           │   │     Metrica           │
                                           │   │     Min_Optimo        │
                                           │   │     Max_Optimo        │
                                           │   │     Min_Atencion      │
                                           │   │     Max_Atencion      │
                                           │   └───────────────────────┘
                                           │
┌─────────────────────────┐                │        ┌──────────────────────────┐
│      Usuario            │                │        │       Punto Crítico      │
├─────────────────────────┤                │        ├──────────────────────────┤
│ PK  RUT                 │                ├───────→│ PK  IdPuntoCritico       │
│     Nombre              │                │  1   ∞ │ FK  IdSección            │
│     Apellido            │                │        │     Ubicacion            │
│     Correo electr.      │                │        └────────────┬─────────────┘
│     Contraseña          │                │                     │ 0..1
│     Rol                 │                │                     │ ∞
│     RutaFoto            │                │                     │
│     Activo (NUEVO)      │                │         ┌───────────┘
└──────┬──────────────────┘                │         │
       │ 1                                 │         │
       ├──────────── ∞ ────────────────────┴─────────┤
       │                       ┌─────────────────────┴─────────┐
       │                       │          Muestra              │
       │                       ├───────────────────────────────┤
       │                       │ PK  IdMuestra                 │
       │            ∞          │ FK  IdSección                 │
       ├───────────────────────│ FK  IdPuntoCritico NULL       │
       │                       │ FK  RutUsuario                │
       │                       │     Salinidad                 │
       │                       │     Humedad                   │
       │                       │     Conductividad             │
       │                       │     Temperatura               │
       │                       │     Ubicacion                 │
       │                       │     Recomendaciones           │
       │                       │     Fecha_Hora                │
       │                       └──────────┬────────────────────┘
       │                                  │ 1
       │                                  │ ∞
       │                       ┌──────────┴────────────────────┐
       │                       │          Foto                 │
       │                       ├───────────────────────────────┤
       │                       │ PK  IdFoto                    │
       │                       │ FK  IdMuestra                 │
       │                       │     RutaArchivo               │
       │                       │     fecha_hora_captura        │
       │                       └───────────────────────────────┘
       │
       │ 1         ┌───────────────────────────┐
       ├────── ∞ ──│        Sesion             │
       │           ├───────────────────────────┤
       │           │ PK  IdSesion (UUID)       │
       │           │ FK  RutUsuario            │
       │           │     Token                 │
       │           │     Fecha_Inicio          │
       │           │     Fecha_Expiracion      │
       │           │     IP                    │
       │           │     Activa                │
       │           └───────────────────────────┘
       │
       │ 1         ┌───────────────────────────┐
       ├────── ∞ ──│     Notificacion          │
       │           ├───────────────────────────┤
       │           │ PK  IdNotificacion        │
       │           │ FK  RutUsuario            │
       │           │ FK  IdSeccion NULL        │
       │           │ FK  IdMuestra NULL        │
       │           │     Titulo                │
       │           │     Mensaje               │
       │           │     Tipo                  │
       │           │     Leida                 │
       │           │     Fecha_Hora            │
       │           └───────────────────────────┘
       │
       │ 1         ┌───────────────────────────┐
       ├────── ∞ ──│       Reporte             │
       │           ├───────────────────────────┤
       │           │ PK  IdReporte             │
       │           │ FK  RutUsuario            │
       │           │ FK  Filtro_Seccion NULL   │
       │           │     Tipo                  │
       │           │     FechaDesde            │
       │           │     FechaHasta            │
       │           │     Filtro_Metrica        │
       │           │     RutaArchivo           │
       │           │     Fecha_Generacion      │
       │           └───────────────────────────┘
       │
       │ 1         ┌───────────────────────────┐
       └────── ∞ ──│     LogActividad          │
                   ├───────────────────────────┤
                   │ PK  IdLog (BIGINT)        │
                   │ FK  RutUsuario            │
                   │     Accion                │
                   │     Detalle               │
                   │     Fecha_Hora            │
                   │     IP                    │
                   └───────────────────────────┘
```

### Columnas nuevas en tablas existentes

| Tabla | Columna nueva | Tipo | Descripción |
|---|---|---|---|
| `Usuario` | `Activo` | `BOOLEAN DEFAULT TRUE` | Controla si el usuario puede iniciar sesión (toggle de acceso en la pantalla de usuarios) |

---

## Relaciones actualizadas

| Tabla origen | Cardinalidad | Tabla destino | Campo de unión | Notas |
|---|---|---|---|---|
| `Sección` | 1 → N | `PuntoCritico` | `IdSección` | _(existente)_ |
| `Sección` | 1 → N | `Muestra` | `IdSección` | _(existente)_ |
| `PuntoCritico` | 0..1 → N | `Muestra` | `IdPuntoCritico` | _(existente)_ |
| `Usuario` | 1 → N | `Muestra` | `RutUsuario / RUT` | _(existente)_ |
| `Muestra` | 1 → N | `Foto` | `IdMuestra` | _(existente)_ |
| **`Sección`** | **1 → N** | **`UmbralSeccion`** | **`IdSección`** | **NUEVA — umbrales de métricas por sección** |
| **`Usuario`** | **1 → N** | **`Sesion`** | **`RutUsuario / RUT`** | **NUEVA — sesiones de autenticación** |
| **`Usuario`** | **1 → N** | **`Notificacion`** | **`RutUsuario / RUT`** | **NUEVA — notificaciones del usuario** |
| **`Sección`** | **1 → N** | **`Notificacion`** | **`IdSección`** | **NUEVA — notificación asociada a sección (opcional)** |
| **`Muestra`** | **1 → N** | **`Notificacion`** | **`IdMuestra`** | **NUEVA — notificación asociada a muestra (opcional)** |
| **`Usuario`** | **1 → N** | **`Reporte`** | **`RutUsuario / RUT`** | **NUEVA — reportes generados por usuario** |
| **`Sección`** | **1 → N** | **`Reporte`** | **`Filtro_Seccion / IdSección`** | **NUEVA — sección filtrada en reporte (opcional)** |
| **`Usuario`** | **1 → N** | **`LogActividad`** | **`RutUsuario / RUT`** | **NUEVA — log de acciones del usuario** |

---

## Endpoints por pantalla

### 🔐 1. Login (`/login`)

**Archivo:** `login.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 1.1 | `POST` | `/api/auth/login` | `Usuario`, `Sesion`, `LogActividad` | Autentica usuario con correo + contraseña. Crea registro en `Sesion` y `LogActividad`. Retorna token JWT |
| 1.2 | `POST` | `/api/auth/logout` | `Sesion`, `LogActividad` | Invalida la sesión activa. Registra logout en `LogActividad` |
| 1.3 | `POST` | `/api/auth/refresh` | `Sesion` | Renueva un token JWT a punto de expirar |
| 1.4 | `GET` | `/api/auth/me` | `Usuario` | Obtiene el perfil del usuario autenticado (nombre, rol, foto) |

---

### 📊 2. Dashboard (`/dashboard`)

**Archivo:** `dashboard.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 2.1 | `GET` | `/api/dashboard/kpis` | `Muestra`, `Seccion`, `UmbralSeccion` | Obtiene los KPIs generales (promedios de humedad, temperatura, salinidad, conductividad) con su estado calculado según umbrales |
| 2.2 | `GET` | `/api/secciones` | `Seccion` | Lista todas las secciones con sus polígonos para renderizar el mapa overview |
| 2.3 | `GET` | `/api/secciones/{id}/estado` | `Muestra`, `Seccion`, `UmbralSeccion` | Estado de salud de una sección específica (promedio de métricas más recientes vs. umbrales) |
| 2.4 | `GET` | `/api/reportes/ultimo-semanal` | `Reporte`, `Muestra` | Obtiene el reporte semanal más reciente para el card de descarga |
| 2.5 | `POST` | `/api/reportes/generar` | `Reporte`, `Muestra`, `Seccion` | Genera y registra un nuevo reporte semanal (PDF). Crea registro en `Reporte` |
| 2.6 | `GET` | `/api/reportes/{id}/descargar` | `Reporte` | Descarga el archivo del reporte generado |
| 2.7 | `GET` | `/api/campo/configuracion` | `ConfiguracionCampo` | Obtiene nombre del club y coordenadas del mapa |

---

### 🗺️ 3. Georreferenciación (`/geomap`)

**Archivo:** `geomap.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 3.1 | `GET` | `/api/secciones/geojson` | `Seccion`, `UmbralSeccion`, `Muestra` | Obtiene las secciones como GeoJSON con polígonos, estado de salud calculado y métricas promedio |
| 3.2 | `GET` | `/api/secciones/{id}/detalle` | `Seccion`, `Muestra`, `PuntoCritico`, `UmbralSeccion`, `Usuario` | Detalle completo de una sección: métricas promedio, último responsable, último registro, estado de salud |
| 3.3 | `GET` | `/api/secciones/{id}/muestras/recientes` | `Muestra`, `Usuario` | Timeline de últimos estados registrados para la sección (últimas 5-10 muestras con fecha, descripción y estado) |
| 3.4 | `GET` | `/api/secciones/{id}/puntos-criticos` | `PuntoCritico` | Lista de puntos críticos de la sección para renderizar en el mapa |
| 3.5 | `GET` | `/api/campo/configuracion` | `ConfiguracionCampo` | Coordenadas del centro y niveles de zoom para inicializar el mapa |

---

### ✍️ 4. Nuevo Registro de Muestra (`/samples/new`)

**Archivo:** `new-sample.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 4.1 | `GET` | `/api/secciones` | `Seccion` | Lista de secciones disponibles para el select de Zona (Green, Fairway, Rough, Tee) |
| 4.2 | `GET` | `/api/secciones?tipo={tipo}` | `Seccion` | Filtra secciones por tipo de tierra para obtener los números de sector disponibles |
| 4.3 | `GET` | `/api/secciones/{id}/puntos-criticos` | `PuntoCritico` | Puntos críticos disponibles en la sección seleccionada (para asociar la muestra a un punto existente) |
| 4.4 | `POST` | `/api/muestras` | `Muestra`, `LogActividad` | Crea una nueva muestra con todos sus campos (sección, punto crítico, ubicación, métricas, recomendaciones). Registra la acción |
| 4.5 | `POST` | `/api/muestras/{id}/fotos` | `Foto` | Sube la evidencia fotográfica asociada a la muestra recién creada (multipart/form-data) |
| 4.6 | `GET` | `/api/campo/configuracion` | `ConfiguracionCampo` | Coordenadas y zoom para el mapa point-picker |

---

### 📋 5. Historial de Muestras (`/samples/history`)

**Archivo:** `sample-history.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 5.1 | `GET` | `/api/muestras?page={p}&size={s}` | `Muestra`, `Usuario`, `Seccion` | Lista paginada de todas las muestras con datos del responsable y sección. Parámetros de paginación |
| 5.2 | `GET` | `/api/muestras?sector={n}&zona={tipo}&page={p}&size={s}` | `Muestra`, `Usuario`, `Seccion` | Lista filtrada por sector y/o tipo de zona con paginación |
| 5.3 | `GET` | `/api/muestras/{id}` | `Muestra`, `Foto`, `Usuario`, `Seccion`, `PuntoCritico` | Detalle completo de una muestra específica (botón "Ver Muestra"), incluyendo fotos y punto crítico |
| 5.4 | `GET` | `/api/muestras/exportar?sector={n}&zona={tipo}&formato={csv\|excel}` | `Muestra`, `Usuario`, `Seccion` | Exporta el historial filtrado a CSV o Excel (botón "Exportar") |

---

### 📈 6. Reportes / Análisis Histórico (`/reports`)

**Archivo:** `reports.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 6.1 | `GET` | `/api/muestras/analisis?desde={fecha}&hasta={fecha}&sector={n}&zona={tipo}&metrica={m}` | `Muestra`, `Seccion`, `PuntoCritico` | Obtiene datos filtrados para el gráfico de línea temporal y la tabla de datos. Agrupa por fecha/punto |
| 6.2 | `GET` | `/api/secciones` | `Seccion` | Lista de secciones para los selectores de filtro (Sector, Zona) |
| 6.3 | `GET` | `/api/umbrales?seccion={id}&metrica={m}` | `UmbralSeccion` | Obtiene la línea de referencia de umbral para mostrar la línea punteada "Mín" en el gráfico |
| 6.4 | `POST` | `/api/reportes/exportar-pdf` | `Reporte`, `Muestra`, `Seccion` | Genera y descarga el reporte en PDF con los filtros aplicados |
| 6.5 | `POST` | `/api/reportes/exportar-excel` | `Reporte`, `Muestra`, `Seccion` | Genera y descarga el reporte en Excel con los filtros aplicados |

---

### 👥 7. Gestión de Usuarios (`/users`)

**Archivo:** `users.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 7.1 | `GET` | `/api/usuarios` | `Usuario`, `LogActividad` | Lista todos los usuarios con su rol, estado (activo/offline basado en campo `Activo`) y última actividad (último registro en `LogActividad`) |
| 7.2 | `GET` | `/api/usuarios/{rut}` | `Usuario`, `LogActividad` | Detalle de un usuario específico para el panel de edición |
| 7.3 | `POST` | `/api/usuarios` | `Usuario`, `LogActividad` | Crea un nuevo usuario (botón "Añadir Nuevo Usuario"). Registra la acción |
| 7.4 | `PUT` | `/api/usuarios/{rut}` | `Usuario`, `LogActividad` | Actualiza nombre, email, rol de un usuario existente |
| 7.5 | `PATCH` | `/api/usuarios/{rut}/acceso` | `Usuario`, `Sesion`, `LogActividad` | Activa/desactiva el acceso de un usuario (toggle). Si se desactiva, invalida sus sesiones activas |
| 7.6 | `POST` | `/api/usuarios/{rut}/foto` | `Usuario` | Sube/actualiza la foto de perfil del usuario (botón de cámara en el panel de edición) |
| 7.7 | `DELETE` | `/api/usuarios/{rut}` | `Usuario`, `Sesion`, `LogActividad` | Elimina un usuario (operación futura, el frontend aún no la implementa pero es necesaria en la API) |

---

### 🔧 8. Layout Global (Topbar + Sidebar)

**Archivos:** `topbar.component.ts`, `sidebar.component.ts`

| # | Método | Endpoint | Tablas involucradas | Descripción |
|---|---|---|---|---|
| 8.1 | `GET` | `/api/auth/me` | `Usuario` | Obtiene los datos del usuario autenticado para mostrar nombre, rol e iniciales en el topbar y sidebar |
| 8.2 | `GET` | `/api/notificaciones?leida=false` | `Notificacion` | Obtiene el conteo y listado de notificaciones no leídas (campana del topbar) |
| 8.3 | `PATCH` | `/api/notificaciones/{id}/leer` | `Notificacion` | Marca una notificación como leída |
| 8.4 | `PATCH` | `/api/notificaciones/leer-todas` | `Notificacion` | Marca todas las notificaciones del usuario como leídas |
| 8.5 | `GET` | `/api/campo/configuracion` | `ConfiguracionCampo` | Nombre del club para el breadcrumb del topbar |

---

## Resumen consolidado de endpoints

### Por método HTTP

| Método | Cantidad | Descripción |
|---|---|---|
| `GET` | 26 | Consultas de datos, listados, filtros, descargas |
| `POST` | 9 | Creación de registros, autenticación, exportación |
| `PUT` | 1 | Actualización completa de usuario |
| `PATCH` | 3 | Actualizaciones parciales (notificaciones, acceso) |
| `DELETE` | 1 | Eliminación de usuario |
| **Total** | **40** | |

### Por tabla (frecuencia de uso)

| Tabla | Lecturas (GET) | Escrituras (POST/PUT/PATCH/DELETE) |
|---|---|---|
| `Muestra` | 10 | 1 |
| `Seccion` | 9 | 0 |
| `Usuario` | 7 | 5 |
| `LogActividad` | 3 | 7 (implícitas) |
| `Notificacion` | 1 | 3 |
| `ConfiguracionCampo` | 4 | 0 |
| `Reporte` | 2 | 3 |
| `UmbralSeccion` | 3 | 0 |
| `Sesion` | 0 | 4 |
| `Foto` | 1 | 1 |
| `PuntoCritico` | 4 | 0 |

### Por pantalla (volumen de endpoints)

| Pantalla | Endpoints | Prioridad |
|---|---|---|
| Gestión de Usuarios | 7 | 🔴 Alta |
| Dashboard | 7 | 🔴 Alta |
| Georreferenciación | 5 | 🔴 Alta |
| Nuevo Registro | 6 | 🔴 Alta |
| Reportes | 5 | 🟡 Media |
| Layout Global | 5 | 🟡 Media |
| Historial de Muestras | 4 | 🟡 Media |
| Login | 4 | 🔴 Alta |

---

> **Nota:** Este documento debe actualizarse conforme se agreguen nuevas funcionalidades al frontend. Cada endpoint listado aquí corresponde a un requerimiento real derivado del código fuente analizado.
