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
    title: 'Iniciar Sesión — FairGreen',
    data: { description: 'Inicia sesión en FairGreen, tu plataforma de gestión y análisis de campos de golf.' }
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Recuperar Contraseña — FairGreen',
    data: { description: 'Recupera el acceso a tu cuenta de FairGreen fácilmente.' }
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Restablecer Contraseña — FairGreen',
    data: { description: 'Configura una nueva contraseña para tu cuenta de FairGreen.' }
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
        title: 'Panel de Control de Césped — FairGreen',
        data: { description: 'Visualiza el estado general de las muestras y métricas del campo en el panel de control de FairGreen.' }
      },
      {
        path: 'geomap',
        loadComponent: () =>
          import('./pages/geomap/geomap.component').then(m => m.GeomapComponent),
        title: 'Mapa de Georreferenciación — FairGreen',
        data: { description: 'Explora el mapa interactivo con las últimas muestras tomadas en los distintos hoyos y sectores.' }
      },
      {
        path: 'samples/new',
        loadComponent: () =>
          import('./pages/new-sample/new-sample.component').then(m => m.NewSampleComponent),
        title: 'Nuevo Registro de Muestra — FairGreen',
        canActivate: [roleGuard(['ADMIN', 'AGRO', 'CANCHERO'])],
        data: { description: 'Registra una nueva muestra de suelo en el campo ingresando métricas como humedad, temperatura y salinidad.' }
      },
      {
        path: 'samples/edit/:id',
        loadComponent: () =>
          import('./pages/edit-sample/edit-sample.component').then(m => m.EditSampleComponent),
        title: 'Editar Muestra — FairGreen',
        canActivate: [roleGuard(['ADMIN', 'AGRO'])],
        data: { description: 'Edita los datos de una muestra existente en el sistema de FairGreen.' }
      },
      {
        path: 'samples/detail/:id',
        loadComponent: () =>
          import('./pages/sample-detail/sample-detail.component').then(m => m.SampleDetailComponent),
        title: 'Detalle de Muestra — FairGreen',
        data: { description: 'Revisa en profundidad todas las métricas, fotos e historial de una muestra registrada.' }
      },
      {
        path: 'samples/history',
        loadComponent: () =>
          import('./pages/sample-history/sample-history.component').then(m => m.SampleHistoryComponent),
        title: 'Historial de Muestras — FairGreen',
        data: { description: 'Consulta el listado completo y el historial de todas las muestras tomadas en el campo de golf.' }
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(m => m.ReportsComponent),
        title: 'Reportes y Análisis de Suelo — FairGreen',
        canActivate: [roleGuard(['ADMIN', 'AGRO'])],
        data: { description: 'Genera y analiza reportes detallados del estado del suelo y exporta la información en PDF o Excel.' }
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then(m => m.UsersComponent),
        title: 'Gestión de Usuarios — FairGreen',
        canActivate: [roleGuard(['ADMIN'])],
        data: { description: 'Administra los usuarios del sistema, asigna roles y controla los accesos a FairGreen.' }
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notificaciones y Alertas — FairGreen',
        data: { description: 'Revisa las notificaciones recientes y alertas del sistema sobre las métricas del campo.' }
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];


