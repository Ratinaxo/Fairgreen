import { Component, signal, computed, inject } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;       // Bootstrap Icons class name
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, NgOptimizedImage],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isCollapsed = signal(false);
  isOpen = signal(false);

  private auth = inject(AuthService);
  readonly notifications = inject(NotificationsService);
  readonly noLeidas = computed(() => this.notifications.noLeidas());

  // Mapeo de rol backend → etiqueta de menú
  private readonly rolMap: Record<string, string> = {
    ADMIN: 'Administrador',
    AGRO: 'Agrónomo',
    CANCHERO: 'Canchero',
  };

  // Rol del usuario autenticado, mapeado al formato de filtro del menú
  readonly userRole = computed<'Administrador' | 'Agrónomo' | 'Canchero'>(
    () => (this.rolMap[this.auth.rol() ?? ''] as 'Administrador' | 'Agrónomo' | 'Canchero') ?? 'Canchero'
  );

  mainNavItems: NavItem[] = [
    {
      label: 'Panel de Control',
      route: '/dashboard',
      icon: 'bi-grid-1x2',
      roles: ['Administrador', 'Agrónomo', 'Canchero']
    },
    {
      label: 'Georreferenciación',
      route: '/geomap',
      icon: 'bi-geo-alt',
      roles: ['Administrador', 'Agrónomo', 'Canchero']
    },
    {
      label: 'Registro de Muestras',
      route: '/samples/new',
      icon: 'bi-droplet-half',
      roles: ['Administrador', 'Agrónomo']
    },
    {
      label: 'Historial de Muestras',
      route: '/samples/history',
      icon: 'bi-clipboard2-data',
      roles: ['Administrador', 'Agrónomo', 'Canchero']
    },
    {
      label: 'Notificaciones',
      route: '/notifications',
      icon: 'bi-bell',
      roles: ['Administrador', 'Agrónomo', 'Canchero']
    },
  ];

  secondaryNavItems: NavItem[] = [
    {
      label: 'Reportes',
      route: '/reports',
      icon: 'bi-bar-chart-line',
      roles: ['Administrador', 'Agrónomo']
    },
    {
      label: 'Gestión de Usuarios',
      route: '/users',
      icon: 'bi-people',
      roles: ['Administrador']
    }
  ];

  filteredMainNav = computed(() =>
    this.mainNavItems.filter(i => !i.roles || i.roles.includes(this.userRole()))
  );

  filteredSecondaryNav = computed(() =>
    this.secondaryNavItems.filter(i => !i.roles || i.roles.includes(this.userRole()))
  );

  toggleCollapse() {
    this.isCollapsed.update(v => !v);
  }

  closeOnMobile() {
    if (window.innerWidth < 1024) {
      this.isOpen.set(false);
    }
  }
}
