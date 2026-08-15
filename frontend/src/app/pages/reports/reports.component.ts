import { Component, signal, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataService, MuestraFeature, PuntoCriticoFeature } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Chart, registerables } from 'chart.js';
import html2canvas from 'html2canvas';
Chart.register(...registerables);

const PC_SAMPLE_CAP = 50;

interface ReportRow {
  id: number;
  date: string;
  sector: string;
  point: string;
  humedad?: number | null;
  temperatura?: number | null;
  salinidad?: number | null;
  conductividad?: number | null;
}

interface PcSample {
  feature: MuestraFeature;
  color: string;
  visible: boolean;
}

interface PdfStats {
  total: number;
  dateMin: string;
  dateMax: string;
  humedad: { avg: number; min: number; max: number; count: number };
  temperatura: { avg: number; min: number; max: number; count: number };
  salinidad: { avg: number; min: number; max: number; count: number };
  conductividad: { avg: number; min: number; max: number; count: number };
  byZone: {
    green: { count: number; humedad: number; temperatura: number; salinidad: number; conductividad: number };
    fairway: { count: number; humedad: number; temperatura: number; salinidad: number; conductividad: number };
  };
  bySector: Record<number, number>;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);

  filtersApplied = signal(false);
  appliedDateFrom = signal('');
  appliedDateTo = signal('');
  appliedZona = signal('');

  todosPuntosCriticos: PuntoCriticoFeature[] = [];

  ngOnInit() {
    this.dataService.getTodosPuntosCriticos().subscribe({
      next: (data) => {
        this.todosPuntosCriticos = data.features ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching puntos criticos:', err)
    });
  }

  get puntosCriticosFiltro(): PuntoCriticoFeature[] {
    let pts = this.todosPuntosCriticos;
    if (this.filters.zona) {
      pts = pts.filter(p => p.properties?.id_seccion?.properties?.tipo_de_tierra?.toLowerCase() === this.filters.zona.toLowerCase());
    }
    if (this.filters.sector) {
      const hoyo = parseInt(this.filters.sector, 10);
      pts = pts.filter(p => p.properties?.id_seccion?.properties?.numero_de_hoyo === hoyo);
    }
    return pts;
  }

  get puntosCriticosExport(): PuntoCriticoFeature[] {
    let pts = this.todosPuntosCriticos;
    if (this.exportConfig.zona) {
      pts = pts.filter(p => p.properties?.id_seccion?.properties?.tipo_de_tierra?.toLowerCase() === this.exportConfig.zona.toLowerCase());
    }
    if (this.exportConfig.sector) {
      const hoyo = parseInt(this.exportConfig.sector, 10);
      pts = pts.filter(p => p.properties?.id_seccion?.properties?.numero_de_hoyo === hoyo);
    }
    return pts;
  }

  filters = {
    dateFrom: '',
    dateTo: '',
    sector: '',
    zona: '',
    puntoCritico: '',
  };

  // ── Parallel Coordinates Config ──────────────────────────────────────────

  readonly PC_PARAMS = [
    { key: 'humedad' as 'humedad', label: 'Humedad', unit: '1–5', min: 0, max: 5 },
    { key: 'salinidad' as 'salinidad', label: 'Salinidad', unit: 'dS/m', min: 0, max: 10 },
    { key: 'conductividad' as 'conductividad', label: 'Conductividad', unit: 'CE', min: 0, max: 2000 },
    { key: 'temperatura' as 'temperatura', label: 'Temperatura', unit: '°C', min: 0, max: 45 },
  ];

  // Customizable axes — user can toggle params on/off
  pcActiveKeys = new Set<string>(['humedad', 'salinidad', 'conductividad', 'temperatura']);

  get pcActiveParams() {
    return this.PC_PARAMS.filter(p => this.pcActiveKeys.has(p.key));
  }

  pcToggleParam(key: string) {
    // Prevent deactivating all — must keep at least 2
    if (this.pcActiveKeys.has(key)) {
      if (this.pcActiveKeys.size > 2) {
        this.pcActiveKeys.delete(key);
      }
    } else {
      this.pcActiveKeys.add(key);
    }
    // Force change detection by reassigning the set
    this.pcActiveKeys = new Set(this.pcActiveKeys);
  }

  pcIsParamActive(key: string): boolean {
    return this.pcActiveKeys.has(key);
  }

  // SVG dimensions
  readonly PC_W = 700;
  readonly PC_H = 300;
  readonly PC_MARGIN = { top: 52, right: 40, bottom: 30, left: 40 };

  // Palette: gradient-based hue rotation in the green/teal/earth spectrum
  private _buildPalette(n: number): string[] {
    const colors: string[] = [];
    // Sweep from hue 90° (yellow-green) to 210° (teal/cyan) then back through
    // warm accent tones — all at medium-dark saturation matching the brand.
    for (let i = 0; i < n; i++) {
      const t = n <= 1 ? 0 : i / (n - 1);
      // Hue goes 120 → 185 (green → teal) for the first 60%, then 185 → 80 (teal → lime)
      let hue: number;
      if (t < 0.6) {
        hue = 120 + t * (185 - 120) / 0.6;
      } else {
        hue = 185 + (t - 0.6) * (80 - 185) / 0.4;
      }
      // Vary lightness slightly so adjacent lines are distinguishable
      const l = 28 + (i % 3) * 10; // 28 / 38 / 48 %
      const s = 55 + (i % 2) * 15; // 55 / 70 %
      colors.push(`hsl(${Math.round(hue)},${s}%,${l}%)`);
    }
    return colors;
  }

  // State
  pcSamples: PcSample[] = [];
  pcHoveredId: number | null = null;
  pcCappedCount = 0;    // original count before cap (for info banner)
  pcTotalCount = 0;

  // Legend dropdown state
  legendDropdownOpen = false;

  toggleLegendDropdown() {
    this.legendDropdownOpen = !this.legendDropdownOpen;
  }

  closeLegendDropdown() {
    this.legendDropdownOpen = false;
  }

  pcShowAll() {
    this.pcSamples.forEach(s => s.visible = true);
  }

  pcHideAll() {
    this.pcSamples.forEach(s => s.visible = false);
  }

  get pcVisibleCount(): number {
    return this.pcSamples.filter(s => s.visible).length;
  }

  // Tooltip
  pcTooltip: {
    show: boolean;
    x: number;
    y: number;
    sample: MuestraFeature | null;
  } = { show: false, x: 0, y: 0, sample: null };

  // Data table
  reportRows: ReportRow[] = [];

  // Table pagination
  readonly TABLE_PAGE_SIZE = 25;
  tablePage = 1;

  get tablePageCount(): number {
    return Math.ceil(this.reportRows.length / this.TABLE_PAGE_SIZE) || 1;
  }

  get pagedRows(): ReportRow[] {
    const start = (this.tablePage - 1) * this.TABLE_PAGE_SIZE;
    return this.reportRows.slice(start, start + this.TABLE_PAGE_SIZE);
  }

  get tablePageNumbers(): number[] {
    const total = this.tablePageCount;
    const current = this.tablePage;
    const pages: number[] = [];
    // Show max 7 page buttons with ellipsis logic handled in template
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.tablePageCount) {
      this.tablePage = page;
    }
  }

  // Export modal
  showExportModal = signal(false);
  isExporting = signal(false);
  exportConfig = {
    format: 'pdf',
    title: 'Reporte de Análisis',
    dateFrom: '',
    dateTo: '',
    sector: '',
    zona: '',
    puntoCritico: '',
    component: 'Todos',
    includeStats: true,
    includeTable: true
  };
  exportReportRows: ReportRow[] = [];
  exportAvgGreen = 0;
  exportAvgFairway = 0;
  private _rawExportFeatures: MuestraFeature[] = [];

  // ── Helpers ──────────────────────────────────────────────────────────────

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

  validateDates(type: 'filter' | 'export') {
    if (type === 'filter') {
      if (this.filters.dateFrom && this.filters.dateTo && this.filters.dateFrom > this.filters.dateTo) {
        this.filters.dateTo = this.filters.dateFrom;
      }
    } else {
      if (this.exportConfig.dateFrom && this.exportConfig.dateTo && this.exportConfig.dateFrom > this.exportConfig.dateTo) {
        this.exportConfig.dateTo = this.exportConfig.dateFrom;
      }
    }
  }

  // ── Parallel Coordinates — geometry ──────────────────────────────────────

  pcAxisX(index: number): number {
    const innerW = this.PC_W - this.PC_MARGIN.left - this.PC_MARGIN.right;
    const nAxes = this.pcActiveParams.length;
    if (nAxes <= 1) return this.PC_MARGIN.left + innerW / 2;
    return this.PC_MARGIN.left + (index / (nAxes - 1)) * innerW;
  }

  private pcValueY(normalizedVal: number): number {
    const innerH = this.PC_H - this.PC_MARGIN.top - this.PC_MARGIN.bottom;
    return this.PC_MARGIN.top + (1 - normalizedVal) * innerH;
  }

  private pcNormalize(value: number | null | undefined, min: number, max: number): number {
    if (value == null) return 0;
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
  }

  pcBuildPath(feature: MuestraFeature): string {
    const props = feature.properties;
    const active = this.pcActiveParams;
    const points = active.map((p, i) => ({
      x: this.pcAxisX(i),
      y: this.pcValueY(this.pcNormalize(props[p.key], p.min, p.max)),
    }));
    if (points.length === 0) return '';
    if (points.length === 1) {
      // Single axis — draw a dot-like short horizontal stroke
      return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} L ${(points[0].x + 0.1).toFixed(2)} ${points[0].y.toFixed(2)}`;
    }
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const mx = ((points[i].x + points[i + 1].x) / 2).toFixed(2);
      d += ` C ${mx} ${points[i].y.toFixed(2)}, ${mx} ${points[i + 1].y.toFixed(2)}, ${points[i + 1].x.toFixed(2)} ${points[i + 1].y.toFixed(2)}`;
    }
    return d;
  }

  pcTickY(param: typeof this.PC_PARAMS[0], tick: 'min' | 'max'): number {
    return tick === 'max' ? this.PC_MARGIN.top : this.PC_H - this.PC_MARGIN.bottom;
  }

  // ── Parallel Coordinates — interactivity ─────────────────────────────────

  pcOnLineEnter(sampleId: number, event: MouseEvent) {
    this.pcHoveredId = sampleId;
    const sample = this.pcSamples.find(s => s.feature.id === sampleId);
    if (sample) {
      this.pcTooltip = {
        show: true,
        x: (event as any).layerX ?? event.offsetX,
        y: (event as any).layerY ?? event.offsetY,
        sample: sample.feature,
      };
    }
  }

  pcOnLineMove(event: MouseEvent) {
    if (this.pcTooltip.show) {
      this.pcTooltip = {
        ...this.pcTooltip,
        x: (event as any).layerX ?? event.offsetX,
        y: (event as any).layerY ?? event.offsetY,
      };
    }
  }

  pcOnLineLeave() {
    this.pcHoveredId = null;
    this.pcTooltip = { ...this.pcTooltip, show: false, sample: null };
  }

  pcToggleSample(sampleId: number) {
    const s = this.pcSamples.find(s => s.feature.id === sampleId);
    if (s) s.visible = !s.visible;
  }

  pcLineOpacity(sampleId: number): string {
    if (this.pcHoveredId === null) return '0.62';
    return sampleId === this.pcHoveredId ? '1' : '0.06';
  }

  pcLineWidth(sampleId: number): number {
    return sampleId === this.pcHoveredId ? 3.5 : 1.8;
  }

  pcTooltipValue(param: typeof this.PC_PARAMS[0]): string {
    const val = this.pcTooltip.sample?.properties[param.key];
    return val != null ? val.toFixed(param.key === 'conductividad' ? 0 : 2) : '—';
  }

  pcSampleLabel(feature: MuestraFeature): string {
    const p = feature.properties;
    const tipo = p.id_seccion?.properties?.tipo_de_tierra ?? '?';
    const hoyo = p.id_seccion?.properties?.numero_de_hoyo ?? '?';
    return `#${feature.id} · ${tipo} H${hoyo}`;
  }

  // ── Filters & data processing ─────────────────────────────────────────────

  applyFilters() {
    this.dataService.getMuestras(1, 500).subscribe({
      next: (geoJson) => {
        this.appliedDateFrom.set(this.filters.dateFrom);
        this.appliedDateTo.set(this.filters.dateTo);
        this.appliedZona.set(this.filters.zona);

        let features = geoJson.features ?? [];

        if (this.filters.dateFrom) {
          features = features.filter(f => f.properties.fecha_hora_captura.substring(0, 10) >= this.filters.dateFrom);
        }
        if (this.filters.dateTo) {
          features = features.filter(f => f.properties.fecha_hora_captura.substring(0, 10) <= this.filters.dateTo);
        }
        if (this.filters.sector) {
          features = features.filter(f => f.properties.id_seccion?.properties?.numero_de_hoyo === parseInt(this.filters.sector));
        }
        if (this.filters.zona) {
          features = features.filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra.toLowerCase() === this.filters.zona.toLowerCase());
        }
        if (this.filters.puntoCritico) {
          const pcId = parseInt(this.filters.puntoCritico);
          features = features.filter(f => {
            const pc = f.properties.id_punto_critico;
            if (!pc) return false;
            return typeof pc === 'object' ? pc.id_punto_critico === pcId : pc === pcId;
          });
        }

        this._processData(features);
        this.tablePage = 1;
        this.filtersApplied.set(true);
        this.cdr.detectChanges();
      }
    });
  }

  private _processData(features: MuestraFeature[]) {
    this.pcTotalCount = features.length;

    // Sort newest first, then cap
    const sorted = [...features].sort(
      (a, b) => new Date(b.properties.fecha_hora_captura).getTime()
        - new Date(a.properties.fecha_hora_captura).getTime()
    );
    const capped = sorted.slice(0, PC_SAMPLE_CAP);
    this.pcCappedCount = sorted.length > PC_SAMPLE_CAP ? PC_SAMPLE_CAP : sorted.length;

    // Build palette — gradient hue rotation over the green/teal spectrum
    const palette = this._buildPalette(capped.length);

    this.pcSamples = capped.map((f, i) => ({
      feature: f,
      color: palette[i],
      visible: true,
    }));

    // Data table — all four columns, newest first
    this.reportRows = capped.map(f => {
      const p = f.properties;
      return {
        id: f.id,
        date: new Date(p.fecha_hora_captura).toLocaleDateString('es-CL'),
        sector: `Sector ${p.id_seccion?.properties?.numero_de_hoyo ?? 0}`,
        point: `${p.id_seccion?.properties?.tipo_de_tierra ?? 'Z'}`,
        humedad: p.humedad,
        temperatura: p.temperatura,
        salinidad: p.salinidad,
        conductividad: p.conductividad,
      };
    });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  openExportModal() {
    this.exportConfig = {
      format: 'pdf',
      title: 'Reporte de Análisis Histórico',
      dateFrom: this.filters.dateFrom,
      dateTo: this.filters.dateTo,
      sector: this.filters.sector,
      zona: this.filters.zona,
      puntoCritico: this.filters.puntoCritico,
      component: 'Todos',
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
        if (this.exportConfig.puntoCritico) {
          const pcId = parseInt(this.exportConfig.puntoCritico);
          features = features.filter(f => {
            const pc = f.properties.id_punto_critico;
            if (!pc) return false;
            return typeof pc === 'object' ? pc.id_punto_critico === pcId : pc === pcId;
          });
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

  private _processExportData(features: MuestraFeature[]) {
    this._rawExportFeatures = features;
    const sorted = [...features].sort(
      (a, b) => new Date(b.properties.fecha_hora_captura).getTime()
        - new Date(a.properties.fecha_hora_captura).getTime()
    );

    this.exportReportRows = sorted.map(f => {
      const p = f.properties;
      return {
        id: f.id,
        date: new Date(p.fecha_hora_captura).toLocaleDateString('es-CL'),
        sector: `Sector ${p.id_seccion?.properties?.numero_de_hoyo ?? 0}`,
        point: `${p.id_seccion?.properties?.tipo_de_tierra ?? 'Z'}`,
        humedad: p.humedad,
        temperatura: p.temperatura,
        salinidad: p.salinidad,
        conductividad: p.conductividad,
      };
    });

    const comp = this.exportConfig.component;
    if (comp !== 'Todos') {
      const propKey = comp.toLowerCase() as 'humedad' | 'temperatura' | 'salinidad' | 'conductividad';
      const greenVals = features
        .filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'GREEN')
        .map(f => f.properties[propKey])
        .filter((v): v is number => v != null);
      const fairwayVals = features
        .filter(f => f.properties.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'FAIRWAY')
        .map(f => f.properties[propKey])
        .filter((v): v is number => v != null);
      this.exportAvgGreen = greenVals.length ? greenVals.reduce((a, b) => a + b, 0) / greenVals.length : 0;
      this.exportAvgFairway = fairwayVals.length ? fairwayVals.reduce((a, b) => a + b, 0) / fairwayVals.length : 0;
    }
  }

  private async _generateExcel() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Reporte');

    sheet.addRow([this.exportConfig.title]);
    sheet.getRow(1).font = { bold: true, size: 16 };
    sheet.addRow([`Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}`]);
    sheet.addRow([]);

    if (this.exportConfig.includeTable) {
      sheet.addRow(['ID', 'Fecha', 'Sector', 'Zona', 'Humedad', 'Temperatura', 'Salinidad', 'Conduct.']);
      const headerRow = sheet.getRow(4);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C3D2E' } };

      this.exportReportRows.forEach(row => {
        sheet.addRow([
          row.id, row.date, row.sector, row.point,
          row.humedad?.toFixed(2) ?? '-',
          row.temperatura?.toFixed(2) ?? '-',
          row.salinidad?.toFixed(2) ?? '-',
          row.conductividad?.toFixed(0) ?? '-',
        ]);
      });

      [10, 15, 15, 12, 12, 12, 12, 12].forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Reporte_Fairgreen_${new Date().getTime()}.xlsx`);
  }

  private _loadLogoBase64(): Promise<{ data: string, width: number, height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = 'assets/logo-fairgreen.png';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve({ data: canvas.toDataURL('image/png'), width: img.width, height: img.height });
        } else {
          resolve({ data: '', width: 0, height: 0 });
        }
      };
      img.onerror = () => resolve({ data: '', width: 0, height: 0 });
    });
  }

  private async _captureSvgToCanvas(): Promise<string> {
    const el = document.getElementById('pc-svg-chart');
    if (!el) return '';
    try {
      const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 1.5 });
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      console.error(e);
      return '';
    }
  }

  private async _renderChartToBase64(config: any): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 300;
      document.body.appendChild(canvas);
      canvas.style.display = 'none';

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      const chart = new Chart(ctx, {
        ...config,
        options: {
          ...config.options,
          animation: false,
          responsive: false,
        },
        plugins: [
          ...(config.plugins ? [config.plugins] : []), // Chart.js 3+ might expect array, but here config.plugins is usually not an array, wait, our config doesn't have a top-level plugins array. It's under options.plugins. We can just add it globally or in the array.
          {
            id: 'whiteBackground',
            beforeDraw: (c) => {
              const ctx = c.ctx;
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, c.width, c.height);
              ctx.restore();
            }
          }
        ]
      });

      setTimeout(() => {
        const base64 = chart.toBase64Image('image/jpeg', 0.8);
        chart.destroy();
        canvas.remove();
        resolve(base64);
      }, 50);
    });
  }

  private _addPageHeaderFooter(doc: jsPDF, pageNum: number, totalPages: number, logo: { data: string, width: number, height: number }) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header
    if (logo.data) {
      const targetHeight = 12;
      const targetWidth = targetHeight * (logo.width / logo.height);
      doc.addImage(logo.data, 'PNG', 14, 10, targetWidth, targetHeight);
    }

    doc.setFontSize(12);
    doc.setTextColor(28, 61, 46);
    doc.setFont("helvetica", "bold");
    doc.text('Reporte FairGreen', pageWidth - 14, 18, { align: 'right' });

    doc.setDrawColor(76, 175, 125);
    doc.setLineWidth(0.5);
    doc.line(14, 25, pageWidth - 14, 25);

    // Footer
    doc.setDrawColor(221, 229, 223);
    doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

    doc.setFontSize(9);
    doc.setTextColor(143, 168, 149);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString('es-CL');
    doc.text(`FairGreen · Generado automáticamente el ${dateStr}`, 14, pageHeight - 14);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 14, pageHeight - 14, { align: 'right' });
  }

  private _computeStats(features: MuestraFeature[]): PdfStats {
    const stats: PdfStats = {
      total: features.length,
      dateMin: '',
      dateMax: '',
      humedad: { avg: 0, min: Infinity, max: -Infinity, count: 0 },
      temperatura: { avg: 0, min: Infinity, max: -Infinity, count: 0 },
      salinidad: { avg: 0, min: Infinity, max: -Infinity, count: 0 },
      conductividad: { avg: 0, min: Infinity, max: -Infinity, count: 0 },
      byZone: {
        green: { count: 0, humedad: 0, temperatura: 0, salinidad: 0, conductividad: 0 },
        fairway: { count: 0, humedad: 0, temperatura: 0, salinidad: 0, conductividad: 0 }
      },
      bySector: {}
    };

    if (features.length === 0) return stats;

    let dateMin = new Date(features[0].properties.fecha_hora_captura).getTime();
    let dateMax = dateMin;

    const sums = {
      humedad: 0, temperatura: 0, salinidad: 0, conductividad: 0,
      green: { humedad: 0, temperatura: 0, salinidad: 0, conductividad: 0 },
      fairway: { humedad: 0, temperatura: 0, salinidad: 0, conductividad: 0 }
    };

    features.forEach(f => {
      const p = f.properties;
      const t = new Date(p.fecha_hora_captura).getTime();
      if (t < dateMin) dateMin = t;
      if (t > dateMax) dateMax = t;

      const sector = p.id_seccion?.properties?.numero_de_hoyo ?? 0;
      stats.bySector[sector] = (stats.bySector[sector] || 0) + 1;

      const isGreen = p.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'GREEN';
      const isFairway = p.id_seccion?.properties?.tipo_de_tierra?.toUpperCase() === 'FAIRWAY';

      if (isGreen) stats.byZone.green.count++;
      if (isFairway) stats.byZone.fairway.count++;

      const processParam = (key: 'humedad' | 'temperatura' | 'salinidad' | 'conductividad') => {
        const val = p[key];
        if (val != null) {
          stats[key].count++;
          sums[key] += val;
          if (val < stats[key].min) stats[key].min = val;
          if (val > stats[key].max) stats[key].max = val;

          if (isGreen) sums.green[key] += val;
          if (isFairway) sums.fairway[key] += val;
        }
      };

      processParam('humedad');
      processParam('temperatura');
      processParam('salinidad');
      processParam('conductividad');
    });

    stats.dateMin = new Date(dateMin).toLocaleDateString('es-CL');
    stats.dateMax = new Date(dateMax).toLocaleDateString('es-CL');

    const finalizeParam = (key: 'humedad' | 'temperatura' | 'salinidad' | 'conductividad') => {
      if (stats[key].count > 0) {
        stats[key].avg = sums[key] / stats[key].count;
      } else {
        stats[key].min = 0;
        stats[key].max = 0;
      }
      if (stats.byZone.green.count > 0) stats.byZone.green[key] = sums.green[key] / stats.byZone.green.count;
      if (stats.byZone.fairway.count > 0) stats.byZone.fairway[key] = sums.fairway[key] / stats.byZone.fairway.count;
    };

    finalizeParam('humedad');
    finalizeParam('temperatura');
    finalizeParam('salinidad');
    finalizeParam('conductividad');

    return stats;
  }

  private _buildExecutiveSummary(doc: jsPDF, stats: PdfStats, currentY: number): number {
    doc.setFontSize(14);
    doc.setTextColor(28, 61, 46);
    doc.setFont("helvetica", "bold");
    doc.text('RESUMEN EJECUTIVO', 14, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(90, 112, 96);
    doc.setFont("helvetica", "normal");

    let text = `Durante el período analizado se registraron ${stats.total} muestras de suelo. `;
    if (stats.humedad.count > 0) text += `La humedad promedio fue de ${stats.humedad.avg.toFixed(1)} (escala 1-5), `;
    if (stats.temperatura.count > 0) text += `la temperatura promedio de ${stats.temperatura.avg.toFixed(1)}°C, `;
    if (stats.salinidad.count > 0) text += `la salinidad promedio de ${stats.salinidad.avg.toFixed(2)} dS/m `;
    if (stats.conductividad.count > 0) text += `y la conductividad promedio de ${stats.conductividad.avg.toFixed(0)} CE.`;

    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 14, currentY);
    currentY += (splitText.length * 5) + 10;

    // Draw KPI Cards
    const cardWidth = 42;
    const cardHeight = 28;
    const gap = 6;
    const startX = 14;

    const drawCard = (x: number, y: number, title: string, avg: string, min: string, max: string) => {
      doc.setDrawColor(221, 229, 223);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(28, 61, 46);
      doc.setFont("helvetica", "bold");
      doc.text(title, x + 4, y + 6);

      doc.setFontSize(12);
      doc.setTextColor(76, 175, 125);
      doc.text(avg, x + 4, y + 14);

      doc.setFontSize(8);
      doc.setTextColor(143, 168, 149);
      doc.setFont("helvetica", "normal");
      doc.text(`Min: ${min}  Max: ${max}`, x + 4, y + 22);
    };

    drawCard(startX, currentY, 'Humedad', stats.humedad.count ? stats.humedad.avg.toFixed(1) : '-', stats.humedad.count ? stats.humedad.min.toFixed(1) : '-', stats.humedad.count ? stats.humedad.max.toFixed(1) : '-');
    drawCard(startX + cardWidth + gap, currentY, 'Temperatura', stats.temperatura.count ? `${stats.temperatura.avg.toFixed(1)}°C` : '-', stats.temperatura.count ? `${stats.temperatura.min.toFixed(1)}°C` : '-', stats.temperatura.count ? `${stats.temperatura.max.toFixed(1)}°C` : '-');
    drawCard(startX + (cardWidth + gap) * 2, currentY, 'Salinidad', stats.salinidad.count ? `${stats.salinidad.avg.toFixed(2)}` : '-', stats.salinidad.count ? `${stats.salinidad.min.toFixed(2)}` : '-', stats.salinidad.count ? `${stats.salinidad.max.toFixed(2)}` : '-');
    drawCard(startX + (cardWidth + gap) * 3, currentY, 'Conductividad', stats.conductividad.count ? `${stats.conductividad.avg.toFixed(0)}` : '-', stats.conductividad.count ? `${stats.conductividad.min.toFixed(0)}` : '-', stats.conductividad.count ? `${stats.conductividad.max.toFixed(0)}` : '-');

    return currentY + cardHeight + 15;
  }

  private _buildZoneComparisonChartConfig(paramKey: 'humedad' | 'temperatura' | 'salinidad' | 'conductividad', label: string, stats: PdfStats): any {
    return {
      type: 'bar',
      data: {
        labels: ['Green', 'Fairway'],
        datasets: [{
          data: [
            stats.byZone.green[paramKey],
            stats.byZone.fairway[paramKey]
          ],
          backgroundColor: ['#1C3D2E', '#4CAF7D'],
          borderRadius: 4
        }]
      },
      options: {
        plugins: {
          legend: { display: false },
          title: { display: true, text: label, font: { size: 12 }, color: '#1C3D2E' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  private _buildSectorDistributionChart(stats: PdfStats): any {
    const sectors = Object.keys(stats.bySector).map(Number).sort((a, b) => a - b);
    const counts = sectors.map(s => stats.bySector[s]);

    return {
      type: 'bar',
      data: {
        labels: sectors.map(s => `Sector ${s}`),
        datasets: [{
          label: 'Cantidad de Muestras',
          data: counts,
          backgroundColor: '#4CAF7D',
          borderRadius: 4
        }]
      },
      options: {
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    };
  }

  private async _generatePDF() {
    const doc = new jsPDF();
    const logoData = await this._loadLogoBase64();
    const stats = this._computeStats(this._rawExportFeatures);

    // --- PAGE 1: PORTADA & RESUMEN ---
    let currentY = 35;

    doc.setFontSize(22);
    doc.setTextColor(28, 61, 46);
    doc.setFont("helvetica", "bold");
    doc.text(this.exportConfig.title, 14, currentY);
    currentY += 8;

    doc.setFontSize(14);
    doc.setTextColor(90, 112, 96);
    doc.setFont("helvetica", "normal");
    doc.text('Club de Golf FairGreen', 14, currentY);
    currentY += 12;

    doc.setFontSize(11);
    doc.setTextColor(26, 46, 32);
    const dateRange = this.exportConfig.dateFrom || this.exportConfig.dateTo
      ? `Período: ${this.exportConfig.dateFrom ? new Date(this.exportConfig.dateFrom).toLocaleDateString('es-CL') : 'Inicio'} — ${this.exportConfig.dateTo ? new Date(this.exportConfig.dateTo).toLocaleDateString('es-CL') : 'Fin'}`
      : `Período: Todas las fechas (${stats.dateMin} — ${stats.dateMax})`;
    doc.text(dateRange, 14, currentY); currentY += 6;
    doc.text(`Zona: ${this.exportConfig.zona || 'Todas'}  ·  Sector: ${this.exportConfig.sector || 'Todos'}`, 14, currentY); currentY += 6;
    doc.text(`Total de muestras: ${stats.total}`, 14, currentY); currentY += 14;

    if (this.exportConfig.includeStats && stats.total > 0) {
      currentY = this._buildExecutiveSummary(doc, stats, currentY);
    }

    // --- PAGE 2: GRÁFICOS COMPARATIVOS ---
    if (this.exportConfig.includeStats && stats.total > 0) {
      doc.addPage();
      currentY = 35;

      doc.setFontSize(14);
      doc.setTextColor(28, 61, 46);
      doc.setFont("helvetica", "bold");
      doc.text('ANÁLISIS COMPARATIVO POR ZONA', 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(90, 112, 96);
      doc.setFont("helvetica", "normal");
      doc.text('A continuación se presenta la comparación de los promedios entre zonas Green y Fairway.', 14, currentY);
      currentY += 10;

      // 1x4 Stack (1 per row) to make charts larger
      const chartWidth = 160;
      const chartHeight = 70;
      const x1 = 14;
      let yGrid = currentY;

      const chartHConfig = this._buildZoneComparisonChartConfig('humedad', 'Humedad (1-5)', stats);
      const chartTConfig = this._buildZoneComparisonChartConfig('temperatura', 'Temperatura (°C)', stats);
      const chartSConfig = this._buildZoneComparisonChartConfig('salinidad', 'Salinidad (dS/m)', stats);
      const chartCConfig = this._buildZoneComparisonChartConfig('conductividad', 'Conductividad (CE)', stats);

      const [chartH, chartT, chartS, chartC] = await Promise.all([
        this._renderChartToBase64(chartHConfig),
        this._renderChartToBase64(chartTConfig),
        this._renderChartToBase64(chartSConfig),
        this._renderChartToBase64(chartCConfig)
      ]);

      if (chartH) {
        doc.addImage(chartH, 'JPEG', x1, yGrid, chartWidth, chartHeight);
        yGrid += chartHeight + 10;
      }
      if (chartT) {
        doc.addImage(chartT, 'JPEG', x1, yGrid, chartWidth, chartHeight);
        yGrid += chartHeight + 10;
      }

      // Page break for the next two charts
      doc.addPage();
      yGrid = 35;
      doc.setFontSize(14);
      doc.setTextColor(28, 61, 46);
      doc.setFont("helvetica", "bold");
      doc.text('ANÁLISIS COMPARATIVO POR ZONA (Cont.)', 14, yGrid);
      yGrid += 12;

      if (chartS) {
        doc.addImage(chartS, 'JPEG', x1, yGrid, chartWidth, chartHeight);
        yGrid += chartHeight + 10;
      }
      if (chartC) {
        doc.addImage(chartC, 'JPEG', x1, yGrid, chartWidth, chartHeight);
        yGrid += chartHeight + 10;
      }

      // Page break for sector distribution to give it full space
      doc.addPage();
      currentY = 35;

      doc.setFontSize(14);
      doc.setTextColor(28, 61, 46);
      doc.setFont("helvetica", "bold");
      doc.text('CANTIDAD DE MUESTRAS POR SECTOR', 14, currentY);
      currentY += 8;

      const chartSectorConfig = this._buildSectorDistributionChart(stats);
      const chartSectorBase64 = await this._renderChartToBase64(chartSectorConfig);
      if (chartSectorBase64) {
        doc.addImage(chartSectorBase64, 'JPEG', 14, currentY, 160, 80);
      }
    }

    // --- PAGE 3: COORDENADAS PARALELAS ---
    if (this.exportConfig.includeStats && stats.total > 0) {
      const pcBase64 = await this._captureSvgToCanvas();
      if (pcBase64) {
        doc.addPage();
        currentY = 35;
        doc.setFontSize(14);
        doc.setTextColor(28, 61, 46);
        doc.setFont("helvetica", "bold");
        doc.text('RELACIÓN ENTRE PARÁMETROS (COORDENADAS PARALELAS)', 14, currentY);
        currentY += 8;

        doc.setFontSize(11);
        doc.setTextColor(90, 112, 96);
        doc.setFont("helvetica", "normal");
        doc.text('Este gráfico muestra la correlación individual de las muestras a través de todos los parámetros.', 14, currentY);
        currentY += 10;

        doc.addImage(pcBase64, 'JPEG', 14, currentY, 180, 80);
      }
    }

    // --- PAGE 4+: TABLA DE DATOS ---
    if (this.exportConfig.includeTable && stats.total > 0) {
      doc.addPage();
      currentY = 35;

      doc.setFontSize(14);
      doc.setTextColor(28, 61, 46);
      doc.setFont("helvetica", "bold");
      doc.text('DETALLE DE MUESTRAS', 14, currentY);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['ID', 'Fecha', 'Sector', 'Zona', 'Humedad', 'Temp.', 'Salinidad', 'Conduct.']],
        body: this.exportReportRows.map(r => [
          r.id, r.date, r.sector, r.point,
          r.humedad?.toFixed(2) ?? '-',
          r.temperatura?.toFixed(2) ?? '-',
          r.salinidad?.toFixed(2) ?? '-',
          r.conductividad?.toFixed(0) ?? '-',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [28, 61, 46] },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [244, 246, 245] },
        margin: { top: 30 }
      });
    }

    // --- ADD HEADER/FOOTER TO ALL PAGES ---
    const totalPdfPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPdfPages; i++) {
      doc.setPage(i);
      this._addPageHeaderFooter(doc, i, totalPdfPages, logoData);
    }

    doc.save(`Reporte_Fairgreen_${new Date().getTime()}.pdf`);
  }
}
