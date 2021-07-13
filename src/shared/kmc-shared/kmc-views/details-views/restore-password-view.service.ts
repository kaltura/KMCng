import { Injectable } from '@angular/core';
import { KMCPermissionsService } from '../../kmc-permissions';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {
    DetailsViewMetadata,
    KmcDetailsViewBaseService
} from 'app-shared/kmc-shared/kmc-views/kmc-details-view-base.service';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { Title } from '@angular/platform-browser';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { ContextualHelpService } from 'app-shared/kmc-shared/contextual-help/contextual-help.service';

export interface RestorePasswordViewArgs {
    hash: string;
}


@Injectable()
export class RestorePasswordViewService extends KmcDetailsViewBaseService<RestorePasswordViewArgs> {

    constructor(private _appPermissions: KMCPermissionsService,
                private _appLocalization: AppLocalization,
                private _router: Router,
                _browserService: BrowserService,
                _logger: KalturaLogger,
                _titleService: Title,
                _contextualHelpService: ContextualHelpService) {
        super(_logger.subLogger('RestorePasswordViewService'), _browserService,
            _titleService, _contextualHelpService);
    }

    getViewMetadata(args: RestorePasswordViewArgs): DetailsViewMetadata {
        const title = this._appLocalization.get('app.titles.restorePasswordPageTitle');
        return {
            title,
            viewKey: 'restore-password'
        };
    }
    isAvailable(args: RestorePasswordViewArgs): boolean {
        const hasHash = args && !!args.hash;
        this._logger.info(`handle isAvailable action by user`, { hasHash });
        return hasHash;
    }

    protected _open(args: RestorePasswordViewArgs): Observable<boolean> {
        this._logger.info('handle open view request by the user', {hash: args.hash});
        return this._browserService.navigateToLoginWithStatus();
    }
}
