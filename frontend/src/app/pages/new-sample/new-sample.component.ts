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
  template: `
    <div class="new-sample-page">
      <div class="page-header d-flex align-center justify-between">
        <h1 style="font-family:var(--font-display);font-size:20px;">Nuevo Registro de Muestra</h1>
        <div style="display:flex;gap:10px;">
          <button class="btn-text" id="cancel-sample-btn" (click)="goBack()">Cancelar</button>
          <button class="btn-primary" id="save-sample-btn" (click)="saveSample()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar Muestra
          </button>
        </div>
      </div>

      <form class="sample-form card" (ngSubmit)="saveSample()" #sampleForm="ngForm" novalidate>

        <!-- Sección 1: Localización -->
        <div class="form-section">
          <div class="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Detalles de Localización</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="zona-select" class="form-label">Zona</label>
              <div class="select-wrapper">
                <select id="zona-select" class="form-control" [(ngModel)]="form.zona" name="zona" required aria-required="true">
                  <option value="">Seleccionar zona</option>
                  <option value="GREEN">Green</option>
                  <option value="FAIRWAY">Fairway</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="sector-select" class="form-label">Sector seleccionado</label>
              <div class="select-wrapper">
                <select id="sector-select" class="form-control" [(ngModel)]="form.sector" name="sector" required aria-required="true">
                  <option value="">Seleccionar sector</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Botón y Mapa Picker -->
          <div style="margin-bottom:14px;">
            <button type="button" class="btn-outline" id="mark-map-btn" (click)="toggleMap()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ mostrarMapa ? 'Ocultar mapa' : 'Marcar en el mapa' }}
            </button>
          </div>

          @if (mostrarMapa) {
            <div style="margin-bottom: 14px;">
              <app-map-point-picker
                [initialLat]="form.lat ? +form.lat : null"
                [initialLon]="form.lng ? +form.lng : null"
                [secciones]="secciones"
                (coordinateSelect)="onCoordinateSelected($event)"
              />
            </div>
          }

          <div class="form-row">
            <div class="form-group">
              <label for="lat-input" class="form-label">Latitud</label>
              <input id="lat-input" type="text" class="form-control" placeholder="-33.0150" [(ngModel)]="form.lat" name="lat" readonly aria-label="Latitud geográfica"/>
            </div>
            <div class="form-group">
              <label for="lng-input" class="form-label">Longitud</label>
              <input id="lng-input" type="text" class="form-control" placeholder="-71.5068" [(ngModel)]="form.lng" name="lng" readonly aria-label="Longitud geográfica"/>
            </div>
          </div>
        </div>

        <!-- Sección 2: Métricas -->
        <div class="form-section">
          <div class="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
            <span>Métricas del Suelo</span>
          </div>

          <div class="metrics-form-grid">
            <div class="floating-group">
              <input id="humidity-input" type="number" min="1" max="5" step="0.1" placeholder=" " [(ngModel)]="form.humidity" name="humidity" aria-required="true" required/>
              <label for="humidity-input">Humedad (1–5)</label>
            </div>
            <div class="floating-group">
              <input id="temp-input" type="number" step="0.1" placeholder=" " [(ngModel)]="form.temperature" name="temperature" aria-required="true" required/>
              <label for="temp-input">Temperatura (°C)</label>
            </div>
            <div class="floating-group">
              <input id="salinity-input" type="number" step="0.01" placeholder=" " [(ngModel)]="form.salinity" name="salinity" aria-required="true" required/>
              <label for="salinity-input">Salinidad (dS/m)</label>
            </div>
            <div class="floating-group">
              <input id="conductivity-input" type="number" step="0.01" placeholder=" " [(ngModel)]="form.conductivity" name="conductivity" aria-required="true" required/>
              <label for="conductivity-input">Conductividad (dS/m)</label>
            </div>
          </div>
        </div>

        <!-- Sección 3: Evidencia + Indicaciones -->
        <div class="form-section">
          <div class="section-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Evidencia e Indicaciones</span>
          </div>

          <div class="evidence-row">
            <!-- Drop zone -->
            <div
              class="drop-zone"
              [ngClass]="{'drag-over': isDragging}"
              (dragover)="isDragging = true; $event.preventDefault()"
              (dragleave)="isDragging = false"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
              id="drop-zone-area"
              role="button"
              aria-label="Área de carga de archivo. Click para seleccionar"
              tabindex="0"
              (keydown.enter)="fileInput.click()"
            >
              <input #fileInput type="file" accept=".svg,.png,.jpg,.jpeg,.dif" style="display:none;" (change)="onFileChange($event)" aria-label="Seleccionar archivo de evidencia"/>
              <div>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-muted);margin-bottom:8px;" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>
                @if (uploadedFile) {
                  <div style="font-size:13px;font-weight:600;color:var(--color-primary);">{{ uploadedFile }}</div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Click para cambiar</div>
                } @else {
                  <div style="font-size:13px;font-weight:500;color:var(--color-text-secondary);">Click para Cargar Archivo o Soltar</div>
                  <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">SVG, PNG, JPG, DIF (máx. 10MB)</div>
                }
              </div>
            </div>

            <!-- Indicaciones textarea -->
            <div class="form-group" style="flex:1;">
              <label for="notes-textarea" class="form-label">Indicaciones y Recomendaciones</label>
              <textarea
                id="notes-textarea"
                class="form-control"
                placeholder="Recomendaciones / Entregar instrucciones al equipo de mantenimiento..."
                [(ngModel)]="form.notes"
                name="notes"
                style="min-height:120px;padding:10px;resize:vertical;"
                aria-label="Indicaciones y recomendaciones para el mantenimiento"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="form-footer">
          <button type="button" class="btn-text" (click)="goBack()">Cancelar</button>
          <button type="submit" class="btn-primary" id="save-sample-footer-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Guardar Muestra
          </button>
        </div>
      </form>

      <!-- Success toast -->
      @if (showSuccess) {
        <div class="toast-success" role="alert" aria-live="polite">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Muestra guardada exitosamente
        </div>
      }
    </div>
  `,
  styles: [`
    .new-sample-page { max-width: 720px; margin: 0 auto; animation: fadeSlideUp 250ms ease; }

    .sample-form { overflow: hidden; }

    .form-section {
      padding: 20px;
      border-bottom: 1px solid var(--color-border);
      &:last-child { border-bottom: none; }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 14px;
    }

    .form-group { display: flex; flex-direction: column; }

    .form-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
      margin-bottom: 6px;
    }

    .metrics-form-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .evidence-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-footer {
      padding: 16px 20px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--color-surface-alt);
      border-top: 1px solid var(--color-border);
    }

    /* Toast */
    .toast-success {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--color-primary);
      color: white;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: var(--shadow-modal);
      animation: fadeSlideUp 200ms ease;
      z-index: 200;
    }

    @media (max-width: 900px) {
      .metrics-form-grid { grid-template-columns: repeat(2, 1fr); }
      .evidence-row { grid-template-columns: 1fr; }
    }
  `]
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

  onCoordinateSelected(coords: { lat: number; lon: number }): void {
    this.form.lat = String(coords.lat);
    this.form.lng = String(coords.lon);
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
