import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin/login' },
  {
    path: 'admin/login',
    title: 'Admin Sign In | The Esoteric Library',
    loadComponent: () =>
      import('./features/admin/auth/login/admin-login').then((m) => m.AdminLogin),
  },
  {
    path: 'admin/dashboard',
    title: 'Admin Dashboard | The Esoteric Library',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/admin-dashboard-placeholder').then(
        (m) => m.AdminDashboardPlaceholder,
      ),
  },
  { path: 'admin', pathMatch: 'full', redirectTo: 'admin/dashboard' },
  { path: '**', redirectTo: 'admin/login' },
];
