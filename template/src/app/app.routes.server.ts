import { RenderMode, ServerRoute } from '@angular/ssr';

// Every page depends on the JWT stored in the browser, so render on the client.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
