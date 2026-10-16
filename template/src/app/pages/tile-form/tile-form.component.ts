import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { errorMessage } from '../../core/errors';
import { TilesService } from '../../core/tiles.service';

const MAX_IMAGES = 10;
const MAX_SIZE = 5 * 1024 * 1024;

/** One image in the editor: either already on the server or a newly picked file. */
type EditorImage =
  | { kind: 'existing'; id: number; url: string }
  | { kind: 'new'; file: File; url: string };

@Component({
  selector: 'app-tile-form',
  imports: [
    ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressBarModule, MatTooltipModule,
  ],
  templateUrl: './tile-form.component.html',
  styleUrl: './tile-form.component.scss',
})
export class TileFormComponent implements OnInit {
  private tilesService = inject(TilesService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  /** Bound from the :id route param; undefined on /tiles/new. */
  id = input<string>();
  isEdit = computed(() => !!this.id());

  loading = signal(false);
  saving = signal(false);
  dragOver = signal(false);
  images = signal<EditorImage[]>([]);
  readonly maxImages = MAX_IMAGES;

  form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.images().forEach(revoke));
  }

  ngOnInit(): void {
    const id = Number(this.id());
    if (!id) return;
    this.loading.set(true);
    this.tilesService.get(id).subscribe({
      next: (tile) => {
        this.form.setValue({ name: tile.name, description: tile.description });
        this.images.set(tile.images.map((img) => ({ kind: 'existing', id: img.id, url: img.url })));
        this.loading.set(false);
      },
      error: (err) => {
        this.snackBar.open(errorMessage(err, 'Could not load tile'), 'OK', { duration: 4000 });
        this.router.navigate(['/dashboard']);
      },
    });
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    this.addFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  private addFiles(files: File[]): void {
    const valid = files.filter((f) => f.type.startsWith('image/') && f.size <= MAX_SIZE);
    if (valid.length < files.length) {
      this.snackBar.open('Some files were skipped (images only, max 5 MB each)', 'OK', { duration: 4000 });
    }
    const room = MAX_IMAGES - this.images().length;
    if (valid.length > room) {
      this.snackBar.open(`A tile can have at most ${MAX_IMAGES} images`, 'OK', { duration: 4000 });
    }
    const added = valid.slice(0, Math.max(room, 0)).map<EditorImage>((file) => ({
      kind: 'new', file, url: URL.createObjectURL(file),
    }));
    this.images.update((list) => [...list, ...added]);
  }

  remove(index: number): void {
    this.images.update((list) => {
      revoke(list[index]);
      return list.filter((_, i) => i !== index);
    });
  }

  makeMain(index: number): void {
    this.move(index, 0);
  }

  move(from: number, to: number): void {
    this.images.update((list) => {
      if (to < 0 || to >= list.length) return list;
      const copy = [...list];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const newImages: File[] = [];
    const order = this.images().map((img) => {
      if (img.kind === 'existing') return `existing:${img.id}`;
      newImages.push(img.file);
      return `new:${newImages.length - 1}`;
    });
    const input = { ...this.form.getRawValue(), newImages, order };

    this.saving.set(true);
    const request = this.isEdit()
      ? this.tilesService.update(Number(this.id()), input)
      : this.tilesService.create(input);

    request.subscribe({
      next: (tile) => {
        this.snackBar.open(this.isEdit() ? 'Tile updated' : 'Tile created', 'OK', { duration: 3000 });
        this.router.navigate(['/tiles', tile.id]);
      },
      error: (err) => {
        this.snackBar.open(errorMessage(err, 'Save failed'), 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }
}

function revoke(img: EditorImage | undefined): void {
  if (img?.kind === 'new') URL.revokeObjectURL(img.url);
}
