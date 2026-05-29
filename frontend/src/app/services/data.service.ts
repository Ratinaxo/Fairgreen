import { Injectable } from '@angular/core';

export interface ZoneProperties {
    id: string;
    nombre: string;
    sector: number;
    zona: string;
    estado: 'optimo' | 'atencion' | 'critico';
    metricas: {
        humedad: number;
        temperatura: number;
        salinidad: number;
        conductividad: number;
    };
    ultimo_registro: string;
    responsable: string;
}

export interface ZoneFeature {
    type: 'Feature';
    id: string;
    geometry: {
        type: 'Polygon';
        coordinates: number[][][];
    };
    properties: ZoneProperties;
}

export interface ZonesGeoJSON {
    type: 'FeatureCollection';
    features: ZoneFeature[];
}

export interface SampleData {
    id: string;
    zone_id: string;
    sector: number;
    zona: string;
    coordenadas: { lat: number; lon: number };
    metricas: {
        humedad: number;
        temperatura: number;
        salinidad: number;
        conductividad: number;
    };
    fecha: string;
    responsable: string;
    evidencia_url: string | null;
    indicaciones: string;
}

export interface CreateSamplePayload {
    zone_id: string;
    sector: number;
    zona: string;
    lat: number;
    lon: number;
    humedad: number;
    temperatura: number;
    salinidad: number;
    conductividad: number;
    indicaciones?: string;
}

const USE_MOCK = true;

@Injectable({ providedIn: 'root' })
export class DataService {
    async getZones(): Promise<ZonesGeoJSON> {
        if (USE_MOCK) {
            const res = await fetch('/data/mock/zones.geojson');
            return res.json();
        }
        const res = await fetch('/api/zones');
        return res.json();
    }

    async getSamplesByZone(zoneId: string): Promise<SampleData[]> {
        if (USE_MOCK) {
            const res = await fetch('/data/mock/samples.json');
            const data: SampleData[] = await res.json();
            return data.filter((s) => s.zone_id === zoneId);
        }
        const res = await fetch(`/api/zones/${zoneId}/samples`);
        return res.json();
    }

    async createSample(payload: CreateSamplePayload): Promise<SampleData> {
        if (USE_MOCK) {
            console.log('[MOCK] Muestra guardada:', payload);
            return {
                id: `sample-${Date.now()}`,
                zone_id: payload.zone_id,
                sector: payload.sector,
                zona: payload.zona,
                coordenadas: { lat: payload.lat, lon: payload.lon },
                metricas: {
                    humedad: payload.humedad,
                    temperatura: payload.temperatura,
                    salinidad: payload.salinidad,
                    conductividad: payload.conductividad,
                },
                fecha: new Date().toISOString(),
                responsable: 'Usuario actual',
                evidencia_url: null,
                indicaciones: payload.indicaciones ?? '',
            };
        }
        const res = await fetch('/api/samples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return res.json();
    }
}
