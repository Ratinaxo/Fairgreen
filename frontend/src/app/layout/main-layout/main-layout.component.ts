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
  private touchEndX = 0;

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    // Solo en dispositivos móviles (asumimos ancho < 768px, pero igual controlamos el umbral del swipe)
    if (window.innerWidth > 768) return;

    const swipeThreshold = 50; // Mínimo recorrido para considerarlo swipe
    
    // Swipe a la derecha
    if (this.touchEndX - this.touchStartX > swipeThreshold) {
      if (!this.sidebar.isOpen()) {
        this.sidebar.isOpen.set(true);
      }
    }
    // Swipe a la izquierda
    else if (this.touchStartX - this.touchEndX > swipeThreshold) {
      if (this.sidebar.isOpen()) {
        this.sidebar.isOpen.set(false);
      }
    }
  }
}
