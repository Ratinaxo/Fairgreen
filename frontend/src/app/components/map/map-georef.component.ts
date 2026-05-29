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
import { Zoom } from 'ol/control.js';
import { fromLonLat } from 'ol/proj';
import { getZoneStyle, getZoneStyleSelected } from '../../utils/map-utils';
import { DataService, ZonesGeoJSON } from '../../services/data.service';
import { MapService } from '../../services/map.service';

@Component({
    selector: 'app-map-georef',
    standalone: true,
    template: `
    <div
      #mapContainer
      class="map-georef-container"
      role="img"
      aria-label="Mapa de georreferenciación del campo"
    ></div>
  `,
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
export class MapGeorefComponent implements AfterViewInit, OnDestroy {
    /** Emite las properties de la zona seleccionada, o null al hacer click fuera */
    zoneSelect = output<Record<string, unknown> | null>();

    private mapInstance: Map | null = null;
    private zonesSource: VectorSource | null = null;
    private selectedId: string | null = null;

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
        const container = this.el.nativeElement.querySelector('.map-georef-container');
        const geojsonData: ZonesGeoJSON = await this.dataService.getZones();

        this.zonesSource = new VectorSource({
            features: new GeoJSON().readFeatures(geojsonData, {
                featureProjection: 'EPSG:3857',
            }),
        });

        const zonesLayer = new VectorLayer({
            source: this.zonesSource,
            style: (feature) => {
                const isSelected = feature.get('id') === this.selectedId;
                const estado = feature.get('estado') as string;
                return isSelected
                    ? getZoneStyleSelected(estado)
                    : getZoneStyle(estado);
            },
        });

        const map = new Map({
            target: container,
            layers: [
                this.mapService.createSatelliteLayer(),
                zonesLayer,
            ],
            view: this.mapService.createDefaultView(),
            controls: [new Zoom()],
        });

        // Cursor pointer sobre zonas
        map.on('pointermove', (e) => {
            const hit = map.hasFeatureAtPixel(e.pixel);
            const target = map.getTargetElement() as HTMLElement;
            target.style.cursor = hit ? 'pointer' : '';
        });

        // Selección de zona
        map.on('click', (e) => {
            let clicked = false;
            map.forEachFeatureAtPixel(e.pixel, (feature) => {
                if (clicked) return;
                clicked = true;
                const props = feature.getProperties() as Record<string, unknown>;
                this.selectedId = props['id'] as string;
                this.zoneSelect.emit(props);
                zonesLayer.changed();
            });
            if (!clicked) {
                this.selectedId = null;
                this.zoneSelect.emit(null);
                zonesLayer.changed();
            }
        });

        this.mapInstance = map;
    }
}
