import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MapGeorefComponent } from '../../components/map/map-georef.component';
import { MapLegendComponent } from '../../components/map/map-legend.component';
import { ZoneProperties } from '../../services/data.service';

interface Zone {
  id: number;
  name: string;
  zoneId: string;
  status: 'activo' | 'inactivo';
  health: 'optimo' | 'atencion' | 'critico';
  humidity: string;
  temperature: string;
  salinity: string;
  conductivity: string;
  lastRecord: string;
  timeline: { time: string; desc: string; status: 'optimo' | 'atencion' | 'critico' }[];
}

@Component({
  selector: 'app-geomap',
  standalone: true,
  imports: [NgClass, RouterLink, MapGeorefComponent, MapLegendComponent],
  template: `
    <div class="geomap-layout">
      <!-- Map area -->
      <div class="map-area">
        <!-- OpenLayers Map -->
        <app-map-georef (zoneSelect)="onZoneSelect($event)" />

        <!-- Map legend -->
        <app-map-legend />
      </div>

      <!-- Right panel -->
      <aside class="geo-panel" [class.panel-visible]="!!selectedZone()" aria-label="Detalles de zona seleccionada">
        @if (selectedZone(); as zone) {
          <!-- Zone header -->
          <div style="margin-bottom: 20px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:6px;">
              Zona Seleccionada
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span class="badge" [ngClass]="'badge-' + zone.health">
                {{ zoneHealthLabel[zone.health] }}
              </span>
            </div>
            <div style="font-family:var(--font-display);font-size:22px;color:var(--color-text-primary);">
              {{ zone.name }}
            </div>
          </div>

          <!-- Maintenance status -->
          <div class="maintenance-card" style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:var(--color-surface);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.75" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--color-text-primary);">Estado en verde</div>
                <div style="font-size:11px;color:var(--color-text-muted);">Suelo · Último registro: {{ zone.lastRecord }}</div>
              </div>
            </div>
          </div>

          <!-- Metrics 2x2 -->
          <div style="margin-bottom:16px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:10px;">Métricas clave promedio</div>
            <div class="metrics-grid">
              <div class="metric-cell">
                <div class="metric-label">Humedad</div>
                <div class="metric-value">{{ zone.humidity }}<span class="metric-unit"> /5</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-optimal" [style.width]="(+zone.humidity / 5 * 100) + '%'"></div></div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Temperatura</div>
                <div class="metric-value">{{ zone.temperature }}<span class="metric-unit">°C</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-warning" style="width:58%;"></div></div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Salinidad</div>
                <div class="metric-value">{{ zone.salinity }}<span class="metric-unit"> dS</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-optimal" style="width:80%;"></div></div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Conductividad</div>
                <div class="metric-value">{{ zone.conductivity }}<span class="metric-unit"> dS</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-danger" style="width:22%;"></div></div>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div style="margin-bottom: 20px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:10px;">Últimos estados registrados</div>
            <div class="timeline">
              @for (entry of zone.timeline; track entry.time) {
                <div class="timeline-item">
                  <div class="timeline-dot status-dot" [ngClass]="'dot-' + (entry.status === 'optimo' ? 'activo' : 'offline')"></div>
                  <div>
                    <div style="font-size:11px;color:var(--color-text-muted);">{{ entry.time }}</div>
                    <div style="font-size:12px;color:var(--color-text-primary);">{{ entry.desc }}</div>
                  </div>
                </div>
              }
            </div>
            <a href="#" style="font-size:12px;color:var(--color-primary-light);font-weight:500;">Reporte total →</a>
          </div>

          <!-- CTA button -->
          <a [routerLink]="'/samples/new'" class="btn-primary w-full" id="register-sample-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
            Registrar Muestra
          </a>
        } @else {
          <div class="empty-panel">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-muted);" aria-hidden="true"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
            <p>Selecciona una zona en el mapa para ver sus detalles</p>
          </div>
        }
      </aside>
    </div>
  `,
  styles: [`
    .geomap-layout {
      display: flex;
      height: calc(100vh - 52px);
      margin: -24px;
      overflow: hidden;
    }

    .map-area {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #1E3D24;
    }

    /* Right panel */
    .geo-panel {
      width: 280px;
      flex-shrink: 0;
      background: white;
      border-left: 1px solid #dde5df;
      padding: 20px;
      overflow-y: auto;
    }

    .maintenance-card {
      background: #f0f4f2;
      border-radius: 8px;
      padding: 12px;
    }

    .timeline { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .timeline-dot {
      margin-top: 4px;
      flex-shrink: 0;
    }

    .w-full {
      width: 100%;
      justify-content: center;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .empty-panel {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      text-align: center;
      color: #8fa895;
      font-size: 13px;
      padding: 40px 20px;
    }

    /* Metrics grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .metric-cell {
      background: #f0f4f2;
      border-radius: 8px;
      padding: 12px;
    }

    .metric-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #8fa895;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .metric-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22px;
      font-weight: 600;
      color: #1a2e20;
      line-height: 1;
    }

    .metric-unit {
      font-size: 11px;
      color: #8fa895;
    }

    .progress-bar {
      height: 4px;
      border-radius: 2px;
      background: #dde5df;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 600ms ease;
    }

    .fill-optimal { background: #4CAF7D; }
    .fill-warning { background: #F59E0B; }
    .fill-danger  { background: #EF4444; }
  `]
})
export class GeomapComponent {
  selectedZone = signal<Zone | null>(null);

  zoneHealthLabel: Record<string, string> = {
    optimo: 'ÓPTIMO',
    atencion: 'ATENCIÓN',
    critico: 'CRÍTICO',
  };

  private zonesData: Record<string, Zone> = {
    'green-1': {
      id: 1, name: 'Green #1', zoneId: 'green-1', status: 'activo', health: 'optimo',
      humidity: '4.2', temperature: '22.1', salinity: '0.6', conductivity: '1.8',
      lastRecord: '2h',
      timeline: [
        { time: 'Hoy, 10:30', desc: 'Registro normal — Parámetros en rango', status: 'optimo' },
        { time: 'Ayer, 16:00', desc: 'Revisión de salinidad — OK', status: 'optimo' },
        { time: 'Hace 2 días', desc: 'Riego programado aplicado', status: 'optimo' },
      ]
    },
    'green-2': {
      id: 2, name: 'Green #2', zoneId: 'green-2', status: 'activo', health: 'atencion',
      humidity: '2.8', temperature: '26.4', salinity: '1.2', conductivity: '2.3',
      lastRecord: '4h',
      timeline: [
        { time: 'Hoy, 08:00', desc: 'Temperatura elevada detectada', status: 'atencion' },
        { time: 'Ayer, 14:30', desc: 'Registro de humedad bajo', status: 'atencion' },
        { time: 'Hace 3 días', desc: 'Muestra tomada — Análisis pendiente', status: 'optimo' },
      ]
    },
    'green-3': {
      id: 3, name: 'Green #3', zoneId: 'green-3', status: 'activo', health: 'critico',
      humidity: '1.5', temperature: '31.2', salinity: '2.8', conductivity: '4.1',
      lastRecord: '6h',
      timeline: [
        { time: 'Hoy, 07:00', desc: '⚠ Conductividad crítica detectada', status: 'critico' },
        { time: 'Ayer, 12:00', desc: 'Alerta de salinidad alta', status: 'critico' },
        { time: 'Hace 2 días', desc: 'Inspección de urgencia realizada', status: 'atencion' },
      ]
    },
    'green-4': {
      id: 4, name: 'Green #4', zoneId: 'green-4', status: 'activo', health: 'atencion',
      humidity: '3.1', temperature: '25.0', salinity: '1.0', conductivity: '2.0',
      lastRecord: '3h',
      timeline: [
        { time: 'Hoy, 09:15', desc: 'Control rutinario realizado', status: 'optimo' },
        { time: 'Ayer, 11:00', desc: 'Humedad en límite inferior', status: 'atencion' },
      ]
    },
    'green-5': {
      id: 5, name: 'Green #5', zoneId: 'green-5', status: 'activo', health: 'optimo',
      humidity: '4.5', temperature: '21.8', salinity: '0.5', conductivity: '1.5',
      lastRecord: '1h',
      timeline: [
        { time: 'Hoy, 11:00', desc: 'Todos los parámetros óptimos', status: 'optimo' },
        { time: 'Ayer, 15:30', desc: 'Riego completado exitosamente', status: 'optimo' },
      ]
    },
  };

  /** Recibe las properties de la zona desde el mapa OpenLayers */
  onZoneSelect(props: Record<string, unknown> | null): void {
    if (!props) {
      this.selectedZone.set(null);
      return;
    }
    const zoneId = props['id'] as string;
    const zone = this.zonesData[zoneId];
    if (zone) {
      this.selectedZone.set(zone);
    }
  }
}
