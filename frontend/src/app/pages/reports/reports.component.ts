import { Component, signal, ElementRef, ViewChild, inject } from '@angular/core';
import { DataService, MuestraFeature } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

interface ReportRow {
  id: number;
  date: string;
  sector: string;
  point: string;
  component: string;
  level: number;
  status: 'optimo' | 'atencion' | 'critico';
  humedad?: number;
  temperatura?: number;
  salinidad?: number;
  conductividad?: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
  private dataService = inject(DataService);

  @ViewChild('chartSvg') chartSvgRef!: ElementRef;
  @ViewChild('exportChartSvg') exportChartSvgRef!: ElementRef;

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

  // Variables para la Exportación Personalizada
  showExportModal = signal(false);
  isExporting = signal(false);
  exportConfig = {
    format: 'pdf',
    title: 'Reporte de Análisis',
    dateFrom: '',
    dateTo: '',
    sector: '',
    zona: '',
    component: 'Humedad',
    includeStats: true,
    includeTable: true
  };

  // Variables para el gráfico SVG de exportación (oculto)
  exportYAxisValues: number[] = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0];
  exportYAxisMax = 5;
  exportYFactor = 40;
  exportXLabels: { x: number; text: string }[] = [];
  exportRawData: number[] = [];
  exportReportRows: ReportRow[] = [];
  exportAvgGreen = 0;
  exportAvgFairway = 0;

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

  // --- Helpers for Export Chart ---
  get exportChartPoints() {
    return this.exportRawData.map((v, i) => ({
      x: this.exportXLabels[i]?.x ?? 0,
      y: 10 + (this.exportYAxisMax - v) * this.exportYFactor,
    }));
  }

  get exportLinePath(): string {
    const pts = this.exportChartPoints;
    if (!pts.length) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${cx} ${pts[i - 1].y} ${cx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }

  get exportAreaPath(): string {
    const pts = this.exportChartPoints;
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

  openExportModal() {
    this.exportConfig = {
      format: 'pdf',
      title: 'Reporte de Análisis Histórico',
      dateFrom: this.filters.dateFrom,
      dateTo: this.filters.dateTo,
      sector: this.filters.sector,
      zona: this.filters.zona,
      component: this.filters.component || 'Humedad',
      includeTable: true,
      includeStats: true,
    };
    this.showExportModal.set(true);
  }

  closeExportModal() {
    this.showExportModal.set(false);
  }

  generateReport() {
    this.isExporting.set(true);

    this.dataService.getMuestras(1, 1000).subscribe({
      next: async (geoJson) => {
        let features = geoJson.features ?? [];

        if (this.exportConfig.dateFrom) {
          features = features.filter(f => f.properties.fecha_hora_captura.substring(0, 10) >= this.exportConfig.dateFrom);
        }
        if (this.exportConfig.dateTo) {
          features = features.filter(f => f.properties.fecha_hora_captura.substring(0, 10) <= this.exportConfig.dateTo);
        }
        if (this.exportConfig.sector) {
          features = features.filter(f => f.properties.id_seccion?.properties?.numero_de_hoyo === parseInt(this.exportConfig.sector));
        }
        if (this.exportConfig.zona) {
          features = features.filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra.toLowerCase() === this.exportConfig.zona.toLowerCase());
        }

        this._processExportData(features);

        if (this.exportConfig.format === 'excel') {
          await this._generateExcel();
        } else {
          await this._generatePDF();
        }

        this.isExporting.set(false);
        this.closeExportModal();
      },
      error: (err) => {
        console.error('Error fetching data for export:', err);
        alert('Error al generar el reporte');
        this.isExporting.set(false);
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
        id: f.id,
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

  private _processExportData(features: MuestraFeature[]) {
    let propKey: 'humedad' | 'temperatura' | 'salinidad' | 'conductividad' = 'humedad';
    const comp = this.exportConfig.component;
    
    if (comp === 'Todos') {
      this.exportReportRows = features.map(f => {
        const p = f.properties;
        return {
          id: f.id,
          date: new Date(p.fecha_hora_captura).toLocaleDateString('es-CL'),
          sector: `Sector ${p.id_seccion?.properties?.numero_de_hoyo ?? 0}`,
          point: `${p.id_seccion?.properties?.tipo_de_tierra ?? 'Z'}`,
          component: 'Todos',
          level: 0,
          status: 'optimo' as const,
          humedad: p.humedad,
          temperatura: p.temperatura,
          salinidad: p.salinidad,
          conductividad: p.conductividad
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      this.exportConfig.includeStats = false;
      return;
    }

    if (comp === 'Humedad') { propKey = 'humedad'; this.exportYAxisMax = 5; this.exportYAxisValues = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0]; }
    else if (comp === 'Temperatura') { propKey = 'temperatura'; this.exportYAxisMax = 40; this.exportYAxisValues = [40, 35, 30, 25, 20, 15, 10, 5, 0]; }
    else if (comp === 'Salinidad') { propKey = 'salinidad'; this.exportYAxisMax = 5; this.exportYAxisValues = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0]; }
    else if (comp === 'Conductividad') { propKey = 'conductividad'; this.exportYAxisMax = 6; this.exportYAxisValues = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0]; }
    
    this.exportYFactor = 200 / this.exportYAxisMax;

    this.exportReportRows = features.map(f => {
      const p = f.properties;
      const val = p[propKey];
      let status: 'optimo' | 'atencion' | 'critico' = 'optimo';
      if (propKey === 'conductividad' || propKey === 'salinidad') {
        if (val > (this.exportYAxisMax * 0.6)) status = 'critico';
        else if (val > (this.exportYAxisMax * 0.4)) status = 'atencion';
      } else {
        if (val < (this.exportYAxisMax * 0.2)) status = 'critico';
        else if (val < (this.exportYAxisMax * 0.4)) status = 'atencion';
      }
      return {
        id: f.id,
        date: new Date(p.fecha_hora_captura).toLocaleDateString('es-CL'),
        sector: `Sector ${p.id_seccion?.properties?.numero_de_hoyo ?? 0}`,
        point: `${p.id_seccion?.properties?.tipo_de_tierra ?? 'Z'}`,
        component: comp,
        level: val,
        status: status
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (features.length === 0) {
      this.exportRawData = Array(12).fill(0);
      this.exportXLabels = Array.from({ length: 12 }, (_, i) => ({ x: 60 + i * 55, text: '' }));
      return;
    }

    features.sort((a, b) => new Date(a.properties.fecha_hora_captura).getTime() - new Date(b.properties.fecha_hora_captura).getTime());

    let startStr = this.exportConfig.dateFrom || features[0].properties.fecha_hora_captura.substring(0, 10);
    let endStr = this.exportConfig.dateTo || features[features.length - 1].properties.fecha_hora_captura.substring(0, 10);

    let startTime = new Date(startStr + 'T00:00:00').getTime();
    let endTime = new Date(endStr + 'T23:59:59').getTime();
    if (endTime <= startTime) endTime = startTime + 24 * 3600 * 1000 - 1000;

    const totalDays = (endTime - startTime) / (24 * 3600 * 1000);
    let bucketsConfig: any[] = [];

    if (totalDays <= 1.5) {
      for (let hour = 0; hour < 24; hour += 2) {
        const start = new Date(startStr + 'T00:00:00');
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start.getTime() + 2 * 3600 * 1000 - 1);
        bucketsConfig.push({ start: start.getTime(), end: end.getTime(), label: start.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }), showLabel: true });
      }
    } else if (totalDays <= 31) {
      const endLimit = new Date(endStr + 'T23:59:59');
      let curr = new Date(startStr + 'T00:00:00');
      while (curr.getTime() <= endLimit.getTime()) {
        const s = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 0, 0, 0, 0).getTime();
        const e = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(), 23, 59, 59, 999).getTime();
        bucketsConfig.push({ start: s, end: e, label: curr.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', ''), showLabel: true });
        curr.setDate(curr.getDate() + 1);
      }
      if (bucketsConfig.length > 12) {
        const step = Math.ceil(bucketsConfig.length / 8);
        bucketsConfig.forEach((b, idx) => { if (idx % step !== 0 && idx !== bucketsConfig.length - 1) b.showLabel = false; });
      }
    } else {
      const endLimit = new Date(endStr + 'T23:59:59');
      let curr = new Date(new Date(startStr + 'T00:00:00').getFullYear(), new Date(startStr + 'T00:00:00').getMonth(), 1, 0, 0, 0, 0);
      while (curr.getTime() <= endLimit.getTime()) {
        const s = new Date(curr.getFullYear(), curr.getMonth(), 1, 0, 0, 0, 0).getTime();
        const e = new Date(curr.getFullYear(), curr.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
        bucketsConfig.push({ start: s, end: e, label: curr.toLocaleDateString('es-CL', { month: 'short' }).replace('.', ''), showLabel: true });
        curr.setMonth(curr.getMonth() + 1);
      }
      if (bucketsConfig.length > 12) {
        const step = Math.ceil(bucketsConfig.length / 12);
        bucketsConfig.forEach((b, idx) => { if (idx % step !== 0 && idx !== bucketsConfig.length - 1) b.showLabel = false; });
      }
    }

    const N = bucketsConfig.length;
    const newLabels = [];
    for (let i = 0; i < N; i++) {
      newLabels.push({ x: N > 1 ? 60 + i * (605 / (N - 1)) : 362.5, text: bucketsConfig[i].showLabel ? bucketsConfig[i].label : '' });
    }
    this.exportXLabels = newLabels;

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

    this.exportRawData = bucketsData.map(b => b.length ? (b.reduce((x, y) => x + y, 0) / b.length) : 0);

    const greenFeatures = features.filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'GREEN');
    const fairwayFeatures = features.filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'FAIRWAY');
    this.exportAvgGreen = greenFeatures.length > 0 ? greenFeatures.reduce((acc, f) => acc + f.properties[propKey], 0) / greenFeatures.length : 0;
    this.exportAvgFairway = fairwayFeatures.length > 0 ? fairwayFeatures.reduce((acc, f) => acc + f.properties[propKey], 0) / fairwayFeatures.length : 0;
  }

  private async _generateExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    sheet.addRow([this.exportConfig.title]);
    sheet.getRow(1).font = { bold: true, size: 16 };
    sheet.addRow([`Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}`]);
    sheet.addRow([`Componente analizado: ${this.exportConfig.component}`]);
    sheet.addRow([]);

    if (this.exportConfig.includeTable) {
      if (this.exportConfig.component === 'Todos') {
        sheet.addRow(['ID', 'Fecha', 'Sector', 'Zona', 'Humedad', 'Temperatura', 'Salinidad', 'Conduct.']);
        const headerRow = sheet.getRow(5);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C3D2E' } };

        this.exportReportRows.forEach(row => {
          sheet.addRow([row.id, row.date, row.sector, row.point, row.humedad?.toFixed(2) || '-', row.temperatura?.toFixed(2) || '-', row.salinidad?.toFixed(2) || '-', row.conductividad?.toFixed(2) || '-']);
        });

        sheet.getColumn(1).width = 10;
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 15;
        sheet.getColumn(5).width = 12;
        sheet.getColumn(6).width = 12;
        sheet.getColumn(7).width = 12;
        sheet.getColumn(8).width = 12;
      } else {
        sheet.addRow(['ID', 'Fecha', 'Sector', 'Zona', 'Componente', 'Nivel']);
        const headerRow = sheet.getRow(5);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C3D2E' } };

        this.exportReportRows.forEach(row => {
          sheet.addRow([row.id, row.date, row.sector, row.point, row.component, row.level.toFixed(1)]);
        });

        sheet.getColumn(1).width = 10;
        sheet.getColumn(2).width = 15;
        sheet.getColumn(3).width = 15;
        sheet.getColumn(4).width = 15;
        sheet.getColumn(5).width = 20;
        sheet.getColumn(6).width = 12;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Fairgreen_${new Date().getTime()}.xlsx`);
  }

  private async _generatePDF() {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(this.exportConfig.title, 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);
    doc.text(`Componente: ${this.exportConfig.component}`, 14, 35);
    
    let currentY = 45;

    // Stats
    if (this.exportConfig.includeStats) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Resumen Estadístico', 14, currentY);
      currentY += 8;
      
      const allLevels = this.exportReportRows.map(r => r.level);
      const min = allLevels.length ? Math.min(...allLevels).toFixed(2) : '0.00';
      const max = allLevels.length ? Math.max(...allLevels).toFixed(2) : '0.00';
      const avg = allLevels.length ? (allLevels.reduce((a,b)=>a+b,0)/allLevels.length).toFixed(2) : '0.00';
      
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Promedio Global: ${avg}`, 14, currentY); currentY += 5;
      doc.text(`Nivel Máximo: ${max}`, 14, currentY); currentY += 5;
      doc.text(`Nivel Mínimo: ${min}`, 14, currentY); currentY += 10;
      
      doc.text(`Promedio en Green: ${this.exportAvgGreen.toFixed(2)}`, 100, currentY - 15);
      doc.text(`Promedio en Fairway: ${this.exportAvgFairway.toFixed(2)}`, 100, currentY - 10);
    }

    // Table
    if (this.exportConfig.includeTable) {
      if (this.exportConfig.component === 'Todos') {
        autoTable(doc, {
          startY: currentY,
          head: [['ID', 'Fecha', 'Sector', 'Zona', 'Humedad', 'Temperatura', 'Salinidad', 'Conduct.']],
          body: this.exportReportRows.map(r => [r.id, r.date, r.sector, r.point, r.humedad?.toFixed(2) || '-', r.temperatura?.toFixed(2) || '-', r.salinidad?.toFixed(2) || '-', r.conductividad?.toFixed(2) || '-']),
          theme: 'striped',
          headStyles: { fillColor: [28, 61, 46] }
        });
      } else {
        autoTable(doc, {
          startY: currentY,
          head: [['ID', 'Fecha', 'Sector', 'Zona', 'Componente', 'Nivel']],
          body: this.exportReportRows.map(r => [r.id, r.date, r.sector, r.point, r.component, r.level.toFixed(1)]),
          theme: 'striped',
          headStyles: { fillColor: [28, 61, 46] }
        });
      }
    }

    doc.save(`Reporte_Fairgreen_${new Date().getTime()}.pdf`);
  }
}
