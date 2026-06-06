import {
    Component,
    AfterViewInit,
    OnDestroy,
    ElementRef,
    input,
    output,
    effect,
    ChangeDetectorRef,
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
import { Style, Circle, Fill, Stroke, Text } from 'ol/style.js';
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

const criticalPointStyle = new Style({
    image: new Circle({
        radius: 7,
        fill: new Fill({ color: '#EF4444' }), // Red
        stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
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

    /** Sección seleccionada */
    selectedSeccion = input<SeccionFeature | null>(null);

    /** Puntos Críticos (opcional) */
    puntosCriticos = input<import('../../services/data.service').PuntoCriticoFeature[]>([]);

    showOutOfBounds = false;
    private oobTimeout: ReturnType<typeof setTimeout> | null = null;

    private mapInstance: Map | null = null;
    private markerSource = new VectorSource();
    private sectionsSource = new VectorSource();
    private criticalPointsSource = new VectorSource();

    constructor(
        private el: ElementRef,
        private cdr: ChangeDetectorRef
    ) {
        // Reactively sync marker with initial coordinates
        effect(() => {
            const lat = this.initialLat();
            const lon = this.initialLon();
            this.markerSource.clear();
            if (lat != null && lon != null) {
                this.markerSource.addFeature(new Feature(new Point(fromLonLat([lon, lat]))));
            }
        });

        // Reactively update critical points layer
        effect(() => {
            const pcs = this.puntosCriticos();
            this.criticalPointsSource.clear();
            if (pcs && pcs.length > 0) {
                const geojsonFormat = new GeoJSON();
                const features = geojsonFormat.readFeatures({
                    type: 'FeatureCollection',
                    features: pcs
                }, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                this.criticalPointsSource.addFeatures(features);
            }
        });

        // Reactively update sections layer when inputs change
        effect(() => {
            const selected = this.selectedSeccion();
            const allSections = this.secciones();

            this.sectionsSource.clear();

            const geojsonFormat = new GeoJSON();

            if (allSections && allSections.length > 0) {
                const features = geojsonFormat.readFeatures({
                    type: 'FeatureCollection',
                    features: allSections
                }, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                this.sectionsSource.addFeatures(features);
            }

            if (selected) {
                const features = geojsonFormat.readFeatures({
                    type: 'FeatureCollection',
                    features: [selected]
                }, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                // Fit view to selected section extent
                if (this.mapInstance && features.length > 0) {
                    const extent = features[0].getGeometry()?.getExtent();
                    if (extent) {
                        this.mapInstance.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 19,
                            duration: 400,
                        });
                    }
                }
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
                const hoyo = props['numero_de_hoyo'];

                let fillColor = 'rgba(255, 255, 255, 0.2)';
                let strokeColor = 'rgba(255, 255, 255, 0.5)';
                let textColor = '#666666';

                if (tipo === 'GREEN') {
                    fillColor = 'rgba(76, 175, 125, 0.4)';
                    strokeColor = '#4CAF7D';
                    textColor = '#2E7D32'; // Verde más oscuro
                } else if (tipo === 'FAIRWAY') {
                    fillColor = 'rgba(245, 158, 11, 0.4)';
                    strokeColor = '#F59E0B';
                    textColor = '#B45309'; // Naranja/Ambar más oscuro
                }

                return new Style({
                    fill: new Fill({ color: fillColor }),
                    stroke: new Stroke({ color: strokeColor, width: 2.5 }),
                    text: new Text({
                        text: hoyo != null ? hoyo.toString() : '',
                        font: 'bold 16px "Inter", "Segoe UI", sans-serif',
                        fill: new Fill({ color: textColor }),
                        // Agregamos un contorno blanco semitransparente para que resalte más y sea legible
                        stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.7)', width: 3 }),
                        overflow: true,
                        placement: 'point',
                    })
                });
            }
        });

        const criticalPointsLayer = new VectorLayer({
            source: this.criticalPointsSource,
            style: criticalPointStyle,
            zIndex: 20,
        });

        const map = new Map({
            target: container,
            layers: [satelliteLayer, sectionsLayer, criticalPointsLayer, markerLayer],
            view: new View({
                center: fromLonLat([initialLon ?? -71.54305513777648, initialLat ?? -32.99195765675922]),
                zoom: CAMPO_ZOOM_PICKER,
            }),
            controls: [],
        });

        // Centering logic on init
        if (initialLat != null && initialLon != null) {
            // Map is already centered via the view constructor, just set a close zoom
            map.getView().setZoom(19);
        } else {
            const selected = this.selectedSeccion();
            if (selected) {
                const geojsonFormat = new GeoJSON();
                const features = geojsonFormat.readFeatures({
                    type: 'FeatureCollection',
                    features: [selected]
                }, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                });
                if (features.length > 0) {
                    const extent = features[0].getGeometry()?.getExtent();
                    if (extent) {
                        map.getView().fit(extent, {
                            padding: [50, 50, 50, 50],
                            maxZoom: 19,
                            duration: 0,
                        });
                    }
                }
            } else if (this.sectionsSource.getFeatures().length > 0) {
                const extent = this.sectionsSource.getExtent();
                if (extent) {
                    map.getView().fit(extent, {
                        padding: [50, 50, 50, 50],
                        maxZoom: 19,
                        duration: 0,
                    });
                }
            }
        }

        map.on('click', (e) => {
            const [lon, lat] = toLonLat(e.coordinate);

            // Detectar en qué sección cae el punto usando hit-test sobre el layer
            let seccionDetectada: SeccionFeature | null = null;
            let pcDetectado: number | undefined = undefined;
            
            // 1. Detectar si hicimos clic en un punto crítico
            map.forEachFeatureAtPixel(
                e.pixel,
                (feature: FeatureLike) => {
                    if (pcDetectado !== undefined) return;
                    // En GeoJSON el ID suele estar en feature.getId() o en feature.get('id')
                    let id = feature.getId();
                    if (!id) id = feature.getProperties()['id'];
                    if (id != null) pcDetectado = Number(id);
                },
                { layerFilter: (l: Layer) => l === criticalPointsLayer }
            );

            // 2. Detectar sección
            map.forEachFeatureAtPixel(
                e.pixel,
                (feature: FeatureLike) => {
                    if (seccionDetectada) return;
                    const props = feature.getProperties();
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

            // If the click is outside any known sector, reject and show feedback
            if (!seccionDetectada) {
                this._showOutOfBoundsFeedback();
                return;
            }

            // Es un click válido: ocultamos el toast si estuviera visible
            if (this.showOutOfBounds) {
                this.showOutOfBounds = false;
                if (this.oobTimeout) clearTimeout(this.oobTimeout);
                this.cdr.detectChanges();
            }

            // Valid click — emit event (the effect will place the marker)
            this.coordinateSelect.emit({
                lat: parseFloat(lat.toFixed(6)),
                lon: parseFloat(lon.toFixed(6)),
                seccion: seccionDetectada,
                ...(pcDetectado !== undefined ? { puntoCriticoId: pcDetectado } : {})
            });
        });

        this.mapInstance = map;
    }

    ngOnDestroy(): void {
        if (this.oobTimeout) clearTimeout(this.oobTimeout);
        this.mapInstance?.setTarget(undefined);
        this.mapInstance = null;
    }

    /**
     * Shows a brief toast indicating the click was out of bounds.
     */
    private _showOutOfBoundsFeedback(): void {
        if (this.oobTimeout) clearTimeout(this.oobTimeout);
        this.showOutOfBounds = true;
        this.cdr.detectChanges();
        this.oobTimeout = setTimeout(() => {
            this.showOutOfBounds = false;
            this.cdr.detectChanges();
        }, 4000);
    }
}
