import { Component, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DataService, MuestraFeature } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent {
  private dataService = inject(DataService);

  filtersApplied = signal(false);
  appliedDateFrom = signal('');
  appliedDateTo = signal('');
  appliedZona = signal('');

  filters = {
    dateFrom: '',
    dateTo: '',
    sector: '',
    zona: '',
  };

  // ── Parallel Coordinates Config ──────────────────────────────────────────

  readonly PC_PARAMS = [
    { key: 'humedad'        as 'humedad',        label: 'Humedad',       unit: '1–5',    min: 0, max: 5    },
    { key: 'salinidad'      as 'salinidad',      label: 'Salinidad',     unit: 'dS/m',   min: 0, max: 10   },
    { key: 'conductividad'  as 'conductividad',  label: 'Conductividad', unit: 'µS/cm',  min: 0, max: 2000 },
    { key: 'temperatura'    as 'temperatura',    label: 'Temperatura',   unit: '°C',     min: 0, max: 45   },
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
    component: 'Todos',
    includeStats: true,
    includeTable: true
  };
  exportReportRows: ReportRow[] = [];
  exportAvgGreen = 0;
  exportAvgFairway = 0;

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

        this._processData(features);
        this.tablePage = 1;
        this.filtersApplied.set(true);
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

  private async _generatePDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(this.exportConfig.title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);

    let currentY = 42;

    if (this.exportConfig.includeStats && this.exportConfig.component !== 'Todos') {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Resumen Estadístico', 14, currentY);
      currentY += 8;

      const propKey = this.exportConfig.component.toLowerCase() as keyof ReportRow;
      const allLevels = this.exportReportRows
        .map(r => r[propKey] as number | null | undefined)
        .filter((v): v is number => v != null);

      const min = allLevels.length ? Math.min(...allLevels).toFixed(2) : '—';
      const max = allLevels.length ? Math.max(...allLevels).toFixed(2) : '—';
      const avg = allLevels.length ? (allLevels.reduce((a, b) => a + b, 0) / allLevels.length).toFixed(2) : '—';

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Promedio Global: ${avg}`, 14, currentY); currentY += 5;
      doc.text(`Nivel Máximo: ${max}`, 14, currentY); currentY += 5;
      doc.text(`Nivel Mínimo: ${min}`, 14, currentY); currentY += 10;
      doc.text(`Promedio en Green: ${this.exportAvgGreen.toFixed(2)}`, 100, currentY - 15);
      doc.text(`Promedio en Fairway: ${this.exportAvgFairway.toFixed(2)}`, 100, currentY - 10);
    }

    if (this.exportConfig.includeTable) {
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
        headStyles: { fillColor: [28, 61, 46] }
      });
    }

    doc.save(`Reporte_Fairgreen_${new Date().getTime()}.pdf`);
  }
}
