import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet, MatButtonModule, MatIconModule, MatMenuModule, MatToolbarModule],
  template: `
    <mat-toolbar class="app-toolbar">
      <a routerLink="/dashboard" class="brand">
        <mat-icon>dashboard</mat-icon>
        <span>Template App</span>
      </a>
      <span class="spacer"></span>
      @if (auth.isLoggedIn()) {
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>{{ auth.isAdmin() ? 'admin_panel_settings' : 'account_circle' }}</mat-icon>
          {{ auth.user()?.username }}
        </button>
        <mat-menu #userMenu="matMenu" xPosition="before">
          <div class="menu-role">Signed in as {{ auth.isAdmin() ? 'admin' : 'user' }}</div>
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            <span>Log out</span>
          </button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/login" [queryParams]="{ returnUrl: router.url }">
          <mat-icon>login</mat-icon>
          Log in
        </a>
        <a mat-stroked-button routerLink="/register" class="signup">Sign up</a>
      }
    </mat-toolbar>

    <main class="app-content">
      <router-outlet />
    </main>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100%; }
    .app-toolbar {
      position: sticky; top: 0; z-index: 10;
      --mat-toolbar-container-background-color: var(--mat-sys-primary);
      --mat-toolbar-container-text-color: var(--mat-sys-on-primary);
    }
    .signup { margin-left: 8px; }
    .brand { display: flex; align-items: center; gap: 8px; color: inherit; text-decoration: none; }
    .spacer { flex: 1; }
    .menu-role { padding: 8px 16px; font-size: 12px; opacity: .7; }
    .app-content { flex: 1; width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px 16px; box-sizing: border-box; }
  `,
})
export class ShellComponent {
  auth = inject(AuthService);
  router = inject(Router);
}
