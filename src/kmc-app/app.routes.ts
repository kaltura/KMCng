import { RouterModule, Routes } from '@angular/router';
import { AppBootstrap, AuthCanActivate } from 'app-shared/kmc-shell';

import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ErrorComponent } from './components/error/error.component';
import { AppDefaultViewComponent } from './components/app-default-view/app-default-view.component';
import { LoginByKSComponent } from './components/app-actions/login-by-ks.component';
import { RestorePasswordComponent } from './components/app-actions/restore-password.component';
import { AuthenticatorComponent } from './components/app-actions/authenticator.component';
import { NotFoundPageComponent } from './components/not-found-page/not-found-page.component';
import { PersistLoginByKsComponent } from './components/app-actions/persist-login-by-ks.component';

const routes: Routes = <Routes>[
    {
        path: 'error', component: ErrorComponent
    },
    {
        path: '', canActivate: [AppBootstrap],
        children: [
            {
                path: 'actions',
                children: [
                    { path: 'login-by-ks/:ks', component: LoginByKSComponent, pathMatch: 'full' },
                    { path: 'login-by-ks', component: LoginByKSComponent, pathMatch: 'full' },
                    { path: 'persist-login-by-ks/:ks', component: PersistLoginByKsComponent, pathMatch: 'full' },
                    { path: 'persist-login-by-ks', component: PersistLoginByKsComponent, pathMatch: 'full' },
                    { path: 'restore-password/:hash', component: RestorePasswordComponent, pathMatch: 'full'  },
                    { path: 'auth-info/:hash', component: AuthenticatorComponent, pathMatch: 'full'  }
                ]
            },
            {
                path: 'login', component: LoginComponent
            },
            {
                path: '', component: AppDefaultViewComponent, pathMatch: 'full'
            },
            {
                path: '',  component: DashboardComponent, canActivate: [AuthCanActivate],
                children: [
                    {
                        path: 'content', children: [
                        {
                            path: 'entries',
                            loadChildren: () => import('../applications/content-entries-app/content-entries-app.module').then(m => m.ContentEntriesAppModule)
                        },
                        {
                            path: 'playlists',
                            loadChildren: () => import('../applications/content-playlists-app/content-playlists-app.module').then(m => m.ContentPlaylistsAppModule)
                        },
                        {
                            path: 'categories',
                            loadChildren: () => import('../applications/content-categories-app/content-categories-app.module').then(m => m.ContentCategoriesAppModule)
                        },
                        {
                            path: 'syndication',
                            loadChildren: () => import('../applications/content-syndication-app/content-syndication-app.module').then(m => m.ContentSyndicationAppModule)
                        },
                        {
                            path: 'upload-control',
                            loadChildren: () => import('../applications/content-upload-control-app/content-upload-control-app.module').then(m => m.ContentUploadControlAppModule)
                        },
                        {
                            path: 'drop-folders',
                            loadChildren: () => import('../applications/content-drop-folders-app/content-drop-folders-app.module').then(m => m.ContentDropFoldersAppModule)
                        },
                        {
                            path: 'bulk',
                            loadChildren: () => import('../applications/content-bulk-log-app/content-bulk-log-app.module').then(m => m.ContentBulkLogAppModule)
                        },
                        {
                            path: 'moderation',
                            loadChildren: () => import('../applications/content-moderation-app/content-moderation-app.module').then(m => m.ContentModerationAppModule)
                        }
                    ]
                    },
                    {
                        path: 'settings', children: [
                        {
                            path: 'accountSettings',
                            loadChildren: () => import('../applications/settings-account-settings-app/settings-account-settings-app.module').then(m => m.SettingsAccountSettingsAppModule)
                        },
                        {
                            path: 'integrationSettings',
                            loadChildren: () => import('../applications/settings-integration-settings-app/settings-integration-settings-app.module').then(m => m.SettingsIntegrationSettingsAppModule)
                        },
                        {
                            path: 'accountInformation',
                            loadChildren: () => import('../applications/settings-account-information-app/settings-account-information-app.module').then(m => m.SettingsAccountInformationAppModule)
                        },
                        {
                            path: 'accessControl',
                            loadChildren: () => import('../applications/settings-access-control-app/settings-access-control-app.module').then(m => m.SettingsAccessControlAppModule)
                        },
                        {
                            path: 'reach',
                            loadChildren: () => import('../applications/settings-reach-app/settings-reach-app.module').then(m => m.SettingsReachAppModule)
                        },
                        {
                            path: 'metadata',
                            loadChildren: () => import('../applications/settings-custom-data-app/settings-custom-data-app.module').then(m => m.SettingsCustomDataAppModule)
                        },
                        {
                            path: 'myUserSettings',
                            loadChildren: () => import('../applications/settings-my-user-settings-app/settings-my-user-settings-app.module').then(m => m.SettingsMyUserSettingsAppModule)
                        },
                        {
                            path: 'transcoding',
                            loadChildren: () => import('../applications/settings-transcoding-settings-app/settings-transcoding-settings-app.module').then(m => m.SettingsTranscodingSettingsAppModule)
                        }
                    ]
                    },
                    {
                        path: 'administration', children: [
                        {
                            path: 'roles',
                            loadChildren: () => import('../applications/administration-roles-app/administration-roles-app.module').then(m => m.AdministrationRolesAppModule)
                        },
                        {
                            path: 'users',
                            loadChildren: () => import('../applications/administration-users-app/administration-users-app.module').then(m => m.AdministrationUsersAppModule)
                        },
                        {
                            path: 'multi-account',
                            loadChildren: () => import('../applications/administration-multi-account-app/administration-multi-account-app.module').then(m => m.AdministrationMultiAccountAppModule)
                        }
                    ]
                    },
                    { path: 'studio', loadChildren: () => import('../applications/studio-app/studio-app.module').then(m => m.StudioAppModule) },
                    {
                        path: 'usageDashboard',
                        loadChildren: () => import('../applications/usage-dashboard-app/usage-dashboard-app.module').then(m => m.UsageDashboardAppModule)
                    },
                    {
                        path: 'servicesDashboard',
                        loadChildren: () => import('../applications/services-dashboard-app/services-dashboard-app.module').then(m => m.ServicesDashboardAppModule)
                    },
                    {
                        path: 'analytics',
                        loadChildren: () => import('../applications/analytics/analytics.module').then(m => m.AnalyticsModule)
                    },
                    {
                        path: '**', component: NotFoundPageComponent
                    }
                ]
            },
            {
                path: '**', component: NotFoundPageComponent
            }
        ]
    },
    {
        path: '**', component: NotFoundPageComponent
    }
];

export const routing = RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' });
