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
import View from 'ol/View.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import { Style, Circle, Fill, Stroke } from 'ol/style.js';
import { fromLonLat } from 'ol/proj';
import { getPointStyle } from '../../utils/map-utils';
import { DataService, MuestraFeature } from '../../services/data.service';
import { firstValueFrom } from 'rxjs';
import {
    MapService,
    CAMPO_CENTER,
    CAMPO_ZOOM_OVERVIEW,
} from '../../services/map.service';

@Component({
    selector: 'app-map-overview',
    standalone: true,
    templateUrl: './map-overview.component.html',
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
export class MapOverviewComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() muestras: MuestraFeature[] = [];

    /** Emite el id de la zona al hacer click en un marcador */
    sectorClick = output<string>();

    private mapInstance: Map | null = null;
    private pointsSource: VectorSource | null = null;
    private pointsLayer: VectorLayer | null = null;

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
        if (this.mapInstance && changes['muestras'] && this.pointsSource) {
            this.updatePoints();
        }
    }

    private updatePoints(): void {
        if (!this.pointsSource) return;
        this.pointsSource.clear();
        for (const m of this.muestras) {
            const coords = m.geometry.coordinates;
            const point = new Feature({ geometry: new Point(fromLonLat([coords[0], coords[1]])) });
            
            let color = '#4CAF7D';
            if (m.properties.conductividad > 3.5 || m.properties.salinidad > 2.5) color = '#EF4444';
            else if (m.properties.conductividad > 2.0 || m.properties.salinidad > 1.5) color = '#F59E0B';
            
            point.setProperties({ ...m.properties, color });
            this.pointsSource.addFeature(point);
        }
    }

    private async initMap(): Promise<void> {
        const container = this.el.nativeElement.querySelector('.map-overview-container');
        
        this.pointsSource = new VectorSource();
        this.updatePoints();

        this.pointsLayer = new VectorLayer({
            source: this.pointsSource,
            style: (feature) => {
                const color = feature.get('color') as string;
                return new Style({
                    image: new Circle({
                        radius: 8,
                        fill: new Fill({ color }),
                        stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
                    })
                });
            }
        });

        const map = new Map({
            target: container,
            layers: [
                this.mapService.createSatelliteLayer(),
                this.pointsLayer,
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
