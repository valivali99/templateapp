import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tile } from './models';

export interface TileInput {
  name: string;
  description: string;
  /** New files to upload. */
  newImages: File[];
  /**
   * Final image order (edit only): "existing:<imageId>" or "new:<index into newImages>".
   * Existing images left out are deleted. The first entry becomes the main image.
   */
  order?: string[];
}

@Injectable({ providedIn: 'root' })
export class TilesService {
  private http = inject(HttpClient);
  private base = '/api/tiles';

  list(): Observable<Tile[]> {
    return this.http.get<Tile[]>(this.base);
  }

  get(id: number): Observable<Tile> {
    return this.http.get<Tile>(`${this.base}/${id}`);
  }

  create(input: TileInput): Observable<Tile> {
    return this.http.post<Tile>(this.base, toFormData(input));
  }

  update(id: number, input: TileInput): Observable<Tile> {
    return this.http.put<Tile>(`${this.base}/${id}`, toFormData(input));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

function toFormData(input: TileInput): FormData {
  const form = new FormData();
  form.append('name', input.name);
  form.append('description', input.description);
  if (input.order) form.append('order', JSON.stringify(input.order));
  input.newImages.forEach((file) => form.append('images', file));
  return form;
}
