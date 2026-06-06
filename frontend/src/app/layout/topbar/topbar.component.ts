import { Component, computed, inject, EventEmitter, Output } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { NotificationsService } from '../../services/notifications.service';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Panel de Control',
  '/geomap': 'Georreferenciación',
  '/samples/new': 'Registro de Muestras',
  '/samples/history': 'Historial de Muestras',
  '/reports': 'Reportes',
  '/users': 'Gestión de Usuarios',
  '/notifications': 'Notificaciones',
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  currentRoute = '';
  routeLabel = '';
  sidebarOpen = false;

  @Output() toggleSidebarEvent = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);
  readonly notifService = inject(NotificationsService);
  readonly noLeidas = computed(() => this.notifService.noLeidas());

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
