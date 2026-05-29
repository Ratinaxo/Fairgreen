import { Component, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
                Nivel de {{ filters.component || 'Humedad' }}
              </h2>
              <p style="font-size:12px;color:var(--color-text-muted);">
                {{ filters.dateFrom || '01/01/2025' }} → {{ filters.dateTo || '26/05/2025' }}
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
              @for (val of [5,4,3,2,1,0]; track val) {
                <text [attr.x]="52" [attr.y]="10 + (5 - val) * 38 + 4" text-anchor="end" font-size="10" font-family="JetBrains Mono" fill="#8FA895">{{ val }}</text>
                <line [attr.x1]="60" [attr.y1]="10 + (5 - val) * 38" [attr.x2]="680" [attr.y2]="10 + (5 - val) * 38" stroke="#DDE5DF" stroke-width="1"/>
              }

              <!-- Reference threshold line -->
              <line x1="60" y1="125" x2="680" y2="125" stroke="#F59E0B" stroke-width="1.5" stroke-dasharray="4,4"/>
              <text x="684" y="129" font-size="9" fill="#F59E0B" font-family="DM Sans">Mín</text>

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
export class ReportsComponent implements AfterViewInit {
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

  get chartPoints() {
    return this.rawData.map((v, i) => ({
      x: this.xLabels[i].x,
      y: 10 + (5 - v) * 38,
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

  reportRows: ReportRow[] = [
    { date: '26/05/2025', sector: 'Sector 3', point: 'Green #3', component: 'Humedad', level: 1.5, status: 'critico' },
    { date: '26/05/2025', sector: 'Sector 1', point: 'Green #1', component: 'Humedad', level: 4.2, status: 'optimo' },
    { date: '25/05/2025', sector: 'Sector 4', point: 'Fairway #4', component: 'Humedad', level: 3.1, status: 'atencion' },
    { date: '25/05/2025', sector: 'Sector 2', point: 'Green #2', component: 'Humedad', level: 2.8, status: 'atencion' },
    { date: '24/05/2025', sector: 'Sector 5', point: 'Green #5', component: 'Humedad', level: 4.5, status: 'optimo' },
    { date: '24/05/2025', sector: 'Sector 3', point: 'Rough #3', component: 'Humedad', level: 1.2, status: 'critico' },
    { date: '23/05/2025', sector: 'Sector 1', point: 'Tee #1', component: 'Humedad', level: 3.8, status: 'optimo' },
    { date: '23/05/2025', sector: 'Sector 2', point: 'Fairway #2', component: 'Humedad', level: 2.5, status: 'atencion' },
  ];

  ngAfterViewInit() {}

  applyFilters() {
    this.filtersApplied.set(true);
  }
}
