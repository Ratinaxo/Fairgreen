# Guía: efecto de ítem activo con curvas cóncavas en sidebar

Esta guía explica cómo transformar el estado activo de un sidebar ya implementado para lograr el efecto "fluido" donde el ítem seleccionado parece fundirse con el área de contenido. **No se tocan los colores del proyecto** — solo se ajusta la geometría y la técnica CSS.

---

## Cómo funciona el efecto

El ítem activo parece "abrirse paso" hacia el contenido porque su fondo coincide exactamente con el fondo de la página principal, mientras que el sidebar tiene un tono distinto (generalmente más oscuro o más claro). Las curvas cóncavas arriba y abajo del bloque eliminan el ángulo recto, creando una sensación orgánica de "encaje".

Se requieren tres piezas:

1. El ítem activo toma el color de fondo de la página (no del sidebar).
2. Sus esquinas derechas son rectas; solo las izquierdas son redondeadas.
3. Dos pseudo-elementos (`::before` y `::after`) simulan las curvas cóncavas.

---

## Paso 1 — identificar tus dos colores clave

Antes de tocar el CSS, anota estos dos valores de tu proyecto:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `COLOR_SIDEBAR` | Fondo del sidebar | `#231f3a` |
| `COLOR_PAGE` | Fondo del área de contenido | `#1a1730` |

Estos son los únicos dos colores que usará esta técnica. No se añade ningún color nuevo.

---

## Paso 2 — estructura HTML requerida

El ítem del menú necesita un elemento interno (`.nav-item-inner` o equivalente) separado del contenedor. Si tu sidebar ya tiene esta estructura, puedes saltarte este paso.

```html
<!-- Estructura mínima requerida -->
<li class="nav-item active">
  <div class="nav-item-inner">
    <i class="icon-dashboard"></i>
    <span>Dashboard</span>
  </div>
</li>
```

El contenedor exterior (`.nav-item`) maneja los pseudo-elementos de las curvas. El interior (`.nav-item-inner`) maneja el fondo y el `border-radius`. Sin esta separación, las curvas quedarán desalineadas.

---

## Paso 3 — CSS del ítem activo

Reemplaza o complementa los estilos actuales de tu estado `.active` con lo siguiente. Sustituye `COLOR_SIDEBAR` y `COLOR_PAGE` con tus valores reales.

```css
/* El contenedor exterior necesita posición relativa para los pseudo-elementos */
.nav-item {
  position: relative;
}

/* El bloque interno toma el color de la página y extiende su borde derecho
   hasta el límite del sidebar, eliminando el hueco */
.nav-item.active .nav-item-inner {
  background: COLOR_PAGE;            /* color del área de contenido */
  border-radius: 14px 0 0 14px;      /* solo esquinas izquierdas redondeadas */
  margin-right: -16px;               /* ajusta al padding del sidebar */
  padding-right: 28px;               /* compensa el margen negativo */
  transition: background 0.2s ease;
}

/* Íconos y texto del ítem activo — ajusta a tus variables de color */
.nav-item.active .nav-icon,
.nav-item.active .nav-label {
  color: #e2e0f0; /* usa tu color de texto activo */
}
```

> **Nota sobre `margin-right`:** el valor `-16px` debe coincidir con el `padding-right` o `padding-inline` que tenga tu sidebar en los ítems. Si tus ítems tienen `padding: 0 20px`, usa `margin-right: -20px` y `padding-right: 32px`.

---

## Paso 4 — las curvas cóncavas (el truco central)

Este es el CSS de los pseudo-elementos. La lógica: cada pseudo-elemento es un cuadrado del color del sidebar. Su `border-radius` crea una esquina redondeada. El `box-shadow` con el color de la página "pinta" el hueco que queda, produciendo la ilusión de una curva hacia adentro.

```css
/* Ambas curvas comparten posición y tamaño base */
.nav-item.active::before,
.nav-item.active::after {
  content: '';
  position: absolute;
  right: 0;
  width: 20px;
  height: 20px;
  background: COLOR_SIDEBAR;  /* color del sidebar */
  pointer-events: none;
}

/* Curva superior — se coloca encima del bloque activo */
.nav-item.active::before {
  top: -20px;
  border-bottom-right-radius: 16px;
  box-shadow: 6px 6px 0 6px COLOR_PAGE;   /* rellena el hueco con el color de la página */
}

/* Curva inferior — se coloca debajo del bloque activo */
.nav-item.active::after {
  bottom: -20px;
  border-top-right-radius: 16px;
  box-shadow: 6px -6px 0 6px COLOR_PAGE;  /* misma lógica, dirección invertida */
}
```

### Ajuste del tamaño de la curva

El tamaño de la curva se controla con tres valores relacionados. Cámbialos en conjunto:

```css
/* Para una curva más pronunciada */
width: 24px;
height: 24px;
top: -24px;          /* / bottom: -24px */
box-shadow: 8px 8px 0 8px COLOR_PAGE;

/* Para una curva más sutil */
width: 14px;
height: 14px;
top: -14px;          /* / bottom: -14px */
box-shadow: 5px 5px 0 5px COLOR_PAGE;
```

La regla: el cuarto valor del `box-shadow` (el spread) debe ser igual o ligeramente mayor que los primeros dos valores de offset para que no queden huecos.

---

## Paso 5 — transición al cambiar ítem

Para que el cambio de ítem se vea fluido en lugar de brusco, basta con una transición en el contenedor interno. Las curvas (pseudo-elementos) no necesitan transición.

```css
.nav-item-inner {
  transition: background 0.2s ease;
}
```

En JavaScript, el cambio de estado activo se hace moviendo la clase `.active`:

```javascript
const items = document.querySelectorAll('.nav-item');

items.forEach(item => {
  item.addEventListener('click', () => {
    items.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
```

---

## Paso 6 — estado colapsado

Si tu sidebar tiene modo colapsado (solo íconos), el efecto de curvas sigue funcionando sin cambios. Solo asegúrate de que `.nav-item-inner` mantenga su `margin-right` negativo también en el estado colapsado. Si en modo colapsado el sidebar no tiene borde derecho abierto, puedes desactivar las curvas:

```css
.sidebar.collapsed .nav-item.active::before,
.sidebar.collapsed .nav-item.active::after {
  display: none;
}

.sidebar.collapsed .nav-item.active .nav-item-inner {
  border-radius: 14px;   /* todas las esquinas redondeadas en modo colapsado */
  margin-right: 0;
  padding-right: 12px;
}
```

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Las curvas aparecen desplazadas verticalmente | El `height` del pseudo-elemento no coincide con `top`/`bottom` | Asegúrate de que `height: 20px` y `top: -20px` sean iguales |
| Se ve un hueco blanco entre la curva y el bloque | El `box-shadow` spread es insuficiente | Aumenta el cuarto valor: `6px 6px 0 8px COLOR_PAGE` |
| Las curvas se ven cortadas | El contenedor padre tiene `overflow: hidden` | Quita `overflow: hidden` del sidebar o del contenedor de ítems |
| El bloque activo no llega al borde del sidebar | `margin-right` insuficiente | Aumenta el valor negativo para que coincida con el padding del sidebar |
| Las curvas tapan el ítem de abajo | `z-index` incorrecto | Añade `z-index: 1` al `.nav-item.active` |

---

## Resumen de la técnica

```
  SIDEBAR          PÁGINA
  ┌─────────────┐
  │             │
  │  ╭──────────╯  ← curva superior (::before)
  │  │ ítem activo │  ← fondo = COLOR_PAGE
  │  ╰──────────╮  ← curva inferior (::after)
  │             │
  └─────────────┘
```

Los pseudo-elementos son cuadrados del color del sidebar. Su `border-radius` crea la curva visible. Su `box-shadow` en COLOR_PAGE tapa el hueco de la esquina. El resultado: una curva cóncava limpia sin SVG ni imágenes.
