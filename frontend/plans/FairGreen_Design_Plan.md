# FairGreen — Plan de Diseño UI/UX

> Sistema de Control y Trazabilidad del Estado de Campos de Golf

---

## 1. Visión General del Producto

FairGreen es una aplicación web de escritorio orientada a agrónomos, cancheros y administradores de campos de golf. Su función principal es el monitoreo georreferenciado de métricas del suelo (humedad, temperatura, salinidad, conductividad), el registro de muestras y la generación de reportes históricos.

**Tono de diseño:** Profesional-técnico con toques naturales. Minimalismo refinado con acentos de verde oscuro profundo. La interfaz debe transmitir precisión agronómica, confiabilidad de datos y conexión con la naturaleza.

---

## 2. Design Tokens (Variables CSS)

```css
:root {
  /* Paleta principal */
  --color-primary:        #1C3D2E;   /* Verde oscuro profundo — sidebar, botones principales */
  --color-primary-hover:  #245239;   /* Verde hover */
  --color-primary-light:  #2F6844;   /* Verde medio — acentos */
  --color-accent:         #4CAF7D;   /* Verde brillante — badges ÓPTIMO, indicadores OK */
  --color-warning:        #F59E0B;   /* Ámbar — estado ATENCIÓN */
  --color-danger:         #EF4444;   /* Rojo — estado CRÍTICO, zonas en mapa */
  --color-danger-zone:    rgba(239, 68, 68, 0.45); /* Overlay mapa zonas críticas */

  /* Neutrales */
  --color-bg:             #F4F6F5;   /* Fondo general — blanco verdoso muy sutil */
  --color-surface:        #FFFFFF;   /* Tarjetas y paneles */
  --color-surface-alt:    #F0F4F2;   /* Filas alternadas de tablas */
  --color-border:         #DDE5DF;   /* Bordes suaves */
  --color-sidebar-bg:     #1C3D2E;   /* Sidebar */
  --color-sidebar-text:   #B8D4C0;   /* Texto sidebar inactivo */
  --color-sidebar-active: #FFFFFF;   /* Texto item activo sidebar */
  --color-sidebar-active-bg: rgba(255,255,255,0.12); /* Fondo item activo */

  /* Tipografía */
  --color-text-primary:   #1A2E20;   /* Títulos */
  --color-text-secondary: #5A7060;   /* Labels, texto secundario */
  --color-text-muted:     #8FA895;   /* Placeholders, metadata */

  /* Tipografías */
  --font-display: 'DM Serif Display', serif;    /* Títulos grandes */
  --font-body:    'DM Sans', sans-serif;        /* UI general */
  --font-mono:    'JetBrains Mono', monospace;  /* Valores numéricos, métricas */

  /* Espaciado */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   32px;
  --space-2xl:  48px;

  /* Bordes */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;

  /* Sombras */
  --shadow-card:   0 1px 4px rgba(28, 61, 46, 0.08), 0 4px 16px rgba(28, 61, 46, 0.04);
  --shadow-panel:  0 2px 8px rgba(28, 61, 46, 0.10);
  --shadow-modal:  0 8px 32px rgba(28, 61, 46, 0.18);

  /* Transiciones */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;
}
```

---

## 3. Layout General (Shell)

```
┌──────────────────────────────────────────────────────┐
│  TOPBAR: Nombre del Club  ···············  Usuario 👤 │
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │           CONTENT AREA                   │
│ 200px    │           flex-1, overflow-y: auto        │
│ fixed    │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

### Sidebar (`width: 200px`, `position: fixed`, `height: 100vh`)
- Fondo: `--color-sidebar-bg` (#1C3D2E)
- Logo Fairgreen: ícono hoja + wordmark en blanco, `padding: 20px 16px`
- Nav items: ícono (20px) + label, `padding: 10px 16px`, `border-radius: var(--radius-md)`
- Item activo: fondo `--color-sidebar-active-bg`, texto blanco, borde izquierdo `3px solid var(--color-accent)`
- Item hover: fondo `rgba(255,255,255,0.07)`
- Ítems del menú:
  - 🏠 Panel de Control
  - 🗺️ Georreferenciación
  - 🧪 Registro de Muestras
  - 📋 Historial de Muestras
  - 📊 Reportes
  - 👥 Gestión de Usuarios

### Topbar (`height: 52px`, fondo blanco, `border-bottom: 1px solid var(--color-border)`)
- Izquierda: Nombre del club en `font-weight: 600`, `font-size: 13px`, `color: --color-text-secondary`, mayúsculas
- Breadcrumb (solo en Georreferenciación): separado por " › "
- Derecha: Avatar circular (32px) con iniciales o foto + nombre de rol

---

## 4. Pantallas

---

### 4.1 Inicio de Sesión (`/login`)

**Layout:** Split 50/50 en desktop. Columna izquierda: imagen hero. Columna derecha: formulario centrado.

#### Columna izquierda
- Imagen de fondo: foto aérea de campo de golf (oscurecida con overlay `rgba(10,30,18,0.55)`)
- Texto inferior izquierdo:
  - `FAIRGREEN` en `font-family: var(--font-display)`, `font-size: 28px`, color blanco
  - Subtítulo: "Control y Trazabilidad del estado de Campos de Golf", `font-size: 13px`, color `rgba(255,255,255,0.75)`

#### Columna derecha (fondo blanco)
- Centrado vertical y horizontal con flexbox
- Logo: ícono hoja (24px) + "Fairgreen" en verde oscuro, `margin-bottom: 32px`
- Título: "Iniciar Sesión", `font-size: 22px`, `font-family: var(--font-display)`
- Campo correo: label `Correo Electrónico`, ícono envelope, placeholder `usuario@fairgreen.com`
- Campo contraseña: label `Contraseña`, ícono candado, tipo password
- Botón "Ingresar": `width: 100%`, fondo `--color-primary`, texto blanco, `border-radius: var(--radius-md)`, `height: 40px`
- Nota informativa: ícono de candado + texto sobre acceso gestionado por administrador, `font-size: 12px`, fondo `#F0F4F2`, `border-radius: var(--radius-md)`, `padding: 10px 12px`

#### Estilos de inputs
```css
.input-field {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  height: 38px;
  padding: 0 12px 0 36px; /* espacio para ícono izquierdo */
  font-size: 14px;
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}
.input-field:focus {
  border-color: var(--color-primary-light);
  outline: none;
  box-shadow: 0 0 0 3px rgba(47, 104, 68, 0.12);
}
```

---

### 4.2 Panel de Control (`/dashboard`)

**Layout:** Content area con `padding: 24px`. Grilla de KPIs en la parte superior, mapa centrado, reporte al fondo.

#### KPI Cards (grilla 4 columnas, `gap: 16px`)
Cada card:
- `background: white`, `border-radius: var(--radius-lg)`, `padding: 16px 20px`, `box-shadow: var(--shadow-card)`
- Badge superior: "ÓPTIMO" / "ATENCIÓN" / "CRÍTICO"
  - Colores: verde `#E6F4EC` / texto `#1C3D2E` | ámbar `#FEF3C7` / texto `#92400E` | rojo `#FEE2E2` / texto `#991B1B`
  - `font-size: 10px`, `font-weight: 700`, `letter-spacing: 0.08em`, `border-radius: 4px`, `padding: 2px 7px`
- Ícono de alerta (campana): alineado a la derecha del badge, `color: --color-text-muted`
- Título métrica: `font-size: 13px`, `font-weight: 500`, `color: --color-text-secondary`
- Valor numérico: `font-size: 28px`, `font-family: var(--font-mono)`, `color: --color-text-primary`, `font-weight: 600`
- Label "Nivel promedio": `font-size: 11px`, `color: --color-text-muted`
- Barra de progreso: `height: 4px`, `border-radius: 2px`, fondo `--color-border`, fill con color según estado
- Última sincronización: `font-size: 11px`, `color: --color-text-muted`, "Última sincronización: 1 hora"

**Métricas mostradas:** Humedad general · Temperatura general · Salinidad general · Conductividad general

#### Mapa "Vista general del campo"
- Título: "VISTA GENERAL DEL CAMPO", `font-size: 11px`, `letter-spacing: 0.1em`, `color: --color-text-muted`
- Imagen satelital del campo, `border-radius: var(--radius-lg)`, `overflow: hidden`
- Marcadores de sectores: círculos de 28px con número interior
  - Color según estado: verde (óptimo) / ámbar (atención) / rojo (crítico)
  - `box-shadow: 0 2px 8px rgba(0,0,0,0.3)`
- Leyenda inferior centrada: puntos de color + labels "ÓPTIMO · ATENCIÓN · CRÍTICO"

#### Reporte semanal (card inferior)
- Ícono de documento (Excel/PDF)
- Texto: "Reporte general semanal" + subtexto "Resumen general / Desde: X / Hasta: Y"
- Botones: "⬇ Descargar" (outline) + "👁 Ver" (primario)

#### Modal de descarga exitosa
- Overlay oscuro semi-transparente sobre toda la pantalla
- Card centrado: `width: 360px`, `border-radius: var(--radius-xl)`, fondo blanco
- Mensaje: "Se ha descargado el archivo"
- Botón "Volver": fondo `--color-primary`, ancho completo

---

### 4.3 Georreferenciación (`/geomap`)

**Layout:** Mapa ocupa ~75% del ancho, panel lateral derecho ~25% (fijo, `width: 280px`).

#### Mapa interactivo
- Imagen satelital a pantalla casi completa, sin márgenes
- Controles zoom: botones `+` / `−` en esquina superior izquierda, fondo blanco, `border-radius: var(--radius-sm)`, `box-shadow: var(--shadow-card)`
- Control de capas (ícono layers)
- Zonas de greens: polígonos con fill de color según estado
  - Crítico: `rgba(239, 68, 68, 0.5)`, borde `#EF4444`
  - Atención: `rgba(245, 158, 11, 0.4)`, borde `#F59E0B`
  - Óptimo: `rgba(76, 175, 125, 0.4)`, borde `#4CAF7D`
- Marcador de punto seleccionado: círculo blanco con borde `--color-primary`, `width: 14px`
- Leyenda: bottom-center, fondo blanco con `border-radius`, `padding: 6px 12px`

#### Panel lateral derecho
- `background: white`, `height: 100%`, `padding: 20px`, `border-left: 1px solid var(--color-border)`, `overflow-y: auto`

**Sección: Zona seleccionada**
- Label "ZONA SELECCIONADA" en uppercase muted
- Badge estado: "ACTIVO" / "INACTIVO" — verde/gris
- Nombre: "Green #4", `font-size: 22px`, `font-family: var(--font-display)`

**Sección: Estado de mantenimiento**
- Card con ícono usuario + "Estado en verde" + subtexto "Suelo · Último registro: Xh"
- Fondo `#F0F4F2`, `border-radius: var(--radius-md)`

**Sección: Métricas clave promedio**
- Grilla 2×2:
  - Cada celda: label (Humedad / Salinidad / Temperatura / Conductividad) + valor numérico en `--font-mono` grande + unidad pequeña + mini-barra de estado
  - Colores de barra según umbral configurado

**Sección: Últimos estados registrados**
- Lista timeline: punto de color + timestamp + descripción breve
- Link "Reporte total" en verde

**Botón CTA:** "⊕ Registrar Muestra" — `width: 100%`, fondo `--color-primary`, icono `+`, `height: 40px`

---

### 4.4 Registro de Muestras (`/samples/new`)

**Layout:** Content area con formulario en card central, `max-width: 680px`, centrado.

#### Header
- Título "Nuevo Registro de Muestra", `font-size: 20px`, `font-family: var(--font-display)`

#### Sección 1: Detalles de Localización
- Borde superior de sección: `border: 1px solid var(--color-border)`, `border-radius: var(--radius-lg)`, `padding: 20px`
- Ícono de pin + "Detalles de Localización" como título de sección
- Row: Zona (select con opciones: Green, Fairway, Rough, Tee) + Número de Sector (input numérico)
- Botón "📍 Marcar en el mapa" — outline verde, `border: 1px solid --color-primary`
- Row: Latitud + Longitud (inputs de texto, readonly si se marca en mapa)

#### Sección 2: Métricas
- Título con ícono gráfico
- Row 4 columnas: Humedad (1–5) · Temperatura (°C) · Salinidad (dS/m) · Conductividad (dS/m)
- Inputs numéricos con label flotante (floating label pattern)

#### Sección 3: Evidencia + Indicaciones (2 columnas)
- **Evidencia:** Drag & drop zone, borde dashed `--color-border`, ícono de archivo centrado, texto "Click para Cargar Archivo o Soltar", aceptados: SVG, PNG, JPG, DIF (max. 10MB)
- **Indicaciones:** Textarea "Recomendaciones / Entregar instrucciones", `min-height: 100px`, sin resize horizontal

#### Footer de formulario
- Botón "Cancelar" (texto, sin fondo) + Botón "Guardar Muestra" (primario)
- Alineados a la derecha

---

### 4.5 Historial de Muestras (`/samples/history`)

**Layout:** Content area con filtros + tabla paginada.

#### Header de página
- Título "Historial de Muestras", `font-size: 24px`, `font-family: var(--font-display)`

#### Filtros
- Card con `padding: 16px`, `border-radius: var(--radius-lg)`
- Row: Select "Sector" + Select "Zona"
- Valores por defecto: Sector 3 / Green

#### Subtítulo de resultados
- "Sector 3 Green Muestras", `font-size: 18px`, `font-weight: 600`

#### Tabla de registros
- Header card: "📋 Registros Recientes" + botón "⬆ Exportar" (outline, esquina derecha)
- Columnas: FECHA · HUMEDAD · TEMPERATURA (°C) · CONDUCTIVIDAD · SALINIDAD · RESPONSABLE · (acción)
- Header: `font-size: 11px`, `letter-spacing: 0.08em`, `color: --color-text-muted`, `text-transform: uppercase`
- Filas: altura `48px`, `border-bottom: 1px solid var(--color-border)`
- Fila hover: fondo `--color-surface-alt`
- Fecha: `font-size: 13px`, `font-weight: 500`
- Valores numéricos: `font-family: var(--font-mono)`, `font-size: 13px`
- Responsable: texto gris
- Botón "Ver Muestra": fondo `--color-primary`, `font-size: 12px`, `padding: 6px 12px`, `border-radius: var(--radius-sm)`
- Footer tabla: "Mostrando 5 de 142 registros" + paginación `< >`

---

### 4.6 Reportes y Gráficos (`/reports`)

**Layout:** Filtros en fila superior, gráfico de área debajo, tabla de datos al fondo.

#### Header
- Título "Análisis histórico", `font-size: 22px`, `font-family: var(--font-display)`
- Subtítulo: "Seleccione las métricas a analizar", `color: --color-text-muted`
- Botones de exportación (aparecen tras aplicar filtro): "📄 Exportar en PDF" + "📊 Exportar en Excel" — ambos outline, esquina superior derecha

#### Filtros (fila horizontal)
5 selectores en fila + botón:
- Rango de fechas (con ícono calendario)
- Sector
- Zona
- Punto crítico
- Componente (Humedad / Temperatura / Salinidad / Conductividad)
- Botón "Aplicar filtros" — fondo `--color-primary`

**Estado vacío (sin filtros aplicados):** área de contenido vacía con fondo `#F4F6F5`, sin texto ni gráfico.

#### Gráfico de área (tras aplicar filtros)
- Card blanca con `padding: 20px`
- Título: "Nivel de humedad", `font-size: 16px`
- Subtítulo: rango de fechas seleccionado
- Gráfico:
  - Tipo: área suavizada (smooth area chart)
  - Color línea: `--color-primary` (#1C3D2E), `stroke-width: 2.5px`
  - Fill área: `rgba(28, 61, 46, 0.12)` con gradiente hacia transparente
  - Eje Y: valores 0–5, `font-family: var(--font-mono)`, `font-size: 11px`
  - Eje X: meses abreviados
  - Línea de referencia horizontal punteada (umbral mínimo): `stroke: #F59E0B`, `stroke-dasharray: 4,4`
  - Ícono de expansión (esquina superior derecha del gráfico)

#### Tabla de datos
- Header: "Datos" + "Mostrando resultados más recientes: ⋮"
- Columnas: FECHA · SECTOR · PUNTO · COMPONENTE · NIVEL
- Columna NIVEL: badge con color según valor
  - Verde: óptimo (ej: 4.0)
  - Ámbar: atención
  - Rojo: crítico

---

### 4.7 Gestión de Usuarios (`/users`)

**Layout:** Lista de usuarios (panel izquierdo ~60%) + panel de edición (panel derecho ~40%, aparece al seleccionar usuario).

#### Header
- Botón "➕ AÑADIR NUEVO USUARIO" — fondo `--color-primary`, `font-size: 12px`, `letter-spacing: 0.05em`, `border-radius: var(--radius-md)`

#### Tabla de usuarios
- Header: USUARIO · ROL · ESTADO · ÚLTIMA ACTIVIDAD
- Cada fila:
  - Avatar circular 32px con iniciales (2 letras), fondo según rol: verde (Agrónomo) / azul (Administrador) / ámbar (Canchero)
  - Nombre completo (`font-weight: 500`) + email debajo (`font-size: 12px`, color muted)
  - Badge de rol: pill con fondo de color tenue
    - Agrónomo: verde suave
    - Administrador: azul suave
    - Canchero: ámbar suave
  - Indicador estado: punto 8px + texto "Activo" (verde) / "Offline" (gris)
  - Última actividad: "Ahora" / "3 horas" / etc.

#### Panel de edición (slide-in desde la derecha)
- `width: 300px`, fondo blanco, `border-left: 1px solid var(--color-border)`
- Header: "Editar Usuario" + botón `×` cerrar
- Avatar grande (64px) centrado, con overlay de edición (ícono cámara)
- Nombre completo debajo del avatar
- Campos:
  - Nombre Completo (input)
  - Correo Electrónico (input)
  - Rol de la cuenta (select: Administrador / Agrónomo / Canchero)
  - Toggle "Acceso al sistema" (on/off)
- Botones: "GUARDAR CAMBIOS" (primario, `width: 100%`) + "CANCELAR" (texto, centrado)

---

## 5. Componentes Reutilizables

### Badge de Estado
```
.badge-optimo   { background: #E6F4EC; color: #1C3D2E; }
.badge-atencion { background: #FEF3C7; color: #92400E; }
.badge-critico  { background: #FEE2E2; color: #991B1B; }
/* font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
   padding: 2px 7px; border-radius: 4px; text-transform: uppercase; */
```

### Botón Primario
```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  height: 38px;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.btn-primary:hover { background: var(--color-primary-hover); }
```

### Botón Outline
```css
.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  height: 38px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.btn-outline:hover {
  background: rgba(28, 61, 46, 0.06);
}
```

### Card
```css
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
}
```

### Select / Input
```css
.form-control {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  height: 36px;
  padding: 0 10px;
  font-size: 13px;
  color: var(--color-text-primary);
  background: white;
  appearance: none;
}
.form-control:focus {
  border-color: var(--color-primary-light);
  box-shadow: 0 0 0 3px rgba(47, 104, 68, 0.12);
  outline: none;
}
```

### Section Header (dentro de formularios)
```
ícono (16px) + label en font-weight: 600, font-size: 14px, color: --color-text-primary
separator: border-bottom 1px solid --color-border, margin-bottom: 16px
```

---

## 6. Tipografía

| Uso | Fuente | Tamaño | Peso |
|---|---|---|---|
| Títulos de página | DM Serif Display | 22–28px | 400 |
| Nombre en mapa | DM Serif Display | 22px | 400 |
| Body / UI | DM Sans | 13–14px | 400/500 |
| Labels uppercase | DM Sans | 10–11px | 700 |
| Valores métricos | JetBrains Mono | 14–28px | 500/600 |
| Sidebar nav | DM Sans | 13px | 500 |

**Importar:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 7. Iconografía

Usar **Lucide Icons** (stroke-based, 20px por defecto, `stroke-width: 1.75`).

| Sección | Ícono Lucide |
|---|---|
| Panel de Control | `layout-dashboard` |
| Georreferenciación | `map` |
| Registro de Muestras | `flask-conical` |
| Historial de Muestras | `clipboard-list` |
| Reportes | `bar-chart-2` |
| Gestión de Usuarios | `users` |
| Humedad | `droplets` |
| Temperatura | `thermometer` |
| Salinidad | `waves` |
| Conductividad | `zap` |
| Alertas/campana | `bell` |
| Exportar | `download` |
| Marcador mapa | `map-pin` |
| Añadir | `plus-circle` |

---

## 8. Animaciones e Interacciones

- **Sidebar items:** hover con `background` suave, `transition: 150ms`
- **Cards KPI:** aparición con `animation: fadeSlideUp 300ms ease` escalonado (`animation-delay: 0ms, 60ms, 120ms, 180ms`)
- **Panel lateral Georreferenciación:** `transition: transform 300ms ease` (slide desde derecha)
- **Panel de edición de usuarios:** slide desde la derecha, `transform: translateX(0/100%)`, `transition: 250ms ease`
- **Barras de progreso KPI:** `transition: width 600ms ease` al cargar
- **Modal de descarga:** fade-in overlay + scale-in del card, `transition: opacity 200ms, transform 200ms`
- **Filas de tabla:** hover `background: var(--color-surface-alt)`, `transition: 100ms`
- **Botones:** scale sutil `transform: scale(0.98)` en `:active`
- **Gráfico de área:** línea dibujada con `stroke-dashoffset` animation al cargar

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 9. Estados de UI

### Indicadores de zona (mapa)
| Estado | Color zona | Marcador |
|---|---|---|
| Óptimo | `rgba(76,175,125,0.4)` | Círculo verde |
| Atención | `rgba(245,158,11,0.4)` | Círculo ámbar |
| Crítico | `rgba(239,68,68,0.5)` | Círculo rojo |

### Barra de métricas (progreso)
| Rango | Color |
|---|---|
| 0–33% | `--color-danger` |
| 34–66% | `--color-warning` |
| 67–100% | `--color-accent` |

### Estados de usuario
| Estado | Color |
|---|---|
| Activo | `#22C55E` (verde) |
| Offline | `#9CA3AF` (gris) |

---

## 10. Responsividad

La app está diseñada **primariamente para desktop** (`min-width: 1200px`). Para viewports intermedios:

- **1024–1200px:** sidebar colapsa a íconos únicamente (`width: 56px`), tooltips al hover
- **< 1024px:** sidebar como drawer (overlay), activado con botón hamburguesa en topbar
- El mapa de georreferenciación conserva su proporción, el panel lateral pasa a bottom sheet en tablet
- Tablas: scroll horizontal con `overflow-x: auto` en contenedor

---

## 11. Accesibilidad

- Todos los inputs con `<label>` asociado o `aria-label`
- Focus rings visibles: `box-shadow: 0 0 0 3px rgba(47,104,68,0.25)`
- Contraste WCAG AA mínimo en textos sobre fondos de color
- Badges de estado no dependen solo del color (incluyen texto)
- Íconos decorativos con `aria-hidden="true"`
- Gráfico de área con tabla de datos accesible debajo
