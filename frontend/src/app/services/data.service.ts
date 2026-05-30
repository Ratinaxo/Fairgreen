import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ---------------------------------------------------------------------------
// Tipos — alineados con los modelos Django del backend
// ---------------------------------------------------------------------------

export interface SeccionProperties {
  id_seccion: number;
  tipo_de_tierra: 'GREEN' | 'FAIRWAY';
  numero_de_hoyo: number;
}

export interface SeccionFeature {
  type: 'Feature';
  id: number;
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  properties: SeccionProperties;
}

export interface SeccionGeoJSON {
  type: 'FeatureCollection';
  count: number;
  next: string | null;
  previous: string | null;
  features: SeccionFeature[];
}

export interface PuntoCriticoFeature {
  type: 'Feature';
  id: number;
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    id_punto_critico: number;
    descripcion: string;
    id_seccion_id: number;
  };
}

export interface PuntoCriticoGeoJSON {
  type: 'FeatureCollection';
  features: PuntoCriticoFeature[];
}

export interface UsuarioResumen {
  rut: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  rol: 'ADMIN' | 'AGRO' | 'CANCHERO';
  ruta_foto: string | null;
  is_active: boolean;
}

export interface MuestraProperties {
  id_muestra: number;
  rut_usuario: UsuarioResumen;
  id_seccion: SeccionFeature;
  id_punto_critico: number | null;
  salinidad: number;
  humedad: number;
  conductividad: number;
  temperatura: number;
  recomendaciones: string | null;
  fecha_hora_captura: string; // ISO 8601
  fotos: FotoItem[];
}

export interface MuestraFeature {
  type: 'Feature';
  id: number;
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: MuestraProperties;
}

export interface MuestraGeoJSON {
  type: 'FeatureCollection';
  count: number;
  next: string | null;
  previous: string | null;
  features: MuestraFeature[];
}

export interface FotoItem {
  id_foto: number;
  ruta_archivo: string;
  fecha_hora_subida: string;
}

export interface CreateMuestraPayload {
  id_seccion_id: number;
  id_punto_critico?: number | null;
  salinidad: number;
  humedad: number;
  conductividad: number;
  temperatura: number;
  ubicacion_exacta: { type: 'Point', coordinates: [number, number] };
  recomendaciones?: string;
}

// ---------------------------------------------------------------------------
// Servicio de datos
// ---------------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // ── Secciones ─────────────────────────────────────────────────────────────

  /** Lista todas las secciones en formato GeoJSON (FeatureCollection). */
  getSecciones(): Observable<SeccionGeoJSON> {
    return this.http.get<SeccionGeoJSON>(`${this.api}/secciones/`);
  }

  /** Obtiene el detalle de una sección específica. */
  getSeccion(id: number): Observable<SeccionFeature> {
    return this.http.get<SeccionFeature>(`${this.api}/secciones/${id}/`);
  }

  // ── Puntos Críticos ───────────────────────────────────────────────────────

  /** Lista los puntos críticos de una sección. */
  getPuntosDeSeccion(seccionId: number): Observable<PuntoCriticoGeoJSON> {
    return this.http.get<PuntoCriticoGeoJSON>(`${this.api}/puntos-criticos/?id_seccion=${seccionId}`);
  }

  /** Lista todos los puntos críticos. */
  getTodosPuntosCriticos(): Observable<PuntoCriticoGeoJSON> {
    return this.http.get<PuntoCriticoGeoJSON>(`${this.api}/puntos-criticos/`);
  }

  // ── Muestras ──────────────────────────────────────────────────────────────

  /**
   * Lista muestras paginadas. Acepta filtros opcionales.
   * @param page  Número de página (1-indexed)
   * @param size  Resultados por página (por defecto usa el global: 50)
   */
  getMuestras(page = 1, size = 20): Observable<MuestraGeoJSON> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', size.toString());
    return this.http.get<MuestraGeoJSON>(`${this.api}/muestras/`, { params });
  }

  /** Detalle de una muestra. */
  getMuestra(id: number): Observable<MuestraFeature> {
    return this.http.get<MuestraFeature>(`${this.api}/muestras/${id}/`);
  }

  /** Crea una nueva muestra. El rut_usuario se inyecta en el backend desde el JWT. */
  createMuestra(payload: CreateMuestraPayload): Observable<MuestraFeature> {
    return this.http.post<MuestraFeature>(`${this.api}/muestras/`, payload);
  }

  /** Elimina una muestra por su ID. */
  deleteMuestra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/muestras/${id}/`);
  }

  /** Elimina TODAS las muestras del sistema. */
  deleteAllMuestras(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${this.api}/muestras/delete_all/`);
  }

  // ── Usuarios ──────────────────────────────────────────────────────────────

  /** Lista todos los usuarios. */
  getUsuarios(): Observable<UsuarioResumen[]> {
    return this.http.get<UsuarioResumen[]>(`${this.api}/usuarios/`);
  }

  /** Detalle de un usuario por RUT. */
  getUsuario(rut: string): Observable<UsuarioResumen> {
    return this.http.get<UsuarioResumen>(`${this.api}/usuarios/${rut}/`);
  }

  /** Crea un usuario nuevo. */
  createUsuario(data: Partial<UsuarioResumen> & { password: string }): Observable<UsuarioResumen> {
    return this.http.post<UsuarioResumen>(`${this.api}/usuarios/`, data);
  }

  /** Actualiza un usuario. */
  updateUsuario(rut: string, data: Partial<UsuarioResumen>): Observable<UsuarioResumen> {
    return this.http.put<UsuarioResumen>(`${this.api}/usuarios/${rut}/`, data);
  }

  /** Toggle de acceso del usuario (activa/desactiva). */
  toggleAcceso(rut: string, is_active: boolean): Observable<UsuarioResumen> {
    return this.http.patch<UsuarioResumen>(`${this.api}/usuarios/${rut}/`, { is_active });
  }

  // ── Fotos ─────────────────────────────────────────────────────────────────

  /** Sube una foto para una muestra. */
  uploadFoto(muestraId: number, archivo: File): Observable<FotoItem> {
    const fd = new FormData();
    fd.append('id_muestra', muestraId.toString());
    fd.append('ruta_archivo', archivo);
    return this.http.post<FotoItem>(`${this.api}/fotos/`, fd);
  }
}
