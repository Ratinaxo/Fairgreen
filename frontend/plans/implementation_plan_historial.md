# Mejoras a Detalle de Muestra, Multi-Imagen y Responsividad

## Contexto

El sistema Fairgreen tiene un historial de muestras donde el botón "Ver Detalle" abre un modal emergente. Se necesitan tres cambios principales:

1. **Detalle de muestra como página independiente** (estilo ficha de producto e-commerce), incluyendo un carrusel de fotos
2. **Subida de múltiples imágenes** en los formularios de crear y editar muestra
3. **Responsividad completa** — el contenido debe adaptarse al colapsar/expandir el sidebar

---

## Cambios Propuestos

### 1. Página de Detalle de Muestra (Sample Detail)

#### [NEW] [sample-detail.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-detail/sample-detail.component.ts)
#### [NEW] [sample-detail.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-detail/sample-detail.component.html)
#### [NEW] [sample-detail.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-detail/sample-detail.component.css)

Nueva página que reemplaza al modal actual. Layout en dos columnas (como una ficha de producto):

- **Columna izquierda**: Carrusel de fotos con navegación (flechas + indicadores de punto), soporte para 0..N imágenes, placeholder si no hay fotos
- **Columna derecha**: Datos organizados en secciones:
  - Header: Zona, Sector, Fecha, Responsable
  - Métricas: Cards con Humedad, Temperatura, Salinidad, Conductividad (con indicador de salud visual)
  - Mapa: Integración del componente `MapGeorefComponent` mostrando la ubicación exacta
  - Observaciones: Bloque con las recomendaciones
  - Botones: "Volver al historial" y "Editar" (si tiene permisos)

El componente recibe el `id` por ruta (`/samples/detail/:id`), carga los datos con `DataService.getMuestra(id)`, y muestra un skeleton loading mientras carga.

---

#### [MODIFY] [app.routes.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/app.routes.ts)

Agregar nueva ruta para el detalle:
```typescript
{
  path: 'samples/detail/:id',
  loadComponent: () =>
    import('./pages/sample-detail/sample-detail.component').then(m => m.SampleDetailComponent),
  title: 'Detalle de Muestra — FairGreen',
  // Todos los roles pueden ver el detalle
},
```

---

#### [MODIFY] [sample-history.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.ts)

- Eliminar `selectedFeature`, `openDetailModal()`, `closeDetailModal()` y `ngOnDestroy`
- Reemplazar el click de "Ver Detalle" por navegación: `this.router.navigate(['/samples/detail', id])`

#### [MODIFY] [sample-history.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.html)

- Eliminar todo el bloque del modal (`<!-- Sample Detail Modal -->`, líneas 200-249)
- Cambiar el `(click)` del botón "Ver Detalle" para navegar en vez de abrir modal

#### [MODIFY] [sample-history.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.css)

- Eliminar todos los estilos del modal: `.detail-modal-card`, `.detail-modal-body`, `.detail-info-pane`, `.detail-grid`, `.detail-map-pane` y sus media queries asociadas

---

### 2. Subida de Múltiples Imágenes

#### [MODIFY] [new-sample.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.ts)

- Cambiar `selectedFile: File | null` → `selectedFiles: File[] = []`
- Cambiar `uploadedFile = ''` → `uploadedFiles: string[] = []`
- Actualizar `onFileChange()` para aceptar `multiple` y acumular archivos
- Actualizar `onDrop()` para aceptar múltiples archivos del drag
- Agregar método `removeFile(index: number)` para quitar archivos individuales
- Actualizar `saveSample()` para subir fotos en secuencia (encadenar `uploadFoto` por cada archivo)

#### [MODIFY] [new-sample.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.html)

- Agregar `multiple` al `<input type="file">`
- Reemplazar la zona de drop actual por: zona de drop + lista de thumbnails de archivos seleccionados con botón de eliminar individual
- Actualizar textos: "Click para cargar archivos" (plural)

#### [MODIFY] [edit-sample.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/edit-sample/edit-sample.component.ts)

- Mismos cambios que new-sample: `selectedFiles: File[]`, multi-file `onFileChange` y `onDrop`
- Agregar `existingPhotos: FotoItem[]` para mostrar las fotos ya existentes cargadas del backend
- Agregar `removeFile(index)` para archivos nuevos
- Actualizar `loadSampleData()` para poblar `existingPhotos` desde `p.fotos`
- Actualizar `saveSample()` para subir todas las fotos nuevas secuencialmente

#### [MODIFY] [edit-sample.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/edit-sample/edit-sample.component.html)

- Agregar `multiple` al `<input type="file">`
- Mostrar galería de fotos existentes encima de la zona de drop
- Mostrar lista de archivos nuevos seleccionados con opción de eliminar

#### [MODIFY] [new-sample.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.css)
#### [MODIFY] [edit-sample.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/edit-sample/edit-sample.component.css)

- Agregar estilos para la galería de thumbnails de archivos seleccionados (grid responsive, botón de eliminar superpuesto)

---

### 3. Responsividad Completa (Sidebar Collapse)

> [!IMPORTANT]
> El problema actual: el sidebar tiene ancho fijo y el `main-layout` usa `margin-left: 220px` (expandido) o `60px` (colapsado). Al colapsar, el contenido no se re-adapta fluidamente porque las páginas internas usan `max-width` fijos.

#### [MODIFY] [main-layout.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/main-layout/main-layout.component.ts)

- Importar `SidebarComponent` con `ViewChild` para leer el estado `isCollapsed` del sidebar
- Exponer una clase CSS condicional (`sidebar-collapsed`) en el `.shell-main` para que los hijos puedan reaccionar

#### [MODIFY] [main-layout.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/main-layout/main-layout.component.html)

- Añadir `[class.sidebar-collapsed]="sidebar.isCollapsed()"` al div `.shell-main`

#### [MODIFY] [main-layout.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/main-layout/main-layout.component.css)

- Agregar regla `.shell-main.sidebar-collapsed { margin-left: 60px; }` para desktop (>1199px)
- Asegurar que la transición de `margin-left` sea fluida (ya tiene `transition: margin-left 280ms`)

#### Archivos de cada página afectada

Se verificarán y ajustarán los estilos de las siguientes páginas para que usen unidades relativas (`%`, `vw`, `calc()`) en lugar de anchos absolutos donde sea necesario:

- [dashboard.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/dashboard/dashboard.component.css)
- [sample-history.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.css)
- [new-sample.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.css)
- [reports.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.css)
- [geomap.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/geomap/geomap.component.css)
- La nueva `sample-detail.component.css`

El ajuste principal es: las páginas que usan `max-width: XXXpx` deberán usar `width: 100%` con un `max-width` que se adapte, y los grids deben usar `auto-fit`/`minmax` donde aplique.

---

## Resumen de archivos

| Acción | Archivo | Componente |
|--------|---------|------------|
| **NEW** | `pages/sample-detail/*.ts/html/css` | Página de detalle con carrusel |
| MODIFY | `app.routes.ts` | Nueva ruta `samples/detail/:id` |
| MODIFY | `pages/sample-history/*.ts/html/css` | Eliminar modal, navegar a nueva página |
| MODIFY | `pages/new-sample/*.ts/html/css` | Multi-file upload |
| MODIFY | `pages/edit-sample/*.ts/html/css` | Multi-file upload + fotos existentes |
| MODIFY | `layout/main-layout/*.ts/html/css` | Clase reactiva al sidebar collapse |
| MODIFY | Varios `*.css` de páginas | Ajustes de responsividad |

---

## Plan de Verificación

### Pruebas Manuales
1. **Detalle de muestra**: Navegar desde historial → verificar que abre página completa con carrusel funcional
2. **Multi-imagen**: Crear nueva muestra con 3+ fotos → verificar que todas se suben y se ven en el detalle
3. **Editar muestra**: Verificar que se ven las fotos existentes y se pueden agregar nuevas
4. **Sidebar collapse**: En desktop, colapsar sidebar → verificar que el contenido se expande fluidamente en todas las páginas
5. **Mobile**: Verificar que la página de detalle se adapta correctamente a pantallas pequeñas (layout de columna única)

### Build automático
- El frontend con `ng serve` dentro de Docker detectará los cambios automáticamente y recompilará. Verificar que no hay errores de compilación TypeScript ni warnings de Angular.
