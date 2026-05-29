import {
    Component,
    AfterViewInit,
    OnDestroy,
    ElementRef,
    input,
    output,
} from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import BingMaps from 'ol/source/BingMaps.js';
import OSM from 'ol/source/OSM';
import { Style, Circle, Fill, Stroke } from 'ol/style.js';
import { fromLonLat, toLonLat } from 'ol/proj';
import { CAMPO_CENTER, CAMPO_ZOOM_PICKER } from '../../services/map.service';

const markerStyle = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({ color: '#FFFFFF' }),
        stroke: new Stroke({ color: '#1C3D2E', width: 2.5 }),
    }),
});

const BING_MAPS_KEY = '';

@Component({
    selector: 'app-map-point-picker',
    standalone: true,
    template: `
    <div
      class="map-picker-container"
      role="img"
      aria-label="Seleccionar punto en el mapa"
    ></div>
  `,
    styles: [
        `
      .map-picker-container {
        width: 100%;
        height: 350px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #dde5df;
        cursor: crosshair;
      }
    `,
    ],
})
export class MapPointPickerComponent implements AfterViewInit, OnDestroy {
    /** Latitud inicial (opcional) */
    initialLat = input<number | null>(null);
    /** Longitud inicial (opcional) */
    initialLon = input<number | null>(null);

    /** Emite { lat, lon } cuando el usuario hace click */
    coordinateSelect = output<{ lat: number; lon: number }>();

    private mapInstance: Map | null = null;
    private markerSource = new VectorSource();

    constructor(private el: ElementRef) { }

    ngAfterViewInit(): void {
        const container = this.el.nativeElement.querySelector('.map-picker-container');
        if (!container) return;

        const initialLat = this.initialLat();
        const initialLon = this.initialLon();

        const markerLayer = new VectorLayer({
            source: this.markerSource,
            style: markerStyle,
        });

        const satelliteLayer = BING_MAPS_KEY
            ? new TileLayer({
                source: new BingMaps({
                    key: BING_MAPS_KEY,
                    imagerySet: 'Aerial',
                }),
            })
            : new TileLayer({
                source: new OSM(),
            });

        const map = new Map({
            target: container,
            layers: [satelliteLayer, markerLayer],
            view: new View({
                center: fromLonLat([initialLon ?? -71.54305513777648, initialLat ?? -32.99195765675922]),
                zoom: CAMPO_ZOOM_PICKER,
            }),
            controls: [],
        });

        // Si ya hay coordenadas previas, mostrar marcador inicial
        if (initialLat && initialLon) {
            const initial = new Feature(
                new Point(fromLonLat([initialLon, initialLat]))
            );
            this.markerSource.addFeature(initial);
        }

        map.on('click', (e) => {
            const [lon, lat] = toLonLat(e.coordinate);

            // Reemplaza marcador anterior
            this.markerSource.clear();
            this.markerSource.addFeature(new Feature(new Point(e.coordinate)));

            this.coordinateSelect.emit({
                lat: parseFloat(lat.toFixed(6)),
                lon: parseFloat(lon.toFixed(6)),
            });
        });

        this.mapInstance = map;
    }

    ngOnDestroy(): void {
        this.mapInstance?.setTarget(undefined);
        this.mapInstance = null;
    }
}
