import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { NgClass } from '@angular/common';
import { MapGeorefComponent } from '../../components/map/map-georef.component';
import { MapLegendComponent } from '../../components/map/map-legend.component';
import { DataService, SeccionFeature, MuestraFeature } from '../../services/data.service';

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
        <app-map-georef 
            (zoneSelect)="onZoneSelect($event)" 
            [muestras]="muestras()"
            [secciones]="secciones()"
            [focusId]="focusId()" />

        <!-- Map legend -->
        <app-map-legend />

        @if (selectedMuestra()) {
          <button class="panel-toggle-btn" (click)="togglePanel()">
            {{ isPanelOpen() ? 'Ocultar Detalles' : 'Ver Detalles' }}
          </button>
        }
      </div>

      <!-- Right panel -->
      <aside class="geo-panel" [class.panel-visible]="isPanelOpen()" aria-label="Detalles de muestra seleccionada">
        @if (selectedMuestra(); as muestra) {
          <!-- Zone header -->
          <div style="margin-bottom: 20px; position: relative;">
            <button class="panel-close-btn-mobile" (click)="isPanelOpen.set(false)" aria-label="Cerrar detalles">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            </button>
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:6px;">
              Muestra Seleccionada
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span class="badge" [ngClass]="'badge-' + muestra.health">
                {{ zoneHealthLabel[muestra.health] }}
              </span>
            </div>
            <div style="font-family:var(--font-display);font-size:22px;color:var(--color-text-primary);">
              {{ muestra.zonaName }}
            </div>
          </div>

          <!-- Maintenance status -->
          <div class="maintenance-card" style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:var(--color-surface);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.75" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--color-text-primary);">Capturada el</div>
                <div style="font-size:11px;color:var(--color-text-muted);">{{ muestra.fechaStr }}</div>
              </div>
            </div>
          </div>

          <!-- Metrics 2x2 -->
          <div style="margin-bottom:16px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:10px;">Mediciones</div>
            <div class="metrics-grid">
              <div class="metric-cell">
                <div class="metric-label">Humedad</div>
                <div class="metric-value">{{ muestra.humedad }}<span class="metric-unit"> /5</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-optimal" [style.width]="(muestra.humedad / 5 * 100) + '%'"></div></div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Temperatura</div>
                <div class="metric-value">{{ muestra.temperatura }}<span class="metric-unit">°C</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-warning" [style.width]="(muestra.temperatura / 40 * 100) + '%'"></div></div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Salinidad</div>
                <div class="metric-value">{{ muestra.salinidad }}<span class="metric-unit"> dS</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-optimal" [style.width]="(muestra.salinidad / 5 * 100) + '%'"></div></div>
              </div>
              <div class="metric-cell">
                <div class="metric-label">Conductividad</div>
                <div class="metric-value">{{ muestra.conductividad }}<span class="metric-unit"> dS</span></div>
                <div class="progress-bar" style="margin-top:6px;"><div class="progress-fill fill-danger" [style.width]="(muestra.conductividad / 5 * 100) + '%'"></div></div>
              </div>
            </div>
          </div>

          <!-- Image & Notes -->
          <div style="margin-bottom: 20px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--color-text-muted);text-transform:uppercase;margin-bottom:10px;">Evidencia e Indicaciones</div>
            @if (muestra.foto) {
              <img [src]="muestra.foto" alt="Foto de muestra" style="width:100%;border-radius:8px;margin-bottom:10px;border:1px solid #dde5df;" />
            }
            <div style="background:#f9fbf9;border:1px solid #dde5df;padding:12px;border-radius:8px;font-size:12px;color:var(--color-text-secondary);line-height:1.5;">
              {{ muestra.recomendaciones || 'Sin indicaciones registradas para esta muestra.' }}
            </div>
          </div>

        } @else {
          <div class="empty-panel">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-muted);" aria-hidden="true"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
            <p>Selecciona una muestra en el mapa para ver sus detalles</p>
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
      transition: transform 0.3s ease;
    }

    .panel-toggle-btn {
      display: none;
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 999px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      white-space: nowrap;
    }

    .panel-close-btn-mobile {
      display: none;
      position: absolute;
      top: 0;
      right: 0;
      background: none;
      border: none;
      color: var(--color-text-muted);
      padding: 4px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .geomap-layout { flex-direction: column; height: calc(100vh - 52px - 48px); }
      .map-area { flex: 1; }

      .geo-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        max-height: 60vh;
        border-left: none;
        border-radius: 20px 20px 0 0;
        box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
        transform: translateY(100%);
        opacity: 0;
        z-index: 150;
        overflow-y: auto;
        padding-top: 24px;
      }

      .geo-panel.panel-visible {
        transform: translateY(0);
        opacity: 1;
      }

      .panel-toggle-btn { display: block; }
      .panel-close-btn-mobile { display: block; }
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
export class GeomapComponent implements OnInit {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  selectedMuestra = signal<any | null>(null);
  isPanelOpen = signal(false);
  zonesHealth = signal<Record<string, string>>({});
  muestras = signal<MuestraFeature[]>([]);
  secciones = signal<SeccionFeature[]>([]);
  focusId = signal<string | null>(null);

  zoneHealthLabel: Record<string, string> = {
    optimo: 'ÓPTIMO',
    atencion: 'ATENCIÓN',
    critico: 'CRÍTICO',
  };

  private zonesData: Record<string, Zone> = {};
  isLoading = signal(true);

  ngOnInit() {
    this._loadRealData();
    this.route.queryParams.subscribe(params => {
      if (params['muestraId']) {
        this.focusId.set(params['muestraId']);
      }
    });
  }

  private _loadRealData() {
    this.isLoading.set(true);

    // Fetch secciones y muestras reales en paralelo
    Promise.all([
      new Promise<SeccionFeature[]>((res) => {
        this.dataService.getSecciones().subscribe({
          next: (geoJson) => res(geoJson.features ?? []),
          error: () => res([])
        });
      }),
      new Promise<MuestraFeature[]>((res) => {
        this.dataService.getMuestras(1, 100).subscribe({
          next: (geoJson) => res(geoJson.features ?? []),
          error: () => res([])
        });
      })
    ]).then(([secciones, muestras]) => {
      this.muestras.set(muestras);
      this.secciones.set(secciones);
      this._buildZonesData(secciones, muestras);
      this.isLoading.set(false);
    });
  }

  private _buildZonesData(secciones: SeccionFeature[], muestras: MuestraFeature[]) {
    const newZonesData: Record<string, Zone> = {};

    for (const sec of secciones) {
      const p = sec.properties;
      const zoneId = sec.id.toString();

      // Filtrar muestras que pertenezcan a esta sección
      const secMuestras = muestras.filter(m => m.properties.id_seccion.id === sec.id);

      // Calcular KPIs promedios si hay muestras
      let avgH = 0, avgT = 0, avgS = 0, avgC = 0;
      let lastRecord = 'Sin registros';
      let health: 'optimo' | 'atencion' | 'critico' = 'optimo';
      const timeline: Zone['timeline'] = [];

      if (secMuestras.length > 0) {
        // Ordenar muestras por fecha (más reciente primero)
        secMuestras.sort((a, b) => new Date(b.properties.fecha_hora_captura).getTime() - new Date(a.properties.fecha_hora_captura).getTime());

        const mProps = secMuestras.map(m => m.properties);
        avgH = mProps.reduce((acc, m) => acc + m.humedad, 0) / mProps.length;
        avgT = mProps.reduce((acc, m) => acc + m.temperatura, 0) / mProps.length;
        avgS = mProps.reduce((acc, m) => acc + m.salinidad, 0) / mProps.length;
        avgC = mProps.reduce((acc, m) => acc + m.conductividad, 0) / mProps.length;

        const ultimaFecha = new Date(mProps[0].fecha_hora_captura);
        lastRecord = ultimaFecha.toLocaleDateString('es-CL') + ' ' + ultimaFecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

        // Determinar salud general (lógica básica basada en salinidad/conductividad)
        if (avgC > 3.5 || avgS > 2.5) {
          health = 'critico';
        } else if (avgC > 2.0 || avgS > 1.5) {
          health = 'atencion';
        } else {
          health = 'optimo';
        }

        // Generar timeline de los últimos 3 registros
        for (const m of secMuestras.slice(0, 3)) {
          const f = new Date(m.properties.fecha_hora_captura);
          let mHealth: 'optimo' | 'atencion' | 'critico' = 'optimo';
          if (m.properties.conductividad > 3.5) mHealth = 'critico';
          else if (m.properties.conductividad > 2.0) mHealth = 'atencion';

          timeline.push({
            time: f.toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            desc: `Registro (C:${m.properties.conductividad.toFixed(1)}, S:${m.properties.salinidad.toFixed(1)})`,
            status: mHealth
          });
        }
      }

      newZonesData[zoneId] = {
        id: sec.id,
        name: `${p.tipo_de_tierra} #${p.numero_de_hoyo}`,
        zoneId: zoneId,
        status: 'activo',
        health: health,
        humidity: secMuestras.length > 0 ? avgH.toFixed(1) : '--',
        temperature: secMuestras.length > 0 ? avgT.toFixed(1) : '--',
        salinity: secMuestras.length > 0 ? avgS.toFixed(2) : '--',
        conductivity: secMuestras.length > 0 ? avgC.toFixed(2) : '--',
        lastRecord: lastRecord,
        timeline: timeline
      };
    }

    this.zonesData = newZonesData;

    // Extraer health object
    const healthMap: Record<string, string> = {};
    for (const zId in newZonesData) {
      healthMap[zId] = newZonesData[zId].health;
    }
    this.zonesHealth.set(healthMap);
  }

  /** Recibe las properties de la muestra desde el mapa OpenLayers */
  onZoneSelect(props: Record<string, any> | null): void {
    if (!props) {
      this.selectedMuestra.set(null);
      return;
    }

    const fecha = new Date(props['fecha_hora_captura']);
    const fechaStr = fecha.toLocaleDateString('es-CL') + ' ' + fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    let health: 'optimo' | 'atencion' | 'critico' = 'optimo';
    if (props['conductividad'] > 3.5 || props['salinidad'] > 2.5) {
      health = 'critico';
    } else if (props['conductividad'] > 2.0 || props['salinidad'] > 1.5) {
      health = 'atencion';
    }

    const seccionProps = props['id_seccion']?.properties;
    const zonaName = seccionProps ? `${seccionProps.tipo_de_tierra} #${seccionProps.numero_de_hoyo}` : 'Zona Desconocida';

    const foto = props['fotos'] && props['fotos'].length > 0 ? props['fotos'][0].ruta_archivo : null;

    this.selectedMuestra.set({
      id: props['id_muestra'],
      zonaName,
      fechaStr,
      health,
      humedad: props['humedad']?.toFixed(1) || '0.0',
      temperatura: props['temperatura']?.toFixed(1) || '0.0',
      salinidad: props['salinidad']?.toFixed(2) || '0.00',
      conductividad: props['conductividad']?.toFixed(2) || '0.00',
      recomendaciones: props['recomendaciones'],
      foto
    });

    this.isPanelOpen.set(true);
  }

  togglePanel() {
    this.isPanelOpen.set(!this.isPanelOpen());
  }
}
