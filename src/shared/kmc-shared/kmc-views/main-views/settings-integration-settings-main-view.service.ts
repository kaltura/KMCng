import { Injectable } from '@angular/core';
import { KMCPermissions, KMCPermissionsService } from '../../kmc-permissions';
import { KmcMainViewBaseService } from '../kmc-main-view-base.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { Router, NavigationEnd } from '@angular/router';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

@Injectable()
export class SettingsIntegrationSettingsMainViewService extends KmcMainViewBaseService {

    constructor(
        logger: KalturaLogger,
        router: Router,
        private _appPermissions: KMCPermissionsService
    ) {
        super(logger.subLogger('SettingsIntegrationSettingsMainViewService'), router);
    }

    isAvailable(): boolean {
        return this._appPermissions.hasAnyPermissions([
            KMCPermissions.INTEGRATION_BASE,
            KMCPermissions.INTEGRATION_UPDATE_SETTINGS
        ]);
    }

    getRoutePath(): string {
        return 'settings/integrationSettings';
    }
}
