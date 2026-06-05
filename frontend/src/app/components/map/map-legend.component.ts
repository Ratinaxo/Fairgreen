import { Component } from '@angular/core';

@Component({
    selector: 'app-map-legend',
    standalone: true,
    templateUrl: './map-legend.component.html',
    styles: [
        `
      .map-legend {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.92);
        border-radius: 8px;
        padding: 6px 16px;
        display: flex;
        gap: 20px;
        backdrop-filter: blur(4px);
        box-shadow: 0 1px 4px rgba(28, 61, 46, 0.08), 0 4px 16px rgba(28, 61, 46, 0.04);
        z-index: 10;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #5a7060;
      }

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
    `,
    ],
})
export class MapLegendComponent { }
