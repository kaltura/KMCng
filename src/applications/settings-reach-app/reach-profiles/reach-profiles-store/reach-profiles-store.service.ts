import { OnDestroy, Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Observable} from 'rxjs';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {ISubscription} from 'rxjs/Subscription';
import {
    KalturaClient, KalturaDetachedResponseProfile,
    KalturaReachProfile,
    KalturaReachProfileFilter,
    KalturaReachProfileListResponse,
    KalturaReachProfileOrderBy, KalturaResponseProfileType,
    ReachProfileListAction, UiConfListAction
} from 'kaltura-ngx-client';
import {KalturaFilterPager} from 'kaltura-ngx-client';
import {BrowserService} from 'shared/kmc-shell/providers/browser.service';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {FiltersStoreBase, ListTypeAdapter, StringTypeAdapter, TypeAdaptersMapping} from '@kaltura-ng/mc-shared';
import {NumberTypeAdapter} from '@kaltura-ng/mc-shared';
import {globalConfig} from 'config/global';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {SettingsReachMainViewService} from "app-shared/kmc-shared/kmc-views/main-views/settings-reach-main-view.service";
import {SortDirection} from "../../../administration-multi-account-app/multi-account-store/multi-account-store.service";

export interface ReachProfilesFilters {
    freeText: string;
    pageSize: number;
    pageIndex: number;
    sortBy: string;
    sortDirection: number;
}

export interface KalturaReachProfileWithCredit extends KalturaReachProfile {
    totalCredit?: number;
    remaining?: number;
}

@Injectable()
export class ReachProfilesStore extends FiltersStoreBase<ReachProfilesFilters> implements OnDestroy {
    private _profiles = {
        data: new BehaviorSubject<{ items: KalturaReachProfileWithCredit[], totalCount: number }>({items: [], totalCount: 0}),
        state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({loading: false, errorMessage: null})
    };
    private _isReady = false;
    private _querySubscription: ISubscription;

    private localStoragePageSizeKey = 'reach.profiles.list.pageSize';

    public readonly profiles = {
        data$: this._profiles.data.asObservable(),
        state$: this._profiles.state.asObservable(),
        data: () => this._profiles.data.value
    };

    constructor(private _kalturaServerClient: KalturaClient,
                private _browserService: BrowserService,
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
        this._profiles.data.complete();
        this._profiles.state.complete();
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
        this._profiles.state.next({ loading: true, errorMessage: null });
        this._querySubscription = this._buildQueryRequest()
            .pipe(cancelOnDestroy(this))
            .subscribe(
                response => {
                    this._logger.info(`handle success loading data from the server`);
                    this._querySubscription = null;

                    this._profiles.state.next({ loading: false, errorMessage: null });

                    this._profiles.data.next({
                        items: response.objects,
                        totalCount: response.totalCount
                    });
                },
                error => {
                    this._querySubscription = null;
                    const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
                    this._logger.warn(`handle failed loading data from the server`, { errorMessage });
                    this._profiles.state.next({ loading: false, errorMessage });
                });
    }

    private _buildQueryRequest(): Observable<{ objects: KalturaReachProfileWithCredit[], totalCount: number }> {
        try {
            // create request items
            const filter = new KalturaReachProfileFilter({});
            let pager: KalturaFilterPager = null;

            const data: ReachProfilesFilters = this._getFiltersAsReadonly();

            // update pagination args
            if (data.pageIndex || data.pageSize) {
                pager = new KalturaFilterPager(
                    {
                        pageSize: data.pageSize,
                        pageIndex: data.pageIndex + 1
                    }
                );
            }

            // filter 'freeText'
            if (data.freeText) {
                if (/^-{0,1}\d+$/.test(data.freeText)){
                    // number - search pid
                    filter.idIn = data.freeText;
                } else {
                    // string - search account name
                    filter.idIn = data.freeText;
                }

            }

            // update the sort by args
            if (data.sortBy) {
                filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
            }

            const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
                type: KalturaResponseProfileType.includeFields,
                fields: 'id,name,createdAt,updatedAt,credit,usedCredit,toDate,addOn'
            });

            const reachProfileListAction = new ReachProfileListAction({ filter, pager }).setRequestOptions({responseProfile});

            // build the request
            return this._kalturaServerClient
                .request(reachProfileListAction)
                .pipe(map((profilesResponse: KalturaReachProfileListResponse) => {
                    const profiles = profilesResponse.objects;
                    let objects: KalturaReachProfileWithCredit[] = [];
                    profiles.forEach(profile => {
                        const totalCredit = profile.credit['credit'] !== -9999 ? parseFloat((profile.credit['credit'] + profile.credit['addOn']).toFixed(2)) : -9999;
                        const remaining = profile.credit['credit'] !== -9999 ? parseFloat((totalCredit - profile.usedCredit).toFixed(2)) : -9999;
                        objects.push({...profile, remaining, totalCredit} as KalturaReachProfileWithCredit);
                    });
                    const totalCount = profilesResponse.totalCount;
                    return { objects, totalCount };
                }));
        } catch (err) {
            return throwError(err);
        }
    }

    protected _preFilter(updates: Partial<ReachProfilesFilters>): Partial<ReachProfilesFilters> {
        if (typeof updates.pageIndex === 'undefined') {
            // reset page index to first page everytime filtering the list by any filter that is not page index
            updates.pageIndex = 0;
        }

        return updates;
    }

    protected _createDefaultFiltersValue(): ReachProfilesFilters {
        const pageSize = this._browserService.getFromLocalStorage(this.localStoragePageSizeKey) || globalConfig.client.views.tables.defaultPageSize;
        return {
            freeText: '',
            pageSize: pageSize,
            pageIndex: 0,
            sortBy: 'createdAt',
            sortDirection: SortDirection.Desc
        };
    }

    protected _getTypeAdaptersMapping(): TypeAdaptersMapping<ReachProfilesFilters> {
        return {
            freeText: new StringTypeAdapter(),
            pageSize: new NumberTypeAdapter(),
            pageIndex: new NumberTypeAdapter(),
            sortBy: new StringTypeAdapter(),
            sortDirection: new NumberTypeAdapter()
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
        if (this._profiles.state.getValue().loading) {
            this._logger.info(`reloading already in progress skip duplicating request`);
            return;
        }

        if (this._isReady) {
            this._executeQuery();
        } else {
            this._prepare();
        }
    }


    // public duplicateProfiles(profiles: KalturaReachProfile): Observable<void> {
    //   return this._transmitChunkRequest(
    //     profiles.map(profile => new ConversionProfileDeleteAction({ id: profile.id }))
    //   );
    // }
}

