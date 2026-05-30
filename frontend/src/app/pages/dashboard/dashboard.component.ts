import { Component, OnInit, inject, signal } from '@angular/core';
import { NgClass, NgStyle, DatePipe } from '@angular/common';
import { MapOverviewComponent } from '../../components/map/map-overview.component';
import { MapLegendComponent } from '../../components/map/map-legend.component';
import { DataService, MuestraFeature, SeccionFeature } from '../../services/data.service';

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
  imports: [NgClass, NgStyle, MapOverviewComponent, MapLegendComponent],
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

        <div class="map-container">
          <app-map-overview 
            (sectorClick)="onSectorClick($event)" 
            [muestras]="muestras()" />
          <app-map-legend />
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
  isLoading = signal(true);
  muestras = signal<MuestraFeature[]>([]);

  private dataService = inject(DataService);

  statusLabel: Record<string, string> = {
    optimo: 'ÓPTIMO',
    atencion: 'ATENCIÓN',
    critico: 'CRÍTICO',
  };

  kpiCards: KpiCard[] = [
    {
      id: 'humidity',
      label: 'Humedad general',
      value: '--',
      unit: '/ 5',
      status: 'optimo',
      progress: 0,
      sync: 'Cargando...',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`
    },
    {
      id: 'temp',
      label: 'Temperatura general',
      value: '--',
      unit: '°C',
      status: 'atencion',
      progress: 0,
      sync: 'Cargando...',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`
    },
    {
      id: 'salinity',
      label: 'Salinidad general',
      value: '--',
      unit: 'dS/m',
      status: 'optimo',
      progress: 0,
      sync: 'Cargando...',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`
    },
    {
      id: 'conductivity',
      label: 'Conductividad general',
      value: '--',
      unit: 'dS/m',
      status: 'optimo',
      progress: 0,
      sync: 'Cargando...',
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

  ngOnInit() {
    Promise.all([
      new Promise<SeccionFeature[]>((res) => {
        this.dataService.getSecciones().subscribe({
          next: (geoJson) => res(geoJson.features ?? []),
          error: () => res([])
        });
      }),
      new Promise<MuestraFeature[]>((res) => {
        this.dataService.getMuestras(1, 200).subscribe({
          next: (geoJson) => res(geoJson.features ?? []),
          error: () => res([])
        });
      })
    ]).then(([secciones, muestras]) => {
      if (muestras.length === 0) {
        this.isLoading.set(false);
        return;
      }
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentMuestras = muestras.filter(m => new Date(m.properties.fecha_hora_captura) >= sevenDaysAgo);

      const targetMuestras = recentMuestras.length > 0 ? recentMuestras : muestras;
      this.muestras.set(targetMuestras);

      this._calcularKPIs(targetMuestras); 
      this.isLoading.set(false);
    });
  }

  private _calcularKPIs(features: MuestraFeature[]) {
    const props = features.map(f => f.properties);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const avgHumedad = avg(props.map(p => p.humedad));
    const avgTemp = avg(props.map(p => p.temperatura));
    const avgSalinidad = avg(props.map(p => p.salinidad));
    const avgConduct = avg(props.map(p => p.conductividad));

    const ultima = new Date(props[0].fecha_hora_captura);
    const agoStr = this._tiempoRelativo(ultima);

    // Humedad (escala 1-5, óptimo > 3)
    this.kpiCards[0].value = avgHumedad.toFixed(1);
    this.kpiCards[0].progress = Math.round((avgHumedad / 5) * 100);
    this.kpiCards[0].status = avgHumedad >= 3 ? 'optimo' : avgHumedad >= 2 ? 'atencion' : 'critico';
    this.kpiCards[0].sync = agoStr;

    // Temperatura (15-28°C = normal)
    this.kpiCards[1].value = avgTemp.toFixed(1);
    this.kpiCards[1].progress = Math.round(Math.min((avgTemp / 35) * 100, 100));
    this.kpiCards[1].status = avgTemp <= 28 && avgTemp >= 15 ? 'optimo' : avgTemp <= 32 ? 'atencion' : 'critico';
    this.kpiCards[1].sync = agoStr;

    // Salinidad (< 1.5 = óptimo)
    this.kpiCards[2].value = avgSalinidad.toFixed(2);
    this.kpiCards[2].progress = Math.round(Math.min((1 - avgSalinidad / 3) * 100, 100));
    this.kpiCards[2].status = avgSalinidad < 1.5 ? 'optimo' : avgSalinidad < 2.5 ? 'atencion' : 'critico';
    this.kpiCards[2].sync = agoStr;

    // Conductividad (< 2 = óptimo)
    this.kpiCards[3].value = avgConduct.toFixed(2);
    this.kpiCards[3].progress = Math.round(Math.min((1 - avgConduct / 4) * 100, 100));
    this.kpiCards[3].status = avgConduct < 2 ? 'optimo' : avgConduct < 3.5 ? 'atencion' : 'critico';
    this.kpiCards[3].sync = agoStr;
  }



  private _tiempoRelativo(fecha: Date): string {
    const diffMs = Date.now() - fecha.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return 'hace menos de 1h';
    if (diffH < 24) return `hace ${diffH}h`;
    return `hace ${diffD} días`;
  }

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

  /** Navega a geomap con la zona preseleccionada */
  onSectorClick(zoneId: string): void {
    console.log('[Dashboard] Sector clickeado:', zoneId);
    // Se puede navegar a geomap con query param en el futuro
  }
}
