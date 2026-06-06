import { Style, Fill, Stroke, Circle, Text } from 'ol/style.js';

/** Paleta de estados (coincide con los tokens CSS del diseño) */
const ESTADO_COLORS: Record<string, { fill: string; fillSelected: string; stroke: string }> = {
    optimo: {
        fill: 'rgba(76, 175, 125, 0.40)',
        fillSelected: 'rgba(76, 175, 125, 0.65)',
        stroke: '#4CAF7D',
    },
    atencion: {
        fill: 'rgba(245, 158, 11, 0.40)',
        fillSelected: 'rgba(245, 158, 11, 0.65)',
        stroke: '#F59E0B',
    },
    critico: {
        fill: 'rgba(239, 68, 68, 0.45)',
        fillSelected: 'rgba(239, 68, 68, 0.70)',
        stroke: '#EF4444',
    },
};

/** Estilo de zona normal */
export function getZoneStyle(estado: string): Style {
    const c = ESTADO_COLORS[estado] ?? ESTADO_COLORS['optimo'];
    return new Style({
        fill: new Fill({ color: c.fill }),
        stroke: new Stroke({ color: c.stroke, width: 2 }),
    });
}

/** Estilo de zona seleccionada (más opaco + borde más grueso) */
export function getZoneStyleSelected(estado: string): Style {
    const c = ESTADO_COLORS[estado] ?? ESTADO_COLORS['optimo'];
    return new Style({
        fill: new Fill({ color: c.fillSelected }),
        stroke: new Stroke({ color: c.stroke, width: 3 }),
    });
}

/** Estilo de marcador de sector (círculo con número) */
export function getPointStyle(sectorNum: number, estado: string): Style {
    const c = ESTADO_COLORS[estado] ?? ESTADO_COLORS['optimo'];
    return new Style({
        image: new Circle({
            radius: 14,
            fill: new Fill({ color: c.stroke }),
            stroke: new Stroke({ color: '#FFFFFF', width: 2 }),
        }),
        text: new Text({
            text: String(sectorNum),
            fill: new Fill({ color: '#FFFFFF' }),
            font: 'bold 11px DM Sans, sans-serif',
            offsetY: 1,
        }),
    });
}

/** Estilo del marcador del picker de punto */
export const markerPickerStyle = new Style({
    image: new Circle({
        radius: 8,
        fill: new Fill({ color: '#FFFFFF' }),
        stroke: new Stroke({ color: '#1C3D2E', width: 2.5 }),
    }),
});
