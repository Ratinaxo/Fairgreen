import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgClass } from '@angular/common';
import { MapGeorefComponent } from '../../components/map/map-georef.component';
import { DataService, MuestraFeature, SeccionFeature, FotoItem } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sample-detail',
  standalone: true,
  imports: [NgClass, MapGeorefComponent],
  templateUrl: './sample-detail.component.html',
  styleUrl: './sample-detail.component.css'
})
export class SampleDetailComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  isLoading = signal(true);
  muestra = signal<MuestraFeature | null>(null);
  secciones = signal<SeccionFeature[]>([]);
  currentPhotoIndex = signal(0);
  error = signal<string | null>(null);

  canEdit = computed(() => {
    const rol = this.authService.rol();
    return rol === 'ADMIN' || rol === 'AGRO';
  });

  fotos = computed<FotoItem[]>(() => this.muestra()?.properties?.fotos ?? []);

  health = computed<'optimo' | 'atencion' | 'critico'>(() => {
    const p = this.muestra()?.properties;
    if (!p) return 'optimo';
    const c = p.conductividad ?? 0;
    const s = p.salinidad ?? 0;
    if (c > 3.5 || s > 2.5) return 'critico';
    if (c > 2.0 || s > 1.5) return 'atencion';
    return 'optimo';
  });

  healthLabel = computed(() => ({
    optimo: 'Óptimo',
    atencion: 'Atención',
    critico: 'Crítico',
  }[this.health()]));

  zona = computed(() => {
    const tipo = this.muestra()?.properties?.id_seccion?.properties?.tipo_de_tierra;
    return tipo === 'GREEN' ? 'Green' : tipo === 'FAIRWAY' ? 'Fairway' : '—';
  });

  sector = computed(() => this.muestra()?.properties?.id_seccion?.properties?.numero_de_hoyo ?? '—');

  responsable = computed(() => {
    const u = this.muestra()?.properties?.rut_usuario;
    return u ? `${u.nombre} ${u.apellido}` : '—';
  });

  ngOnInit() {
    this.dataService.getSecciones().subscribe({
      next: (data) => this.secciones.set(data.features ?? []),
    });

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (!idStr) {
        this.router.navigate(['/samples/history']);
        return;
      }
      const id = parseInt(idStr, 10);
      this.dataService.getMuestra(id).subscribe({
        next: (feature) => {
          this.muestra.set(feature);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('No se pudo cargar la muestra seleccionada.');
          this.isLoading.set(false);
        }
      });
    });
  }

  prevPhoto() {
    const total = this.fotos().length;
    if (total === 0) return;
    this.currentPhotoIndex.update(i => (i - 1 + total) % total);
  }

  nextPhoto() {
    const total = this.fotos().length;
    if (total === 0) return;
    this.currentPhotoIndex.update(i => (i + 1) % total);
  }

  goToPhoto(index: number) {
    this.currentPhotoIndex.set(index);
  }

  editSample() {
    const id = this.muestra()?.id;
    if (id) this.router.navigate(['/samples/edit', id]);
  }

  goBack() {
    this.router.navigate(['/samples/history']);
  }

  formatFecha(fechaIso: string): string {
    const f = new Date(fechaIso);
    return f.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + f.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }
}
