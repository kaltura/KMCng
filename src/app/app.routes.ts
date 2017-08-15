import { Routes, RouterModule } from '@angular/router';
import { AuthCanActivate, AppBootstrap } from 'app-shared/kmc-shell';

import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ErrorComponent } from "./components/error/error.component";


const routes: Routes = <Routes>[
  {
    path: 'error', component: ErrorComponent
  },
  {
    path: '', canActivate: [AppBootstrap],
    children: [

      { path: 'login', component: LoginComponent },
      {
        path: '', component: DashboardComponent, canActivate: [AuthCanActivate], children: [
        {
          path: 'content', children: [
          { path: '', redirectTo: 'entries', pathMatch: 'full' },
          {
            path: 'entries',
            loadChildren: '../applications/content-entries-app/content-entries-app.module#ContentEntriesAppModule'
          },
          {
            path: 'playlists',
            loadChildren: '../applications/content-playlists-app/content-playlists-app.module#ContentPlaylistsAppModule'
          },
          {
            path: 'categories',
            loadChildren: '../applications/content-categories-app/content-categories-app.module#ContentCategoriesAppModule'
          },
          {
            path: 'upload-control',
            loadChildren: '../applications/content-upload-control-app/content-upload-control-app.module#ContentUploadControlAppModule'
          },
        ]
        }
      ]
      },
      {
        path: '**', redirectTo: '/login', pathMatch: 'full'
      }
    ]
  }
];

export const routing = RouterModule.forRoot(routes);
