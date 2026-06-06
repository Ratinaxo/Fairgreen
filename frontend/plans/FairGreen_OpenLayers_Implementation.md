# FairGreen — Plan de Implementación: OpenLayers

> Versión de OL utilizada: **v10.9.0** (latest)
> Estado actual: sin base de datos. Este documento cubre la fase actual (datos mock/estáticos) y la fase futura (integración con DB).

---

## Índice

1. [Instalación y configuración inicial](#1-instalación-y-configuración-inicial)
2. [Arquitectura de capas OL en FairGreen](#2-arquitectura-de-capas-ol-en-fairgreen)
3. [Estructura de datos (ahora y con DB)](#3-estructura-de-datos-ahora-y-con-db)
4. [Implementación por pantalla](#4-implementación-por-pantalla)
   - 4.1 Panel de Control — mapa overview
   - 4.2 Georreferenciación — mapa principal
   - 4.3 Registro de Muestras — selector de punto
5. [Servicio de mapa reutilizable](#5-servicio-de-mapa-reutilizable)
6. [Gestión de estilos y estados visuales](#6-gestión-de-estilos-y-estados-visuales)
7. [Integración con base de datos (planificación)](#7-integración-con-base-datos-planificación)
8. [Modelo de datos en DB](#8-modelo-de-datos-en-db)
9. [API endpoints esperados](#9-api-endpoints-esperados)
10. [Proyección y transformación de coordenadas](#10-proyección-y-transformación-de-coordenadas)
11. [Tree-shaking y bundle size](#11-tree-shaking-y-bundle-size)
12. [Checklist de implementación](#12-checklist-de-implementación)

---

## 1. Instalación y configuración inicial

### Instalación del paquete

```bash
npm install ol
```

### Importar estilos base (obligatorio)

En el archivo de estilos global o en el entry point del proyecto:

```css
/* styles/global.css */
@import "ol/ol.css";
```

Esto importa los estilos que OL necesita para renderizar controles de zoom, cursores y el canvas del mapa correctamente. Sin esto el mapa puede verse roto.

### Estructura de archivos sugerida

```
src/
├── components/
│   ├── map/
│   │   ├── MapOverview.jsx          ← Panel de Control (solo lectura)
│   │   ├── MapGeoref.jsx            ← Georreferenciación (interactivo)
│   │   ├── MapPointPicker.jsx       ← Registro de muestras (selector de punto)
│   │   └── MapTooltip.jsx           ← Tooltip flotante sobre zonas
│   └── sidebar/
│       └── ZonePanel.jsx            ← Panel lateral con métricas de zona
├── services/
│   └── mapService.js               ← Instancias OL reutilizables
├── data/
│   └── mock/
│       ├── zones.geojson            ← Zonas del campo (polígonos)
│       └── samples.json             ← Muestras mock por zona
├── utils/
│   └── mapUtils.js                 ← Helpers de proyección y estilos
└── styles/
    └── global.css
```

---

## 2. Arquitectura de capas OL en FairGreen

Cada mapa en FairGreen se construye apilando capas en este orden (de abajo hacia arriba):

```
┌──────────────────────────────────────┐
│  4. layer: PointsLayer               │  Marcadores de muestras / puntos críticos
├──────────────────────────────────────┤
│  3. layer: SelectedZoneLayer         │  Highlight de zona seleccionada
├──────────────────────────────────────┤
│  2. layer: ZonesLayer                │  Polígonos de greens con color de estado
├──────────────────────────────────────┤
│  1. layer: SatelliteLayer (TileLayer)│  Imagen satelital base
└──────────────────────────────────────┘
```

Cada capa es independiente. Si el estado de una zona cambia, solo se re-renderiza `ZonesLayer`, no el mapa completo.

---

## 3. Estructura de datos (ahora y con DB)

### Fase actual: datos mock estáticos

Las zonas del campo se definen como un archivo GeoJSON local. Este archivo también actúa como contrato de datos para cuando llegue la DB — la forma del objeto no cambia, solo su origen.

**`src/data/mock/zones.geojson`**

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "green-1",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-71.5070, -33.0148],
          [-71.5065, -33.0148],
          [-71.5065, -33.0153],
          [-71.5070, -33.0153],
          [-71.5070, -33.0148]
        ]]
      },
      "properties": {
        "id": "green-1",
        "nombre": "Green #1",
        "sector": 1,
        "zona": "Green",
        "estado": "optimo",
        "metricas": {
          "humedad": 4.0,
          "temperatura": 18.5,
          "salinidad": 0.8,
          "conductividad": 1.5
        },
        "ultimo_registro": "2026-04-16T08:30:00Z",
        "responsable": "J. Pérez"
      }
    },
    {
      "type": "Feature",
      "id": "green-4",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-71.5050, -33.0155],
          [-71.5043, -33.0155],
          [-71.5043, -33.0162],
          [-71.5050, -33.0162],
          [-71.5050, -33.0155]
        ]]
      },
      "properties": {
        "id": "green-4",
        "nombre": "Green #4",
        "sector": 4,
        "zona": "Green",
        "estado": "critico",
        "metricas": {
          "humedad": 2.0,
          "temperatura": 22.0,
          "salinidad": 1.8,
          "conductividad": 2.3
        },
        "ultimo_registro": "2026-04-16T09:00:00Z",
        "responsable": "M. Rojas"
      }
    }
  ]
}
```

**`src/data/mock/samples.json`**

```json
[
  {
    "id": "sample-001",
    "zone_id": "green-1",
    "sector": 1,
    "zona": "Green",
    "coordenadas": { "lat": -33.0150, "lon": -71.5068 },
    "metricas": {
      "humedad": 4.0,
      "temperatura": 18.5,
      "salinidad": 0.8,
      "conductividad": 1.5
    },
    "fecha": "2026-04-16T08:30:00Z",
    "responsable": "J. Pérez",
    "evidencia_url": null,
    "indicaciones": "Niveles dentro del rango. Humedad levemente baja."
  }
]
```

### Capa de abstracción de datos (DataService)

Para que el cambio de mock a DB sea transparente, todo acceso a datos pasa por un servicio. El componente del mapa nunca importa el JSON directamente.

```js
// src/services/dataService.js

const USE_MOCK = true; // ← cambiar a false cuando haya API

export async function getZones() {
  if (USE_MOCK) {
    const data = await import('../data/mock/zones.geojson', { assert: { type: 'json' } });
    return data.default;
  }
  const res = await fetch('/api/zones');
  return res.json();
}

export async function getSamplesByZone(zoneId) {
  if (USE_MOCK) {
    const data = await import('../data/mock/samples.json', { assert: { type: 'json' } });
    return data.default.filter(s => s.zone_id === zoneId);
  }
  const res = await fetch(`/api/zones/${zoneId}/samples`);
  return res.json();
}

export async function createSample(payload) {
  if (USE_MOCK) {
    console.log('[MOCK] Muestra guardada:', payload);
    return { ...payload, id: `sample-${Date.now()}` };
  }
  const res = await fetch('/api/samples', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
```

Con este patrón, cuando la DB esté lista, solo se cambia `USE_MOCK = false` y se implementan los endpoints. Los componentes del mapa no se tocan.

---

## 4. Implementación por pantalla

### 4.1 Panel de Control — mapa overview

Mapa de solo lectura. Muestra todos los sectores con su estado actual. No hay interacción de selección — solo visualización. El click en un marcador puede redirigir a Georreferenciación.

```js
// src/components/map/MapOverview.jsx
import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import BingMaps from 'ol/source/BingMaps.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj';
import { getZoneStyle, getPointStyle } from '../../utils/mapUtils.js';
import { getZones } from '../../services/dataService.js';

export function MapOverview({ onSectorClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    let map;

    async function initMap() {
      const geojsonData = await getZones();

      const zonesSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojsonData, {
          featureProjection: 'EPSG:3857',
        }),
      });

      const zonesLayer = new VectorLayer({
        source: zonesSource,
        style: (feature) => getZoneStyle(feature.get('estado')),
      });

      // Capa de puntos centroide (marcadores numerados)
      const pointsSource = new VectorSource();
      zonesSource.getFeatures().forEach((feature) => {
        const extent = feature.getGeometry().getExtent();
        const center = [
          (extent[0] + extent[2]) / 2,
          (extent[1] + extent[3]) / 2,
        ];
        const point = new ol.Feature({ geometry: new ol.geom.Point(center) });
        point.setProperties(feature.getProperties());
        pointsSource.addFeature(point);
      });

      const pointsLayer = new VectorLayer({
        source: pointsSource,
        style: (feature) => getPointStyle(feature.get('sector'), feature.get('estado')),
      });

      map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new BingMaps({
              key: import.meta.env.VITE_BING_MAPS_KEY,
              imagerySet: 'Aerial',
            }),
          }),
          zonesLayer,
          pointsLayer,
        ],
        view: new View({
          center: fromLonLat([-71.5061, -33.0152]),
          zoom: 15,
        }),
        controls: [], // sin controles en el overview
      });

      // Click en punto → navegar a Georreferenciación con zona preseleccionada
      map.on('click', (e) => {
        map.forEachFeatureAtPixel(e.pixel, (feature) => {
          const props = feature.getProperties();
          if (props.id) {
            onSectorClick?.(props.id);
          }
        });
      });

      mapInstance.current = map;
    }

    initMap();

    return () => mapInstance.current?.setTarget(null);
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '340px', borderRadius: '12px', overflow: 'hidden' }}
      aria-label="Vista general del campo de golf"
    />
  );
}
```

### 4.2 Georreferenciación — mapa principal

Mapa completo e interactivo. Permite seleccionar zonas, ver métricas en el panel lateral y registrar nuevas muestras. Incluye controles de zoom y capas.

```js
// src/components/map/MapGeoref.jsx
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import BingMaps from 'ol/source/BingMaps.js';
import { Zoom } from 'ol/control.js';
import { fromLonLat } from 'ol/proj';
import { getZoneStyle, getZoneStyleSelected } from '../../utils/mapUtils.js';
import { getZones } from '../../services/dataService.js';

export function MapGeoref({ onZoneSelect }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const zonesSourceRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    async function initMap() {
      const geojsonData = await getZones();

      const zonesSource = new VectorSource({
        features: new GeoJSON().readFeatures(geojsonData, {
          featureProjection: 'EPSG:3857',
        }),
      });
      zonesSourceRef.current = zonesSource;

      // Capa de zonas normales
      const zonesLayer = new VectorLayer({
        source: zonesSource,
        style: (feature) => {
          const isSelected = feature.get('id') === selectedId;
          return isSelected
            ? getZoneStyleSelected(feature.get('estado'))
            : getZoneStyle(feature.get('estado'));
        },
      });

      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new BingMaps({
              key: import.meta.env.VITE_BING_MAPS_KEY,
              imagerySet: 'Aerial',
            }),
          }),
          zonesLayer,
        ],
        view: new View({
          center: fromLonLat([-71.5061, -33.0152]),
          zoom: 16,
        }),
        controls: [new Zoom()], // solo zoom, sin atribución por diseño
      });

      // Cursor pointer sobre zonas
      map.on('pointermove', (e) => {
        const hit = map.hasFeatureAtPixel(e.pixel);
        map.getTargetElement().style.cursor = hit ? 'pointer' : '';
      });

      // Selección de zona
      map.on('click', (e) => {
        let clicked = false;
        map.forEachFeatureAtPixel(e.pixel, (feature) => {
          if (clicked) return;
          clicked = true;
          const props = feature.getProperties();
          setSelectedId(props.id);
          onZoneSelect?.(props);
          zonesLayer.changed(); // fuerza re-render de estilos
        });
        if (!clicked) {
          setSelectedId(null);
          onZoneSelect?.(null);
          zonesLayer.changed();
        }
      });

      mapInstance.current = map;
    }

    initMap();
    return () => mapInstance.current?.setTarget(null);
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', minHeight: '480px' }}
      aria-label="Mapa de georreferenciación del campo"
    />
  );
}
```

**Componente padre que integra mapa + panel lateral:**

```jsx
// src/pages/Georeferenciacion.jsx
import { useState } from 'react';
import { MapGeoref } from '../components/map/MapGeoref.jsx';
import { ZonePanel } from '../components/sidebar/ZonePanel.jsx';

export function Georeferenciacion() {
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapGeoref onZoneSelect={setSelectedZone} />
        <MapLegend />
      </div>
      <ZonePanel zone={selectedZone} />
    </div>
  );
}
```

### 4.3 Registro de Muestras — selector de punto

Mini-mapa embebido en el formulario. Al hacer click, obtiene coordenadas y las escribe en los campos de latitud/longitud. El punto seleccionado se muestra con un marcador.

```js
// src/components/map/MapPointPicker.jsx
import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Feature from 'ol/Feature.js';
import Point from 'ol/geom/Point.js';
import BingMaps from 'ol/source/BingMaps.js';
import { Style, Circle, Fill, Stroke } from 'ol/style.js';
import { fromLonLat, toLonLat } from 'ol/proj';

// markerStyle: círculo blanco con borde verde oscuro
const markerStyle = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({ color: '#FFFFFF' }),
    stroke: new Stroke({ color: '#1C3D2E', width: 2.5 }),
  }),
});

export function MapPointPicker({ onCoordinateSelect, initialLat, initialLon }) {
  const mapRef = useRef(null);
  const markerSource = useRef(new VectorSource());

  useEffect(() => {
    const markerLayer = new VectorLayer({
      source: markerSource.current,
      style: markerStyle,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new BingMaps({
            key: import.meta.env.VITE_BING_MAPS_KEY,
            imagerySet: 'Aerial',
          }),
        }),
        markerLayer,
      ],
      view: new View({
        center: fromLonLat([initialLon ?? -71.5061, initialLat ?? -33.0152]),
        zoom: 16,
      }),
      controls: [],
    });

    // Si ya hay coordenadas previas, mostrar marcador inicial
    if (initialLat && initialLon) {
      const initial = new Feature(new Point(fromLonLat([initialLon, initialLat])));
      markerSource.current.addFeature(initial);
    }

    map.on('click', (e) => {
      const [lon, lat] = toLonLat(e.coordinate);

      // Reemplaza marcador anterior
      markerSource.current.clear();
      markerSource.current.addFeature(
        new Feature(new Point(e.coordinate))
      );

      onCoordinateSelect?.({
        lat: parseFloat(lat.toFixed(6)),
        lon: parseFloat(lon.toFixed(6)),
      });
    });

    map.getTargetElement().style.cursor = 'crosshair';

    return () => map.setTarget(null);
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '200px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #DDE5DF',
        cursor: 'crosshair',
      }}
      aria-label="Seleccionar punto en el mapa"
    />
  );
}
```

**Integración en el formulario:**

```jsx
// En el componente RegistroMuestra.jsx
const [coordenadas, setCoordenadas] = useState({ lat: '', lon: '' });
const [mostrarMapa, setMostrarMapa] = useState(false);

// Botón "Marcar en el mapa" activa el mapa
<button type="button" onClick={() => setMostrarMapa(true)}>
  Marcar en el mapa
</button>

{mostrarMapa && (
  <MapPointPicker
    initialLat={coordenadas.lat || undefined}
    initialLon={coordenadas.lon || undefined}
    onCoordinateSelect={(coords) => {
      setCoordenadas(coords);
      setMostrarMapa(false); // colapsa el mapa tras seleccionar
    }}
  />
)}

<input readOnly value={coordenadas.lat} placeholder="Latitud" />
<input readOnly value={coordenadas.lon} placeholder="Longitud" />
```

---

## 5. Servicio de mapa reutilizable

Para evitar duplicar configuración entre pantallas, las instancias de fuente de tiles y la vista base se centralizan:

```js
// src/services/mapService.js
import BingMaps from 'ol/source/BingMaps.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import { fromLonLat } from 'ol/proj';

// Coordenadas del campo. En el futuro se leerán desde la DB del club.
export const CAMPO_CENTER = fromLonLat([-71.5061, -33.0152]);
export const CAMPO_ZOOM_OVERVIEW = 15;
export const CAMPO_ZOOM_DETAIL = 16;
export const CAMPO_ZOOM_PICKER = 17;

export function createSatelliteLayer() {
  return new TileLayer({
    source: new BingMaps({
      key: import.meta.env.VITE_BING_MAPS_KEY,
      imagerySet: 'Aerial',
    }),
  });
}

export function createDefaultView(zoom = CAMPO_ZOOM_DETAIL) {
  return new View({
    center: CAMPO_CENTER,
    zoom,
    minZoom: 13,
    maxZoom: 20,
  });
}
```

---

## 6. Gestión de estilos y estados visuales

Todos los estilos del mapa viven en un único archivo. Esto permite cambiar la paleta visual del mapa sin tocar los componentes.

```js
// src/utils/mapUtils.js
import { Style, Fill, Stroke, Circle, Text } from 'ol/style.js';

// Paleta de estados (debe coincidir con los tokens CSS del diseño)
const ESTADO_COLORS = {
  optimo: {
    fill:         'rgba(76, 175, 125, 0.40)',
    fillSelected: 'rgba(76, 175, 125, 0.65)',
    stroke:       '#4CAF7D',
  },
  atencion: {
    fill:         'rgba(245, 158, 11, 0.40)',
    fillSelected: 'rgba(245, 158, 11, 0.65)',
    stroke:       '#F59E0B',
  },
  critico: {
    fill:         'rgba(239, 68, 68, 0.45)',
    fillSelected: 'rgba(239, 68, 68, 0.70)',
    stroke:       '#EF4444',
  },
};

// Estilo de zona normal
export function getZoneStyle(estado) {
  const c = ESTADO_COLORS[estado] ?? ESTADO_COLORS.optimo;
  return new Style({
    fill:   new Fill({ color: c.fill }),
    stroke: new Stroke({ color: c.stroke, width: 2 }),
  });
}

// Estilo de zona seleccionada (más opaco + borde más grueso)
export function getZoneStyleSelected(estado) {
  const c = ESTADO_COLORS[estado] ?? ESTADO_COLORS.optimo;
  return new Style({
    fill:   new Fill({ color: c.fillSelected }),
    stroke: new Stroke({ color: c.stroke, width: 3 }),
  });
}

// Estilo de marcador de sector (círculo con número)
export function getPointStyle(sectorNum, estado) {
  const c = ESTADO_COLORS[estado] ?? ESTADO_COLORS.optimo;
  return new Style({
    image: new Circle({
      radius: 14,
      fill:   new Fill({ color: c.stroke }),
      stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
    }),
    text: new Text({
      text:     String(sectorNum),
      fill:     new Fill({ color: '#FFFFFF' }),
      font:     'bold 11px DM Sans, sans-serif',
      offsetY:  1,
    }),
  });
}
```

---

## 7. Integración con base de datos (planificación)

Esta sección documenta cómo se conectará OL con la DB cuando esté disponible. El código actual ya está preparado para este momento gracias al `dataService.js`.

### Flujo de datos con DB

```
Frontend (OL)
     │
     │  fetch('/api/zones')
     ▼
Backend API (REST o GraphQL)
     │
     │  SELECT * FROM zones JOIN zone_status ...
     ▼
Base de datos (PostgreSQL + PostGIS)
```

### Por qué PostGIS

PostgreSQL con la extensión PostGIS es la opción natural para este proyecto:

- Permite guardar los polígonos de cada zona directamente como geometría (`GEOMETRY(Polygon, 4326)`), no como arrays de coordenadas en JSON.
- La consulta de "qué zona contiene este punto" se hace en SQL en una línea: `WHERE ST_Contains(geom, ST_SetSRID(ST_Point($lon, $lat), 4326))`.
- OL puede recibir la respuesta directamente en formato GeoJSON — PostGIS tiene `ST_AsGeoJSON()` nativo.
- La alternativa (guardar coordenadas como texto y procesarlas en el servidor) es frágil y no escala.

Si no se puede usar PostGIS, la alternativa es guardar los polígonos como JSON en una columna `jsonb` de PostgreSQL estándar y hacer las operaciones geoespaciales en el backend con la librería `turf.js`.

### Endpoint que reemplaza el mock

```js
// Reemplaza: import('../data/mock/zones.geojson')
// Por:
const res = await fetch('/api/zones');
const geojson = await res.json();
// geojson tiene exactamente la misma forma que el mock
// OL no nota la diferencia
```

---

## 8. Modelo de datos en DB

### Tabla: `zones`

Almacena la definición geográfica fija del campo. Esta tabla rara vez cambia — solo cuando se redefinen los límites de una zona.

```sql
CREATE TABLE zones (
  id            VARCHAR(50)    PRIMARY KEY,        -- ej: "green-4"
  nombre        VARCHAR(100)   NOT NULL,           -- ej: "Green #4"
  sector        INTEGER        NOT NULL,
  zona          VARCHAR(50)    NOT NULL,           -- Green | Fairway | Rough | Tee
  geom          GEOMETRY(Polygon, 4326) NOT NULL,  -- polígono en WGS84
  club_id       INTEGER        REFERENCES clubs(id),
  activa        BOOLEAN        DEFAULT TRUE,
  created_at    TIMESTAMPTZ    DEFAULT NOW()
);

-- Índice espacial para queries ST_Contains rápidas
CREATE INDEX zones_geom_idx ON zones USING GIST (geom);
```

### Tabla: `samples`

Registro de cada muestra tomada en campo. Es la tabla de mayor volumen.

```sql
CREATE TABLE samples (
  id              SERIAL         PRIMARY KEY,
  zone_id         VARCHAR(50)    REFERENCES zones(id),
  sector          INTEGER        NOT NULL,
  zona            VARCHAR(50)    NOT NULL,
  lat             DECIMAL(9,6)   NOT NULL,
  lon             DECIMAL(9,6)   NOT NULL,
  punto           GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                    ST_SetSRID(ST_Point(lon, lat), 4326)
                  ) STORED,
  humedad         DECIMAL(4,2),   -- escala 1–5
  temperatura     DECIMAL(5,2),   -- °C
  salinidad       DECIMAL(5,3),   -- dS/m
  conductividad   DECIMAL(5,3),   -- dS/m
  responsable_id  INTEGER        REFERENCES users(id),
  evidencia_url   TEXT,
  indicaciones    TEXT,
  fecha           TIMESTAMPTZ    DEFAULT NOW()
);
```

### Vista: `zone_current_status`

Esta vista es lo que consume el frontend para el mapa. Calcula el estado actual de cada zona en base a la última muestra registrada, sin lógica en el servidor.

```sql
CREATE VIEW zone_current_status AS
SELECT
  z.id,
  z.nombre,
  z.sector,
  z.zona,
  ST_AsGeoJSON(z.geom)::json  AS geometry,
  s.humedad,
  s.temperatura,
  s.salinidad,
  s.conductividad,
  s.fecha                      AS ultimo_registro,
  u.nombre                     AS responsable,
  CASE
    WHEN s.humedad < 2.0 OR s.salinidad > 1.5 THEN 'critico'
    WHEN s.humedad < 3.0 OR s.salinidad > 1.0 THEN 'atencion'
    ELSE 'optimo'
  END                          AS estado
FROM zones z
LEFT JOIN LATERAL (
  SELECT * FROM samples
  WHERE zone_id = z.id
  ORDER BY fecha DESC
  LIMIT 1
) s ON TRUE
LEFT JOIN users u ON s.responsable_id = u.id;
```

> Los umbrales del `CASE` (humedad < 2.0, salinidad > 1.5, etc.) deben ser configurables por club. En una segunda iteración se mueven a una tabla `zone_thresholds`.

### Tabla: `zone_thresholds` (segunda iteración)

```sql
CREATE TABLE zone_thresholds (
  club_id             INTEGER  REFERENCES clubs(id),
  zona                VARCHAR(50),
  humedad_min         DECIMAL(4,2)  DEFAULT 2.0,
  humedad_max         DECIMAL(4,2)  DEFAULT 5.0,
  salinidad_max       DECIMAL(5,3)  DEFAULT 1.5,
  conductividad_max   DECIMAL(5,3)  DEFAULT 2.0,
  temperatura_min     DECIMAL(5,2)  DEFAULT 10.0,
  temperatura_max     DECIMAL(5,2)  DEFAULT 30.0,
  PRIMARY KEY (club_id, zona)
);
```

### Tabla: `users`

```sql
CREATE TABLE users (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  rol         VARCHAR(20)   NOT NULL CHECK (rol IN ('admin', 'agronomo', 'canchero')),
  club_id     INTEGER       REFERENCES clubs(id),
  activo      BOOLEAN       DEFAULT TRUE,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  last_login  TIMESTAMPTZ
);
```

### Tabla: `clubs`

```sql
CREATE TABLE clubs (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(100)  NOT NULL,
  pais        VARCHAR(50),
  timezone    VARCHAR(50)   DEFAULT 'America/Santiago',
  created_at  TIMESTAMPTZ   DEFAULT NOW()
);
```

---

## 9. API endpoints esperados

Estos son los endpoints que el backend deberá implementar. El `dataService.js` ya los llama — solo falta que existan.

### `GET /api/zones`

Devuelve todas las zonas del club con su estado actual. Responde GeoJSON puro para que OL lo consuma directamente.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "green-4",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[ ... ]]
      },
      "properties": {
        "id": "green-4",
        "nombre": "Green #4",
        "sector": 4,
        "zona": "Green",
        "estado": "critico",
        "metricas": {
          "humedad": 2.0,
          "temperatura": 22.0,
          "salinidad": 1.8,
          "conductividad": 2.3
        },
        "ultimo_registro": "2026-04-16T09:00:00Z",
        "responsable": "M. Rojas"
      }
    }
  ]
}
```

**Query SQL que lo genera:**

```sql
SELECT json_build_object(
  'type', 'FeatureCollection',
  'features', json_agg(
    json_build_object(
      'type', 'Feature',
      'id', zcs.id,
      'geometry', zcs.geometry,
      'properties', row_to_json(zcs) - 'geometry'
    )
  )
)
FROM zone_current_status zcs
WHERE club_id = $club_id;
```

### `GET /api/zones/:id/samples`

Historial de muestras de una zona específica. Usado por el panel lateral de Georreferenciación y por el Historial de Muestras.

```
GET /api/zones/green-4/samples?limit=10&offset=0
```

### `POST /api/samples`

Crea una nueva muestra. Usado por el formulario de Registro de Muestras.

```json
{
  "zone_id": "green-4",
  "sector": 4,
  "zona": "Green",
  "lat": -33.015823,
  "lon": -71.504711,
  "humedad": 3.5,
  "temperatura": 19.0,
  "salinidad": 1.1,
  "conductividad": 1.4,
  "indicaciones": "Riego recomendado en próximas 24h."
}
```

### `GET /api/reports/weekly`

Reporte semanal del Panel de Control. Devuelve un PDF o los datos para generarlo.

---

## 10. Proyección y transformación de coordenadas

Este es el punto más propenso a errores. Hay dos sistemas de coordenadas en juego:

| Sistema | Código EPSG | Formato | Usado en |
|---|---|---|---|
| WGS84 (geográfico) | EPSG:4326 | `[lon, lat]` decimal | DB, API, GeoJSON |
| Web Mercator | EPSG:3857 | metros XY | OpenLayers internamente |

**Regla:** la DB guarda siempre en EPSG:4326. OL trabaja en EPSG:3857. La conversión se hace en el frontend al leer y al escribir.

```js
import { fromLonLat, toLonLat } from 'ol/proj';

// Al leer de la API para pasarle a OL:
// GeoJSON con featureProjection: 'EPSG:3857' lo convierte automáticamente
new GeoJSON().readFeatures(geojson, { featureProjection: 'EPSG:3857' });

// Al obtener coordenadas de un click en el mapa:
map.on('click', (e) => {
  const [lon, lat] = toLonLat(e.coordinate); // convierte de 3857 a 4326
  // → guardar [lon, lat] en DB
});

// Al centrar la vista en coordenadas de la DB:
new View({ center: fromLonLat([lon, lat]), zoom: 16 }); // 4326 → 3857
```

**Precisión recomendada para guardar en DB:**

```js
const lat = parseFloat(lat.toFixed(6)); // ~11cm de precisión, suficiente
const lon = parseFloat(lon.toFixed(6));
```

---

## 11. Tree-shaking y bundle size

OL completo pesa ~900KB sin comprimir. Con tree-shaking (Vite o Webpack) y solo los módulos usados, el impacto real es ~120–180KB gzipped — aceptable para un sistema de escritorio interno.

**Importar solo lo que se usa:**

```js
// ✓ Correcto — tree-shaking funciona
import Map from 'ol/Map.js';
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat } from 'ol/proj';

// ✗ Evitar — importa TODO ol
import * as ol from 'ol';
```

**Variable de entorno para la API key de Bing Maps:**

```bash
# .env.local (nunca commitear)
VITE_BING_MAPS_KEY=tu_api_key_aqui
```

Bing Maps ofrece 125,000 transacciones/mes gratuitas para proyectos con fines de desarrollo/interno. Para producción se puede usar Mapbox (también tiene tier gratuito) o tiles propios vía un servidor WMS.

---

## 12. Checklist de implementación

### Fase 1 — Frontend con datos mock

- [ ] Instalar `ol` y agregar `@import "ol/ol.css"` en estilos globales
- [ ] Crear `src/data/mock/zones.geojson` con los polígonos del campo
- [ ] Crear `src/data/mock/samples.json` con muestras de ejemplo
- [ ] Implementar `dataService.js` con `USE_MOCK = true`
- [ ] Implementar `mapUtils.js` con estilos por estado
- [ ] Implementar `mapService.js` con configuración base (center, zoom, satellite layer)
- [ ] Construir `MapOverview` para el Panel de Control
- [ ] Construir `MapGeoref` + `ZonePanel` para Georreferenciación
- [ ] Construir `MapPointPicker` para Registro de Muestras
- [ ] Verificar conversiones de proyección (fromLonLat / toLonLat)
- [ ] Agregar variable de entorno `VITE_BING_MAPS_KEY`

### Fase 2 — Integración con base de datos

- [ ] Levantar PostgreSQL con extensión PostGIS habilitada
- [ ] Crear tablas: `clubs`, `users`, `zones`, `samples`, `zone_thresholds`
- [ ] Crear vista `zone_current_status`
- [ ] Crear índice espacial en `zones.geom`
- [ ] Implementar `GET /api/zones` que devuelve GeoJSON
- [ ] Implementar `GET /api/zones/:id/samples`
- [ ] Implementar `POST /api/samples`
- [ ] Implementar `GET /api/reports/weekly`
- [ ] Cambiar `USE_MOCK = false` en `dataService.js`
- [ ] Verificar que los polígonos de la DB producen el mismo GeoJSON que el mock
- [ ] Prueba de carga: verificar que el mapa responde < 300ms con todos los polígonos
