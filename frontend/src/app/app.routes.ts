import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Panel de Control — FairGreen',
      },
      {
        path: 'geomap',
        loadComponent: () =>
          import('./pages/geomap/geomap.component').then(m => m.GeomapComponent),
        title: 'Georreferenciación — FairGreen',
      },
      {
        path: 'samples/new',
        loadComponent: () =>
          import('./pages/new-sample/new-sample.component').then(m => m.NewSampleComponent),
        title: 'Nuevo Registro — FairGreen',
      },
      {
        path: 'samples/history',
        loadComponent: () =>
          import('./pages/sample-history/sample-history.component').then(m => m.SampleHistoryComponent),
        title: 'Historial de Muestras — FairGreen',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reportes — FairGreen',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then(m => m.UsersComponent),
        title: 'Gestión de Usuarios — FairGreen',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
