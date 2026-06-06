import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';
import { MapPointPickerComponent } from '../../components/map/map-point-picker.component';
import { DataService, SeccionFeature, FotoItem } from '../../services/data.service';

@Component({
  selector: 'app-edit-sample',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, MapPointPickerComponent],
  templateUrl: './edit-sample.component.html',
  styleUrl: './edit-sample.component.css'
})
export class EditSampleComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  sampleId = signal<number | null>(null);
  isDragging = false;
  selectedFiles: File[] = [];
  existingPhotos: FotoItem[] = [];
  showSuccess = signal(false);
  mostrarMapa = false;

  isInitialLoading = signal(true);
  isSaving = signal(false);

  secciones: SeccionFeature[] = [];

  form = {
    zona: '',
    sector: '',
    lat: '',
    lng: '',
    humidity: '',
    temperature: '',
    salinity: '',
    conductivity: '',
    notes: '',
  };

  ngOnInit() {
    this.isInitialLoading.set(true);
    this.dataService.getSecciones().subscribe({
      next: (data) => {
        this.secciones = data.features ?? [];
        
        // Cargar datos de la muestra tras obtener las secciones
        this.route.paramMap.subscribe(params => {
          const idStr = params.get('id');
          if (idStr) {
            this.sampleId.set(parseInt(idStr, 10));
            this.loadSampleData(this.sampleId()!);
          } else {
            this.isInitialLoading.set(false);
          }
        });
      },
      error: () => {
        this.isInitialLoading.set(false);
        alert('Error al cargar secciones del sistema.');
      }
    });
  }

  loadSampleData(id: number) {
    this.dataService.getMuestra(id).subscribe({
      next: (muestra) => {
        console.log('Muestra cargada:', muestra);
        try {
          const p = muestra.properties;
          const coords = muestra.geometry ? muestra.geometry.coordinates : [0, 0];
          
          let zona = '';
          let sector = '';
          if (p.id_seccion) {
            const sec = p.id_seccion as any;
            if (sec.properties) {
              zona = sec.properties.tipo_de_tierra || '';
              sector = String(sec.properties.numero_de_hoyo || '');
            } else {
              zona = sec.tipo_de_tierra || '';
              sector = String(sec.numero_de_hoyo || '');
            }
          }

          this.form = {
            zona: zona,
            sector: sector,
            lat: String(coords[1] ?? ''),
            lng: String(coords[0] ?? ''),
            humidity: String(p.humedad ?? ''),
            temperature: String(p.temperatura ?? ''),
            salinity: String(p.salinidad ?? ''),
            conductivity: String(p.conductividad ?? ''),
            notes: p.recomendaciones || '',
          };

          // Populate existing photos
          this.existingPhotos = p.fotos ?? [];
          this.isInitialLoading.set(false);
        } catch (err) {
          console.error('Error al procesar datos de la muestra:', err);
          this.isInitialLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Error al descargar la muestra:', err);
        this.isInitialLoading.set(false);
        alert('No se pudo cargar la muestra seleccionada.');
        this.router.navigate(['/samples/history']);
      }
    });
  }

  toggleMap(): void {
    this.mostrarMapa = !this.mostrarMapa;
  }

  onCoordinateSelected(coords: { lat: number; lon: number; seccion: import('../../services/data.service').SeccionFeature | null }): void {
    this.form.lat = String(coords.lat);
    this.form.lng = String(coords.lon);

    // Auto-rellenar zona y sector si el punto cae dentro de un polígono conocido
    if (coords.seccion) {
      this.form.zona   = coords.seccion.properties.tipo_de_tierra;
      this.form.sector = String(coords.seccion.properties.numero_de_hoyo);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }
    input.value = '';
  }

  removeNewFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      const newFiles = Array.from(event.dataTransfer.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
    }
  }

  saveSample(): void {
    if (!this.form.zona || !this.form.sector || !this.form.lat || !this.form.lng || !this.form.humidity || !this.form.temperature || !this.form.salinity || !this.form.conductivity) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const currentId = this.sampleId();
    if (!currentId) return;

    // Auto-mapear Green 4 a Green 2
    if (this.form.zona === 'GREEN' && this.form.sector === '4') {
      this.form.sector = '2';
    }

    const sec = this.secciones.find(s => s.properties.tipo_de_tierra === this.form.zona && s.properties.numero_de_hoyo === parseInt(this.form.sector, 10));
    
    if (!sec) {
      alert('La combinación de Zona y Sector no existe en la base de datos del sistema.');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      id_seccion_id: sec.id,
      salinidad: parseFloat(this.form.salinity),
      humedad: parseFloat(this.form.humidity),
      conductividad: parseFloat(this.form.conductivity),
      temperatura: parseFloat(this.form.temperature),
      recomendaciones: this.form.notes,
      ubicacion_exacta: {
        type: 'Point' as const,
        coordinates: [parseFloat(this.form.lng), parseFloat(this.form.lat)] as [number, number]
      }
    };

    this.dataService.updateMuestra(currentId, payload).subscribe({
      next: (muestra) => {
        if (this.selectedFiles.length > 0) {
          const uploadNext = (index: number) => {
            if (index >= this.selectedFiles.length) {
              this.onSaveSuccess();
              return;
            }
            this.dataService.uploadFoto(muestra.id, this.selectedFiles[index]).subscribe({
              next: () => uploadNext(index + 1),
              error: () => {
                this.isSaving.set(false);
                alert(`Muestra actualizada, pero hubo un error al subir la imagen ${index + 1}.`);
                this.router.navigate(['/samples/history']);
              }
            });
          };
          uploadNext(0);
        } else {
          this.onSaveSuccess();
        }
      },
      error: () => {
        this.isSaving.set(false);
        alert('Ocurrió un error al actualizar la muestra.');
      }
    });
  }

  private onSaveSuccess() {
    this.isSaving.set(false);
    this.showSuccess.set(true);
    setTimeout(() => {
      this.showSuccess.set(false);
      this.router.navigate(['/samples/history']);
    }, 1200);
  }

  goBack(): void {
    this.router.navigate(['/samples/history']);
  }
}
