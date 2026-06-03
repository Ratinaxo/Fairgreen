import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService, MuestraFeature } from '../../services/data.service';

interface SampleRow {
  id: number;
  date: string;
  humidity: number;
  temperature: number;
  conductivity: number;
  salinity: number;
  responsible: string;
  zona: string;
  sector: number;
  rawFeature: MuestraFeature;
}

@Component({
  selector: 'app-sample-history',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="history-page">
      <!-- Header -->
      <div class="page-header d-flex align-center justify-between">
        <h1 style="font-family:var(--font-display);font-size:24px;">Historial de Muestras</h1>
      </div>

      <!-- Filters card -->
      <div class="card filter-card">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:8px;">
            <label for="filter-sector" style="font-size:12px;font-weight:500;color:var(--color-text-secondary);white-space:nowrap;">Sector:</label>
            <div class="select-wrapper" style="width:120px;">
              <select id="filter-sector" class="form-control" [(ngModel)]="filterSector" aria-label="Filtrar por sector">
                <option value="">Todos</option>
                @for (s of sectorOptions; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <label for="filter-zona" style="font-size:12px;font-weight:500;color:var(--color-text-secondary);white-space:nowrap;">Zona:</label>
            <div class="select-wrapper" style="width:140px;">
              <select id="filter-zona" class="form-control" [(ngModel)]="filterZona" aria-label="Filtrar por zona">
                <option value="">Todas</option>
                <option>Green</option>
                <option>Fairway</option>
              </select>
            </div>
          </div>
          <button class="btn-primary" id="apply-filters-btn" (click)="loadPage(1)">Aplicar</button>
          <button class="btn-text" (click)="clearFilters()">Limpiar</button>
        </div>
      </div>

      <!-- Results subtitle -->
      <div style="margin: 16px 0 12px;">
        <span style="font-size:18px;font-weight:600;color:var(--color-text-primary);">
          {{ filterSector ? 'Sector ' + filterSector : 'Todos los sectores' }}
          {{ filterZona ? ' · ' + filterZona : '' }}
        </span>
        <span style="font-size:13px;color:var(--color-text-muted);margin-left:8px;">
          @if (isLoading()) { Cargando... } @else { {{ totalCount() }} Muestras }
        </span>
      </div>

      <!-- Table card -->
      <div class="card" style="overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--color-border);">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="color:var(--color-text-muted);" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            <span style="font-size:14px;font-weight:600;color:var(--color-text-primary);">Registros Recientes</span>
          </div>
          <button class="btn-outline" id="export-btn" style="height:32px;font-size:12px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Exportar
          </button>
        </div>

        @if (isLoading()) {
          <div style="padding:40px;text-align:center;color:var(--color-text-muted);">
            <span>Cargando muestras...</span>
          </div>
        } @else if (rows().length === 0) {
          <div style="padding:40px;text-align:center;color:var(--color-text-muted);">
            No hay muestras registradas.
          </div>
        } @else {
          <div style="overflow-x:auto;">
            <table class="data-table" aria-label="Historial de muestras">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Humedad</th>
                  <th scope="col">Temperatura (°C)</th>
                  <th scope="col">Conductividad</th>
                  <th scope="col">Salinidad</th>
                  <th scope="col">Responsable</th>
                  <th scope="col"><span class="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody>
                @for (sample of rows(); track sample.id) {
                  <tr>
                    <td>
                      <span style="font-size:13px;font-weight:500;">{{ sample.date }}</span>
                      <div style="font-size:11px;color:var(--color-text-muted);">Sector {{ sample.sector }} · {{ sample.zona }}</div>
                    </td>
                    <td class="mono">{{ sample.humidity.toFixed(1) }}</td>
                    <td class="mono">{{ sample.temperature.toFixed(1) }}</td>
                    <td class="mono">{{ sample.conductivity.toFixed(2) }}</td>
                    <td class="mono">{{ sample.salinity.toFixed(2) }}</td>
                    <td style="color:var(--color-text-secondary);">{{ sample.responsible }}</td>
                    <td style="display:flex;gap:6px;">
                      <button
                        class="btn-outline"
                        style="height:30px;font-size:12px;padding:0 8px;"
                        [attr.aria-label]="'Ver en mapa muestra del ' + sample.date"
                        (click)="viewInMap(sample.id)"
                      >Ver en Mapa</button>
                      <button
                        class="btn-primary"
                        style="height:30px;font-size:12px;padding:0 8px;"
                        [attr.aria-label]="'Ver detalle muestra del ' + sample.date"
                        (click)="openDetailModal(sample.rawFeature)"
                      >Ver Detalle</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- Pagination -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--color-border);">
          <span style="font-size:12px;color:var(--color-text-muted);">
            Página {{ currentPage() }} de {{ totalPages() }} · {{ totalCount() }} registros
          </span>
          <div style="display:flex;gap:6px;">
            <button
              class="page-btn"
              id="prev-page-btn"
              (click)="loadPage(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              aria-label="Página anterior"
            >‹</button>
            @for (p of pageNumbers(); track p) {
              <button
                class="page-btn"
                [class.active]="p === currentPage()"
                (click)="loadPage(p)"
                [attr.aria-label]="'Página ' + p"
                [attr.aria-current]="p === currentPage() ? 'page' : null"
              >{{ p }}</button>
            }
            <button
              class="page-btn"
              id="next-page-btn"
              (click)="loadPage(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              aria-label="Página siguiente"
            >›</button>
          </div>
        </div>
      </div>

      <!-- Sample Detail Modal -->
      @if (selectedFeature()) {
        <div class="modal-overlay" (click)="closeDetailModal()" role="dialog" aria-modal="true">
          <div class="modal-card" style="max-width:500px;text-align:left;padding:24px;" (click)="$event.stopPropagation()">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h3 style="font-family:var(--font-display);font-size:20px;margin:0;">Detalle de Muestra</h3>
              <button class="btn-text" (click)="closeDetailModal()" style="padding:4px;min-width:auto;">✕</button>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
              <div><span style="font-size:12px;color:var(--color-text-muted);">Fecha</span><div style="font-weight:500;">{{ formatFecha(selectedFeature()!.properties.fecha_hora_captura) }}</div></div>
              <div><span style="font-size:12px;color:var(--color-text-muted);">Ubicación</span><div style="font-weight:500;">{{ selectedFeature()!.properties.id_seccion?.properties?.tipo_de_tierra }} #{{ selectedFeature()!.properties.id_seccion?.properties?.numero_de_hoyo }}</div></div>
              <div><span style="font-size:12px;color:var(--color-text-muted);">Humedad</span><div style="font-weight:500;">{{ selectedFeature()!.properties.humedad }} / 5</div></div>
              <div><span style="font-size:12px;color:var(--color-text-muted);">Temperatura</span><div style="font-weight:500;">{{ selectedFeature()!.properties.temperatura }} °C</div></div>
              <div><span style="font-size:12px;color:var(--color-text-muted);">Salinidad</span><div style="font-weight:500;">{{ selectedFeature()!.properties.salinidad }} dS/m</div></div>
              <div><span style="font-size:12px;color:var(--color-text-muted);">Conductividad</span><div style="font-weight:500;">{{ selectedFeature()!.properties.conductividad }} dS/m</div></div>
            </div>

            @if (selectedFeature()!.properties.fotos && selectedFeature()!.properties.fotos!.length > 0) {
              <div style="margin-bottom:16px;">
                <span style="font-size:12px;color:var(--color-text-muted);display:block;margin-bottom:8px;">Evidencia Fotográfica</span>
                <img [src]="selectedFeature()!.properties.fotos![0].ruta_archivo" alt="Evidencia" style="width:100%;border-radius:8px;max-height:200px;object-fit:cover;border:1px solid var(--color-border);" />
              </div>
            }

            <div style="margin-bottom:20px;">
              <span style="font-size:12px;color:var(--color-text-muted);display:block;margin-bottom:8px;">Observaciones y Recomendaciones</span>
              <div style="background:var(--color-surface-alt);padding:12px;border-radius:8px;font-size:13px;line-height:1.5;">
                {{ selectedFeature()!.properties.recomendaciones || 'Sin observaciones registradas.' }}
              </div>
            </div>

            <button class="btn-primary" style="width:100%;justify-content:center;" (click)="closeDetailModal()">Cerrar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .history-page { animation: fadeSlideUp 250ms ease; }

    .filter-card { padding: 14px 16px; margin-bottom: 0; }

    .page-btn {
      width: 30px;
      height: 30px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: white;
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);

      &:hover:not(:disabled) {
        background: var(--color-surface-alt);
        border-color: var(--color-primary);
      }

      &.active {
        background: var(--color-primary);
        color: white;
        border-color: var(--color-primary);
      }

      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .sr-only {
      position: absolute; width: 1px; height: 1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;
    }
  `]
})
export class SampleHistoryComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);

  filterSector = '';
  filterZona = '';
  readonly pageSize = 20;

  currentPage = signal(1);
  totalCount = signal(0);
  isLoading = signal(true);
  rows = signal<SampleRow[]>([]);

  sectorOptions = ['1', '2', '3', '4', '5'];

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const range: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      range.push(i);
    }
    return range;
  });

  selectedFeature = signal<MuestraFeature | null>(null);

  ngOnInit() {
    this.loadPage(1);
  }

  loadPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.isLoading.set(true);
    this.currentPage.set(page);

    this.dataService.getMuestras(page, this.pageSize).subscribe({
      next: (geoJson) => {
        this.totalCount.set(geoJson.count ?? 0);
        this.rows.set(this._mapFeatures(geoJson.features ?? []));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  clearFilters() {
    this.filterSector = '';
    this.filterZona = '';
    this.loadPage(1);
  }

  viewInMap(id: number) {
    this.router.navigate(['/geomap'], { queryParams: { muestraId: id } });
  }

  openDetailModal(feature: MuestraFeature) {
    this.selectedFeature.set(feature);
  }

  closeDetailModal() {
    this.selectedFeature.set(null);
  }

  formatFecha(fechaIso: string): string {
    const f = new Date(fechaIso);
    return f.toLocaleDateString('es-CL') + ' ' + f.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  private _mapFeatures(features: MuestraFeature[]): SampleRow[] {
    const zonaMap: Record<string, string> = {
      GREEN: 'Green',
      FAIRWAY: 'Fairway',
    };

    return features.map(f => {
      const p = f.properties;
      const fecha = new Date(p.fecha_hora_captura);
      const tipo = p.id_seccion?.properties?.tipo_de_tierra ?? '—';
      return {
        id: p.id_muestra,
        date: fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        humidity: p.humedad,
        temperature: p.temperatura,
        conductivity: p.conductividad,
        salinity: p.salinidad,
        responsible: p.rut_usuario
          ? `${p.rut_usuario.nombre} ${p.rut_usuario.apellido}`
          : '—',
        zona: zonaMap[tipo] ?? tipo,
        sector: p.id_seccion?.properties?.numero_de_hoyo ?? 0,
        rawFeature: f
      };
    });
  }
}
