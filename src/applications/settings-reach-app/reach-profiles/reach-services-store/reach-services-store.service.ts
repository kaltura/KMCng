import { OnDestroy, Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Observable} from 'rxjs';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {ISubscription} from 'rxjs/Subscription';
import {
    KalturaClient,
    KalturaDetachedResponseProfile,
    KalturaResponseProfileType,
    KalturaVendorAlignmentCatalogItemFilter,
    KalturaVendorAudioDescriptionCatalogItemFilter,
    KalturaVendorCaptionsCatalogItemFilter,
    KalturaVendorCatalogItem,
    KalturaVendorCatalogItemListResponse,
    KalturaVendorChapteringCatalogItemFilter,
    KalturaVendorServiceFeature,
    KalturaVendorTranslationCatalogItemFilter,
    VendorCatalogItemListAction
} from 'kaltura-ngx-client';
import {KalturaFilterPager} from 'kaltura-ngx-client';
import {BrowserService} from 'shared/kmc-shell/providers/browser.service';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {FiltersStoreBase, StringTypeAdapter, TypeAdaptersMapping} from '@kaltura-ng/mc-shared';
import {NumberTypeAdapter} from '@kaltura-ng/mc-shared';
import {globalConfig} from 'config/global';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {SettingsReachMainViewService} from "app-shared/kmc-shared/kmc-views/main-views/settings-reach-main-view.service";
import {AppAuthentication} from "app-shared/kmc-shell";

export enum SortDirection {
    Desc = -1,
    Asc = 1
}

export interface ReachServicesFilters {
    pageSize: number;
    pageIndex: number;
    sortBy: string;
    sortDirection: number;
    feature: number;
    service: number;
    tat: number;
    languages: string;
}

@Injectable()
export class ReachServicesStore extends FiltersStoreBase<ReachServicesFilters> implements OnDestroy {
    private _services = {
        data: new BehaviorSubject<{ items: KalturaVendorCatalogItem[], totalCount: number }>({items: [], totalCount: 0}),
        state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({loading: false, errorMessage: null})
    };
    private _isReady = false;
    private _querySubscription: ISubscription;

    private localStoragePageSizeKey = 'reach.services.list.pageSize';

    public readonly services = {
        data$: this._services.data.asObservable(),
        state$: this._services.state.asObservable(),
        data: () => this._services.data.value
    };

    public _selectedFeature: KalturaVendorServiceFeature = KalturaVendorServiceFeature.captions;

    constructor(private _kalturaServerClient: KalturaClient,
                private _browserService: BrowserService,
                private _appAuthentication: AppAuthentication,
                settingsReachMainView: SettingsReachMainViewService,
                _logger: KalturaLogger) {
        super(_logger);
        if (settingsReachMainView.isAvailable()) {
            setTimeout(() => {
                this._prepare();
            });
        }
    }

    ngOnDestroy() {
        this._services.data.complete();
        this._services.state.complete();
    }

    private _executeQuery(): void {
        if (this._querySubscription) {
            this._querySubscription.unsubscribe();
            this._querySubscription = null;
        }

        const pageSize = this.cloneFilter('pageSize', null);
        if (pageSize) {
            this._browserService.setInLocalStorage(this.localStoragePageSizeKey, pageSize);
        }

        this._logger.info(`loading data from the server`);
        this._services.state.next({ loading: true, errorMessage: null });
        this._querySubscription = this._buildQueryRequest()
            .pipe(cancelOnDestroy(this))
            .subscribe(
                response => {
                    this._logger.info(`handle success loading data from the server`);
                    this._querySubscription = null;

                    this._services.state.next({ loading: false, errorMessage: null });

                    this._services.data.next({
                        items: response.objects,
                        totalCount: response.totalCount
                    });
                },
                error => {
                    this._querySubscription = null;
                    const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
                    this._logger.warn(`handle failed loading data from the server`, { errorMessage });
                    this._services.state.next({ loading: false, errorMessage });
                });
    }

    private _buildQueryRequest(): Observable<{ objects: KalturaVendorCatalogItem[], totalCount: number }> {
        try {
            // create request items
            let pager: KalturaFilterPager = null;

            // set filter type according to selected feature. Default feature is Captions
            let filter: any = new KalturaVendorCaptionsCatalogItemFilter({});
            switch (this._selectedFeature) {
                case KalturaVendorServiceFeature.translation:
                    filter = new KalturaVendorTranslationCatalogItemFilter({});
                    break;
                case KalturaVendorServiceFeature.alignment:
                    filter = new KalturaVendorAlignmentCatalogItemFilter({});
                    break;
                case KalturaVendorServiceFeature.audioDescription:
                    filter = new KalturaVendorAudioDescriptionCatalogItemFilter({});
                    break;
                case KalturaVendorServiceFeature.chaptering:
                    filter = new KalturaVendorChapteringCatalogItemFilter({});
                    break;
            }
            const data: ReachServicesFilters = this._getFiltersAsReadonly();

            // update pagination args
            if (data.pageIndex || data.pageSize) {
                pager = new KalturaFilterPager(
                    {
                        pageSize: data.pageSize,
                        pageIndex: data.pageIndex + 1
                    }
                );
            }

            // filter by partner ID
            filter.partnerIdEqual = this._appAuthentication.appUser.partnerId;

            // filter by feature
            filter.serviceFeatureEqual = data.feature;

            // filter service
            if (data.service){
                filter.serviceTypeIn = data.service.toString();
            }

            // filter tat
            if (data.tat) {
                filter.turnAroundTimeIn = data.tat.toString();
            }

            // filter 'languages'
            if (data.languages) {
                filter.sourceLanguageIn = data.languages;
            }

            // update the sort by args
            if (data.sortBy) {
                filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
            }

            const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
                type: KalturaResponseProfileType.includeFields,
                fields: 'id,createdAt,serviceType,serviceFeature,turnAroundTime,pricing,enableSpeakerId,sourceLanguage,targetLanguage'
            });

            const reachServicesListAction = new VendorCatalogItemListAction({ filter, pager }).setRequestOptions({responseProfile});

            // build the request
            return this._kalturaServerClient
                .request(reachServicesListAction)
                .pipe(map((servicesResponse: KalturaVendorCatalogItemListResponse) => {
                    const objects: KalturaVendorCatalogItem[] = servicesResponse.objects;
                    const totalCount = servicesResponse.totalCount;
                    return { objects, totalCount };
                }));
        } catch (err) {
            return throwError(err);
        }
    }

    protected _preFilter(updates: Partial<ReachServicesFilters>): Partial<ReachServicesFilters> {
        if (typeof updates.pageIndex === 'undefined') {
            // reset page index to first page everytime filtering the list by any filter that is not page index
            updates.pageIndex = 0;
        }

        return updates;
    }

    protected _createDefaultFiltersValue(): ReachServicesFilters {
        const pageSize = this._browserService.getFromLocalStorage(this.localStoragePageSizeKey) || globalConfig.client.views.tables.defaultPageSize;
        return {
            pageSize: pageSize,
            pageIndex: 0,
            sortBy: 'createdAt',
            sortDirection: SortDirection.Desc,
            feature: KalturaVendorServiceFeature.captions,
            service: null,
            tat: null,
            languages: ''
        };
    }

    protected _getTypeAdaptersMapping(): TypeAdaptersMapping<ReachServicesFilters> {
        return {
            pageSize: new NumberTypeAdapter(),
            pageIndex: new NumberTypeAdapter(),
            sortBy: new StringTypeAdapter(),
            sortDirection: new NumberTypeAdapter(),
            feature: new NumberTypeAdapter(),
            service: new NumberTypeAdapter(),
            tat: new NumberTypeAdapter(),
            languages: new StringTypeAdapter()
        };
    }

    private _registerToFilterStoreDataChanges(): void {
        this.filtersChange$
            .pipe(cancelOnDestroy(this))
            .subscribe(() => {
                this._executeQuery();
            });
    }

    private _prepare(): void {
        // NOTICE: do not execute here any logic that should run only once.
        // this function will re-run if preparation failed. execute your logic
        // only after the line where we set isReady to true

        if (!this._isReady) {
            this._logger.info(`initiate service`);
            this._isReady = true;
            this._registerToFilterStoreDataChanges();
            this._executeQuery();
        }
    }


    public reload(): void {
        this._logger.info(`reload profiles list`);
        if (this._services.state.getValue().loading) {
            this._logger.info(`reloading already in progress skip duplicating request`);
            return;
        }

        if (this._isReady) {
            this._executeQuery();
        } else {
            this._prepare();
        }
    }
}

