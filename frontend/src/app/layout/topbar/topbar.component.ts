import { Component, computed, inject, EventEmitter, Output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

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
  imports: [NgOptimizedImage],
  template: `
    <header class="topbar" role="banner">
      <!-- Botón hamburguesa (móvil) -->
      <button
        class="hamburger-btn"
        (click)="toggleSidebar()"
        [attr.aria-label]="sidebarOpen ? 'Cerrar menú' : 'Abrir menú'"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div class="topbar-left">
        <img ngSrc="assets/logo-fairgreen.png" alt="FairGreen" class="topbar-logo" width="28" height="28" priority style="object-fit: contain;">
        <span class="club-name">FairGreen</span>
        @if (currentRoute && currentRoute !== '/dashboard') {
          <span class="breadcrumb-sep" aria-hidden="true">›</span>
          <span class="breadcrumb-page">{{ routeLabel }}</span>
        }
      </div>
      <div class="topbar-right">
        <div class="user-chip">
          <div class="user-avatar" aria-hidden="true">{{ iniciales() }}</div>
          <div class="user-meta">
            <span class="user-name">{{ nombreCompleto() }}</span>
            <span class="user-role">{{ rolLabel() }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="logout()" title="Cerrar sesión" aria-label="Cerrar sesión">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
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

    /* Hamburguesa (móvil) */
    .hamburger-btn {
      display: none;
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-muted);
      padding: 6px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      transition: color var(--transition-fast), background var(--transition-fast);
      min-width: 44px;
      min-height: 44px;
      align-items: center;
      justify-content: center;
    }
    .hamburger-btn:hover { 
      color: var(--color-text-primary);
      background: var(--color-surface-alt); 
    }

    .topbar-logo {
      flex-shrink: 0;
      border-radius: 4px;
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

    .logout-btn {
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
        color: #dc2626;
        background: #fee2e2;
      }
    }

    /* ── Media Queries ── */
    @media (max-width: 1023px) {
      .hamburger-btn { display: flex; flex-direction: column; }
    }

    @media (max-width: 768px) {
      .topbar { padding: 0 12px; }
      .user-meta { display: none; }
    }

    @media (max-width: 480px) {
      .breadcrumb-sep,
      .breadcrumb-page { display: none; }
    }
  `]
})
export class TopbarComponent {
  currentRoute = '';
  routeLabel = '';
  sidebarOpen = false;

  @Output() toggleSidebarEvent = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);

  // Datos reactivos del usuario
  readonly iniciales = computed(() => {
    const u = this.auth.usuario();
    if (!u) return '??';
    return `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase();
  });

  readonly nombreCompleto = computed(() => {
    const u = this.auth.usuario();
    return u ? `${u.nombre} ${u.apellido}` : 'Cargando...';
  });

  readonly rolLabel = computed(() => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      AGRO: 'Agrónoma',
      CANCHERO: 'Canchero',
    };
    return roles[this.auth.rol() ?? ''] ?? '';
  });

  constructor() {
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

  logout() {
    this.auth.logout();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.toggleSidebarEvent.emit();
  }
}
