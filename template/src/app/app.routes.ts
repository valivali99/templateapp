import { Routes } from '@angular/router';
import { adminGuard, guestGuard } from './core/auth.guards';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Sign up',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    // Dashboard and detail pages are public; add canActivate: [authGuard] to a route to require login.
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'tiles/new',
        canActivate: [adminGuard],
        title: 'New tile',
        loadComponent: () => import('./pages/tile-form/tile-form.component').then((m) => m.TileFormComponent),
      },
      {
        path: 'tiles/:id/edit',
        canActivate: [adminGuard],
        title: 'Edit tile',
        loadComponent: () => import('./pages/tile-form/tile-form.component').then((m) => m.TileFormComponent),
      },
      {
        path: 'tiles/:id',
        title: 'Tile',
        loadComponent: () => import('./pages/tile-detail/tile-detail.component').then((m) => m.TileDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
