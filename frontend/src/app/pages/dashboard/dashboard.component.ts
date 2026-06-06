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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
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

  timeFilter = signal<'7d' | '30d' | '6m' | 'all'>('7d');
  allMuestras: MuestraFeature[] = [];

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
      this.allMuestras = muestras;
      this.applyTimeFilter();
      this.isLoading.set(false);
    });
  }

  onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.timeFilter.set(select.value as any);
    this.applyTimeFilter();
  }

  private applyTimeFilter() {
    if (this.allMuestras.length === 0) {
      this.muestras.set([]);
      return;
    }

    let filtered = this.allMuestras;
    if (this.timeFilter() !== 'all') {
      const cutoffDate = new Date();
      if (this.timeFilter() === '7d') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (this.timeFilter() === '30d') {
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      } else if (this.timeFilter() === '6m') {
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      }
      filtered = this.allMuestras.filter(m => new Date(m.properties.fecha_hora_captura) >= cutoffDate);
      
      // Fallback a todas si el filtro es muy restrictivo y deja 0
      if (filtered.length === 0) {
        filtered = this.allMuestras;
      }
    }

    this.muestras.set(filtered);
    this._calcularKPIs(filtered);
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
