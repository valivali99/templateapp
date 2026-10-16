export type Role = 'user' | 'admin';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TileImage {
  id: number;
  url: string;
}

export interface Tile {
  id: number;
  name: string;
  description: string;
  /** Ordered; the first one is the main image. */
  images: TileImage[];
  mainImage: string | null;
  createdAt: string;
  updatedAt: string;
}
