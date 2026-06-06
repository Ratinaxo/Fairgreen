import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { MapPointPickerComponent } from '../../components/map/map-point-picker.component';
import { DataService, SeccionFeature, PuntoCriticoFeature } from '../../services/data.service';

@Component({
  selector: 'app-new-sample',
  standalone: true,
  imports: [FormsModule, NgClass, MapPointPickerComponent],
  templateUrl: './new-sample.component.html',
  styleUrl: './new-sample.component.css'
})
export class NewSampleComponent implements OnInit {
  private dataService = inject(DataService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isDragging = false;
  selectedFiles: File[] = [];
  showSuccess = false;
  mostrarMapa = false;
  isLoading = false;

  secciones: SeccionFeature[] = [];
  todosPuntosCriticos: PuntoCriticoFeature[] = [];

  form = {
    zona: '',
    sector: '',
    lat: '',
    lng: '',
    puntoCriticoId: '',
    esNuevoPuntoCritico: false,
    humidity: '',
    temperature: '',
    salinity: '',
    conductivity: '',
    notes: '',
  };

  ngOnInit() {
    this.dataService.getSecciones().subscribe({
      next: (data) => {
        this.secciones = data.features ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching secciones:', err)
    });
    this.dataService.getTodosPuntosCriticos().subscribe({
      next: (data) => {
        this.todosPuntosCriticos = data.features ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching puntos criticos:', err)
    });
  }

  get puntosCriticosMapa(): PuntoCriticoFeature[] {
    let pts = this.todosPuntosCriticos;
    if (this.form.zona) {
      pts = pts.filter(p => p.properties?.id_seccion?.properties?.tipo_de_tierra === this.form.zona);
    }
    if (this.form.sector) {
      const hoyo = parseInt(this.form.sector, 10);
      pts = pts.filter(p => p.properties?.id_seccion?.properties?.numero_de_hoyo === hoyo);
    }
    return pts;
  }



  /** Sectors available for the currently selected zona */
  get availableSectors(): number[] {
    if (!this.form.zona) return [];
    return this.secciones
      .filter(s => s.properties.tipo_de_tierra === this.form.zona)
      .map(s => s.properties.numero_de_hoyo)
      .sort((a, b) => a - b);
  }

  /** Finds the SeccionFeature matching the current zona + sector */
  getSelectedSeccion(): SeccionFeature | null {
    if (!this.form.zona || !this.form.sector) return null;
    const hoyo = parseInt(this.form.sector, 10);
    return this.secciones.find(
      s => s.properties.tipo_de_tierra === this.form.zona && s.properties.numero_de_hoyo === hoyo
    ) ?? null;
  }

  /** Called when zona or sector changes — reset map, coordinates */
  onZonaSectorChange(): void {
    this.form.lat = '';
    this.form.lng = '';
    this.form.puntoCriticoId = '';
  }

  onPuntoCriticoChange(): void {
    if (!this.form.puntoCriticoId) {
      // Si se deselecciona "Ninguno", borramos las coordenadas para limpiar el marcador
      this.form.lat = '';
      this.form.lng = '';
      return;
    }
    const pcId = parseInt(this.form.puntoCriticoId, 10);
    const pc = this.todosPuntosCriticos.find(p => p.id === pcId);
    if (pc && pc.geometry.type === 'Point') {
      this.form.lng = String(pc.geometry.coordinates[0]);
      this.form.lat = String(pc.geometry.coordinates[1]);
      
      // Auto-rellenar zona y sector si está disponible
      if (pc.properties?.id_seccion?.properties) {
        this.form.zona = pc.properties.id_seccion.properties.tipo_de_tierra;
        this.form.sector = String(pc.properties.id_seccion.properties.numero_de_hoyo);
      }
    }
  }

  toggleMap(): void {
    this.mostrarMapa = !this.mostrarMapa;
  }

  onCoordinateSelected(coords: { lat: number; lon: number; seccion: import('../../services/data.service').SeccionFeature | null, puntoCriticoId?: number }): void {
    this.form.lat = String(coords.lat);
    this.form.lng = String(coords.lon);

    // Auto-rellenar zona y sector si el punto cae dentro de un polígono conocido
    if (coords.seccion) {
      const prevZona = this.form.zona;
      const prevSector = this.form.sector;
      this.form.zona = coords.seccion.properties.tipo_de_tierra;
      this.form.sector = String(coords.seccion.properties.numero_de_hoyo);
      
      // Si cambió la sección, el desplegable se filtrará solo por el getter
      if (coords.puntoCriticoId) {
        this.form.puntoCriticoId = String(coords.puntoCriticoId);
      } else {
        this.form.puntoCriticoId = '';
      }
    }
  }

  getFileUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const validFiles = Array.from(input.files).filter(file => file.type.startsWith('image/'));
      if (validFiles.length < input.files.length) {
        alert('Solo se permiten archivos de imagen (JPG, PNG, etc). Algunos archivos fueron ignorados.');
      }
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
    }
    // Reset input so same file can be re-added after removal
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      const allFiles = Array.from(event.dataTransfer.files);
      const validFiles = allFiles.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length < allFiles.length) {
        alert('Solo se permiten archivos de imagen (JPG, PNG, etc). Algunos archivos fueron ignorados.');
      }
      this.selectedFiles = [...this.selectedFiles, ...validFiles];
    }
  }

  saveSample(): void {
    if (!this.form.zona || !this.form.sector || !this.form.lat || !this.form.lng || !this.form.humidity || !this.form.temperature || !this.form.salinity || !this.form.conductivity) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    if (parseFloat(this.form.salinity) < 0 || parseFloat(this.form.conductivity) < 0) {
      alert('La salinidad y la conductividad no pueden ser valores negativos.');
      return;
    }

    // Auto-mapear Green 4 a Green 2
    if (this.form.zona === 'GREEN' && this.form.sector === '4') {
      this.form.sector = '2';
    }

    const sec = this.secciones.find(s => s.properties.tipo_de_tierra === this.form.zona && s.properties.numero_de_hoyo === parseInt(this.form.sector, 10));
    
    if (!sec) {
      alert('La combinación de Zona y Sector no existe en la base de datos del sistema.');
      return;
    }

    const createSampleReq = (pcId: number | null) => {
      const payload = {
        id_seccion_id: sec.id,
        id_punto_critico: pcId,
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

      this.dataService.createMuestra(payload).subscribe({
        next: (muestra) => {
          const muestraId = muestra.properties?.id_muestra ?? muestra.id;
          if (this.selectedFiles.length > 0 && muestraId) {
            // Upload all photos sequentially
            const uploadNext = (index: number) => {
              if (index >= this.selectedFiles.length) {
                this.onSaveSuccess();
                return;
              }
              this.dataService.uploadFoto(muestraId, this.selectedFiles[index]).subscribe({
                next: () => uploadNext(index + 1),
                error: () => {
                  this.isLoading = false;
                  alert(`Muestra registrada, pero hubo un error al subir la imagen ${index + 1}.`);
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
          this.isLoading = false;
          alert('Ocurrió un error al guardar la muestra.');
        }
      });
    };

    this.isLoading = true;
    if (this.form.esNuevoPuntoCritico) {
      const pcPayload = {
        id_seccion_id: sec.id,
        descripcion: `Punto Crítico generado desde registro de muestra (${this.form.zona} ${this.form.sector})`,
        ubicacion: {
          type: 'Point' as const,
          coordinates: [parseFloat(this.form.lng), parseFloat(this.form.lat)] as [number, number]
        }
      };

      this.dataService.createPuntoCritico(pcPayload).subscribe({
        next: (pc) => {
          createSampleReq(pc.id as number);
        },
        error: () => {
          this.isLoading = false;
          alert('Ocurrió un error al crear el nuevo punto crítico.');
        }
      });
    } else {
      const pcId = this.form.puntoCriticoId ? parseInt(this.form.puntoCriticoId, 10) : null;
      createSampleReq(pcId);
    }
  }

  private onSaveSuccess() {
    this.isLoading = false;
    this.showSuccess = true;
    setTimeout(() => {
      this.showSuccess = false;
      this.router.navigate(['/samples/history']);
    }, 1200);
  }

  goBack(): void {
    this.router.navigate(['/samples/history']);
  }
}
