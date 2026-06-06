# Integración del Logo FairGreen + Responsividad Móvil 100%

Implementar el logo real de FairGreen (`logo-fairgreen.png`) en toda la aplicación, reemplazando el favicon de Angular por defecto, y hacer que **todas las páginas** sean completamente funcionales en dispositivos móviles.

## Estado Actual

### Logo
- Existe el logo en `src/assets/logo-fairgreen.png` (pelota de golf con hojas verdes, 50KB)
- El **sidebar** usa un ícono SVG genérico (`bi-leaf`) como logo
- La **página de login** usa un SVG genérico de hoja como logo
- El **topbar** muestra texto "FairGreen" sin logo
- El **favicon** en `public/favicon.ico` es el **favicon por defecto de Angular** (15KB)

### Responsividad
- El **sidebar** ya tiene breakpoints a 1199px (colapsa) y 1023px (drawer), ✅ bien implementado
- La **topbar** no tiene media queries para móvil ❌
- El **login** oculta el hero en < 768px ✅ pero falta padding en móvil
- El **dashboard**: la KPI grid baja a 2 columnas en < 1200px ✅, pero **falta** columna única para < 600px ❌. El report-card no es responsive ❌
- El **new-sample**: métricas bajan a 2 columnas en < 900px ✅ pero falta columna única ❌
- El **sample-history**: tabla tiene `overflow-x:auto` ✅ pero botones y paginación no son responsive ❌
- El **geomap**: panel lateral fijo de 280px, no se adapta a móvil ❌
- Los **reports**: filtros con `flex-wrap:wrap` ✅ pero el gráfico SVG puede desbordar ❌
- La **gestión de usuarios**: panel de edición (300px) no se adapta a móvil ❌

> [!IMPORTANT]
> El `favicon.ico` actual en `public/` es el ícono de Angular por defecto. Se reemplazará por uno generado a partir del logo de FairGreen.

## Propuesta de Cambios

### 1. Favicon y Logo

#### [MODIFY] [favicon.ico](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/public/favicon.ico)
- Generar un nuevo favicon `.ico` con el diseño de FairGreen (pelota de golf verde)
- Se creará una versión de 32×32 y 16×16 del logo estilizado

#### [MODIFY] [sidebar.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/sidebar/sidebar.component.ts)
- Reemplazar el ícono SVG (`bi-leaf`) por una etiqueta `<img>` que muestre `logo-fairgreen.png`
- Ajustar `.sb-logo-mark` para contener la imagen del logo (32×32px con bordes redondeados)
- Asegurar que en estado colapsado el logo se vea correctamente centrado

#### [MODIFY] [login.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/login/login.component.ts)
- Reemplazar los SVGs genéricos de hoja por `<img src="assets/logo-fairgreen.png">`
- Logo del hero (columna izquierda): ~48px
- Logo del formulario (columna derecha): ~28px

#### [MODIFY] [topbar.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/topbar/topbar.component.ts)
- Agregar `<img>` del logo (~20px) antes del texto "FairGreen" en `.topbar-left`

---

### 2. Responsividad Móvil — Topbar

#### [MODIFY] [topbar.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/topbar/topbar.component.ts)
- Agregar **botón hamburguesa** visible solo en ≤1023px para abrir el sidebar drawer
- Ocultar `.user-meta` (nombre/rol) en ≤768px, dejando solo el avatar
- Ocultar breadcrumb en ≤480px
- Comunicar con el sidebar via `Output()` o servicio compartido para `isOpen`

#### [MODIFY] [main-layout.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/main-layout/main-layout.component.ts)
- Agregar padding reducido en `content-area` para móvil (16px → 12px)
- Asegurar que el layout funcione sin margin-left en ≤1023px

---

### 3. Responsividad Móvil — Páginas

#### [MODIFY] [dashboard.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/dashboard/dashboard.component.ts)
Agregar media queries:
- `≤600px`: KPI grid a **1 columna**
- `≤768px`: `.report-card` cambiar a layout vertical (flex-direction: column), botones apilados
- `≤480px`: reducir font-sizes del header

#### [MODIFY] [new-sample.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.ts)
- `≤600px`: `.form-row` a 1 columna, `.metrics-form-grid` a 1 columna, header con botones apilados

#### [MODIFY] [sample-history.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.ts)
- `≤768px`: Filtros apilados verticalmente, botones de acción en tabla más compactos
- `≤480px`: Ocultar columnas menos importantes (Conductividad, Salinidad), botón "Ver en Mapa" como ícono

#### [MODIFY] [geomap.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/geomap/geomap.component.ts)
- `≤768px`: El panel lateral se convierte en un **drawer inferior** (bottom sheet) que se desliza desde abajo
- El mapa ocupa el 100% del viewport
- El panel se abre al seleccionar una muestra y se cierra con un botón o swipe

#### [MODIFY] [reports.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.ts)
- `≤768px`: Filtros apilados en grid de 2 columnas, botones de export apilados
- `≤480px`: Filtros en 1 columna, barras del gráfico comparativo más estrechas

#### [MODIFY] [users.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/users/users.component.ts)
- `≤768px`: El panel de edición se convierte en un **overlay modal** a pantalla completa en vez de sidebar lateral
- Tabla: ocultar columna "Última Actividad", condensar info del usuario

---

### 4. Estilos Globales

#### [MODIFY] [styles.scss](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/styles.scss)
- Agregar media queries globales para:
  - `.page-header` responsive (flex-wrap, gap reducido en móvil)
  - `.modal-card` width 100% en móvil con padding reducido
  - `.data-table` font-size reducido en móvil
  - Mejorar touch targets: botones mínimos 44×44px en móvil

---

## Resumen de Archivos a Modificar

| Archivo | Cambio Principal |
|---------|-----------------|
| `public/favicon.ico` | Reemplazar favicon Angular → FairGreen |
| `sidebar.component.ts` | Logo img en lugar de ícono SVG |
| `topbar.component.ts` | Logo img + hamburguesa + responsive |
| `main-layout.component.ts` | Padding móvil + comunicación sidebar |
| `login.component.ts` | Logo img en hero y formulario |
| `dashboard.component.ts` | KPI 1-col, report-card responsive |
| `new-sample.component.ts` | Formulario 1-col en móvil |
| `sample-history.component.ts` | Tabla responsive + filtros |
| `geomap.component.ts` | Panel como bottom-sheet en móvil |
| `reports.component.ts` | Filtros y gráficos responsive |
| `users.component.ts` | Panel edición como modal en móvil |
| `styles.scss` | Media queries globales |

## Open Questions

> [!IMPORTANT]
> **Favicon**: ¿Quieres que genere un favicon simple basado en el logo existente (pelota de golf verde), o prefieres proporcionarlo tú manualmente?

> [!IMPORTANT]
> **Botón hamburguesa en topbar**: ¿Prefieres que el botón hamburguesa aparezca solo cuando no hay sidebar visible (≤1023px), o también a resoluciones intermedias donde el sidebar está colapsado (≤1199px)?

## Plan de Verificación

### Pruebas de Responsividad
- Verificar cada página en viewports: 320px, 375px, 414px, 768px, 1024px, 1440px
- Comprobar que el sidebar drawer funciona correctamente con el botón hamburguesa
- Verificar que el logo se muestra correctamente en sidebar (expandido y colapsado), topbar y login
- Confirmar que el favicon ya no muestra el ícono de Angular

### Verificación Manual
- Solicitar al usuario que pruebe en un dispositivo móvil real o simulador del navegador (Chrome DevTools → Device Mode)
