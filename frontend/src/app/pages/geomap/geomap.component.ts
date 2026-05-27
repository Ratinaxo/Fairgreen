import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

interface Zone {
  id: number;
  name: string;
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
  imports: [NgClass, RouterLink],
  template: `
    <div class="geomap-layout">
      <!-- Map area -->
      <div class="map-area">
        <!-- Map controls -->
        <div class="map-controls" role="group" aria-label="Controles del mapa">
          <button class="map-ctrl-btn" id="zoom-in-btn" aria-label="Acercar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
          </button>
          <div class="map-ctrl-divider"></div>
          <button class="map-ctrl-btn" id="zoom-out-btn" aria-label="Alejar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" x2="19" y1="12" y2="12"/></svg>
          </button>
        </div>

        <!-- Layers control -->
        <button class="layers-btn" aria-label="Control de capas">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </button>

        <!-- SVG Map -->
        <svg
          class="golf-svg-map"
          viewBox="0 0 900 600"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Mapa de georreferenciación del campo de golf"
        >
          <defs>
            <linearGradient id="bgGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2D5A32"/>
              <stop offset="100%" stop-color="#1E3D24"/>
            </linearGradient>
          </defs>

          <!-- Background -->
          <rect width="900" height="600" fill="url(#bgGrad2)"/>

          <!-- Fairway paths -->
          <path d="M100,100 Q180,140 240,220 Q300,300 400,340 Q500,380 620,360 Q720,340 800,300" stroke="#3D7A45" stroke-width="90" stroke-linecap="round" fill="none"/>

          <!-- Rough areas -->
          <ellipse cx="200" cy="150" rx="160" ry="100" fill="rgba(30,55,30,0.6)"/>
          <ellipse cx="700" cy="280" rx="180" ry="110" fill="rgba(30,55,30,0.6)"/>

          <!-- Greens -->
          <circle cx="800" cy="300" r="55" fill="#5DBB6B"/>
          <circle cx="100" cy="100" r="45" fill="#5DBB6B"/>
          <circle cx="450" cy="200" r="48" fill="#5DBB6B"/>
          <circle cx="300" cy="420" r="40" fill="#5DBB6B"/>

          <!-- Water -->
          <ellipse cx="580" cy="460" rx="65" ry="28" fill="#5B9BD5" opacity="0.7"/>

          <!-- Sand bunkers -->
          <ellipse cx="360" cy="310" rx="25" ry="14" fill="#D4C57A" opacity="0.75"/>
          <ellipse cx="640" cy="330" rx="20" ry="11" fill="#D4C57A" opacity="0.7"/>

          <!-- Zone polygons overlay -->
          @for (zone of zones; track zone.id) {
            <g (click)="selectZone(zone)" style="cursor:pointer;">
              <circle
                [attr.cx]="zonePositions[zone.id - 1].x"
                [attr.cy]="zonePositions[zone.id - 1].y"
                r="40"
                [attr.fill]="zoneAreaColor(zone.health)"
                [attr.stroke]="zoneBorderColor(zone.health)"
                stroke-width="2"
                [class.selected-zone]="selectedZone()?.id === zone.id"
              />
              <!-- Marker -->
              <circle
                [attr.cx]="zonePositions[zone.id - 1].x"
                [attr.cy]="zonePositions[zone.id - 1].y"
                r="16"
                [attr.fill]="zoneBorderColor(zone.health)"
                stroke="white"
                stroke-width="2"
              />
              <text
                [attr.x]="zonePositions[zone.id - 1].x"
                [attr.y]="zonePositions[zone.id - 1].y + 5"
                text-anchor="middle"
                fill="white"
                font-size="12"
                font-weight="700"
                font-family="DM Sans, sans-serif"
              >{{ zone.id }}</text>
            </g>
          }

          <!-- Selected zone marker -->
          @if (selectedZone()) {
            <circle
              [attr.cx]="zonePositions[selectedZone()!.id - 1].x"
              [attr.cy]="zonePositions[selectedZone()!.id - 1].y"
              r="20"
              fill="none"
              stroke="white"
              stroke-width="2.5"
              stroke-dasharray="4,3"
            />
          }
        </svg>

        <!-- Map legend -->
        <div class="geo-legend" role="note">
          <span class="legend-item"><span class="legend-dot" style="background:#4CAF7D;"></span>Óptimo</span>
          <span class="legend-item"><span class="legend-dot" style="background:#F59E0B;"></span>Atención</span>
          <span class="legend-item"><span class="legend-dot" style="background:#EF4444;"></span>Crítico</span>
        </div>
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
              <span class="badge" [ngClass]="'badge-' + (zone.status === 'activo' ? 'activo' : 'inactivo')">
                {{ zone.status.toUpperCase() }}
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

    .golf-svg-map {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .selected-zone { stroke-width: 3 !important; }

    /* Controls */
    .map-controls {
      position: absolute;
      top: 16px;
      left: 16px;
      z-index: 10;
      background: white;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-card);
      overflow: hidden;
    }

    .map-ctrl-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: white;
      border: none;
      cursor: pointer;
      color: var(--color-text-primary);
      transition: background var(--transition-fast);
      &:hover { background: var(--color-surface-alt); }
    }

    .map-ctrl-divider {
      height: 1px;
      background: var(--color-border);
    }

    .layers-btn {
      position: absolute;
      top: 88px;
      left: 16px;
      z-index: 10;
      width: 32px;
      height: 32px;
      background: white;
      border: none;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-card);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-primary);
      transition: background var(--transition-fast);
      &:hover { background: var(--color-surface-alt); }
    }

    .geo-legend {
      position: absolute;
      bottom: 16px;
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
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* Right panel */
    .geo-panel {
      width: 280px;
      flex-shrink: 0;
      background: var(--color-surface);
      border-left: 1px solid var(--color-border);
      padding: 20px;
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform var(--transition-normal);
    }

    .geo-panel.panel-visible {
      transform: translateX(0);
    }

    /* always show panel */
    .geo-panel { transform: translateX(0); }

    .maintenance-card {
      background: var(--color-surface-alt);
      border-radius: var(--radius-md);
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
      color: var(--color-text-muted);
      font-size: 13px;
      padding: 40px 20px;
    }
  `]
})
export class GeomapComponent {
  selectedZone = signal<Zone | null>(null);

  zonePositions = [
    { x: 100, y: 100 },
    { x: 250, y: 220 },
    { x: 450, y: 200 },
    { x: 620, y: 340 },
    { x: 800, y: 300 },
  ];

  zones: Zone[] = [
    {
      id: 1, name: 'Green #1', status: 'activo', health: 'optimo',
      humidity: '4.2', temperature: '22.1', salinity: '0.6', conductivity: '1.8',
      lastRecord: '2h',
      timeline: [
        { time: 'Hoy, 10:30', desc: 'Registro normal — Parámetros en rango', status: 'optimo' },
        { time: 'Ayer, 16:00', desc: 'Revisión de salinidad — OK', status: 'optimo' },
        { time: 'Hace 2 días', desc: 'Riego programado aplicado', status: 'optimo' },
      ]
    },
    {
      id: 2, name: 'Green #2', status: 'activo', health: 'atencion',
      humidity: '2.8', temperature: '26.4', salinity: '1.2', conductivity: '2.3',
      lastRecord: '4h',
      timeline: [
        { time: 'Hoy, 08:00', desc: 'Temperatura elevada detectada', status: 'atencion' },
        { time: 'Ayer, 14:30', desc: 'Registro de humedad bajo', status: 'atencion' },
        { time: 'Hace 3 días', desc: 'Muestra tomada — Análisis pendiente', status: 'optimo' },
      ]
    },
    {
      id: 3, name: 'Green #3', status: 'activo', health: 'critico',
      humidity: '1.5', temperature: '31.2', salinity: '2.8', conductivity: '4.1',
      lastRecord: '6h',
      timeline: [
        { time: 'Hoy, 07:00', desc: '⚠ Conductividad crítica detectada', status: 'critico' },
        { time: 'Ayer, 12:00', desc: 'Alerta de salinidad alta', status: 'critico' },
        { time: 'Hace 2 días', desc: 'Inspección de urgencia realizada', status: 'atencion' },
      ]
    },
    {
      id: 4, name: 'Green #4', status: 'activo', health: 'atencion',
      humidity: '3.1', temperature: '25.0', salinity: '1.0', conductivity: '2.0',
      lastRecord: '3h',
      timeline: [
        { time: 'Hoy, 09:15', desc: 'Control rutinario realizado', status: 'optimo' },
        { time: 'Ayer, 11:00', desc: 'Humedad en límite inferior', status: 'atencion' },
      ]
    },
    {
      id: 5, name: 'Green #5', status: 'activo', health: 'optimo',
      humidity: '4.5', temperature: '21.8', salinity: '0.5', conductivity: '1.5',
      lastRecord: '1h',
      timeline: [
        { time: 'Hoy, 11:00', desc: 'Todos los parámetros óptimos', status: 'optimo' },
        { time: 'Ayer, 15:30', desc: 'Riego completado exitosamente', status: 'optimo' },
      ]
    },
  ];

  selectZone(zone: Zone) {
    this.selectedZone.set(zone);
  }

  zoneAreaColor(health: string): string {
    if (health === 'optimo') return 'rgba(76,175,125,0.35)';
    if (health === 'atencion') return 'rgba(245,158,11,0.35)';
    return 'rgba(239,68,68,0.45)';
  }

  zoneBorderColor(health: string): string {
    if (health === 'optimo') return '#4CAF7D';
    if (health === 'atencion') return '#F59E0B';
    return '#EF4444';
  }
}
