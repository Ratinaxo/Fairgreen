# Parallel Coordinates Chart — Replace Line Chart in Reports

Replace the current single-parameter time-series line chart in `ReportsComponent` with a **parallel coordinates chart** that plots **all 4 soil parameters simultaneously** (Humedad, Salinidad, Conductividad, Temperatura) per sample. Built with native SVG inside Angular — no external chart library.

## User Review Required

> [!IMPORTANT]
> **The "Componente" filter goes away.** The current UI lets you pick one component at a time (Humedad, Temperatura, etc.) and renders a line chart for it. The parallel coordinates chart shows **all 4 parameters at once** on their own vertical axes, so the single-component dropdown in the main filter bar will be **removed**. The component dropdown in the **export modal** stays because exports can still target a single component for the table/stats.

> [!WARNING]
> **The bar-chart section (Green vs. Fairway averages) is also being removed.** It was tied to the single-component view. If you want to keep it in some form, let me know before I proceed.

## Open Questions

1. **Color scheme for sample lines** — Each sample will get a unique line color. Should we use a gradient-based hue rotation (green/teal spectrum matching the FairGreen palette), or a more traditional categorical palette? I'll default to a harmonious palette derived from the project's primary colors.

2. **Maximum simultaneous samples** — The chart can get cluttered with many lines. Should we cap the displayed samples (e.g. latest 50) or rely on the existing date/sector/zona filters to keep the count manageable?

## Proposed Changes

### Reports Component — TypeScript

#### [MODIFY] [reports.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.ts)

**Remove:**
- All line-chart state: `rawData`, `xLabels`, `yAxisValues`, `yAxisMax`, `yFactor`, and the computed properties `chartPoints`, `linePath`, `areaPath`
- All export-chart variants: `exportYAxisValues`, `exportYAxisMax`, `exportYFactor`, `exportXLabels`, `exportRawData`, `exportChartPoints`, `exportLinePath`, `exportAreaPath`
- `avgGreen` / `avgFairway` bar-chart signals
- The `appliedComponent` signal (no longer needed for chart display)
- The `filters.component` field from the filter bar config (keep it only in `exportConfig`)
- Time-bucketing logic in `_processData()` (no longer aggregating into monthly buckets)

**Add — Parallel Coordinates Engine (all inline in the component):**

```typescript
// ── Parallel Coordinates Config ──────────────────────────────────
readonly PC_PARAMS = [
  { key: 'humedad'       as const, label: 'Humedad',       unit: 'escala 1–5', min: 0,   max: 5    },
  { key: 'salinidad'     as const, label: 'Salinidad',     unit: 'dS/m',       min: 0,   max: 10   },
  { key: 'conductividad' as const, label: 'Conductividad', unit: 'µS/cm',      min: 0,   max: 2000 },
  { key: 'temperatura'   as const, label: 'Temperatura',   unit: '°C',         min: 0,   max: 45   },
];

readonly PC_MARGIN = { top: 50, right: 40, bottom: 30, left: 40 };
readonly PC_COLORS = [
  '#1C3D2E', '#4CAF7D', '#2980B9', '#E67E22', '#8E44AD',
  '#16A085', '#D35400', '#2C3E50', '#27AE60', '#C0392B',
];

// State
pcSamples: { feature: MuestraFeature; color: string; visible: boolean }[] = [];
pcHoveredId: number | null = null;
pcTooltip = { show: false, x: 0, y: 0, sample: null as MuestraFeature | null };
```

**Normalization + path helpers** (pure functions, no separate file):

```typescript
private pcNormalize(value: number | null | undefined, min: number, max: number): number {
  if (value == null) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

pcAxisX(index: number): number {
  // Called from template — calculates X position for axis `index`
  const innerW = 700 - this.PC_MARGIN.left - this.PC_MARGIN.right;
  const nAxes = this.PC_PARAMS.length;
  return this.PC_MARGIN.left + (index / (nAxes - 1)) * innerW;
}

pcValueY(normalizedVal: number): number {
  const innerH = 300 - this.PC_MARGIN.top - this.PC_MARGIN.bottom;
  return this.PC_MARGIN.top + (1 - normalizedVal) * innerH;
}

pcBuildPath(feature: MuestraFeature): string {
  const props = feature.properties;
  const points = this.PC_PARAMS.map((p, i) => ({
    x: this.pcAxisX(i),
    y: this.pcValueY(this.pcNormalize(props[p.key], p.min, p.max)),
  }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const mx = (points[i].x + points[i + 1].x) / 2;
    d += ` C ${mx} ${points[i].y}, ${mx} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  return d;
}
```

**Updated `_processData()`** — now populates `pcSamples` instead of bucketed line data:

```typescript
private _processData(features: MuestraFeature[]) {
  // Build pcSamples for the parallel coordinates chart
  this.pcSamples = features
    .sort((a, b) => new Date(b.properties.fecha_hora_captura).getTime()
                   - new Date(a.properties.fecha_hora_captura).getTime())
    .map((f, i) => ({
      feature: f,
      color: this.PC_COLORS[i % this.PC_COLORS.length],
      visible: true,
    }));

  // Still build reportRows for the data table (all 4 components per row)
  this.reportRows = features.map(f => {
    const p = f.properties;
    // Status logic based on overall health (can keep existing logic or simplify)
    return {
      id: f.id,
      date: new Date(p.fecha_hora_captura).toLocaleDateString('es-CL'),
      sector: `Sector ${p.id_seccion?.properties?.numero_de_hoyo ?? 0}`,
      point: `${p.id_seccion?.properties?.tipo_de_tierra ?? 'Z'}`,
      component: 'Todos',
      level: null,
      status: 'optimo' as const,
      humedad: p.humedad,
      temperatura: p.temperatura,
      salinidad: p.salinidad,
      conductividad: p.conductividad,
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
```

**Interactivity methods:**

```typescript
pcOnLineEnter(sampleId: number) {
  this.pcHoveredId = sampleId;
}

pcOnLineLeave() {
  this.pcHoveredId = null;
  this.pcTooltip.show = false;
}

pcToggleSample(sampleId: number) {
  const s = this.pcSamples.find(s => s.feature.id === sampleId);
  if (s) s.visible = !s.visible;
}

pcLineOpacity(sampleId: number): number {
  if (this.pcHoveredId === null) return 0.65;
  return sampleId === this.pcHoveredId ? 1 : 0.12;
}

pcLineWidth(sampleId: number): number {
  return sampleId === this.pcHoveredId ? 3.5 : 2;
}
```

---

### Reports Component — HTML Template

#### [MODIFY] [reports.component.html](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.html)

**Remove:**
- The "Componente" `<select>` from the filters bar (lines 63–72)
- The entire SVG line-chart block (lines 105–147): `<svg #chartSvg ...>` with area, line, data points, and axes
- The chart card title reference to `appliedComponent()`

**Replace chart card content with Parallel Coordinates SVG:**

```html
<!-- Parallel Coordinates Chart -->
<div class="card chart-card">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
    <div>
      <h2 style="font-size:16px;font-weight:600;color:var(--color-text-primary);">
        Coordenadas Paralelas — Parámetros de Suelo
      </h2>
      <p style="font-size:12px;color:var(--color-text-muted);">
        {{ displayDateFrom() }} → {{ displayDateTo() }}
      </p>
    </div>
  </div>

  <div class="chart-wrapper pc-container" role="img"
       aria-label="Gráfico de coordenadas paralelas con 4 parámetros de suelo">
    <svg viewBox="0 0 700 300" width="100%" style="overflow:visible;">
      <!-- Axis lines + labels -->
      @for (param of PC_PARAMS; track param.key; let i = $index) {
        <line [attr.x1]="pcAxisX(i)" [attr.y1]="PC_MARGIN.top"
              [attr.x2]="pcAxisX(i)" [attr.y2]="300 - PC_MARGIN.bottom"
              class="pc-axis-line"/>
        <!-- Label -->
        <text [attr.x]="pcAxisX(i)" [attr.y]="PC_MARGIN.top - 24"
              text-anchor="middle" class="pc-axis-label">{{ param.label }}</text>
        <!-- Unit -->
        <text [attr.x]="pcAxisX(i)" [attr.y]="PC_MARGIN.top - 10"
              text-anchor="middle" class="pc-axis-unit">{{ param.unit }}</text>
        <!-- Min tick -->
        <text [attr.x]="pcAxisX(i) - 8" [attr.y]="300 - PC_MARGIN.bottom + 4"
              text-anchor="end" class="pc-tick-label">{{ param.min }}</text>
        <!-- Max tick -->
        <text [attr.x]="pcAxisX(i) - 8" [attr.y]="PC_MARGIN.top + 4"
              text-anchor="end" class="pc-tick-label">{{ param.max }}</text>
      }

      <!-- Sample lines -->
      @for (s of pcSamples; track s.feature.id) {
        @if (s.visible) {
          <path [attr.d]="pcBuildPath(s.feature)"
                class="pc-line"
                [attr.data-id]="s.feature.id"
                [style.stroke]="s.color"
                [style.opacity]="pcLineOpacity(s.feature.id)"
                [style.stroke-width.px]="pcLineWidth(s.feature.id)"
                (mouseenter)="pcOnLineEnter(s.feature.id)"
                (mouseleave)="pcOnLineLeave()"/>
        }
      }
    </svg>
  </div>

  <!-- Legend -->
  <div class="pc-legend">
    @for (s of pcSamples; track s.feature.id) {
      <button class="pc-legend-item"
              [class.pc-inactive]="!s.visible"
              (click)="pcToggleSample(s.feature.id)">
        <span class="pc-legend-swatch" [style.background]="s.color"></span>
        #{{ s.feature.id }} — {{ s.feature.properties.id_seccion?.properties?.tipo_de_tierra }}
        H{{ s.feature.properties.id_seccion?.properties?.numero_de_hoyo }}
      </button>
    }
  </div>
</div>
```

**Update data table** to show all 4 columns instead of single component:

```html
<thead>
  <tr>
    <th scope="col">ID</th>
    <th scope="col">Fecha</th>
    <th scope="col">Sector</th>
    <th scope="col">Zona</th>
    <th scope="col">Humedad</th>
    <th scope="col">Temp.</th>
    <th scope="col">Salinidad</th>
    <th scope="col">Conduct.</th>
  </tr>
</thead>
<tbody>
  @for (row of reportRows; track row.id) {
    <tr>
      <td class="mono">#{{ row.id }}</td>
      <td>{{ row.date }}</td>
      <td>{{ row.sector }}</td>
      <td>{{ row.point }}</td>
      <td><span class="mono">{{ row.humedad != null ? row.humedad.toFixed(1) : '—' }}</span></td>
      <td><span class="mono">{{ row.temperatura != null ? row.temperatura.toFixed(1) : '—' }}</span></td>
      <td><span class="mono">{{ row.salinidad != null ? row.salinidad.toFixed(2) : '—' }}</span></td>
      <td><span class="mono">{{ row.conductividad != null ? row.conductividad.toFixed(1) : '—' }}</span></td>
    </tr>
  }
</tbody>
```

---

### Reports Component — CSS

#### [MODIFY] [reports.component.css](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.css)

**Remove:**
- `.chart-line` and `.chart-point` rules (old line-chart animation classes)

**Add** parallel-coordinates styles (consistent with the FairGreen design system tokens):

```css
/* ── Parallel Coordinates ─────────────────────────────── */
.pc-container {
  width: 100%;
  min-height: 300px;
  position: relative;
}

.pc-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.65;
  transition: opacity 0.2s ease, stroke-width 0.2s ease;
  cursor: pointer;
}
.pc-line:hover { opacity: 1; stroke-width: 3; }

.pc-axis-line {
  stroke: var(--color-border);
  stroke-width: 1;
}
.pc-axis-label {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-body);
  fill: var(--color-text-primary);
}
.pc-axis-unit {
  font-size: 10px;
  font-family: var(--font-mono);
  fill: var(--color-text-muted);
}
.pc-tick-label {
  font-size: 9px;
  font-family: var(--font-mono);
  fill: var(--color-text-muted);
  text-anchor: end;
}

/* Legend */
.pc-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.pc-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: var(--font-body);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  cursor: pointer;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transition: opacity var(--transition-fast);
}
.pc-legend-item:hover {
  background: var(--color-surface-alt);
}
.pc-legend-item.pc-inactive {
  opacity: 0.35;
}
.pc-legend-swatch {
  width: 12px;
  height: 3px;
  border-radius: 2px;
  flex-shrink: 0;
}
```

---

### Data Service — No Changes

The existing [DataService.getMuestras()](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/services/data.service.ts#L171-L184) already returns `MuestraFeature[]` with all four parameters (`humedad`, `salinidad`, `conductividad`, `temperatura`) nested in `properties`. **No backend or service changes needed.** The data mapping is:

| Plan's `muestras.json` field | Actual Backend field via `MuestraProperties` |
|-----|------|
| `hum` | `properties.humedad` |
| `sal` | `properties.salinidad` |
| `cond` | `properties.conductividad` |
| `temp` | `properties.temperatura` |
| `id` | `feature.id` |
| `name` | derived from `properties.id_seccion.properties.tipo_de_tierra` + `numero_de_hoyo` |

The normalization ranges in `PC_PARAMS` are defined inline rather than coming from a JSON file — they're constants matching the project's known parameter ranges.

---

### Export Logic — Minor Adjustments

#### [MODIFY] [reports.component.ts](file:///c:/Users/henri/OneDrive/Documentos/GitHub/Fairgreen/frontend/src/app/pages/reports/reports.component.ts)

- `_processExportData()` stays largely the same — it already handles the `component === 'Todos'` case with all 4 columns.
- Remove the line-chart data preparation from `_processExportData()` (the `exportRawData`, `exportXLabels`, bucket logic).
- Keep the PDF/Excel table generation as-is since it doesn't depend on the line chart.

---

## Summary of What Gets Removed

| Removed Item | Reason |
|---|---|
| `rawData`, `xLabels`, `chartPoints`, `linePath`, `areaPath` | Line chart replaced by parallel coords |
| `yAxisValues`, `yAxisMax`, `yFactor` | Per-component Y axis config no longer needed |
| `avgGreen`, `avgFairway`, `barHeight()` | Green vs Fairway bar comparison removed |
| `appliedComponent` signal | Chart now shows all components |
| `filters.component` | No single-component filter for the chart |
| Export line-chart data (`exportRawData`, `exportXLabels`, etc.) | No line chart SVG to render in exports |
| Time-bucketing logic in `_processData()` | Parallel coords shows individual samples, not time aggregates |

## Verification Plan

### Manual Verification
- Apply filters (date range, sector, zona) and verify that all returned samples appear as individual Bézier curves across the 4 vertical axes
- Hover over a line → only that line stays at full opacity, all others dim
- Click legend items → toggle sample visibility
- Verify responsive behavior on mobile (the SVG `viewBox` scales naturally)
- Test the export modal — PDF and Excel should still generate with correct data tables
- Check that the `#chartSvg` ViewChild reference is removed cleanly (it was used for html2canvas export of the old chart, which is no longer embedded in PDF)
