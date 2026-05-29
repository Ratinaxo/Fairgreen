import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Sample {
  id: number;
  date: string;
  humidity: number;
  temperature: number;
  conductivity: number;
  salinity: number;
  responsible: string;
  zona: string;
  sector: number;
}

@Component({
  selector: 'app-sample-history',
  standalone: true,
  imports: [FormsModule],
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
              <select id="filter-sector" class="form-control" [(ngModel)]="filterSector" (change)="applyFilters()" aria-label="Filtrar por sector">
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
              <select id="filter-zona" class="form-control" [(ngModel)]="filterZona" (change)="applyFilters()" aria-label="Filtrar por zona">
                <option value="">Todas</option>
                <option>Green</option>
                <option>Fairway</option>
                <option>Rough</option>
                <option>Tee</option>
              </select>
            </div>
          </div>
          <button class="btn-primary" id="apply-filters-btn" (click)="applyFilters()">Aplicar</button>
          <button class="btn-text" (click)="clearFilters()">Limpiar</button>
        </div>
      </div>

      <!-- Results subtitle -->
      <div style="margin: 16px 0 12px;">
        <span style="font-size:18px;font-weight:600;color:var(--color-text-primary);">
          {{ filterSector ? 'Sector ' + filterSector : 'Todos los sectores' }}
          {{ filterZona ? ' · ' + filterZona : '' }}
        </span>
        <span style="font-size:13px;color:var(--color-text-muted);margin-left:8px;">Muestras</span>
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
              @for (sample of pagedSamples(); track sample.id) {
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
                  <td>
                    <button
                      class="btn-primary"
                      style="height:30px;font-size:12px;padding:0 12px;"
                      [id]="'view-sample-' + sample.id"
                      [attr.aria-label]="'Ver muestra del ' + sample.date"
                    >Ver Muestra</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--color-border);">
          <span style="font-size:12px;color:var(--color-text-muted);">
            Mostrando {{ startIndex + 1 }}–{{ endIndex }} de {{ filteredSamples().length }} registros
          </span>
          <div style="display:flex;gap:6px;">
            <button
              class="page-btn"
              id="prev-page-btn"
              (click)="prevPage()"
              [disabled]="currentPage() === 1"
              aria-label="Página anterior"
            >‹</button>
            @for (p of pageNumbers(); track p) {
              <button
                class="page-btn"
                [class.active]="p === currentPage()"
                (click)="goToPage(p)"
                [attr.aria-label]="'Página ' + p"
                [attr.aria-current]="p === currentPage() ? 'page' : null"
              >{{ p }}</button>
            }
            <button
              class="page-btn"
              id="next-page-btn"
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages()"
              aria-label="Página siguiente"
            >›</button>
          </div>
        </div>
      </div>
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
export class SampleHistoryComponent {
  filterSector = '';
  filterZona = '';
  currentPage = signal(1);
  readonly pageSize = 8;

  sectorOptions = ['1', '2', '3', '4', '5'];

  allSamples: Sample[] = this.generateMockSamples(142);

  filteredSamples = computed(() => {
    return this.allSamples.filter(s => {
      const sectorMatch = !this.filterSector || s.sector.toString() === this.filterSector;
      const zonaMatch = !this.filterZona || s.zona === this.filterZona;
      return sectorMatch && zonaMatch;
    });
  });

  totalPages = computed(() => Math.ceil(this.filteredSamples().length / this.pageSize));

  get startIndex() { return (this.currentPage() - 1) * this.pageSize; }
  get endIndex() { return Math.min(this.startIndex + this.pageSize, this.filteredSamples().length); }

  pagedSamples = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSamples().slice(start, start + this.pageSize);
  });

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

  applyFilters() { this.currentPage.set(1); }
  clearFilters() { this.filterSector = ''; this.filterZona = ''; this.currentPage.set(1); }
  prevPage() { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  goToPage(p: number) { this.currentPage.set(p); }

  private generateMockSamples(count: number): Sample[] {
    const zones = ['Green', 'Fairway', 'Rough', 'Tee'];
    const responsibles = ['Carlos M.', 'Ana R.', 'Luis T.', 'María G.', 'Pedro S.'];
    const samples: Sample[] = [];
    const now = new Date(2025, 4, 26);
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getTime() - i * 8 * 3600000);
      samples.push({
        id: i + 1,
        date: date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        humidity: +(1 + Math.random() * 4).toFixed(1),
        temperature: +(18 + Math.random() * 16).toFixed(1),
        conductivity: +(0.5 + Math.random() * 4).toFixed(2),
        salinity: +(0.2 + Math.random() * 3).toFixed(2),
        responsible: responsibles[i % responsibles.length],
        zona: zones[i % zones.length],
        sector: (i % 5) + 1,
      });
    }
    return samples;
  }
}
