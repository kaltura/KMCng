import { Injectable } from '@angular/core';
import { KMCPermissions, KMCPermissionsService } from '../../kmc-permissions';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';
import { KmcMainViewBaseService, ViewMetadata } from '../kmc-main-view-base.service';
import { Router } from '@angular/router';
import {serverConfig} from 'config/server';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { Title } from '@angular/platform-browser';
import { AppLocalization } from '@kaltura-ng/mc-shared/localization/app-localization.service';

@Injectable()
export class UsageDashboardMainViewService extends KmcMainViewBaseService {

    constructor(
        logger: KalturaLogger,
        browserService: BrowserService,
        router: Router,
        private _appPermissions: KMCPermissionsService,
        appLocalization: AppLocalization,
        titleService: Title
    ) {
        super(logger.subLogger('UsageDashboardMainViewService'), browserService, router, appLocalization, titleService);
    }

    isAvailable(): boolean {
        return !!serverConfig.externalApps.usageDashboard &&
            this._appPermissions.hasPermission(KMCPermissions.FEATURE_ENABLE_USAGE_DASHBOARD) &&
            this._appPermissions.hasPermission(KMCPermissions.ANALYTICS_BASE);
    }

    getRoutePath(): string {
        return 'usageDashboard';
    }

    getViewMetadata(): ViewMetadata {
        return {
            titleToken: 'usageDashboardPageTitle',
            menuToken: 'usageDashboardMenuTitle'
        };
    }
}


