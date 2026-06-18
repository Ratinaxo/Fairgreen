import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { MapGeorefComponent } from '../../components/map/map-georef.component';
import { MapLegendComponent } from '../../components/map/map-legend.component';
import { DataService, SeccionFeature, MuestraFeature, PuntoCriticoFeature } from '../../services/data.service';

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
  imports: [NgClass, MapGeorefComponent, MapLegendComponent, DatePipe, DecimalPipe],
  templateUrl: './geomap.component.html',
  styleUrl: './geomap.component.css'
})
export class GeomapComponent implements OnInit {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  selectedMuestra = signal<any | null>(null);
  selectedSector = signal<any | null>(null);
  selectedPuntoCritico = signal<any | null>(null);
  isPanelOpen = signal(false);
  zonesHealth = signal<Record<string, string>>({});
  muestras = signal<MuestraFeature[]>([]);
  secciones = signal<SeccionFeature[]>([]);
  puntosCriticos = signal<PuntoCriticoFeature[]>([]);
  focusId = signal<string | null>(null);

  /** Señales GPS para el mapa geomap */
  gpsLat = signal<number | null>(null);
  gpsLng = signal<number | null>(null);
  gpsLoading = signal(false);
  gpsError = signal<string | null>(null);

  zoneHealthLabel: Record<string, string> = {
    optimo: 'ÓPTIMO',
    atencion: 'ATENCIÓN',
    critico: 'CRÍTICO',
  };

  private zonesData: Record<string, Zone> = {};
  isLoading = signal(true);

  timeFilter = signal<'7d' | '30d' | '6m' | 'all'>('30d');
  showOnlyCritical = signal(false);
  private allMuestras: MuestraFeature[] = [];

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
      }),
      new Promise<PuntoCriticoFeature[]>((res) => {
        this.dataService.getTodosPuntosCriticos().subscribe({
          next: (geoJson) => res(geoJson.features ?? []),
          error: () => res([])
        });
      })
    ]).then(([secciones, muestras, puntosCriticos]) => {
      this.allMuestras = muestras;
      this.secciones.set(secciones);
      this.puntosCriticos.set(puntosCriticos);
      this.applyFilters();
      this.isLoading.set(false);
    });
  }

  onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.timeFilter.set(select.value as any);
    this.applyFilters();
  }

  toggleCriticalFilter(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.showOnlyCritical.set(checkbox.checked);
    this.applyFilters();

    // Si desactivamos el filtro, ocultamos el panel si estábamos viendo un punto crítico
    if (!this.showOnlyCritical() && this.selectedPuntoCritico()) {
      this.selectedPuntoCritico.set(null);
      this.isPanelOpen.set(false);
    }
  }

  private applyFilters() {
    if (this.allMuestras.length === 0) {
      this.muestras.set([]);
      this._buildZonesData(this.secciones(), []);
      return;
    }

    let filtered = this.allMuestras;
    if (this.timeFilter() !== 'all') {
      const cutoffDate = new Date();
      if (this.timeFilter() === '7d') cutoffDate.setDate(cutoffDate.getDate() - 7);
      else if (this.timeFilter() === '30d') cutoffDate.setDate(cutoffDate.getDate() - 30);
      else if (this.timeFilter() === '6m') cutoffDate.setMonth(cutoffDate.getMonth() - 6);

      filtered = filtered.filter(m => new Date(m.properties.fecha_hora_captura) >= cutoffDate);
    }

    if (this.showOnlyCritical()) {
      filtered = filtered.filter(m => m.properties.id_punto_critico != null);
    }

    this.muestras.set(filtered);
    this._buildZonesData(this.secciones(), filtered);
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
        const humVals = mProps.map(m => m.humedad).filter((v): v is number => v !== null && v !== undefined);
        const tempVals = mProps.map(m => m.temperatura).filter((v): v is number => v !== null && v !== undefined);
        const salVals = mProps.map(m => m.salinidad).filter((v): v is number => v !== null && v !== undefined);
        const condVals = mProps.map(m => m.conductividad).filter((v): v is number => v !== null && v !== undefined);

        avgH = humVals.length > 0 ? humVals.reduce((acc, v) => acc + v, 0) / humVals.length : 0;
        avgT = tempVals.length > 0 ? tempVals.reduce((acc, v) => acc + v, 0) / tempVals.length : 0;
        avgS = salVals.length > 0 ? salVals.reduce((acc, v) => acc + v, 0) / salVals.length : 0;
        avgC = condVals.length > 0 ? condVals.reduce((acc, v) => acc + v, 0) / condVals.length : 0;

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
          const cond = m.properties.conductividad ?? 0;
          const sal = m.properties.salinidad ?? 0;
          if (cond > 3.5) mHealth = 'critico';
          else if (cond > 2.0) mHealth = 'atencion';

          const condStr = m.properties.conductividad != null ? m.properties.conductividad.toFixed(1) : '—';
          const salStr = m.properties.salinidad != null ? m.properties.salinidad.toFixed(1) : '—';

          timeline.push({
            time: f.toLocaleDateString('es-CL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            desc: `Registro (C:${condStr}, S:${salStr})`,
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

  /** Recibe las properties de la muestra o sector desde el mapa OpenLayers */
  onZoneSelect(props: Record<string, any> | null): void {
    if (!props) {
      this.selectedMuestra.set(null);
      this.selectedSector.set(null);
      this.selectedPuntoCritico.set(null);
      this.isPanelOpen.set(false);
      return;
    }

    if (props['type'] === 'sector') {
      this.selectedMuestra.set(null);
      this.selectedPuntoCritico.set(null);

      const zoneId = String(props['featureId'] || props['id']);
      const zoneData = this.zonesData[zoneId];

      if (zoneData) {
        // Filtrar las muestras de este sector y ordenarlas
        const secMuestras = this.muestras().filter(m => String(m.properties.id_seccion.id) === zoneId);
        secMuestras.sort((a, b) => new Date(b.properties.fecha_hora_captura).getTime() - new Date(a.properties.fecha_hora_captura).getTime());

        this.selectedSector.set({
          zoneData: zoneData,
          muestras: secMuestras
        });
      }
      this.isPanelOpen.set(true);
      return;
    }

    // Es una muestra
    this.selectedSector.set(null);

    // Si el filtro de críticos está activo y la muestra pertenece a un punto crítico, mostrar vista de grupo
    if (this.showOnlyCritical() && props['id_punto_critico'] != null && !props['forceSampleView']) {
      this.selectedMuestra.set(null);

      const pcObj = props['id_punto_critico'];
      const pcId = typeof pcObj === 'object' ? pcObj.id_punto_critico : pcObj;
      const pc = this.puntosCriticos().find(p => p.id === pcId);

      // Filtrar TODAS las muestras de ese punto crítico en el tiempo seleccionado
      const pcMuestras = this.muestras().filter(m => {
        const mPcObj = m.properties.id_punto_critico;
        const mPcId = typeof mPcObj === 'object' && mPcObj !== null ? (mPcObj as any).id_punto_critico : mPcObj;
        return mPcId === pcId;
      });
      pcMuestras.sort((a, b) => new Date(b.properties.fecha_hora_captura).getTime() - new Date(a.properties.fecha_hora_captura).getTime());

      let avgH = 0, avgT = 0, avgS = 0, avgC = 0;
      let health: 'optimo' | 'atencion' | 'critico' = 'optimo';

      if (pcMuestras.length > 0) {
        const mProps = pcMuestras.map(m => m.properties);
        const humVals = mProps.map(m => m.humedad).filter((v): v is number => v !== null && v !== undefined);
        const tempVals = mProps.map(m => m.temperatura).filter((v): v is number => v !== null && v !== undefined);
        const salVals = mProps.map(m => m.salinidad).filter((v): v is number => v !== null && v !== undefined);
        const condVals = mProps.map(m => m.conductividad).filter((v): v is number => v !== null && v !== undefined);

        avgH = humVals.length > 0 ? humVals.reduce((acc, v) => acc + v, 0) / humVals.length : 0;
        avgT = tempVals.length > 0 ? tempVals.reduce((acc, v) => acc + v, 0) / tempVals.length : 0;
        avgS = salVals.length > 0 ? salVals.reduce((acc, v) => acc + v, 0) / salVals.length : 0;
        avgC = condVals.length > 0 ? condVals.reduce((acc, v) => acc + v, 0) / condVals.length : 0;

        if (avgC > 3.5 || avgS > 2.5) {
          health = 'critico';
        } else if (avgC > 2.0 || avgS > 1.5) {
          health = 'atencion';
        }
      }

      let zonaName = 'Zona Desconocida';
      let descripcion = 'Punto crítico';
      if (pc) {
        zonaName = pc.properties.id_seccion?.properties
          ? `${pc.properties.id_seccion.properties.tipo_de_tierra} #${pc.properties.id_seccion.properties.numero_de_hoyo}`
          : zonaName;
        descripcion = pc.properties.descripcion || descripcion;
      } else {
        const seccionProps = props['id_seccion']?.properties;
        zonaName = seccionProps ? `${seccionProps.tipo_de_tierra} #${seccionProps.numero_de_hoyo}` : zonaName;
      }

      this.selectedPuntoCritico.set({
        pcData: {
          id: pcId,
          name: `Punto Crítico ${pcId}`,
          zonaName: zonaName,
          descripcion: descripcion,
          health: health,
          humidity: pcMuestras.length > 0 ? avgH.toFixed(1) : '--',
          temperature: pcMuestras.length > 0 ? avgT.toFixed(1) : '--',
          salinity: pcMuestras.length > 0 ? avgS.toFixed(2) : '--',
          conductivity: pcMuestras.length > 0 ? avgC.toFixed(2) : '--',
        },
        muestras: pcMuestras
      });
      this.isPanelOpen.set(true);
      return;
    }

    // Mostrar vista de muestra individual
    this.selectedPuntoCritico.set(null);
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

    const fotos = props['fotos'] || [];

    this.selectedMuestra.set({
      id: props['id_muestra'],
      zonaName,
      fechaStr,
      health,
      humedad: props['humedad'] != null ? props['humedad'].toFixed(1) : '—',
      temperatura: props['temperatura'] != null ? props['temperatura'].toFixed(1) : '—',
      salinidad: props['salinidad'] != null ? props['salinidad'].toFixed(2) : '—',
      conductividad: props['conductividad'] != null ? props['conductividad'].toFixed(2) : '—',
      recomendaciones: props['recomendaciones'],
      fotos,
      currentPhotoIndex: 0
    });

    this.isPanelOpen.set(true);
  }

  focusOnSample(m: MuestraFeature) {
    this.focusId.set(String(m.id || m.properties.id_muestra));
    this.onZoneSelect({ ...m.properties, id_muestra: m.id || m.properties.id_muestra, type: 'muestra', forceSampleView: true });
  }

  /** Obtiene la ubicación GPS del usuario y centra el mapa en su posición */
  useGpsLocation(): void {
    if (!navigator.geolocation) {
      this.gpsError.set('Tu navegador no soporta geolocalización.');
      return;
    }

    this.gpsLoading.set(true);
    this.gpsError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        this.gpsLat.set(lat);
        this.gpsLng.set(lng);
        this.gpsLoading.set(false);
        // El mapa-georef recibe gpsLat/gpsLng via @Input y centra la vista
      },
      (error) => {
        this.gpsLoading.set(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.gpsError.set('Permiso de ubicación denegado. Actívalo en la configuración del navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            this.gpsError.set('No se pudo obtener la ubicación. Verifica el GPS del dispositivo.');
            break;
          case error.TIMEOUT:
            this.gpsError.set('Tiempo de espera agotado. Intenta de nuevo.');
            break;
          default:
            this.gpsError.set('Error desconocido al obtener la ubicación.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  togglePanel() {
    this.isPanelOpen.set(!this.isPanelOpen());
  }

  prevPhoto() {
    const m = this.selectedMuestra();
    if (!m || !m.fotos || m.fotos.length === 0) return;
    const total = m.fotos.length;
    this.selectedMuestra.set({
      ...m,
      currentPhotoIndex: (m.currentPhotoIndex - 1 + total) % total
    });
  }

  nextPhoto() {
    const m = this.selectedMuestra();
    if (!m || !m.fotos || m.fotos.length === 0) return;
    const total = m.fotos.length;
    this.selectedMuestra.set({
      ...m,
      currentPhotoIndex: (m.currentPhotoIndex + 1) % total
    });
  }

  goToPhoto(index: number) {
    const m = this.selectedMuestra();
    if (!m) return;
    this.selectedMuestra.set({
      ...m,
      currentPhotoIndex: index
    });
  }
}
