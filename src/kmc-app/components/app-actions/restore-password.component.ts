import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { AppAuthentication, BrowserService } from 'app-shared/kmc-shell';

@Component({
    selector: 'kRestorePassword',
    template: '<k-area-blocker classes="kAreaBlockerCoverAll" [showLoader]="true"></k-area-blocker>',
    providers: [KalturaLogger.createLogger('RestorePasswordComponent')]
})
export class RestorePasswordComponent implements OnInit, OnDestroy {
    constructor(private _route: ActivatedRoute,
                private _router: Router,
                private _appAuth: AppAuthentication,
                private _browserService: BrowserService,
                private _logger: KalturaLogger) {

    }

    ngOnInit() {
        this._logger.info(`handle 'restore-password' action`);
        const restorePasswordHash = (this._route.snapshot.params['hash'] || '').trim();
        if (!restorePasswordHash) {
            this._logger.info(`missing 'hash' value, navigating to default page`);
            this._browserService.navigateToDefault();
            return;
        }

        this._logger.info(`handle restore password`, {restorePasswordHash});
        this._appAuth.restorePassword(restorePasswordHash);
    }

    ngOnDestroy() {
    }
}
