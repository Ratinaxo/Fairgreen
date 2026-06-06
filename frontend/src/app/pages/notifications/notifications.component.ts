import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationsService } from '../../services/notifications.service';
import { Notificacion } from '../../services/data.service';

type Filtro = 'todas' | 'no_leidas' | 'leidas';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [NgClass, DatePipe, RouterLink],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  readonly notifService = inject(NotificationsService);

  readonly filtro = signal<Filtro>('todas');

  readonly notificacionesFiltradas = computed(() => {
    const todas = this.notifService.notificaciones();
    switch (this.filtro()) {
      case 'no_leidas': return todas.filter(n => !n.leida);
      case 'leidas':    return todas.filter(n => n.leida);
      default:          return todas;
    }
  });

  readonly total    = computed(() => this.notifService.notificaciones().length);
  readonly noLeidas = computed(() => this.notifService.noLeidas());

  ngOnInit(): void {
    this.notifService.refresh();
  }

  setFiltro(f: Filtro): void {
    this.filtro.set(f);
  }

  marcarLeida(notif: Notificacion, event: Event): void {
    event.stopPropagation();
    if (!notif.leida) {
      this.notifService.marcarLeida(notif.id_notificacion);
    }
  }

  marcarTodasLeidas(): void {
    this.notifService.marcarTodasLeidas();
  }

  iconoPorTipo(tipo: string): string {
    switch (tipo) {
      case 'PUNTO_CRITICO': return 'bi-exclamation-triangle-fill';
      default:              return 'bi-info-circle-fill';
    }
  }

  colorPorTipo(tipo: string): string {
    switch (tipo) {
      case 'PUNTO_CRITICO': return 'tipo-critico';
      default:              return 'tipo-sistema';
    }
  }

  tiempoRelativo(fechaIso: string): string {
    const diff = Date.now() - new Date(fechaIso).getTime();
    const mins  = Math.floor(diff / 60000);
    const horas = Math.floor(mins / 60);
    const dias  = Math.floor(horas / 24);
    if (mins < 1)  return 'ahora mismo';
    if (mins < 60) return `hace ${mins} min`;
    if (horas < 24) return `hace ${horas}h`;
    return `hace ${dias} día${dias !== 1 ? 's' : ''}`;
  }
}
