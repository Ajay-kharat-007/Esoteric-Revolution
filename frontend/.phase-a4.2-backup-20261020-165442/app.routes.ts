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
    path: 'admin/forgot-password',
    title: 'Admin Password Recovery | The Esoteric Library',
    loadComponent: () =>
      import('./features/admin/auth/forgot-password/admin-forgot-password').then(
        (m) => m.AdminForgotPassword,
      ),
  },
  {
    path: 'admin/reset-password',
    title: 'Reset Admin Password | The Esoteric Library',
    loadComponent: () =>
      import('./features/admin/auth/reset-password/admin-reset-password').then(
        (m) => m.AdminResetPassword,
      ),
  },
  {
    path: 'admin/access-denied',
    title: 'Access Denied | The Esoteric Library',
    loadComponent: () =>
      import('./features/admin/auth/access-denied/admin-access-denied').then(
        (m) => m.AdminAccessDenied,
      ),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Admin Dashboard | The Esoteric Library',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
    ],
  },
  { path: '**', redirectTo: 'admin/login' },
];
