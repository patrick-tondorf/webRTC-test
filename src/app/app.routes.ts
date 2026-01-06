import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./srs-web-rtc-player/srs-web-rtc-player.component').then(
        (m) => m.SrsWebRtcPlayerComponent
      ),
  },
];
