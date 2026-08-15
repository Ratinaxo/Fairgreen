import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { Meta, Title } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
})
export class App implements OnInit {
  title = 'FairGreen';
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private metaService = inject(Meta);
  private titleService = inject(Title);

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data)
    ).subscribe((event) => {
      // Note: Angular 14+ automatically handles the `<title>` tag from the route definition.
      if (event['description']) {
        this.metaService.updateTag({ name: 'description', content: event['description'] });
      } else {
        this.metaService.updateTag({ name: 'description', content: 'FairGreen: Plataforma de gestión y análisis de campos de golf.' });
      }
    });
  }
}
