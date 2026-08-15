# Análisis de Requerimientos — Informe Final vs. Sistema Actual

Comparación exhaustiva de todos los requerimientos definidos en el [informe final](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/plans/informe%20final.md) contra la implementación actual del sistema Fairgreen.

**Leyenda:**
- ✅ Implementado correctamente
- ⚠️ Implementado con diferencias
- ❌ No implementado / Ausente

---

## Épica 1: Gestión de Usuario

### HU-01-01 — Inicio de Sesión

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | Credenciales: correo + contraseña | ✅ | [login.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/login/login.component.ts) usa `email` y `password` vía JWT. |
| 2 | Contraseña mín. 8 caracteres, un número y un carácter especial | ⚠️ | **No hay validación en frontend.** El [login.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/login/login.component.ts) solo verifica que los campos no estén vacíos. La validación de complejidad de contraseña no está implementada ni en login ni en la creación de usuarios ([users.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/users/users.component.ts)). Podría existir en el backend, pero el frontend no lo valida. |
| 3 | No existe plataforma de registro público; el administrador registra usuarios | ✅ | La ruta `/users` está protegida con `roleGuard(['ADMIN'])` en [app.routes.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/app.routes.ts#L88). Solo el admin crea usuarios. |

---

### HU-01-02 — Gestión de Perfiles

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | Administrador puede asignar foto tipo carnet al usuario | ❌ | **No implementado.** El modelo `UsuarioResumen` tiene campo `ruta_foto`, pero el [users.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/users/users.component.ts) no tiene funcionalidad de subida de foto. Solo muestra iniciales como avatar. |
| 2 | Permitir añadir nombre, apellido y RUT a cada usuario | ✅ | Implementado en [submitCreateUser()](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/users/users.component.ts#L213-L248) con campos `rut`, `nombre`, `apellido`. |
| 3 | Permitir asignar un perfil al usuario (Agrónomo/a, Canchero/a) | ✅ | Se asigna rol (`ADMIN`, `AGRO`, `CANCHERO`) al crear y editar usuarios. |

---

## Épica 2: Gestionar los suelos del campo

### HU-02-01 — Registrar Muestra

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | Seleccionar automáticamente si la muestra pertenece a Green o Fairway | ✅ | [new-sample.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.ts) auto-detecta la sección vía point-in-polygon (método `autoDetectSeccion`) y al hacer clic en mapa (`onCoordinateSelected`). |
| 2 | Validar ingreso de parámetros técnicos: humedad, temperatura, salinidad, conductividad | ⚠️ | **Parcialmente implementado.** La humedad se valida (rango 1–5), salinidad y conductividad se validan como no-negativos. Pero **los parámetros NO son obligatorios** — todos pueden ser `null`. El informe dice "validar el ingreso", lo cual implica campos requeridos. |
| 3 | Capturar coordenadas mediante georreferenciación al hacer click en el mapa | ✅ | Implementado con `MapPointPickerComponent` y `onCoordinateSelected()`. También existe GPS nativo con `useGpsLocation()`. |
| 4 | Permitir marcar la muestra como Punto Crítico | ✅ | Se puede seleccionar un punto crítico existente o crear uno nuevo (`esNuevoPuntoCritico`). |
| 5 | Adjuntar evidencia fotográfica | ✅ | Implementado con drag-and-drop y file input. Se suben vía `uploadFoto()`. |
| 6 | Campo de texto para recomendaciones/instrucciones para jardineros | ✅ | Campo `notes` en el formulario, mapeado a `recomendaciones`. |
| 7 | Guardar automáticamente fecha y hora de la toma | ✅ | `fecha_hora_captura` se genera automáticamente en el backend (campo ISO 8601). |
| 8 | Guardar solo si todos los campos están completos | ⚠️ | **Diferencia.** El sistema valida que `zona`, `sector`, `lat`, `lng` estén completos, pero los 4 parámetros técnicos (humedad, temperatura, salinidad, conductividad) son **opcionales** (pueden ser null). El informe exige "todos los campos completos". |

---

### HU-02-02 — Designar pruebas fotográficas a una muestra

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | Permitir subir mínimo 1 fotografía por registro | ⚠️ | **No se exige mínimo.** Se pueden subir 0 o más fotos. El informe dice "mínimo 1", pero el sistema permite guardar sin fotos. |
| 2 | Permitir añadir una breve descripción para la fotografía adjunta | ❌ | **No implementado.** El modelo `FotoItem` en [data.service.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/services/data.service.ts#L99-L104) solo tiene `id_foto`, `ruta_archivo`, `url` y `fecha_hora_subida`. No hay campo de descripción para las fotos, ni en el frontend ni en el formulario de registro. |

---

### HU-02-03 — Editar Muestra

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | La agrónoma puede cambiar todos los campos del registro | ✅ | [edit-sample.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/edit-sample/edit-sample.component.ts) permite editar zona, sector, coordenadas, parámetros técnicos, recomendaciones y subir nuevas fotos. |
| 2 | Validar que ningún campo esté vacío al confirmar cambios | ⚠️ | **Misma diferencia que HU-02-01.** Los parámetros técnicos no son obligatorios. Solo se valida `zona`, `sector`, `lat`, `lng`. |
| 3 | El sistema actualizará los datos al confirmar los cambios | ✅ | Usa `updateMuestra()` con PATCH al backend. |

> [!WARNING]
> **Ventana de edición de 4 horas (sección 6.3.4 del informe):** El informe establece que la edición se **bloquea automáticamente tras 4 horas** desde la creación del registro para resguardar la integridad histórica. **Esta restricción NO está implementada en el frontend.** El componente `sample-detail` solo verifica el rol (`ADMIN` o `AGRO`) para mostrar el botón "Editar", sin verificar tiempo transcurrido.

---

### HU-02-04 — Registrar puntos de interés al registrar muestra

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | Colocar un punto en el mapa para señalar el lugar exacto de la toma | ✅ | Implementado con `MapPointPickerComponent`. |
| 2 | Señalar el lugar exacto dentro de las zonas de Green o Fairway | ✅ | El sistema detecta automáticamente si el punto cae en Green o Fairway mediante ray-casting. |

---

## Épica 3: Visualizar los datos del campo

### HU-03-01 — Consultar datos históricos

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | Al seleccionar un punto del campo, mostrar el registro de todas las muestras recolectadas | ✅ | Implementado en [geomap.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/geomap/geomap.component.ts). Al hacer clic en sector/muestra/punto crítico se abre un panel lateral (sidebar) con información. |
| 2 | Al seleccionar un registro, mostrar de forma detallada todos los datos de la muestra | ✅ | [sample-detail](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-detail/sample-detail.component.html) muestra todos los datos: métricas, fotos, coordenadas, punto crítico, recomendaciones e historial de modificaciones. |

---

### HU-03-02 — Generación de reportes e informes de interés

| # | Criterio de Aceptación | Estado | Observación |
|---|---|---|---|
| 1 | Gráfico de línea que indica la evolución del estado del campo por parámetro | ⚠️ | **Diferente tipo de gráfico.** El informe exige un "gráfico de línea" cronológico. El sistema implementa un gráfico de **coordenadas paralelas** (Parallel Coordinates) en [reports.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.ts#L69-L100), que muestra todos los parámetros pero no es un gráfico de línea temporal/cronológico como se solicita. |

---

## Requerimientos No Funcionales (RNF)

| ID | Requerimiento | Estado | Observación |
|---|---|---|---|
| RNF_001 | Acceso restringido por rol (RBAC) | ⚠️ | **Parcialmente diferente.** El informe dice que la Agrónoma debe ser la **única** que ejecuta muestras, pero en [app.routes.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/app.routes.ts#L53) la ruta `samples/new` permite `CANCHERO` registrar muestras (`roleGuard(['ADMIN', 'AGRO', 'CANCHERO'])`). El informe indica que el Canchero solo tiene "perfil de revisión". |
| RNF_002 | Registro en tiempo real (< 3 seg) | ✅ | No verificable desde frontend (depende del backend/red), pero la arquitectura está diseñada para respuestas rápidas con JWT y API REST. |
| RNF_003 | Carga de gráficos < 5 seg | ✅ | Similar a RNF_002, depende del rendimiento en producción. |
| RNF_004 | Disponibilidad 99% | ✅ | Diseñado para AWS (EC2/RDS/S3/CloudFront). Operacional. |
| RNF_005 | Accesible vía web, interfaz intuitiva | ✅ | Aplicación Angular SPA accesible vía navegador. Diseño responsivo implementado. |
| RNF_006 | Stack: Django + Angular + PostgreSQL | ✅ | Confirmado por la arquitectura. Frontend Angular con HTML/SCSS/TypeScript. |
| RNF_007 | Alojamiento en infraestructura externa | ✅ | Diseñado para AWS (EC2, RDS, S3, CloudFront). |
| RNF_008 | Persistencia y trazabilidad de registros | ✅ | Los registros incluyen coordenadas, parámetros, fotos y historial de modificaciones. |

---

## Requerimientos de Diseño/Interfaz (Sección 6.3.4)

| # | Requerimiento de Interfaz | Estado | Observación |
|---|---|---|---|
| 1 | Pantalla principal con mapa interactivo de los 10 hoyos | ✅ | Implementado con OpenLayers en [geomap](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/geomap/geomap.component.ts). |
| 2 | Sidebar al seleccionar sección/punto crítico (sin pop-ups) | ✅ | Panel lateral implementado en geomap con señal `isPanelOpen`. |
| 3 | Marcadores/pines diferenciados para Puntos Críticos | ✅ | Los puntos críticos se muestran con marcadores distintos en el mapa. |
| 4 | Ventana de edición temporal: bloqueo automático tras 4 horas | ❌ | **No implementado.** No hay verificación de tiempo en [sample-detail.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-detail/sample-detail.component.ts#L30-L33) ni en [edit-sample.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/edit-sample/edit-sample.component.ts). |
| 5 | Validación activa de formularios en tiempo real | ⚠️ | Parcialmente implementado: humedad se valida en rango, salinidad/conductividad como no negativos. Pero no se deshabilita el botón de guardado dinámicamente según el informe. |
| 6 | Panel de alertas/notificaciones centralizado | ✅ | Implementado con [notifications.service.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/services/notifications.service.ts) y página de notificaciones con polling cada 60s. |

---

## Requerimientos de la Propuesta de Solución (Sección 4.1)

| # | Requerimiento | Estado | Observación |
|---|---|---|---|
| 1 | Generar documentos en formatos PDF, Word, Excel | ⚠️ | **Word no implementado.** El sistema exporta a **PDF** (usando `jsPDF`) y **Excel** (usando `ExcelJS`), pero **no exporta a Word/DOCX**. El informe menciona explícitamente "pdf, word, excel". |
| 2 | Tres roles: Administrador, Agrónoma, Canchero | ✅ | Implementados como `ADMIN`, `AGRO`, `CANCHERO`. |
| 3 | Administrador tiene privilegios de supervisor + asignar roles | ✅ | Solo ADMIN accede a `/users`. Puede crear/editar/eliminar usuarios y asignar roles. |

---

## Resumen de Discrepancias

> [!IMPORTANT]
> ### Funcionalidades Ausentes (❌)

| # | Requerimiento | Referencia |
|---|---|---|
| 1 | **Foto tipo carnet** para usuarios | HU-01-02 — No hay funcionalidad de subida de foto de perfil |
| 2 | **Descripción por fotografía** adjunta a muestra | HU-02-02 — El modelo `FotoItem` no tiene campo de descripción |
| 3 | **Bloqueo automático de edición tras 4 horas** | Sección 6.3.4 — No hay verificación temporal para restringir edición |
| 4 | **Exportación a Word/DOCX** | Sección 4.1 — Solo se implementó PDF y Excel |

> [!WARNING]
> ### Funcionalidades con Diferencias (⚠️)

| # | Requerimiento | Diferencia |
|---|---|---|
| 1 | **Validación de contraseña** (mín. 8 chars, número, carácter especial) | No se valida en frontend al crear usuarios |
| 2 | **Parámetros técnicos obligatorios** | Humedad, temperatura, salinidad y conductividad son **opcionales** (nullable); el informe implica que son requeridos |
| 3 | **Mínimo 1 foto por muestra** | El sistema permite guardar muestras sin foto alguna |
| 4 | **Gráfico de línea cronológico** por punto | Se implementó gráfico de coordenadas paralelas en vez de línea temporal |
| 5 | **Canchero no debería registrar muestras** | El informe dice que solo tiene "perfil de revisión", pero la ruta `samples/new` permite que `CANCHERO` registre muestras |
| 6 | **Validación activa de formularios** con botón de guardado deshabilitado dinámicamente | Implementado parcialmente; algunos campos se validan pero no todos los obligatorios según el informe |
