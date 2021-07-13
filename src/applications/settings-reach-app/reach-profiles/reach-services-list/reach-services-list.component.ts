import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Router} from '@angular/router';
import {AppLocalization} from '@kaltura-ng/mc-shared';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {KMCPermissions} from 'app-shared/kmc-shared/kmc-permissions';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {BrowserService} from 'app-shared/kmc-shell/providers';
import {SettingsReachMainViewService} from 'app-shared/kmc-shared/kmc-views';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {ReachProfilesFilters} from "../reach-profiles-store/reach-profiles-store.service";
import {SortDirection} from "../../../administration-multi-account-app/multi-account-store/multi-account-store.service";
import {SettingsReachProfileViewService} from "app-shared/kmc-shared/kmc-views/details-views/settings-reach-profile-view.service";
import {ReachServicesStore} from "../reach-services-store/reach-services-store.service";
import {KalturaVendorServiceFeature} from "kaltura-ngx-client";
import {
    ReachServicesRefineFiltersService,
    RefineList
} from "../reach-services-store/reach-services-refine-filters.service";
import { first } from 'rxjs/operators';

@Component({
    selector: 'k-reach-services-list',
    templateUrl: './reach-services-list.component.html',
    styleUrls: ['./reach-services-list.component.scss'],
    providers: [KalturaLogger.createLogger('ReachServicesListComponent')]
})
export class ReachServicesListComponent implements OnInit, OnDestroy {

    @Output() setParentBlockerMessage = new EventEmitter<AreaBlockerMessage>();

    public _isBusy = false;
    public _blockerMessage: AreaBlockerMessage = null;
    public _tableIsBusy = false;
    public _tableBlockerMessage: AreaBlockerMessage;
    public _kmcPermissions = KMCPermissions;
    public _serviceFeatures = [];
    public _window = window;

    public _query = {
        sortBy: 'createdAt',
        sortDirection: SortDirection.Asc,
        pageIndex: 0,
        pageSize: 50
    };
    public _refineFilters: RefineList[];

    constructor(private _appLocalization: AppLocalization,
                private _router: Router,
                private _logger: KalturaLogger,
                private _browserService: BrowserService,
                private _refineFiltersService: ReachServicesRefineFiltersService,
                private _settingsReachMainViewService: SettingsReachMainViewService,
                private _settingsReachViewService: SettingsReachProfileViewService,
                public _reachServicesStore: ReachServicesStore) {

        this._serviceFeatures = [
            { label: this._appLocalization.get('applications.settings.reach.services.captions'), value: KalturaVendorServiceFeature.captions },
            { label: this._appLocalization.get('applications.settings.reach.services.translations'), value: KalturaVendorServiceFeature.translation },
            { label: this._appLocalization.get('applications.settings.reach.services.alignment'), value: KalturaVendorServiceFeature.alignment },
            { label: this._appLocalization.get('applications.settings.reach.services.audioDescription'), value: KalturaVendorServiceFeature.audioDescription },
            { label: this._appLocalization.get('applications.settings.reach.services.chaptering'), value: KalturaVendorServiceFeature.chaptering }
        ];
    }

    ngOnInit() {
        if (this._settingsReachMainViewService.isAvailable()) {
            this._prepare();
        }
    }

    ngOnDestroy() {

    }

    private _prepare(): void {
        this._logger.info(`initiate reach profiles list view, load refine filters`);
        this._isBusy = true;
        this._refineFiltersService.getFilters()
            .pipe(cancelOnDestroy(this))
            .pipe(first()) // only handle it once, no need to handle changes over time
            .subscribe(
                lists => {
                    this._logger.info(`handle successful loading of filters, proceed initiation`);
                    this._isBusy = false;
                    this._refineFilters = lists;
                    this._restoreFiltersState();
                    this._registerToFilterStoreDataChanges();
                    this._registerToDataChanges();
                },
                error => {
                    this._logger.warn(`handle failed loading of filters, abort initiation, show alert`, { errorMessage: error.message });
                    this._isBusy = false;
                    this._blockerMessage = new AreaBlockerMessage({
                        message: this._appLocalization.get('applications.content.filters.errorLoading'),
                        buttons: [{
                            label: this._appLocalization.get('app.common.retry'),
                            action: () => {
                                this._logger.info(`user selected retry, retry action`);
                                this._blockerMessage = null;
                                this._prepare();
                                this._reachServicesStore.reload();
                            }
                        }
                        ]
                    });
                });
    }

    private _registerToFilterStoreDataChanges(): void {
        this._reachServicesStore.filtersChange$
            .pipe(cancelOnDestroy(this))
            .subscribe(({changes}) => {
                this._updateComponentState(changes);
            });
    }

    private _registerToDataChanges(): void {
        this._reachServicesStore.services.state$
            .pipe(cancelOnDestroy(this))
            .subscribe(
                result => {
                    setTimeout(() => {
                        this._tableIsBusy = result.loading;
                    }, 0);
                    if (result.errorMessage) {
                        this._logger.info(`handle failing load services list data, show confirmation`);
                        this._tableBlockerMessage = new AreaBlockerMessage({
                            message: result.errorMessage || this._appLocalization.get('applications.settings.reach.errorLoadingServices'),
                            buttons: [
                                {
                                    label: this._appLocalization.get('app.common.retry'),
                                    action: () => {
                                        this._logger.info(`user selected retry, reload services list data`);
                                        this._tableBlockerMessage = null;
                                        this._reachServicesStore.reload();
                                    }
                                },
                                {
                                    label: this._appLocalization.get('app.common.cancel'),
                                    action: () => {
                                        this._logger.info(`user canceled, dismiss confirmation`);
                                        this._tableBlockerMessage = null;
                                    }
                                }
                            ]
                        });
                    } else {
                        this._tableBlockerMessage = null;
                    }
                }
            );
    }

    private _restoreFiltersState(): void {
        this._updateComponentState(this._reachServicesStore.cloneFilters(
            [
                'pageSize',
                'pageIndex',
                'sortBy',
                'sortDirection',
                'service',
                'tat'
            ]
        ));
    }

    private _updateComponentState(updates: Partial<ReachProfilesFilters>): void {
        // if (typeof updates.freeText !== 'undefined') {
        //     this._query.freeText = updates.freeText || '';
        // }

        if (typeof updates.pageSize !== 'undefined') {
            this._query.pageSize = updates.pageSize;
        }

        if (typeof updates.pageIndex !== 'undefined') {
            this._query.pageIndex = updates.pageIndex;
        }

        if (typeof updates.sortBy !== 'undefined') {
            this._query.sortBy = updates.sortBy;
        }

        if (typeof updates.sortDirection !== 'undefined') {
            this._query.sortDirection = updates.sortDirection;
        }
    }

    public _onPaginationChanged(state): void {
        if (state.page !== this._query.pageIndex || state.rows !== this._query.pageSize) {
            this._reachServicesStore.filter({
                pageIndex: state.page,
                pageSize: state.rows
            });
        }
    }

    public _onSortChanged(event): void {
        if (event.field !== this._query.sortBy || event.order !== this._query.sortDirection) {
            this._reachServicesStore.filter({
                sortBy: event.field,
                sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
            });
        }
    }

    public _onFeatureChange(event): void {
        this._reachServicesStore.filter({
            feature: event.value
        });
    }
}
