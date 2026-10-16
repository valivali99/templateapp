import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { Tile } from '../../core/models';
import { TilesService } from '../../core/tiles.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private tilesService = inject(TilesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  tiles = signal<Tile[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.tilesService.list().subscribe({
      next: (tiles) => {
        this.tiles.set(tiles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err, 'Could not load tiles'));
        this.loading.set(false);
      },
    });
  }

  confirmDelete(tile: Tile, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: { title: 'Delete tile', message: `Delete "${tile.name}" and all of its images?`, confirmText: 'Delete' },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.tilesService.delete(tile.id)),
      )
      .subscribe({
        next: () => {
          this.tiles.update((list) => list.filter((t) => t.id !== tile.id));
          this.snackBar.open('Tile deleted', 'OK', { duration: 3000 });
        },
        error: (err) => this.snackBar.open(errorMessage(err, 'Delete failed'), 'OK', { duration: 4000 }),
      });
  }

  stop(event: Event): void {
    event.stopPropagation();
  }
}
