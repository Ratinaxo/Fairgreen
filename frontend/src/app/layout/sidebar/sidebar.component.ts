import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed()">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </div>
        @if (!isCollapsed()) {
          <span class="logo-text">FairGreen</span>
        }
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav" aria-label="Navegación principal">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [title]="item.label"
            [attr.aria-label]="item.label"
          >
            <span class="nav-icon" aria-hidden="true" [innerHTML]="item.icon"></span>
            @if (!isCollapsed()) {
              <span class="nav-label">{{ item.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Footer user -->
      <div class="sidebar-footer">
        <div class="sidebar-divider"></div>
        <div class="user-info">
          <div class="user-avatar" aria-hidden="true">AG</div>
          @if (!isCollapsed()) {
            <div class="user-details">
              <div class="user-name">Agrónomo Principal</div>
              <div class="user-role">Club Las Palmas</div>
            </div>
          }
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 200px;
      height: 100vh;
      background: var(--color-sidebar-bg);
      display: flex;
      flex-direction: column;
      z-index: 100;
      transition: width var(--transition-normal);
      overflow: hidden;
    }

    .sidebar.collapsed { width: 56px; }

    /* Logo */
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      color: white;
      flex-shrink: 0;
      min-height: 64px;
    }

    .logo-icon {
      color: var(--color-accent);
      flex-shrink: 0;
      display: flex;
    }

    .logo-text {
      font-family: var(--font-display);
      font-size: 17px;
      color: white;
      white-space: nowrap;
    }

    /* Nav */
    .sidebar-nav {
      flex: 1;
      padding: 8px 0;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      margin: 2px 8px;
      text-decoration: none;
      color: var(--color-sidebar-text);
      font-size: 13px;
      font-weight: 500;
      transition: background var(--transition-fast), color var(--transition-fast);
      position: relative;
      white-space: nowrap;

      &:hover { background: rgba(255,255,255,0.07); color: white; }

      &.active {
        background: var(--color-sidebar-active-bg);
        color: var(--color-sidebar-active);
        &::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 6px;
          bottom: 6px;
          width: 3px;
          background: var(--color-accent);
          border-radius: 0 2px 2px 0;
        }
      }
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 10px 0;
    }

    .nav-icon {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    /* Footer */
    .sidebar-footer { flex-shrink: 0; padding: 12px 0 16px; }

    .sidebar-divider {
      height: 1px;
      background: rgba(255,255,255,0.1);
      margin: 0 16px 12px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .user-name {
      font-size: 12px;
      font-weight: 600;
      color: white;
      white-space: nowrap;
    }

    .user-role {
      font-size: 11px;
      color: var(--color-sidebar-text);
      white-space: nowrap;
    }

    @media (max-width: 1200px) {
      .sidebar { width: 56px; }
      .nav-item { justify-content: center; padding: 10px 0; }
    }
  `]
})
export class SidebarComponent {
  isCollapsed = signal(false);

  navItems: NavItem[] = [
    {
      label: 'Panel de Control',
      route: '/dashboard',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`
    },
    {
      label: 'Georreferenciación',
      route: '/geomap',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>`
    },
    {
      label: 'Registro de Muestras',
      route: '/samples/new',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>`
    },
    {
      label: 'Historial de Muestras',
      route: '/samples/history',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`
    },
    {
      label: 'Reportes',
      route: '/reports',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`
    },
    {
      label: 'Gestión de Usuarios',
      route: '/users',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
    },
  ];

  toggleCollapse() {
    this.isCollapsed.update(v => !v);
  }
}
