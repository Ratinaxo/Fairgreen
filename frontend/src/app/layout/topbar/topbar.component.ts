import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Panel de Control',
  '/geomap': 'Georreferenciación',
  '/samples/new': 'Registro de Muestras',
  '/samples/history': 'Historial de Muestras',
  '/reports': 'Reportes',
  '/users': 'Gestión de Usuarios',
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  template: `
    <header class="topbar" role="banner">
      <div class="topbar-left">
        <span class="club-name">Club de Golf Las Palmas</span>
        @if (currentRoute && currentRoute !== '/dashboard') {
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <span class="breadcrumb-page">{{ routeLabel }}</span>
        }
      </div>
      <div class="topbar-right">
        <button class="notif-btn" aria-label="Notificaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
        </button>
        <div class="user-chip">
          <div class="user-avatar" aria-hidden="true">AG</div>
          <div class="user-meta">
            <span class="user-name">Agrónomo Principal</span>
            <span class="user-role">Administrador</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 52px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .club-name {
      font-weight: 600;
      font-size: 12px;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .breadcrumb-sep {
      color: var(--color-text-muted);
      font-size: 14px;
    }

    .breadcrumb-page {
      font-size: 12px;
      color: var(--color-text-muted);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .notif-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      padding: 6px;
      border-radius: var(--radius-sm);
      transition: color var(--transition-fast), background var(--transition-fast);

      &:hover {
        color: var(--color-text-primary);
        background: var(--color-surface-alt);
      }
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: var(--radius-md);
      transition: background var(--transition-fast);

      &:hover { background: var(--color-surface-alt); }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: var(--color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .user-meta { display: flex; flex-direction: column; }

    .user-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.3;
    }

    .user-role {
      font-size: 11px;
      color: var(--color-text-muted);
      line-height: 1.3;
    }
  `]
})
export class TopbarComponent {
  currentRoute = '';
  routeLabel = '';

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ).subscribe(url => {
      this.currentRoute = url;
      this.routeLabel = ROUTE_LABELS[url] ?? '';
    });
    this.currentRoute = this.router.url;
    this.routeLabel = ROUTE_LABELS[this.currentRoute] ?? '';
  }
}
