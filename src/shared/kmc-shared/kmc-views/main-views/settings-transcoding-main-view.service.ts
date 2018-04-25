import { Injectable } from '@angular/core';
import { KMCPermissions, KMCPermissionsService } from '../../kmc-permissions';
import { KmcMainViewBaseService } from '../kmc-main-view-base.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import { Router, NavigationEnd } from '@angular/router';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

@Injectable()
export class SettingsTranscodingMainViewService extends KmcMainViewBaseService {

    constructor(
        logger: KalturaLogger,
        router: Router,
        private _appPermissions: KMCPermissionsService
    ) {
        super(logger.subLogger('SettingsTranscodingMainViewService'), router);
    }

    isAvailable(): boolean {
        return this._appPermissions.hasAnyPermissions([
            KMCPermissions.TRANSCODING_BASE,
            KMCPermissions.TRANSCODING_ADD,
            KMCPermissions.TRANSCODING_UPDATE,
            KMCPermissions.TRANSCODING_DELETE
        ]);
    }

    getRoutePath(): string {
        return 'settings/transcoding';
    }
}