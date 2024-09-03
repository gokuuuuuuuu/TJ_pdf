import { Route } from '@angular/router';
import { ImgViewerComponent } from './img-viewer/img-viewer.component';
import { HomeComponent } from './home/home.component';
import { RefreshComponent } from './refresh/refresh.component';

export const appRoutes: Route[] = [
  {
    path: 'img-viewer/:file',
    component: ImgViewerComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  { 
    path: 'refresh', 
    component: RefreshComponent 
},
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
];
