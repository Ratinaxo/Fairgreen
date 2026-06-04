import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DataService, MuestraFeature } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

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
  templateUrl: './sample-history.component.html',
  styleUrl: './sample-history.component.css'
})
export class SampleHistoryComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);
  private authService = inject(AuthService);

  canDelete = computed(() => {
    const rol = this.authService.rol();
    return rol === 'ADMIN' || rol === 'AGRO';
  });

  filterSector = '';
  filterZona = '';
  filterFechaDesde = '';
  filterFechaHasta = '';
  readonly pageSize = 20;

  currentPage = signal(1);
  totalCount = signal(0);
  isLoading = signal(true);
  rows = signal<SampleRow[]>([]);

  sectorOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

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

    this.dataService.getMuestras(
      page,
      this.pageSize,
      this.filterFechaDesde || undefined,
      this.filterFechaHasta || undefined,
    ).subscribe({
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
    this.filterFechaDesde = '';
    this.filterFechaHasta = '';
    this.loadPage(1);
  }

  deleteSample(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta muestra?')) {
      this.dataService.deleteMuestra(id).subscribe({
        next: () => {
          this.loadPage(this.currentPage());
        },
        error: (err) => {
          console.error(err);
          alert('Error al eliminar la muestra');
        }
      });
    }
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
      const tipo = p.id_seccion.properties.tipo_de_tierra ?? '—';
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
        sector: p.id_seccion.properties.numero_de_hoyo ?? 0,
        rawFeature: f
      };
    });
  }
}
