import { Component, computed, effect, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Simple image carousel: arrows, dots, thumbnails, keyboard and swipe. */
@Component({
  selector: 'app-carousel',
  imports: [MatButtonModule, MatIconModule],
  host: {
    tabindex: '0',
    '(keydown.arrowleft)': 'prev()',
    '(keydown.arrowright)': 'next()',
  },
  template: `
    @if (images().length) {
      <div class="stage" (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)">
        <div class="track" [style.transform]="'translateX(-' + index() * 100 + '%)'">
          @for (src of images(); track $index) {
            <div class="slide"><img [src]="src" [alt]="alt() + ' ' + ($index + 1)" /></div>
          }
        </div>

        @if (images().length > 1) {
          <button mat-mini-fab class="nav prev" (click)="prev()" aria-label="Previous image"><mat-icon>chevron_left</mat-icon></button>
          <button mat-mini-fab class="nav next" (click)="next()" aria-label="Next image"><mat-icon>chevron_right</mat-icon></button>
          <div class="dots">
            @for (src of images(); track $index) {
              <button class="dot" [class.active]="$index === index()" (click)="index.set($index)" [attr.aria-label]="'Go to image ' + ($index + 1)"></button>
            }
          </div>
          <span class="counter">{{ index() + 1 }} / {{ images().length }}</span>
        }
      </div>

      @if (images().length > 1) {
        <div class="thumbs">
          @for (src of images(); track $index) {
            <button class="thumb" [class.active]="$index === index()" (click)="index.set($index)">
              <img [src]="src" alt="" />
            </button>
          }
        </div>
      }
    } @else {
      <div class="stage empty"><mat-icon>image_not_supported</mat-icon></div>
    }
  `,
  styles: `
    :host { display: block; outline: none; }
    .stage {
      position: relative; overflow: clip; border-radius: 12px;
      aspect-ratio: 16 / 10; background: #111;
    }
    .stage.empty { display: flex; align-items: center; justify-content: center; background: var(--mat-sys-surface-container-high); }
    .stage.empty mat-icon { font-size: 56px; width: 56px; height: 56px; opacity: .4; }
    .track { display: flex; height: 100%; transition: transform .35s ease; }
    .slide { flex: 0 0 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .slide img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
    .nav { position: absolute; top: 50%; transform: translateY(-50%); opacity: .85; }
    .nav.prev { left: 12px; }
    .nav.next { right: 12px; }
    .dots { position: absolute; bottom: 12px; left: 0; right: 0; display: flex; justify-content: center; gap: 8px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; border: none; padding: 0; cursor: pointer; background: rgba(255,255,255,.5); }
    .dot.active { background: #fff; transform: scale(1.2); }
    .counter { position: absolute; top: 12px; right: 12px; padding: 2px 10px; border-radius: 12px; font-size: 12px; color: #fff; background: rgba(0,0,0,.55); }
    .thumbs { display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; padding-bottom: 4px; }
    .thumb { flex: 0 0 80px; height: 60px; padding: 0; border: 2px solid transparent; border-radius: 8px; overflow: hidden; cursor: pointer; background: none; opacity: .6; }
    .thumb.active { border-color: var(--mat-sys-primary); opacity: 1; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  `,
})
export class CarouselComponent {
  images = input<string[]>([]);
  alt = input('Image');

  index = signal(0);
  private count = computed(() => this.images().length);
  private touchX = 0;

  constructor() {
    // Reset when a different image set comes in.
    effect(() => {
      this.images();
      this.index.set(0);
    });
  }

  prev(): void {
    if (this.count()) this.index.update((i) => (i - 1 + this.count()) % this.count());
  }

  next(): void {
    if (this.count()) this.index.update((i) => (i + 1) % this.count());
  }

  onTouchStart(e: TouchEvent): void {
    this.touchX = e.changedTouches[0].clientX;
  }

  onTouchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.touchX;
    if (Math.abs(dx) > 40) dx < 0 ? this.next() : this.prev();
  }
}
