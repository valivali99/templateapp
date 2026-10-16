import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { TilesService } from '../../core/tiles.service';
import { CarouselComponent } from '../../shared/carousel.component';

@Component({
  selector: 'app-tile-detail',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CarouselComponent],
  template: `
    <a mat-button routerLink="/dashboard" class="back"><mat-icon>arrow_back</mat-icon> Back to dashboard</a>

    @if (tile.isLoading()) {
      <div class="state"><mat-spinner diameter="48" /></div>
    } @else if (tile.error()) {
      <div class="state">
        <mat-icon class="state-icon">error_outline</mat-icon>
        <p>{{ errorText() }}</p>
        <a mat-stroked-button routerLink="/dashboard">Go back</a>
      </div>
    } @else if (tile.value()) {
      @let t = tile.value()!;
      <div class="detail">
        <app-carousel [images]="imageUrls()" [alt]="t.name" />

        <section class="info">
          <div class="info-header">
            <h1>{{ t.name }}</h1>
            @if (auth.isAdmin()) {
              <a mat-stroked-button [routerLink]="['/tiles', t.id, 'edit']"><mat-icon>edit</mat-icon> Edit</a>
            }
          </div>
          <p class="meta">
            {{ t.images.length }} {{ t.images.length === 1 ? 'image' : 'images' }} · Updated {{ t.updatedAt + 'Z' | date: 'medium' }}
          </p>
          @if (t.description) {
            <p class="description">{{ t.description }}</p>
          } @else {
            <p class="description muted">No description.</p>
          }
        </section>
      </div>
    }
  `,
  styles: `
    .back { margin-bottom: 16px; }
    .detail { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 32px; align-items: start; }
    @media (max-width: 860px) { .detail { grid-template-columns: 1fr; } }
    .info-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    h1 { margin: 0; font-size: 28px; font-weight: 500; }
    .meta { margin: 8px 0 16px; font-size: 13px; color: var(--mat-sys-on-surface-variant); }
    .description { white-space: pre-line; line-height: 1.6; }
    .muted { color: var(--mat-sys-on-surface-variant); font-style: italic; }
  `,
})
export class TileDetailComponent {
  private tilesService = inject(TilesService);
  auth = inject(AuthService);

  /** Bound from the :id route param. */
  id = input.required({ transform: numberAttribute });

  tile = rxResource({ request: () => this.id(), loader: ({ request }) => this.tilesService.get(request) });
  imageUrls = computed(() => this.tile.value()?.images.map((i) => i.url) ?? []);
  errorText = computed(() => errorMessage(this.tile.error(), 'Could not load tile'));
}
