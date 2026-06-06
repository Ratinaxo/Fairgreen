# FairGreen — Plan de Diseño: Sidebar

---

## 1. Estructura del componente

```
<aside>                          ← Contenedor raíz (position: fixed)
  ├── .sb-logo                   ← Zona de logo
  ├── <nav> .sb-nav              ← Zona de navegación (flex: 1, overflow-y: auto)
  │     ├── <a> .sb-item         ← Ítem de nav (×N)
  │     ├── .sb-divider          ← Separador de grupos
  │     └── <a> .sb-item         ← Ítem de nav
  └── .sb-bottom                 ← Zona inferior fija (Configuración)
```

El contenedor raíz es un `<aside>` con `position: fixed; left: 0; top: 0; height: 100vh; z-index: 100; overflow: hidden`. La transición de ancho maneja el colapso.

---

## 2. Tokens de color

| Token | Valor | Uso |
|---|---|---|
| `--sb-bg` | `#1C3D2E` | Fondo del sidebar |
| `--sb-accent` | `#4CAF7D` | Borde izquierdo ítem activo |
| `--sb-item-active-bg` | `rgba(255,255,255,0.11)` | Fondo ítem activo |
| `--sb-item-hover-bg` | `rgba(255,255,255,0.06)` | Fondo ítem hover |
| `--sb-text-inactive` | `#B8D4C0` | Texto nav inactivo |
| `--sb-text-active` | `#FFFFFF` | Texto nav activo |
| `--sb-icon-color` | `#7EC99A` | Color de íconos (inactivo) |
| `--sb-icon-active` | `#FFFFFF` | Color de íconos (activo) |
| `--sb-divider` | `rgba(255,255,255,0.08)` | Dividers y bordes internos |
| `--sb-logo-icon-bg` | `rgba(255,255,255,0.12)` | Fondo del contenedor del ícono logo |

---

## 3. Dimensiones y espaciado

| Propiedad | Expandido | Colapsado |
|---|---|---|
| Ancho | `200px` | `52px` |
| Altura | `100vh` | `100vh` |
| Padding zona logo | `18px 16px 14px` | `16px 0` (centrado) |
| Padding zona nav | `10px 8px` | `10px 0` |
| Padding ítem (default) | `8px 10px` | — |
| Padding ítem (activo) | `8px 10px 8px 8px` | — |
| Ancho ítem colapsado | — | `36×36px` |
| Border-radius ítem | `7px` | `7px` |
| Gap ícono + texto | `9px` | — |
| Tamaño ícono nav | `17px` | `17px` |
| Tamaño texto nav | `12.5px` | — |
| Font-weight texto activo | `500` | — |
| Font-weight texto inactivo | `400` | — |
| Borde acento activo | `border-left: 2.5px solid var(--sb-accent)` | igual |
| Altura divider | `1px` | `1px` |
| Margin divider | `6px 0` | `4px 0` |
| Ancho divider colapsado | — | `24px` centrado |
| Gap entre ítems nav | `margin-bottom: 2px` | `margin-bottom: 2px` |
| Tamaño logo ícono container | `26×26px` | — |
| Border-radius logo container | `6px` | — |
| Tamaño logo wordmark | `14px / weight 500` | oculto |

---

## 4. Estados del ítem de navegación

### Default
```css
.sb-item {
  background: transparent;
  color: #B8D4C0;          /* --sb-text-inactive */
  border-left: 2.5px solid transparent;
}
.sb-item i {
  color: #7EC99A;          /* --sb-icon-color */
}
```

### Hover
```css
.sb-item:hover {
  background: rgba(255,255,255,0.06);   /* --sb-item-hover-bg */
  cursor: pointer;
  /* sin borde izquierdo visible */
}
```

### Activo
```css
.sb-item.active {
  background: rgba(255,255,255,0.11);   /* --sb-item-active-bg */
  border-left: 2.5px solid #4CAF7D;    /* --sb-accent */
  color: #FFFFFF;
  font-weight: 500;
}
.sb-item.active i {
  color: #FFFFFF;
}
```

### Focus (teclado)
```css
.sb-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 125, 0.4);
}
```

---

## 5. Ítems de navegación

| Ícono (Lucide/Tabler) | Label | Ruta | Roles con acceso |
|---|---|---|---|
| `layout-dashboard` | Panel de Control | `/dashboard` | Todos |
| `map` | Georreferenciación | `/geomap` | Todos |
| `flask` | Registro de Muestras | `/samples/new` | Agrónomo, Admin |
| `clipboard-list` | Historial de Muestras | `/samples/history` | Todos |
| — | *divider* | — | — |
| `chart-bar` | Reportes | `/reports` | Agrónomo, Admin |
| `users` | Gestión de Usuarios | `/users` | Solo Admin |
| — | *divider (bottom)* | — | — |
| `settings` | Configuración | `/settings` | Todos |

> `Configuración` se ancla al fondo del sidebar con `margin-top: auto` o mediante `.sb-bottom` separado por `border-top`.

---

## 6. Visibilidad por rol

| Ítem | Administrador | Agrónomo | Canchero |
|---|:---:|:---:|:---:|
| Panel de Control | ✓ | ✓ | ✓ |
| Georreferenciación | ✓ | ✓ | ✓ |
| Registro de Muestras | ✓ | ✓ | — |
| Historial de Muestras | ✓ | ✓ | ✓ |
| Reportes | ✓ | ✓ | — |
| Gestión de Usuarios | ✓ | — | — |
| Configuración | ✓ | ✓ | ✓ |

Los ítems no visibles deben removerse del DOM (no solo ocultarse con CSS), para evitar que sean navegables con teclado.

---

## 7. Transiciones y animaciones

| Propiedad | Valor |
|---|---|
| Hover background | `background 150ms ease` |
| Color de ícono | `color 150ms ease` |
| Expansión / colapso de ancho | `width 250ms cubic-bezier(0.4, 0, 0.2, 1)` |
| Fade-out del texto (colapso) | `opacity 150ms ease, visibility 150ms` |
| Tooltip (aparición) | `opacity 200ms ease, transform translateX(4px → 0) 200ms ease` |
| Delay del tooltip | `300ms` antes de mostrarse |

```css
aside.sidebar {
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sb-item span {
  transition: opacity 150ms ease, visibility 150ms ease;
}
aside.sidebar.collapsed .sb-item span {
  opacity: 0;
  visibility: hidden;
  width: 0;
}
```

---

## 8. Estado colapsado (52px)

Cuando el ancho es `52px`:
- Solo se muestran íconos, centrados horizontalmente.
- El wordmark del logo tiene `opacity: 0; width: 0; overflow: hidden`.
- El ítem activo conserva `border-left: 2.5px solid var(--sb-accent)` y `border-radius: 0 7px 7px 0` para que el borde izquierdo quede al filo.
- Los dividers se reducen a `width: 24px` centrados con `margin: 4px auto`.
- Cada ícono tiene un **tooltip** que aparece a la derecha al hacer hover.

### Tooltip (estado colapsado)
```css
.sb-tooltip {
  position: absolute;
  left: 60px;
  background: #1C3D2E;
  color: #FFFFFF;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  pointer-events: none;
  opacity: 0;
  transform: translateX(4px);
  transition: opacity 200ms ease, transform 200ms ease;
  transition-delay: 300ms;
}
.sb-item:hover .sb-tooltip {
  opacity: 1;
  transform: translateX(0);
}
```

---

## 9. Zona logo

```html
<div class="sb-logo">
  <div class="sb-logo-icon">
    <!-- ícono hoja (leaf / plant) 15px, color #7EC99A -->
  </div>
  <span class="sb-logo-text">Fairgreen</span>
</div>
```

```css
.sb-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.sb-logo-icon {
  width: 26px;
  height: 26px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sb-logo-text {
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
  letter-spacing: 0.01em;
}
```

---

## 10. Zona inferior (Configuración)

```css
.sb-bottom {
  margin-top: auto;
  padding: 10px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
```

El ítem de Configuración dentro de `.sb-bottom` usa exactamente los mismos estilos que cualquier `.sb-item` del nav principal.

---

## 11. Breakpoints y comportamiento responsive

| Viewport | Comportamiento |
|---|---|
| ≥ 1200px | Sidebar expandido (200px) siempre visible |
| 1024px – 1199px | Sidebar colapsado automático (52px), sin intervención del usuario |
| < 1024px | Sidebar oculto (`transform: translateX(-100%)`). Se activa como **drawer** con overlay oscuro al presionar el botón hamburguesa en el topbar |

```css
/* Drawer mobile */
@media (max-width: 1023px) {
  aside.sidebar {
    transform: translateX(-100%);
    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 200;
  }
  aside.sidebar.open {
    transform: translateX(0);
    width: 200px;  /* siempre expandido en drawer */
  }
  .sb-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 199;
    opacity: 0;
    pointer-events: none;
    transition: opacity 300ms ease;
  }
  .sb-overlay.visible {
    opacity: 1;
    pointer-events: all;
  }
}
```

---

## 12. CSS completo del componente

```css
/* ── Variables ─────────────────────────────────────── */
aside.sidebar {
  --sb-bg:              #1C3D2E;
  --sb-accent:          #4CAF7D;
  --sb-item-active-bg:  rgba(255,255,255,0.11);
  --sb-item-hover-bg:   rgba(255,255,255,0.06);
  --sb-text-inactive:   #B8D4C0;
  --sb-text-active:     #FFFFFF;
  --sb-icon-color:      #7EC99A;
  --sb-divider:         rgba(255,255,255,0.08);
}

/* ── Contenedor raíz ───────────────────────────────── */
aside.sidebar {
  position: fixed;
  left: 0; top: 0;
  width: 200px;
  height: 100vh;
  background: var(--sb-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
  transition: width 250ms cubic-bezier(0.4, 0, 0.2, 1);
}
aside.sidebar.collapsed { width: 52px; }

/* ── Logo ──────────────────────────────────────────── */
.sb-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--sb-divider);
  flex-shrink: 0;
}
.sb-logo-icon {
  width: 26px; height: 26px;
  background: rgba(255,255,255,0.12);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sb-logo-text {
  font-size: 14px; font-weight: 500;
  color: var(--sb-text-active);
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition: opacity 150ms ease, visibility 150ms ease;
}
aside.sidebar.collapsed .sb-logo-text {
  opacity: 0; visibility: hidden; width: 0;
}

/* ── Nav ───────────────────────────────────────────── */
.sb-nav {
  flex: 1;
  padding: 10px 8px;
  overflow-y: auto;
  overflow-x: hidden;
}
.sb-nav::-webkit-scrollbar { width: 3px; }
.sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

/* ── Ítem ──────────────────────────────────────────── */
.sb-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 7px;
  border-left: 2.5px solid transparent;
  margin-bottom: 2px;
  cursor: pointer;
  text-decoration: none;
  color: var(--sb-text-inactive);
  transition: background 150ms ease, color 150ms ease;
  position: relative;
  white-space: nowrap;
}
.sb-item i {
  font-size: 17px;
  color: var(--sb-icon-color);
  flex-shrink: 0;
  transition: color 150ms ease;
}
.sb-item span {
  font-size: 12.5px;
  transition: opacity 150ms ease, visibility 150ms ease;
}
.sb-item:hover {
  background: var(--sb-item-hover-bg);
}
.sb-item.active {
  background: var(--sb-item-active-bg);
  border-left-color: var(--sb-accent);
  padding-left: 8px;
  color: var(--sb-text-active);
  font-weight: 500;
}
.sb-item.active i { color: var(--sb-text-active); }
.sb-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(76,175,125,0.4);
}

/* Colapsado: ocultar texto */
aside.sidebar.collapsed .sb-item span {
  opacity: 0; visibility: hidden; width: 0;
}
aside.sidebar.collapsed .sb-item {
  justify-content: center;
  padding: 0;
  width: 36px; height: 36px;
  margin: 0 auto 2px;
}
aside.sidebar.collapsed .sb-item.active {
  border-radius: 0 7px 7px 0;
  width: 100%;
  padding-left: 0;
}

/* ── Divider ───────────────────────────────────────── */
.sb-divider {
  height: 1px;
  background: var(--sb-divider);
  margin: 6px 0;
}
aside.sidebar.collapsed .sb-divider {
  width: 24px;
  margin: 4px auto;
}

/* ── Zona inferior ─────────────────────────────────── */
.sb-bottom {
  padding: 10px 8px;
  border-top: 1px solid var(--sb-divider);
  flex-shrink: 0;
}

/* ── Tooltip (colapsado) ───────────────────────────── */
.sb-tooltip {
  position: absolute;
  left: 60px;
  top: 50%; transform: translateY(-50%) translateX(4px);
  background: #1C3D2E;
  color: #FFFFFF;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  pointer-events: none;
  opacity: 0;
  transition: opacity 200ms ease, transform 200ms ease;
  transition-delay: 300ms;
  z-index: 101;
}
aside.sidebar.collapsed .sb-item:hover .sb-tooltip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}
```
