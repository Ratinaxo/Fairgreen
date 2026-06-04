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
