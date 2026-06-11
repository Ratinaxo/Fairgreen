import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './services/auth.guard';
import { roleGuard } from './services/role.guard';

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
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Panel de Control — FairGreen',
        // Todos los roles pueden ver el dashboard
      },
      {
        path: 'geomap',
        loadComponent: () =>
          import('./pages/geomap/geomap.component').then(m => m.GeomapComponent),
        title: 'Georreferenciación — FairGreen',
        // Todos los roles pueden ver el mapa
      },
      {
        path: 'samples/new',
        loadComponent: () =>
          import('./pages/new-sample/new-sample.component').then(m => m.NewSampleComponent),
        title: 'Nuevo Registro — FairGreen',
        canActivate: [roleGuard(['ADMIN', 'AGRO', 'CANCHERO'])], // Canchero SÍ puede registrar, pero no editar
      },
      {
        path: 'samples/edit/:id',
        loadComponent: () =>
          import('./pages/edit-sample/edit-sample.component').then(m => m.EditSampleComponent),
        title: 'Editar Muestra — FairGreen',
        canActivate: [roleGuard(['ADMIN', 'AGRO'])], // Canchero NO puede editar
      },
      {
        path: 'samples/detail/:id',
        loadComponent: () =>
          import('./pages/sample-detail/sample-detail.component').then(m => m.SampleDetailComponent),
        title: 'Detalle de Muestra — FairGreen',
        // Todos los roles pueden ver el detalle
      },
      {
        path: 'samples/history',
        loadComponent: () =>
          import('./pages/sample-history/sample-history.component').then(m => m.SampleHistoryComponent),
        title: 'Historial de Muestras — FairGreen',
        // Todos los roles pueden ver el historial
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reportes — FairGreen',
        canActivate: [roleGuard(['ADMIN', 'AGRO'])], // Canchero NO puede ver reportes
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then(m => m.UsersComponent),
        title: 'Gestión de Usuarios — FairGreen',
        canActivate: [roleGuard(['ADMIN'])], // Solo Admin gestiona usuarios
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notificaciones — FairGreen',
        // Todos los roles reciben notificaciones
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];


