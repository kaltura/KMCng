import { Injectable, OnDestroy } from '@angular/core';
import { KalturaFeatureStatusListResponse } from 'kaltura-ngx-client';
import { KalturaFeatureStatusType } from 'kaltura-ngx-client';
import { KmcServerPolls } from 'app-shared/kmc-shared/server-polls';
import { modulesConfig } from 'config/modules';
import { CategoriesStatusRequestFactory } from './categories-status-request-factory';
import { ReplaySubject } from 'rxjs';
import { KalturaFeatureStatus } from 'kaltura-ngx-client';
import { PollInterval } from '@kaltura-ng/kaltura-common';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

export interface CategoriesStatus {
    lock: boolean;
    update: boolean;
}

@Injectable()
export class CategoriesStatusMonitorService implements OnDestroy {

    private _pollingState: null | 'running' = null;
    private _pollingInterval: PollInterval = <PollInterval>modulesConfig.contentShared.categories.categoriesStatusSampleInterval;
    private _currentStatus = { lock: null, update: null };

    private _status = new ReplaySubject<CategoriesStatus>(1);
    public readonly status$ = this._status.asObservable();
    private _logger: KalturaLogger;

    private _categoriesStatusRequestFactory = new CategoriesStatusRequestFactory();


    constructor( private _kmcServerPolls: KmcServerPolls, private _kalturaClient: KalturaClient, _logger: KalturaLogger ) {
        this._logger = _logger.subLogger('categoriesStatusMonitor');
        this._logger.debug('constructor()');
        this._startPolling();
    }


    ngOnDestroy() {
        this._logger.debug('ngOnDestroy()');
        this._status.complete();
    }

    private _startPolling(): void {
        if (this._pollingState !== 'running') {
            this._pollingState = 'running';
            this._logger.info(`start server polling every ${this._pollingInterval} seconds to get categories status`);

            this._kmcServerPolls.register<KalturaFeatureStatusListResponse>(this._pollingInterval , this._categoriesStatusRequestFactory)
                .pipe(cancelOnDestroy(this))
                .subscribe(response => {
                    this._handleResponse(response);
                });
        }
    }

    private _handleResponse(response): void{
        if (response.error) {
            this._logger.warn(`error occurred while trying to get categories status from server. server error: ${response.error.message}`);
            return;
        }
        let lockFlagFound = false;
        let updateFlagFound = false;

        const status: KalturaFeatureStatusListResponse = response.result;
        if (status && status.objects) {
            status.objects.forEach((kfs: KalturaFeatureStatus) => {
                switch (kfs.type) {
                    case KalturaFeatureStatusType.lockCategory:
                        lockFlagFound = true;
                        break;
                    case KalturaFeatureStatusType.category:
                        updateFlagFound = true;
                        break;
                }
            });
        }

        if (this._currentStatus.lock !== lockFlagFound || this._currentStatus.update !== updateFlagFound) {
            this._currentStatus =  { lock: lockFlagFound, update: updateFlagFound };
            this._status.next({lock: lockFlagFound, update: updateFlagFound});
            this._logger.info(`got new categories status: locked: ${lockFlagFound}, update: ${updateFlagFound}`);
        }
    }

    // API to invoke immediate categories status update
    public updateCategoriesStatus():void{
        this._kalturaClient.request(this._categoriesStatusRequestFactory.create()).pipe(cancelOnDestroy(this))
	        .subscribe(response => {
                this._handleResponse(response);
            });
    }
}
