import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  @ViewChild('contentArea') contentArea!: ElementRef<HTMLElement>;

  private routerSub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.contentArea) {
        this.contentArea.nativeElement.scrollTop = 0;
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  /** Píxeles mínimos de desplazamiento horizontal para considerar swipe */
  private readonly swipeThreshold = 100;
  /** Píxeles desde el borde izquierdo para activar el gesto de "abrir drawer" */
  private readonly edgeZone = 30;
  /** Ratio mínimo horizontal/vertical para considerar el gesto predominantemente horizontal */
  private readonly horizontalRatioMin = 2;

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe(e);
  }

  private handleSwipe(e: TouchEvent) {
    // Solo en móviles (breakpoint del sidebar)
    if (window.innerWidth >= 1024) return;

    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Verificar que el gesto sea predominantemente horizontal
    if (absX < this.swipeThreshold) return;
    if (absY > 0 && absX / absY < this.horizontalRatioMin) return;

    // Ignorar si el toque inició sobre un contenedor de mapa (navegación del mapa no debe abrir el menú)
    const target = e.target as Element | null;
    if (target?.closest('.map-georef-container, .map-picker-container, .ol-viewport')) return;

    if (deltaX > 0) {
      // Swipe a la derecha: solo abrir si el dedo comenzó en el borde izquierdo
      if (this.touchStartX <= this.edgeZone && !this.sidebar.isOpen()) {
        this.sidebar.isOpen.set(true);
      }
    } else {
      // Swipe a la izquierda: cerrar el drawer si está abierto
      if (this.sidebar.isOpen()) {
        this.sidebar.isOpen.set(false);
      }
    }
  }
}
