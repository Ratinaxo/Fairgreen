import { Component, OnInit } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';

interface KpiCard {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: 'optimo' | 'atencion' | 'critico';
  progress: number;
  sync: string;
  icon: string;
}

interface Sector {
  id: number;
  label: string;
  x: number;
  y: number;
  status: 'optimo' | 'atencion' | 'critico';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, NgStyle],
  template: `
    <div class="dashboard">
      <!-- Page header -->
      <div class="page-header d-flex align-center justify-between">
        <div>
          <h1 style="font-family: var(--font-display); font-size: 24px;">Panel de Control</h1>
          <p class="text-muted" style="font-size: 13px; margin-top: 4px;">Monitoreo general del campo · Actualizado hace 1h</p>
        </div>
        <div style="font-size: 12px; color: var(--color-text-muted);">
          <span style="display:inline-flex;align-items:center;gap:6px;">
            <span style="width:8px;height:8px;background:#22C55E;border-radius:50%;display:inline-block;"></span>
            Sistema activo
          </span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        @for (card of kpiCards; track card.id; let i = $index) {
          <div
            class="kpi-card card"
            [style.animation-delay]="(i * 60) + 'ms'"
            style="animation: fadeSlideUp 300ms ease both; padding: 16px 20px;"
            [attr.aria-label]="card.label + ': ' + card.value + card.unit"
          >
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <span class="badge" [ngClass]="'badge-' + card.status">
                {{ statusLabel[card.status] }}
              </span>
              <button style="background:none;border:none;cursor:pointer;color:var(--color-text-muted);padding:0;" [attr.aria-label]="'Alerta de ' + card.label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
              </button>
            </div>

            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span aria-hidden="true" [innerHTML]="card.icon" style="color:var(--color-text-muted);"></span>
              <span style="font-size:13px;font-weight:500;color:var(--color-text-secondary);">{{ card.label }}</span>
            </div>

            <div style="font-family:var(--font-mono);font-size:28px;font-weight:600;color:var(--color-text-primary);line-height:1;">
              {{ card.value }}<span style="font-size:14px;font-weight:400;margin-left:4px;color:var(--color-text-muted);">{{ card.unit }}</span>
            </div>

            <div style="font-size:11px;color:var(--color-text-muted);margin:6px 0 10px;">Nivel promedio</div>

            <div class="progress-bar">
              <div
                class="progress-fill"
                [ngClass]="progressClass(card.progress)"
                [ngStyle]="{width: card.progress + '%'}"
                [attr.aria-valuenow]="card.progress"
                aria-valuemin="0"
                aria-valuemax="100"
                role="progressbar"
              ></div>
            </div>

            <div style="font-size:11px;color:var(--color-text-muted);margin-top:8px;">
              Última sincronización: {{ card.sync }}
            </div>
          </div>
        }
      </div>

      <!-- Map section -->
      <div class="card map-card" style="margin-top: 20px; padding: 20px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:11px;letter-spacing:0.1em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:4px;">Vista general del campo</div>
          <div style="font-size:15px;font-weight:600;color:var(--color-text-primary);">Club de Golf Las Palmas</div>
        </div>

        <div class="map-container" role="img" aria-label="Mapa del campo de golf con sectores de monitoreo">
          <!-- Golf map SVG -->
          <svg viewBox="0 0 800 380" width="100%" style="border-radius: var(--radius-md);">
            <!-- Background: sky -->
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#87CEEB"/>
                <stop offset="100%" stop-color="#B0E2FF"/>
              </linearGradient>
              <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3A7D44"/>
                <stop offset="100%" stop-color="#2D5A32"/>
              </linearGradient>
              <linearGradient id="fairwayGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#4A8C52"/>
                <stop offset="50%" stop-color="#3D7A45"/>
                <stop offset="100%" stop-color="#4A8C52"/>
              </linearGradient>
            </defs>

            <!-- Background grass -->
            <rect width="800" height="380" fill="url(#grassGrad)"/>

            <!-- Rough areas (darker) -->
            <ellipse cx="150" cy="120" rx="140" ry="90" fill="rgba(30,60,35,0.5)"/>
            <ellipse cx="650" cy="250" rx="160" ry="100" fill="rgba(30,60,35,0.5)"/>
            <ellipse cx="400" cy="330" rx="200" ry="60" fill="rgba(30,60,35,0.4)"/>

            <!-- Fairways -->
            <path d="M120,80 Q200,110 250,180 Q300,240 380,280 Q460,310 560,290 Q640,270 680,240" stroke="#4CAF7D" stroke-width="70" stroke-linecap="round" fill="none" opacity="0.6"/>

            <!-- Greens (circles) -->
            <circle cx="680" cy="240" r="45" fill="#5DBB6B" stroke="#4CAF7D" stroke-width="2"/>
            <circle cx="120" cy="80" r="35" fill="#5DBB6B" stroke="#4CAF7D" stroke-width="2"/>
            <circle cx="400" cy="190" r="38" fill="#5DBB6B" stroke="#4CAF7D" stroke-width="2"/>

            <!-- Sand bunkers -->
            <ellipse cx="300" cy="215" rx="22" ry="12" fill="#D4C57A" opacity="0.8"/>
            <ellipse cx="560" cy="260" rx="18" ry="10" fill="#D4C57A" opacity="0.8"/>
            <ellipse cx="460" cy="170" rx="15" ry="9" fill="#D4C57A" opacity="0.7"/>

            <!-- Water hazard -->
            <ellipse cx="500" cy="310" rx="55" ry="22" fill="#5B9BD5" opacity="0.7"/>
            <ellipse cx="500" cy="310" rx="50" ry="18" fill="#4A86C4" opacity="0.5"/>

            <!-- Trees (dots cluster) -->
            <g fill="#2D5A32" opacity="0.8">
              <circle cx="50" cy="180" r="12"/><circle cx="70" cy="165" r="10"/>
              <circle cx="60" cy="200" r="9"/><circle cx="750" cy="100" r="13"/>
              <circle cx="765" cy="120" r="10"/><circle cx="735" cy="110" r="11"/>
              <circle cx="200" cy="340" r="12"/><circle cx="220" cy="355" r="10"/>
            </g>

            <!-- Path/roads -->
            <path d="M30,380 Q100,350 180,310 Q260,270 320,250" stroke="#B8A88A" stroke-width="8" fill="none" opacity="0.5" stroke-dasharray="0"/>

            <!-- Status zone overlays -->
            @for (sector of sectors; track sector.id) {
              <circle
                [attr.cx]="sector.x"
                [attr.cy]="sector.y"
                r="24"
                [attr.fill]="zoneColor(sector.status)"
                [attr.stroke]="zoneBorder(sector.status)"
                stroke-width="2"
              />
              <text
                [attr.x]="sector.x"
                [attr.y]="sector.y + 5"
                text-anchor="middle"
                fill="white"
                font-size="12"
                font-weight="700"
                font-family="DM Sans, sans-serif"
              >{{ sector.id }}</text>
            }

            <!-- Flag pins -->
            <line x1="680" y1="240" x2="680" y2="205" stroke="white" stroke-width="1.5" opacity="0.9"/>
            <polygon points="680,205 695,212 680,219" fill="#EF4444" opacity="0.9"/>

            <line x1="120" y1="80" x2="120" y2="50" stroke="white" stroke-width="1.5" opacity="0.9"/>
            <polygon points="120,50 135,57 120,64" fill="white" opacity="0.9"/>
          </svg>

          <!-- Legend -->
          <div class="map-legend" role="note" aria-label="Leyenda del mapa">
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--color-accent);"></span>
              ÓPTIMO
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--color-warning);"></span>
              ATENCIÓN
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: var(--color-danger);"></span>
              CRÍTICO
            </span>
          </div>
        </div>
      </div>

      <!-- Report card -->
      <div class="card report-card">
        <div class="report-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" x2="8" y1="13" y2="13"/>
            <line x1="16" x2="8" y1="17" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div class="report-info">
          <div class="report-title">Reporte general semanal</div>
          <div class="report-meta">Resumen general · Desde: 19/05/2025 · Hasta: 26/05/2025</div>
        </div>
        <div class="report-actions">
          <button class="btn-outline" id="download-report-btn" (click)="showDownloadModal = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Descargar
          </button>
          <button class="btn-primary" id="view-report-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver
          </button>
        </div>
      </div>

      <!-- Modal de descarga -->
      @if (showDownloadModal) {
        <div class="modal-overlay" (click)="showDownloadModal = false" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div style="width:56px;height:56px;background:#E6F4EC;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1C3D2E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 id="modal-title" style="font-family:var(--font-display);font-size:18px;margin-bottom:8px;">¡Descarga exitosa!</h3>
            <p style="font-size:13px;color:var(--color-text-muted);margin-bottom:20px;">Se ha descargado el archivo <strong>reporte_semanal_2025.pdf</strong></p>
            <button class="btn-primary w-100" id="modal-back-btn" (click)="showDownloadModal = false">Volver</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { animation: fadeSlideUp 250ms ease; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 4px;
    }

    .kpi-card { transition: box-shadow var(--transition-fast); }
    .kpi-card:hover { box-shadow: var(--shadow-panel); }

    .map-card { }
    .map-container { position: relative; }

    .map-legend {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255,255,255,0.92);
      border-radius: var(--radius-md);
      padding: 6px 16px;
      display: flex;
      gap: 20px;
      backdrop-filter: blur(4px);
      box-shadow: var(--shadow-card);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--color-text-secondary);
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .report-card {
      margin-top: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .report-icon {
      width: 48px;
      height: 48px;
      background: var(--color-surface-alt);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-primary);
    }

    .report-info { flex: 1; }
    .report-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
    .report-meta { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }

    .report-actions { display: flex; gap: 10px; }

    .w-100 { width: 100%; justify-content: center; }

    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  showDownloadModal = false;

  statusLabel: Record<string, string> = {
    optimo: 'ÓPTIMO',
    atencion: 'ATENCIÓN',
    critico: 'CRÍTICO',
  };

  kpiCards: KpiCard[] = [
    {
      id: 'humidity',
      label: 'Humedad general',
      value: '3.8',
      unit: '/ 5',
      status: 'optimo',
      progress: 76,
      sync: '1 hora',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`
    },
    {
      id: 'temp',
      label: 'Temperatura general',
      value: '24.3',
      unit: '°C',
      status: 'atencion',
      progress: 58,
      sync: '1 hora',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`
    },
    {
      id: 'salinity',
      label: 'Salinidad general',
      value: '0.8',
      unit: 'dS/m',
      status: 'optimo',
      progress: 82,
      sync: '2 horas',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`
    },
    {
      id: 'conductivity',
      label: 'Conductividad general',
      value: '2.1',
      unit: 'dS/m',
      status: 'critico',
      progress: 22,
      sync: '3 horas',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
    },
  ];

  sectors: Sector[] = [
    { id: 1, label: '1', x: 120, y: 80, status: 'optimo' },
    { id: 2, label: '2', x: 250, y: 185, status: 'atencion' },
    { id: 3, label: '3', x: 400, y: 190, status: 'critico' },
    { id: 4, label: '4', x: 540, y: 250, status: 'atencion' },
    { id: 5, label: '5', x: 680, y: 240, status: 'optimo' },
  ];

  ngOnInit() {}

  progressClass(progress: number): string {
    if (progress >= 67) return 'fill-optimal';
    if (progress >= 34) return 'fill-warning';
    return 'fill-danger';
  }

  zoneColor(status: string): string {
    if (status === 'optimo') return 'rgba(76,175,125,0.7)';
    if (status === 'atencion') return 'rgba(245,158,11,0.7)';
    return 'rgba(239,68,68,0.75)';
  }

  zoneBorder(status: string): string {
    if (status === 'optimo') return '#4CAF7D';
    if (status === 'atencion') return '#F59E0B';
    return '#EF4444';
  }
}
