import { Injectable } from '@angular/core';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import BingMaps from 'ol/source/BingMaps';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';

/** Coordenadas del campo. En el futuro se leerán desde la DB del club. */
export const CAMPO_CENTER = fromLonLat([-71.54305513777648, -32.99195765675922]);
export const CAMPO_ZOOM_OVERVIEW = 15;
export const CAMPO_ZOOM_DETAIL = 16;
export const CAMPO_ZOOM_PICKER = 17;

/**
 * Bing Maps Key.
 * Si está vacío, se usa OpenStreetMap (OSM) como fallback gratuito.
 * Obtén una key gratis en https://www.bingmapsportal.com/
 * 125,000 transacciones/mes gratuitas para desarrollo.
 */
const BING_MAPS_KEY = '';

@Injectable({ providedIn: 'root' })
export class MapService {
    createSatelliteLayer(): TileLayer {
        if (BING_MAPS_KEY) {
            return new TileLayer({
                source: new BingMaps({
                    key: BING_MAPS_KEY,
                    imagerySet: 'Aerial',
                }),
            });
        }
        // Fallback a OpenStreetMap cuando no hay key de Bing
        return new TileLayer({
            source: new OSM(),
        });
    }

    createDefaultView(zoom = CAMPO_ZOOM_DETAIL): View {
        return new View({
            center: CAMPO_CENTER,
            zoom,
            minZoom: 13,
            maxZoom: 20,
        });
    }
}
