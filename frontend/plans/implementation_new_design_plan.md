# Eliminar rigidez visual — Diseño fluido sin contenedores rígidos

El problema actual es que las páginas se sienten **encajonadas** dentro de `cards` con bordes y sombras visibles, lo cual genera una apariencia rígida y poco elegante. El objetivo es lograr un diseño más fluido, aireado y moderno **sin tocar el sidebar en absoluto**.

## Principios de diseño

La idea central es pasar de un layout de "cajas apiladas" a un diseño donde el contenido **fluye naturalmente** sobre el fondo, usando:

- **Eliminación de bordes visibles** en contenedores principales
- **Fondos sutiles o transparentes** en lugar de `cards` con borde + sombra
- **Separadores orgánicos** (espaciado, tipografía, líneas sutiles) en vez de bordes de caja
- **Sombras solo donde aportan contexto** (elementos interactivos, hover)
- **Transiciones suaves** entre secciones de contenido

## User Review Required

> [!IMPORTANT]
> **El sidebar NO será modificado bajo ningún concepto.** Ni su HTML, ni su CSS, ni su componente TypeScript serán tocados en ningún paso de este plan.

> [!IMPORTANT]
> **Decisión de estilo:** Este plan propone un enfoque "card-less" donde el contenido principal de cada página fluye directamente sobre el fondo sin contenedores con bordes visibles. Las tablas y formularios mantendrán estructura visual sutil. ¿Estás de acuerdo con esta dirección?

## Open Questions

> [!IMPORTANT]
> 1. **¿Deseas mantener `cards` con borde/sombra para algunos elementos específicos** como formularios modales o tablas, o prefieres eliminar completamente el concepto de "caja" en toda la interfaz?
> 2. **¿Quieres que la topbar también se vea más fluida** (sin borde inferior, más transparente), o solo modificar el contenido de las páginas?

---

## Archivos que NO se tocarán

| Componente | Archivos |
|---|---|
| **Sidebar** | `sidebar/` — todos los archivos |
| **Login** | `login/` — todos los archivos |

---

## Proposed Changes

### 1. Global Design System

#### [MODIFY] [styles.scss](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/styles.scss)

**Cambios principales:**

- **`.card`**: Eliminar `border` y reducir `box-shadow` drásticamente. Usar fondo `transparent` o con opacidad muy sutil. El resultado: las cards dejan de ser "cajas" y se convierten en contenedores invisibles.
  
  ```diff
  .card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
  - box-shadow: var(--shadow-card);
  - border: 1px solid var(--color-border);
  + box-shadow: none;
  + border: none;
    min-width: 0;
  }
  ```

- **Nuevo token `--shadow-card-hover`**: Solo mostrar sombra sutil al hacer hover sobre cards interactivas.

- **`.data-table`**: Transición de bordes duros a separadores con opacidad reducida y sin borde exterior. Las filas se diferencian por espaciado y hover, no por líneas.
  
  ```diff
  .data-table th {
  - border-bottom: 1px solid var(--color-border);
  + border-bottom: 1px solid rgba(221, 229, 223, 0.5);
  - background: var(--color-surface);
  + background: transparent;
  }
  
  .data-table td {
  - border-bottom: 1px solid var(--color-border);
  + border-bottom: 1px solid rgba(221, 229, 223, 0.3);
  }
  ```

- **`.section-header`**: Reemplazar la línea divisoria inferior por un gradiente sutil que desaparece.

- **`.page-header h1`**: Incrementar peso visual del título para que sea el ancla visual que reemplaza los bordes de las cajas.

- **Nuevo utilitario `.content-section`**: Un espaciador entre secciones que usa padding generoso y sin bordes.

---

### 2. Layout Principal

#### [MODIFY] [main-layout.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/main-layout/main-layout.component.css)

- **`.content-area`**: Aumentar padding para dar más respiración al contenido. Fondo con gradiente muy sutil en vez de color plano.

  ```diff
  .content-area {
    flex: 1;
    overflow-y: auto;
  - padding: 24px;
  + padding: 32px 40px;
    background: var(--color-bg);
  }
  ```

---

### 3. Topbar (opcional, según respuesta)

#### [MODIFY] [topbar.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/layout/topbar/topbar.component.css)

- Reemplazar `border-bottom: 1px solid` por un borde con opacidad reducida o eliminarlo completamente, usando solo una sombra muy sutil para separar.

  ```diff
  .topbar {
  - border-bottom: 1px solid var(--color-border);
  + border-bottom: 1px solid rgba(221, 229, 223, 0.4);
  + backdrop-filter: blur(8px);
  + background: rgba(255, 255, 255, 0.85);
  }
  ```

---

### 4. Dashboard

#### [MODIFY] [dashboard.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/dashboard/dashboard.component.css)

- **KPI cards**: Mantener fondo blanco pero sin borde ni sombra estática. Agregar sombra sutil solo en hover para indicar interactividad.
- **Map card**: Eliminar borde. Usar `border-radius` más generoso con overflow hidden para que el mapa fluya.

#### [MODIFY] [dashboard.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/dashboard/dashboard.component.html)

- Eliminar `class="card"` del map container y las KPI cards, reemplazando con clases específicas que no hereden el estilo de card.

---

### 5. Historial de Muestras

#### [MODIFY] [sample-history.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.css)

- **`.filter-card`**: Fondo con opacidad reducida, sin borde. Los filtros flotan naturalmente sobre el contenido.
- **Table container**: Sin borde ni sombra. La tabla se separa del resto por tipografía y espaciado.

#### [MODIFY] [sample-history.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-history/sample-history.component.html)

- Eliminar `class="card"` del contenedor de la tabla, reemplazando con estilos fluidos.

---

### 6. Reportes

#### [MODIFY] [reports.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.css)

- **`.filters-card`**: Fondo sutil sin borde.
- **`.chart-card`**: Sin borde, el gráfico fluye directamente.
- **Data table card**: Mismos cambios fluidos.

#### [MODIFY] [reports.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.html)

- Reemplazar `class="card"` por clases específicas sin apariencia de contenedor.

---

### 7. Usuarios

#### [MODIFY] [users.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/users/users.component.css)

- **`.users-layout`**: Sin `border-radius` exterior. El panel de edición mantendrá separación visual sutil.
- **`.users-table-card`**: Sin borde ni sombra.

---

### 8. Detalle de Muestra

#### [MODIFY] [sample-detail.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/sample-detail/sample-detail.component.css)

- Las múltiples cards (carousel, map, info) se convierten en secciones fluidas con separación por espaciado.

---

### 9. Nueva Muestra / Editar Muestra

#### [MODIFY] [new-sample.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/new-sample/new-sample.component.css)

- El formulario principal (`sample-form.card`) pierde su apariencia de caja. Las secciones internas se separan por tipografía y espaciado.

---

### 10. Notificaciones

#### [MODIFY] [notifications.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/notifications/notifications.component.css)

- Los items de notificación fluyen directamente sin contenedor externo rígido.

---

## Resumen visual del cambio

```
ANTES                              DESPUÉS
┌──────────────┐                   
│ ┌──────────┐ │                   Título Grande
│ │ Card 1   │ │                   
│ └──────────┘ │                   Contenido fluido sin bordes
│ ┌──────────┐ │                   ──── separador sutil ────
│ │ Card 2   │ │                   
│ └──────────┘ │                   Más contenido, respirando
│ ┌──────────┐ │                   
│ │ Card 3   │ │                   Tabla sin caja exterior
│ └──────────┘ │                   
└──────────────┘                   
```

## Verification Plan

### Manual Verification
- Verificar visualmente cada página en el navegador tras los cambios
- Confirmar que el sidebar permanece **100% intacto**
- Verificar responsive en diferentes tamaños de pantalla
- Confirmar que las tablas, formularios y elementos interactivos siguen siendo usables y accesibles
- Confirmar que los modales mantienen su apariencia (los modales SÍ deben verse como cajas flotantes)
