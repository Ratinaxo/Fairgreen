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
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
  private dataService = inject(DataService);

  @ViewChild('chartSvg') chartSvgRef!: ElementRef;

  filtersApplied = signal(false);
  appliedComponent = signal('Humedad');
  appliedDateFrom = signal('');
  appliedDateTo = signal('');
  appliedZona = signal('');

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
  yAxisValues: number[] = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0];
  yAxisMax = 5;
  yFactor = 40; // (200px height / 5 units)

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
    if (this.appliedDateFrom()) {
      return new Date(this.appliedDateFrom()).toLocaleDateString('es-CL');
    }
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toLocaleDateString('es-CL');
  }

  displayDateTo(): string {
    if (this.appliedDateTo()) {
      return new Date(this.appliedDateTo()).toLocaleDateString('es-CL');
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
        // Set applied values first
        this.appliedComponent.set(this.filters.component);
        this.appliedDateFrom.set(this.filters.dateFrom);
        this.appliedDateTo.set(this.filters.dateTo);
        this.appliedZona.set(this.filters.zona);

        let features = geoJson.features ?? [];
        
        // 1. Filtrar por fecha
        if (this.filters.dateFrom) {
          features = features.filter(f => f.properties.fecha_hora_captura.substring(0, 10) >= this.filters.dateFrom);
        }
        if (this.filters.dateTo) {
          features = features.filter(f => f.properties.fecha_hora_captura.substring(0, 10) <= this.filters.dateTo);
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
    const comp = this.appliedComponent();
    if (comp === 'Humedad') { propKey = 'humedad'; this.yAxisMax = 5; this.yAxisValues = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0]; }
    else if (comp === 'Temperatura') { propKey = 'temperatura'; this.yAxisMax = 40; this.yAxisValues = [40, 35, 30, 25, 20, 15, 10, 5, 0]; }
    else if (comp === 'Salinidad') { propKey = 'salinidad'; this.yAxisMax = 5; this.yAxisValues = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0]; }
    else if (comp === 'Conductividad') { propKey = 'conductividad'; this.yAxisMax = 6; this.yAxisValues = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0]; }
    
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
        component: comp,
        level: val,
        status: status
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generar puntos equitativos para el gráfico basados en el tiempo real transcurrido
    if (features.length === 0) {
      this.rawData = Array(12).fill(0);
      this.xLabels = Array.from({ length: 12 }, (_, i) => ({ x: 60 + i * 55, text: '' }));
      return;
    }

    // Ordenamos cronológicamente
    features.sort((a, b) => new Date(a.properties.fecha_hora_captura).getTime() - new Date(b.properties.fecha_hora_captura).getTime());

    // 1. Determinar rango de tiempo
    let startStr = this.appliedDateFrom();
    let endStr = this.appliedDateTo();

    if (!startStr && features.length) {
      startStr = features[0].properties.fecha_hora_captura.substring(0, 10);
    }
    if (!endStr && features.length) {
      endStr = features[features.length - 1].properties.fecha_hora_captura.substring(0, 10);
    }

    let startTime = new Date(startStr + 'T00:00:00').getTime();
    let endTime = new Date(endStr + 'T23:59:59').getTime();

    if (endTime <= startTime) {
      endTime = startTime + 24 * 3600 * 1000 - 1000;
    }

    const totalDays = (endTime - startTime) / (24 * 3600 * 1000);

    // Definición de los buckets (intervalos de tiempo específicos)
    interface TimeBucket {
      start: number;
      end: number;
      label: string;
      showLabel: boolean;
    }
    let bucketsConfig: TimeBucket[] = [];

    if (totalDays <= 1.5) {
      // 1. Agrupar por hora (cada 2 horas)
      for (let hour = 0; hour < 24; hour += 2) {
        const start = new Date(startStr + 'T00:00:00');
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start.getTime() + 2 * 3600 * 1000 - 1);
        const label = start.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        bucketsConfig.push({ start: start.getTime(), end: end.getTime(), label, showLabel: true });
      }
    } else if (totalDays <= 31) {
      // 2. Agrupar por día
      const start = new Date(startStr + 'T00:00:00');
      const endLimit = new Date(endStr + 'T23:59:59');
      let curr = new Date(start.getTime());
      while (curr.getTime() <= endLimit.getTime()) {
        const s = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 0, 0, 0, 0).getTime();
        const e = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 23, 59, 59, 999).getTime();
        const label = curr.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '');
        bucketsConfig.push({ start: s, end: e, label, showLabel: true });
        curr.setDate(curr.getDate() + 1);
      }
      
      // Ocultar etiquetas intermedias si son demasiados días
      if (bucketsConfig.length > 12) {
        const step = Math.ceil(bucketsConfig.length / 8);
        bucketsConfig.forEach((b, idx) => {
          if (idx % step !== 0 && idx !== bucketsConfig.length - 1) {
            b.showLabel = false;
          }
        });
      }
    } else {
      // 3. Agrupar por mes calendario (evita duplicados de meses en rangos largos)
      const start = new Date(startStr + 'T00:00:00');
      const endLimit = new Date(endStr + 'T23:59:59');
      let curr = new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
      
      while (curr.getTime() <= endLimit.getTime()) {
        const s = new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0, 0).getTime();
        const e = new Date(curr.getFullYear(), curr.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
        const label = curr.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '');
        bucketsConfig.push({ start: s, end: e, label, showLabel: true });
        curr.setMonth(curr.getMonth() + 1);
      }

      // Ocultar etiquetas intermedias si son demasiados meses (rango multi-año)
      if (bucketsConfig.length > 12) {
        const step = Math.ceil(bucketsConfig.length / 12);
        bucketsConfig.forEach((b, idx) => {
          if (idx % step !== 0 && idx !== bucketsConfig.length - 1) {
            b.showLabel = false;
          }
        });
      }
    }

    const N = bucketsConfig.length;
    
    // 2. Generar las coordenadas X y etiquetas dinámicamente
    const newLabels = [];
    for (let i = 0; i < N; i++) {
      const x = N > 1 ? 60 + i * (605 / (N - 1)) : 362.5;
      newLabels.push({
        x: x,
        text: bucketsConfig[i].showLabel ? bucketsConfig[i].label : ''
      });
    }
    this.xLabels = newLabels;

    // 3. Agrupar muestras en los buckets correspondientes
    const bucketsData = Array.from({ length: N }, () => [] as number[]);
    for (const f of features) {
      const t = new Date(f.properties.fecha_hora_captura).getTime();
      for (let i = 0; i < N; i++) {
        if (t >= bucketsConfig[i].start && t <= bucketsConfig[i].end) {
          bucketsData[i].push(f.properties[propKey]);
          break;
        }
      }
    }

    this.rawData = bucketsData.map(b => b.length ? (b.reduce((x, y) => x + y, 0) / b.length) : 0);

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
