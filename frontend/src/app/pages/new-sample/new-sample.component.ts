import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MapPointPickerComponent } from '../../components/map/map-point-picker.component';
import { DataService, SeccionFeature } from '../../services/data.service';

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

  isDragging = false;
  uploadedFile = '';
  showSuccess = false;
  mostrarMapa = false;
  isLoading = false;

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
    this.dataService.getSecciones().subscribe({
      next: (data) => {
        this.secciones = data.features ?? [];
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
    if (input.files?.[0]) {
      this.uploadedFile = input.files[0].name;
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadedFile = file.name;
  }

  saveSample(): void {
    if (!this.form.zona || !this.form.sector || !this.form.lat || !this.form.lng || !this.form.humidity || !this.form.temperature || !this.form.salinity || !this.form.conductivity) {
      alert('Por favor complete los campos obligatorios.');
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

    this.isLoading = true;
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

    this.dataService.createMuestra(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.showSuccess = true;
        setTimeout(() => {
          this.showSuccess = false;
          this.router.navigate(['/samples/history']);
        }, 2000);
      },
      error: () => {
        this.isLoading = false;
        alert('Ocurrió un error al guardar la muestra.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/samples/history']);
  }
}
