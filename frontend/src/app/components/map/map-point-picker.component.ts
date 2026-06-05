import {
    Component,
    AfterViewInit,
    OnDestroy,
    ElementRef,
    input,
    output,
    effect,
} from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import Polygon from 'ol/geom/Polygon.js';
import BingMaps from 'ol/source/BingMaps.js';
import OSM from 'ol/source/OSM';
import { Style, Circle, Fill, Stroke } from 'ol/style.js';
import { fromLonLat, toLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON.js';
import { FeatureLike } from 'ol/Feature.js';
import { Layer } from 'ol/layer.js';
import { CAMPO_CENTER, CAMPO_ZOOM_PICKER } from '../../services/map.service';
import { SeccionFeature } from '../../services/data.service';



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
    templateUrl: './map-point-picker.component.html',
    styles: [
        `
      .map-picker-container {
        width: 100%;
        height: 350px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #dde5df;
        cursor: crosshair;
        position: relative;
      }

      .oob-toast {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(220, 53, 69, 0.92);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 10;
        pointer-events: none;
        animation: fadeInUp 200ms ease;
        white-space: nowrap;
      }

      @keyframes fadeInUp {
        from { opacity: 0; transform: translateX(-50%) translateY(8px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `,
    ],
})
export class MapPointPickerComponent implements AfterViewInit, OnDestroy {
    /** Latitud inicial (opcional) */
    initialLat = input<number | null>(null);
    /** Longitud inicial (opcional) */
    initialLon = input<number | null>(null);

    /** Emite { lat, lon, seccion? } cuando el usuario hace click */
    coordinateSelect = output<{ lat: number; lon: number; seccion: SeccionFeature | null }>();

    /** Secciones (polígonos) opcionales a dibujar */
    secciones = input<SeccionFeature[]>([]);

    /** Sección seleccionada — si se provee, restringe clicks a este polígono */
    selectedSeccion = input<SeccionFeature | null>(null);

    showOutOfBounds = false;

    private mapInstance: Map | null = null;
    private markerSource = new VectorSource();
    private sectionsSource = new VectorSource();
    private maskSource = new VectorSource();
    private oobTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(private el: ElementRef) {
        // Reactively update sections layer when inputs change
        effect(() => {
            const selected = this.selectedSeccion();
            const allSections = this.secciones();

            this.sectionsSource.clear();
            this.maskSource.clear();

            const geojsonFormat = new GeoJSON();

            if (selected) {
                // Draw only the selected section
                const features = geojsonFormat.readFeatures({
                    type: 'FeatureCollection',
                    features: [selected]
                }, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                this.sectionsSource.addFeatures(features);

                // Build a dimming mask (world polygon with a hole for the selected section)
                this._buildMask(selected);

                // Fit view to selected section extent
                if (this.mapInstance && features.length > 0) {
                    const extent = this.sectionsSource.getExtent();
                    if (extent) {
                        this.mapInstance.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 19,
                            duration: 400,
                        });
                    }
                }
            } else if (allSections && allSections.length > 0) {
                // Fallback: draw all sections
                const features = geojsonFormat.readFeatures({
                    type: 'FeatureCollection',
                    features: allSections
                }, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                this.sectionsSource.addFeatures(features);
            }
        });
    }

    ngAfterViewInit(): void {
        const container = this.el.nativeElement.querySelector('.map-picker-container');
        if (!container) return;

        const initialLat = this.initialLat();
        const initialLon = this.initialLon();

        const markerLayer = new VectorLayer({
            source: this.markerSource,
            style: markerStyle,
            zIndex: 30,
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

        const sectionsLayer = new VectorLayer({
            source: this.sectionsSource,
            zIndex: 10,
            style: (feature) => {
                const props = feature.getProperties();
                const tipo = props['tipo_de_tierra'];

                let fillColor = 'rgba(255, 255, 255, 0.2)';
                let strokeColor = 'rgba(255, 255, 255, 0.5)';

                if (tipo === 'GREEN') {
                    fillColor = 'rgba(76, 175, 125, 0.4)';
                    strokeColor = '#4CAF7D';
                } else if (tipo === 'FAIRWAY') {
                    fillColor = 'rgba(245, 158, 11, 0.4)';
                    strokeColor = '#F59E0B';
                }

                return new Style({
                    fill: new Fill({ color: fillColor }),
                    stroke: new Stroke({ color: strokeColor, width: 2.5 })
                });
            }
        });

        // Dim mask layer — semi-transparent dark overlay outside selected polygon
        const maskLayer = new VectorLayer({
            source: this.maskSource,
            zIndex: 5,
            style: new Style({
                fill: new Fill({ color: 'rgba(0, 0, 0, 0.45)' }),
            }),
        });

        const map = new Map({
            target: container,
            layers: [satelliteLayer, maskLayer, sectionsLayer, markerLayer],
            view: new View({
                center: fromLonLat([initialLon ?? -71.54305513777648, initialLat ?? -32.99195765675922]),
                zoom: CAMPO_ZOOM_PICKER,
            }),
            controls: [],
        });

        // If we have a selectedSeccion at init time, fit to it
        const selected = this.selectedSeccion();
        if (selected && this.sectionsSource.getFeatures().length > 0) {
            const extent = this.sectionsSource.getExtent();
            if (extent) {
                map.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    maxZoom: 19,
                    duration: 0,
                });
            }
        }

        // If there are initial coordinates, show marker
        if (initialLat && initialLon) {
            const initial = new Feature(
                new Point(fromLonLat([initialLon, initialLat]))
            );
            this.markerSource.addFeature(initial);
        }

        map.on('click', (e) => {
            const [lon, lat] = toLonLat(e.coordinate);

            // If a section is selected, validate the click falls inside the polygon
            const sel = this.selectedSeccion();
            if (sel) {
                const clickInsideSection = this._isInsideSelectedSection(e.coordinate);
                if (!clickInsideSection) {
                    this._showOutOfBoundsFeedback();
                    return;
                }
            }

            // Valid click — place marker
            this.markerSource.clear();
            this.markerSource.addFeature(new Feature(new Point(e.coordinate)));

            // Detectar en qué sección cae el punto usando hit-test sobre el layer
            let seccionDetectada: SeccionFeature | null = null;
            
            map.forEachFeatureAtPixel(
                e.pixel,
                (feature: FeatureLike) => {
                    if (seccionDetectada) return;
                    const props = feature.getProperties();
                    const idSec = props['id_seccion'];
                    const tipo  = props['tipo_de_tierra'];
                    const hoyo  = props['numero_de_hoyo'];
                    if (tipo && hoyo != null) {
                        // Buscar la SeccionFeature original para pasar el id correcto
                        const match = this.secciones().find(
                            s => s.properties.tipo_de_tierra === tipo
                              && s.properties.numero_de_hoyo === hoyo
                        );
                        if (match) seccionDetectada = match;
                    }
                },
                { layerFilter: (l: Layer) => l === sectionsLayer }
            );

            this.coordinateSelect.emit({
                lat: parseFloat(lat.toFixed(6)),
                lon: parseFloat(lon.toFixed(6)),
                seccion: seccionDetectada,
            });
        });

        this.mapInstance = map;
    }

    ngOnDestroy(): void {
        if (this.oobTimeout) clearTimeout(this.oobTimeout);
        this.mapInstance?.setTarget(undefined);
        this.mapInstance = null;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Checks if a coordinate (in EPSG:3857) falls inside any feature in the
     * sectionsSource (which holds only the selected polygon when restricted).
     */
    private _isInsideSelectedSection(coordinate: number[]): boolean {
        const features = this.sectionsSource.getFeatures();
        for (const f of features) {
            const geom = f.getGeometry();
            if (geom && geom.intersectsCoordinate(coordinate)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Shows a brief toast indicating the click was out of bounds.
     */
    private _showOutOfBoundsFeedback(): void {
        if (this.oobTimeout) clearTimeout(this.oobTimeout);
        this.showOutOfBounds = true;
        this.oobTimeout = setTimeout(() => {
            this.showOutOfBounds = false;
        }, 2500);
    }

    /**
     * Builds an inverted mask polygon: a very large world-covering polygon
     * with a hole cut out for the selected section, creating a dimming effect
     * for everything outside the section.
     */
    private _buildMask(seccion: SeccionFeature): void {
        // World extent ring (EPSG:4326) — covers the whole visible world
        const worldRing: number[][] = [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
        ];

        // The section polygon ring(s) — we use the first (outer) ring
        const coords = seccion.geometry.coordinates;
        if (!coords || coords.length === 0) return;
        const holeRing = coords[0]; // Outer ring of the polygon

        // Build a polygon with a hole in EPSG:4326, then transform to EPSG:3857
        const maskPolygon = new Polygon([worldRing, holeRing]);
        maskPolygon.transform('EPSG:4326', 'EPSG:3857');

        const maskFeature = new Feature(maskPolygon);
        this.maskSource.addFeature(maskFeature);
    }
}
