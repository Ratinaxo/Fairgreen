import { Component, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { DataService, MuestraFeature } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

interface ReportRow {
  date: string;
  sector: string;
  point: string;
  component: string;
  level: number;
  status: 'optimo' | 'atencion' | 'critico';
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="reports-page">
      <!-- Header -->
      <div class="d-flex align-center justify-between" style="margin-bottom:20px;">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;color:var(--color-text-primary);">Análisis histórico</h1>
          <p style="font-size:13px;color:var(--color-text-muted);margin-top:2px;">Seleccione las métricas a analizar</p>
        </div>
        @if (filtersApplied()) {
          <div style="display:flex;gap:10px;" aria-label="Exportar reporte">
            <button class="btn-outline" id="export-pdf-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Exportar PDF
            </button>
            <button class="btn-outline" id="export-excel-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="3" x2="21" y1="15" y2="15"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>
              Exportar Excel
            </button>
          </div>
        }
      </div>

      <!-- Filters -->
      <div class="card filters-card">
        <div class="filters-row">
          <div class="filter-item">
            <label for="date-from" class="filter-label">Desde</label>
            <input id="date-from" type="date" class="form-control" [(ngModel)]="filters.dateFrom" style="width:150px;"/>
          </div>
          <div class="filter-item">
            <label for="date-to" class="filter-label">Hasta</label>
            <input id="date-to" type="date" class="form-control" [(ngModel)]="filters.dateTo" style="width:150px;"/>
          </div>
          <div class="filter-item">
            <label for="rep-sector" class="filter-label">Sector</label>
            <div class="select-wrapper" style="width:110px;">
              <select id="rep-sector" class="form-control" [(ngModel)]="filters.sector" aria-label="Sector">
                <option value="">Todos</option>
                <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
              </select>
            </div>
          </div>
          <div class="filter-item">
            <label for="rep-zona" class="filter-label">Zona</label>
            <div class="select-wrapper" style="width:130px;">
              <select id="rep-zona" class="form-control" [(ngModel)]="filters.zona" aria-label="Zona">
                <option value="">Todas</option>
                <option>Green</option><option>Fairway</option><option>Rough</option><option>Tee</option>
              </select>
            </div>
          </div>
          <div class="filter-item">
            <label for="rep-component" class="filter-label">Componente</label>
            <div class="select-wrapper" style="width:170px;">
              <select id="rep-component" class="form-control" [(ngModel)]="filters.component" aria-label="Componente">
                <option value="">Todos</option>
                <option>Humedad</option>
                <option>Temperatura</option>
                <option>Salinidad</option>
                <option>Conductividad</option>
              </select>
            </div>
          </div>
          <button class="btn-primary" id="apply-report-btn" (click)="applyFilters()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Aplicar filtros
          </button>
        </div>
      </div>

      <!-- Content area -->
      @if (filtersApplied()) {
        <!-- Chart card -->
        <div class="card chart-card">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
            <div>
              <h2 style="font-size:16px;font-weight:600;color:var(--color-text-primary);">
                Análisis Temporal de {{ filters.component || 'Humedad' }}
              </h2>
              <p style="font-size:12px;color:var(--color-text-muted);">
                {{ displayDateFrom() }} → {{ displayDateTo() }}
              </p>
            </div>
            <button style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);" aria-label="Expandir gráfico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </button>
          </div>

          <!-- SVG Area Chart -->
          <div class="chart-wrapper" role="img" [attr.aria-label]="'Gráfico de área de nivel de ' + (filters.component || 'humedad')">
            <svg #chartSvg viewBox="0 0 700 220" width="100%" style="overflow:visible;">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(28,61,46,0.18)"/>
                  <stop offset="100%" stop-color="rgba(28,61,46,0)"/>
                </linearGradient>
                <clipPath id="chartClip">
                  <rect width="620" height="200" x="60" y="10"/>
                </clipPath>
              </defs>

              <!-- Y axis labels -->
              @for (val of yAxisValues; track val) {
                <text [attr.x]="52" [attr.y]="10 + (yAxisMax - val) * yFactor + 4" text-anchor="end" font-size="10" font-family="JetBrains Mono" fill="#8FA895">{{ val }}</text>
                <line [attr.x1]="60" [attr.y1]="10 + (yAxisMax - val) * yFactor" [attr.x2]="680" [attr.y2]="10 + (yAxisMax - val) * yFactor" stroke="#DDE5DF" stroke-width="1"/>
              }

              <!-- Reference threshold line -->
              <line x1="60" [attr.y1]="10 + (yAxisMax - yAxisMinThreshold) * yFactor" x2="680" [attr.y2]="10 + (yAxisMax - yAxisMinThreshold) * yFactor" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="4,4"/>
              <text x="684" [attr.y]="10 + (yAxisMax - yAxisMinThreshold) * yFactor + 4" font-size="9" fill="#F59E0B" font-family="DM Sans">Mín</text>

              <!-- Area fill -->
              <path
                [attr.d]="areaPath"
                fill="url(#areaGrad)"
                clip-path="url(#chartClip)"
              />

              <!-- Line -->
              <path
                [attr.d]="linePath"
                fill="none"
                stroke="#1C3D2E"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                clip-path="url(#chartClip)"
                class="chart-line"
              />

              <!-- Data points -->
              @for (pt of chartPoints; track pt.x) {
                <circle
                  [attr.cx]="pt.x"
                  [attr.cy]="pt.y"
                  r="4"
                  fill="white"
                  stroke="#1C3D2E"
                  stroke-width="2"
                  class="chart-point"
                />
              }

              <!-- X axis labels -->
              @for (label of xLabels; track label.x) {
                <text [attr.x]="label.x" y="210" text-anchor="middle" font-size="10" font-family="DM Sans" fill="#8FA895">{{ label.text }}</text>
              }
            </svg>
          </div>
        </div>

        <!-- Comparative Chart Card (Green vs Fairway) -->
        <div class="card chart-card" style="margin-top:16px;">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;">
            <div>
              <h2 style="font-size:16px;font-weight:600;color:var(--color-text-primary);">
                Promedio de {{ filters.component || 'Humedad' }} por Zona
              </h2>
              <p style="font-size:12px;color:var(--color-text-muted);">
                Comparativa: Green vs Fairway
              </p>
            </div>
          </div>
          
          <div style="display:flex;align-items:flex-end;gap:40px;height:160px;padding:20px 40px 0;">
            <!-- Bar 1: Green -->
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">
              <div style="font-size:13px;font-family:var(--font-mono);font-weight:600;margin-bottom:8px;color:var(--color-text-primary);">
                {{ avgGreen().toFixed(2) }}
              </div>
              <div [style.height]="barHeight(avgGreen()) + '%'" style="width:60px;background:#4CAF7D;border-radius:6px 6px 0 0;transition:height 0.8s ease;"></div>
              <div style="margin-top:12px;font-size:12px;font-weight:500;color:var(--color-text-secondary);">Green</div>
            </div>
            <!-- Bar 2: Fairway -->
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;">
              <div style="font-size:13px;font-family:var(--font-mono);font-weight:600;margin-bottom:8px;color:var(--color-text-primary);">
                {{ avgFairway().toFixed(2) }}
              </div>
              <div [style.height]="barHeight(avgFairway()) + '%'" style="width:60px;background:#F59E0B;border-radius:6px 6px 0 0;transition:height 0.8s ease;"></div>
              <div style="margin-top:12px;font-size:12px;font-weight:500;color:var(--color-text-secondary);">Fairway</div>
            </div>
          </div>
        </div>

        <!-- Data table -->
        <div class="card" style="margin-top:16px;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--color-border);">
            <span style="font-size:14px;font-weight:600;">Datos</span>
            <span style="font-size:12px;color:var(--color-text-muted);">Mostrando resultados más recientes</span>
          </div>
          <div style="overflow-x:auto;">
            <table class="data-table" aria-label="Datos del análisis histórico">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Sector</th>
                  <th scope="col">Punto</th>
                  <th scope="col">Componente</th>
                  <th scope="col">Nivel</th>
                </tr>
              </thead>
              <tbody>
                @for (row of reportRows; track row.date + row.point) {
                  <tr>
                    <td style="font-size:13px;font-weight:500;">{{ row.date }}</td>
                    <td>{{ row.sector }}</td>
                    <td>{{ row.point }}</td>
                    <td>{{ row.component }}</td>
                    <td>
                      <span
                        class="badge"
                        [ngClass]="'badge-' + row.status"
                        style="font-family:var(--font-mono);"
                      >{{ row.level.toFixed(1) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <!-- Empty state -->
        <div class="empty-state" role="status" aria-label="Sin filtros aplicados">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
          </div>
          <h3 style="font-size:16px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px;">Sin filtros aplicados</h3>
          <p style="font-size:13px;color:var(--color-text-muted);">Configura los filtros y presiona "Aplicar" para visualizar el análisis</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-page { animation: fadeSlideUp 250ms ease; }

    .filters-card { padding: 16px 20px; margin-bottom: 16px; }

    .filters-row {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-item { display: flex; flex-direction: column; gap: 4px; }

    .filter-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .chart-card { padding: 20px; margin-top: 0; }

    .chart-wrapper { width: 100%; }

    .chart-line {
      stroke-dasharray: 1000;
      stroke-dashoffset: 0;
      animation: drawLine 1.2s ease forwards;
    }

    .chart-point { animation: fadeIn 0.8s ease; }

    .empty-state {
      margin-top: 24px;
      background: var(--color-bg);
      border-radius: var(--radius-lg);
      padding: 60px 40px;
      text-align: center;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      background: var(--color-surface);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-muted);
      margin-bottom: 16px;
      box-shadow: var(--shadow-card);
    }
  `]
})
export class ReportsComponent {
  private dataService = inject(DataService);

  @ViewChild('chartSvg') chartSvgRef!: ElementRef;

  filtersApplied = signal(false);

  filters = {
    dateFrom: '',
    dateTo: '',
    sector: '',
    zona: '',
    component: 'Humedad',
  };

  // Chart data
  rawData = [1.8, 2.3, 3.1, 2.8, 3.5, 4.1, 3.8, 4.3, 3.9, 4.5, 4.2, 3.7];
  xLabels = [
    { x: 60, text: 'Jun' }, { x: 115, text: 'Jul' }, { x: 170, text: 'Ago' },
    { x: 225, text: 'Sep' }, { x: 280, text: 'Oct' }, { x: 335, text: 'Nov' },
    { x: 390, text: 'Dic' }, { x: 445, text: 'Ene' }, { x: 500, text: 'Feb' },
    { x: 555, text: 'Mar' }, { x: 610, text: 'Abr' }, { x: 665, text: 'May' },
  ];

  // Averages for bar chart
  avgGreen = signal(0);
  avgFairway = signal(0);

  // Chart properties dinámicos
  yAxisValues: number[] = [5, 4, 3, 2, 1, 0];
  yAxisMax = 5;
  yAxisMinThreshold = 2;
  yFactor = 38; // (200px height / 5 units)

  get chartPoints() {
    return this.rawData.map((v, i) => ({
      x: this.xLabels[i].x,
      y: 10 + (this.yAxisMax - v) * this.yFactor,
    }));
  }

  get linePath(): string {
    const pts = this.chartPoints;
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${cx} ${pts[i - 1].y} ${cx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }

  get areaPath(): string {
    const pts = this.chartPoints;
    if (!pts.length) return '';
    let d = `M ${pts[0].x} 200`;
    d += ` L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${cx} ${pts[i - 1].y} ${cx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
    }
    d += ` L ${pts[pts.length - 1].x} 200 Z`;
    return d;
  }

  reportRows: ReportRow[] = [];

  displayDateFrom(): string {
    if (this.filters.dateFrom) {
      return new Date(this.filters.dateFrom).toLocaleDateString('es-CL');
    }
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toLocaleDateString('es-CL');
  }

  displayDateTo(): string {
    if (this.filters.dateTo) {
      return new Date(this.filters.dateTo).toLocaleDateString('es-CL');
    }
    return new Date().toLocaleDateString('es-CL');
  }

  barHeight(value: number): number {
    // Escalar la altura de la barra relativa al maximo (yAxisMax)
    return Math.min(100, Math.max(0, (value / this.yAxisMax) * 100));
  }

  applyFilters() {
    this.dataService.getMuestras(1, 500).subscribe({
      next: (geoJson) => {
        let features = geoJson.features ?? [];
        
        // 1. Filtrar por fecha
        if (this.filters.dateFrom) {
          const from = new Date(this.filters.dateFrom);
          features = features.filter(f => new Date(f.properties.fecha_hora_captura) >= from);
        }
        if (this.filters.dateTo) {
          const to = new Date(this.filters.dateTo);
          to.setHours(23, 59, 59, 999);
          features = features.filter(f => new Date(f.properties.fecha_hora_captura) <= to);
        }

        // 2. Filtrar por sector
        if (this.filters.sector) {
          features = features.filter(f => f.properties.id_seccion?.properties?.numero_de_hoyo === parseInt(this.filters.sector));
        }

        // 3. Filtrar por zona
        if (this.filters.zona) {
          features = features.filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra.toLowerCase() === this.filters.zona.toLowerCase());
        }

        this._processData(features);
        this.filtersApplied.set(true);
      }
    });
  }

  private _processData(features: MuestraFeature[]) {
    // Definir configuración del gráfico según componente
    let propKey: 'humedad' | 'temperatura' | 'salinidad' | 'conductividad' = 'humedad';
    if (this.filters.component === 'Humedad') { propKey = 'humedad'; this.yAxisMax = 5; this.yAxisMinThreshold = 2; this.yAxisValues = [5,4,3,2,1,0]; }
    else if (this.filters.component === 'Temperatura') { propKey = 'temperatura'; this.yAxisMax = 40; this.yAxisMinThreshold = 15; this.yAxisValues = [40,32,24,16,8,0]; }
    else if (this.filters.component === 'Salinidad') { propKey = 'salinidad'; this.yAxisMax = 5; this.yAxisMinThreshold = 1.5; this.yAxisValues = [5,4,3,2,1,0]; }
    else if (this.filters.component === 'Conductividad') { propKey = 'conductividad'; this.yAxisMax = 6; this.yAxisMinThreshold = 2; this.yAxisValues = [6,5,4,3,2,1,0]; }
    
    this.yFactor = 200 / this.yAxisMax;

    // Actualizar tabla
    this.reportRows = features.map(f => {
      const p = f.properties;
      const val = p[propKey];
      let status: 'optimo' | 'atencion' | 'critico' = 'optimo';
      if (propKey === 'conductividad' || propKey === 'salinidad') {
        if (val > (this.yAxisMax * 0.6)) status = 'critico';
        else if (val > (this.yAxisMax * 0.4)) status = 'atencion';
      } else {
        if (val < (this.yAxisMax * 0.2)) status = 'critico';
        else if (val < (this.yAxisMax * 0.4)) status = 'atencion';
      }

      return {
        date: new Date(p.fecha_hora_captura).toLocaleDateString('es-CL'),
        sector: `Sector ${p.id_seccion?.properties?.numero_de_hoyo ?? 0}`,
        point: `${p.id_seccion?.properties?.tipo_de_tierra ?? 'Z'}`,
        component: this.filters.component,
        level: val,
        status: status
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generar 12 puntos equitativos para el gráfico (mock simple agrupado por tiempo)
    if (features.length === 0) {
      this.rawData = Array(12).fill(0);
      return;
    }
    
    // Ordenamos cronológicamente
    features.sort((a, b) => new Date(a.properties.fecha_hora_captura).getTime() - new Date(b.properties.fecha_hora_captura).getTime());
    
    // Dividir en 12 buckets y sacar promedio
    const buckets = Array.from({ length: 12 }, () => [] as number[]);
    const bucketSize = Math.max(1, Math.floor(features.length / 12));
    
    for (let i = 0; i < features.length; i++) {
      const bucketIdx = Math.min(11, Math.floor(i / bucketSize));
      buckets[bucketIdx].push(features[i].properties[propKey]);
    }
    
    this.rawData = buckets.map(b => b.length ? (b.reduce((x, y) => x + y, 0) / b.length) : 0);

    // Calcular promedios para Green vs Fairway
    const greenFeatures = features.filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'GREEN');
    const fairwayFeatures = features.filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'FAIRWAY');

    const gAvg = greenFeatures.length > 0 
      ? greenFeatures.reduce((acc, f) => acc + f.properties[propKey], 0) / greenFeatures.length 
      : 0;
    const fAvg = fairwayFeatures.length > 0 
      ? fairwayFeatures.reduce((acc, f) => acc + f.properties[propKey], 0) / fairwayFeatures.length 
      : 0;

    this.avgGreen.set(gAvg);
    this.avgFairway.set(fAvg);
  }
}
