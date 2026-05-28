import {
    Component,
    AfterViewInit,
    OnDestroy,
    ElementRef,
    output,
} from '@angular/core';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { getZoneStyle, getPointStyle } from '../../utils/map-utils';
import { DataService, ZonesGeoJSON } from '../../services/data.service';
import {
    MapService,
    CAMPO_CENTER,
    CAMPO_ZOOM_OVERVIEW,
} from '../../services/map.service';

@Component({
    selector: 'app-map-overview',
    standalone: true,
    template: `
    <div
      #mapContainer
      class="map-overview-container"
      role="img"
      aria-label="Vista general del campo de golf"
    ></div>
  `,
    styles: [
        `
      .map-overview-container {
        width: 100%;
        height: 340px;
        border-radius: 12px;
        overflow: hidden;
      }
    `,
    ],
})
export class MapOverviewComponent implements AfterViewInit, OnDestroy {
    /** Emite el id de la zona al hacer click en un marcador */
    sectorClick = output<string>();

    private mapInstance: Map | null = null;

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

    private async initMap(): Promise<void> {
        const container = this.el.nativeElement.querySelector('.map-overview-container');
        const geojsonData: ZonesGeoJSON = await this.dataService.getZones();

        const zonesSource = new VectorSource({
            features: new GeoJSON().readFeatures(geojsonData, {
                featureProjection: 'EPSG:3857',
            }),
        });

        const zonesLayer = new VectorLayer({
            source: zonesSource,
            style: (feature) => {
                const estado = feature.get('estado') as string;
                return getZoneStyle(estado);
            },
        });

        // Capa de puntos centroide (marcadores numerados)
        const pointsSource = new VectorSource();
        zonesSource.getFeatures().forEach((feature) => {
            const extent = feature.getGeometry()!.getExtent();
            const center: [number, number] = [
                (extent[0] + extent[2]) / 2,
                (extent[1] + extent[3]) / 2,
            ];
            const point = new Feature({ geometry: new Point(center) });
            point.setProperties(feature.getProperties());
            pointsSource.addFeature(point);
        });

        const pointsLayer = new VectorLayer({
            source: pointsSource,
            style: (feature) => {
                const sector = feature.get('sector') as number;
                const estado = feature.get('estado') as string;
                return getPointStyle(sector, estado);
            },
        });

        const map = new Map({
            target: container,
            layers: [
                this.mapService.createSatelliteLayer(),
                zonesLayer,
                pointsLayer,
            ],
            view: new View({
                center: CAMPO_CENTER,
                zoom: CAMPO_ZOOM_OVERVIEW,
            }),
            controls: [],
        });

        // Click en punto → emite el id de la zona
        map.on('click', (e) => {
            map.forEachFeatureAtPixel(e.pixel, (feature) => {
                const props = feature.getProperties() as Record<string, unknown>;
                if (props['id']) {
                    this.sectorClick.emit(props['id'] as string);
                }
            });
        });

        this.mapInstance = map;
    }
}
