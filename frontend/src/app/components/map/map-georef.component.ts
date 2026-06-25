import {
    Component,
    AfterViewInit,
    OnDestroy,
    ElementRef,
    output,
    Input,
    OnChanges,
    SimpleChanges
} from '@angular/core';
import Map from 'ol/Map.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { Style, Circle, Fill, Stroke } from 'ol/style.js';
import { Zoom } from 'ol/control.js';
import { fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent.js';
import { DataService, MuestraFeature, SeccionFeature } from '../../services/data.service';
import { MapService } from '../../services/map.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-map-georef',
    standalone: true,
    templateUrl: './map-georef.component.html',
    styles: [
        `
      .map-georef-container {
        width: 100%;
        height: 100%;
        min-height: 480px;
      }
    `,
    ],
})
export class MapGeorefComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() muestras: MuestraFeature[] = [];
    @Input() secciones: SeccionFeature[] = [];
    @Input() focusId: string | null = null;

    /** Emite las properties de la muestra seleccionada, o null al hacer click fuera */
    zoneSelect = output<Record<string, unknown> | null>();

    private mapInstance: Map | null = null;
    private pointsSource: VectorSource | null = null;
    private pointsLayer: VectorLayer | null = null;
    private sectionsSource: VectorSource | null = null;
    private sectionsLayer: VectorLayer | null = null;
    private selectedId: string | null = null;
    private selectedSectorId: string | null = null;

    constructor(
        private el: ElementRef,
        private dataService: DataService,
        private mapService: MapService
    ) { }

    async ngAfterViewInit(): Promise<void> {
        await this.initMap();
    }

    ngOnDestroy(): void {
        this.mapInstance?.setTarget(undefined);
        this.mapInstance = null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.mapInstance) {
            if (changes['secciones'] && this.sectionsSource) {
                this.updateSections();
            }
            if (changes['muestras'] && this.pointsSource) {
                this.updatePoints();
                if (this.focusId) {
                    setTimeout(() => this.zoomToSample(this.focusId!), 100);
                }
            }
            if (changes['focusId'] && this.focusId) {
                this.selectedId = this.focusId;
                this.selectedSectorId = null;
                this.pointsLayer?.changed();
                this.sectionsLayer?.changed();
                this.zoomToSample(this.focusId);
            }
        }
    }

    private zoomToSample(id: string): void {
        if (!this.pointsSource || !this.mapInstance) return;
        const features = this.pointsSource.getFeatures();
        const feat = features.find(f => String(f.get('id_muestra')) === id);
        if (feat) {
            const geom = feat.getGeometry();
            if (geom) {
                this.mapInstance.getView().animate({ center: getCenter(geom.getExtent()), zoom: 19, duration: 800 });
            }
        }
    }

    private updateSections(): void {
        if (!this.sectionsSource) return;
        this.sectionsSource.clear();
        if (!this.secciones || this.secciones.length === 0) return;

        const geojsonFormat = new GeoJSON();
        const features = geojsonFormat.readFeatures({
            type: 'FeatureCollection',
            features: this.secciones
        }, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        this.sectionsSource.addFeatures(features);
    }

    private updatePoints(): void {
        if (!this.pointsSource) return;
        this.pointsSource.clear();
        for (const m of this.muestras) {
            const coords = m.geometry.coordinates;
            const point = new Feature({ geometry: new Point(fromLonLat([coords[0], coords[1]])) });

            // Determinar color según estado (salinidad/conductividad)
            let color = '#4CAF7D'; // Optimo
            const cond = m.properties.conductividad ?? 0;
            const sal = m.properties.salinidad ?? 0;
            if (cond > 3.5 || sal > 2.5) color = '#EF4444'; // Critico
            else if (cond > 2.0 || sal > 1.5) color = '#F59E0B'; // Atencion

            point.setProperties({ ...m.properties, id_muestra: m.id || m.properties?.id_muestra, color });
            this.pointsSource.addFeature(point);
        }
    }

    private async initMap(): Promise<void> {
        const container = this.el.nativeElement.querySelector('.map-georef-container');

        this.pointsSource = new VectorSource();
        this.updatePoints();

        this.sectionsSource = new VectorSource();
        this.updateSections();

        this.pointsLayer = new VectorLayer({
            source: this.pointsSource,
            style: (feature) => {
                const isSelected = String(feature.get('id_muestra')) === this.selectedId;
                const color = feature.get('color') as string;
                return new Style({
                    image: new Circle({
                        radius: isSelected ? 10 : 8,
                        fill: new Fill({ color }),
                        stroke: new Stroke({ color: '#FFFFFF', width: isSelected ? 3 : 2 }),
                    })
                });
            }
        });

        this.sectionsLayer = new VectorLayer({
            source: this.sectionsSource,
            style: (feature) => {
                const props = feature.getProperties();
                const tipo = props['tipo_de_tierra'];
                const isSelected = String(feature.getId()) === this.selectedSectorId;

                let fillColor = 'rgba(255, 255, 255, 0.2)';
                let strokeColor = 'rgba(255, 255, 255, 0.5)';
                let strokeWidth = isSelected ? 4 : 2;
                let zIndex = isSelected ? 10 : 1;

                if (tipo === 'GREEN') {
                    fillColor = isSelected ? 'rgba(52, 211, 153, 0.7)' : 'rgba(76, 175, 125, 0.4)'; // Más chillón al seleccionar
                    strokeColor = isSelected ? '#10B981' : '#4CAF7D';
                } else if (tipo === 'FAIRWAY') {
                    fillColor = isSelected ? 'rgba(251, 191, 36, 0.7)' : 'rgba(245, 158, 11, 0.4)'; // Más chillón al seleccionar
                    strokeColor = isSelected ? '#F59E0B' : '#F59E0B';
                }

                return new Style({
                    fill: new Fill({ color: fillColor }),
                    stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
                    zIndex: zIndex
                });
            }
        });

        const map = new Map({
            target: container,
            layers: [
                this.mapService.createSatelliteLayer(),
                this.sectionsLayer,
                this.pointsLayer,
            ],
            view: this.mapService.createDefaultView(),
            controls: [new Zoom()],
        });

        // Cursor pointer sobre zonas (muestras y secciones)
        map.on('pointermove', (e) => {
            const hit = map.hasFeatureAtPixel(e.pixel, {
                layerFilter: (layer) => layer === this.pointsLayer || layer === this.sectionsLayer
            });
            const target = map.getTargetElement() as HTMLElement;
            target.style.cursor = hit ? 'pointer' : '';
        });

        // Selección de muestra o sector
        map.on('click', (e) => {
            let clickedMuestra = false;
            map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
                if (clickedMuestra) return;
                clickedMuestra = true;
                const props = feature.getProperties() as Record<string, unknown>;
                this.selectedId = String(props['id_muestra']);
                this.selectedSectorId = null;
                this.zoneSelect.emit({ ...props, type: 'muestra' });
                this.pointsLayer?.changed();
                this.sectionsLayer?.changed();
            }, {
                layerFilter: (layer) => layer === this.pointsLayer
            });

            if (!clickedMuestra) {
                let clickedSector = false;
                map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
                    if (clickedSector) return;
                    clickedSector = true;
                    const props = feature.getProperties() as Record<string, unknown>;
                    this.selectedId = null;
                    this.selectedSectorId = String(feature.getId());
                    this.zoneSelect.emit({ ...props, type: 'sector', featureId: feature.getId() });
                    this.pointsLayer?.changed();
                    this.sectionsLayer?.changed();
                }, {
                    layerFilter: (layer) => layer === this.sectionsLayer
                });

                if (!clickedSector) {
                    this.selectedId = null;
                    this.selectedSectorId = null;
                    this.zoneSelect.emit(null);
                    this.pointsLayer?.changed();
                    this.sectionsLayer?.changed();
                }
            }
        });

        this.mapInstance = map;

        // Si el componente se inicializó con un focusId, centrar la vista en él
        if (this.focusId) {
            setTimeout(() => this.zoomToSample(this.focusId!), 100);
        }
    }
}
