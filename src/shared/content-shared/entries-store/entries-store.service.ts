import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { MetadataProfileCreateModes, MetadataProfileStore, MetadataProfileTypes } from 'app-shared/kmc-shared';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/subscribeOn';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

import { KalturaBaseEntryListResponse } from 'kaltura-ngx-client/api/types/KalturaBaseEntryListResponse';
import { BaseEntryDeleteAction } from 'kaltura-ngx-client/api/types/BaseEntryDeleteAction';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client/api/types/KalturaDetachedResponseProfile';
import { KalturaFilterPager } from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import { KalturaMediaEntryFilter } from 'kaltura-ngx-client/api/types/KalturaMediaEntryFilter';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { KalturaMetadataSearchItem } from 'kaltura-ngx-client/api/types/KalturaMetadataSearchItem';
import { KalturaResponseProfileType } from 'kaltura-ngx-client/api/types/KalturaResponseProfileType';
import { KalturaSearchOperator } from 'kaltura-ngx-client/api/types/KalturaSearchOperator';
import { KalturaSearchOperatorType } from 'kaltura-ngx-client/api/types/KalturaSearchOperatorType';
import { BaseEntryListAction } from 'kaltura-ngx-client/api/types/BaseEntryListAction';

import { KalturaClient } from 'kaltura-ngx-client';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';

import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { KalturaLiveStreamAdminEntry } from 'kaltura-ngx-client/api/types/KalturaLiveStreamAdminEntry';
import { KalturaLiveStreamEntry } from 'kaltura-ngx-client/api/types/KalturaLiveStreamEntry';
import { KalturaExternalMediaEntry } from 'kaltura-ngx-client/api/types/KalturaExternalMediaEntry';

import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import {
    FiltersStoreBase, TypeAdaptersMapping,
    GroupedListAdapter,
    DatesRangeAdapter, DatesRangeType,
    StringTypeAdapter,
    ListAdapter, ListType,
    NumberTypeAdapter,
    GroupedListType, EnumTypeAdapter
} from '@kaltura-ng/mc-shared/filters';
import { KalturaNullableBoolean } from 'kaltura-ngx-client/api/types/KalturaNullableBoolean';
import { KalturaContentDistributionSearchItem } from 'kaltura-ngx-client/api/types/KalturaContentDistributionSearchItem';
import { KalturaSearchCondition } from 'kaltura-ngx-client/api/types/KalturaSearchCondition';
import { CategoriesListAdapter, CategoriesListType } from 'app-shared/content-shared/categories/categories-list-type';
import {
    CategoriesModeAdapter, CategoriesModes,
    CategoriesModeType
} from 'app-shared/content-shared/categories/categories-mode-type';

export enum SortDirection {
    Desc,
    Asc
}

export interface EntriesFilters {
    freetext: string,
    pageSize: number,
    pageIndex: number,
    sortBy: string,
    sortDirection: number,
    createdAt: DatesRangeType,
    scheduledAt: DatesRangeType,
    mediaTypes: ListType,
    timeScheduling: ListType,
    ingestionStatuses: ListType,
    durations: ListType,
    originalClippedEntries: ListType,
    moderationStatuses: ListType,
    replacementStatuses: ListType,
    accessControlProfiles: ListType,
    flavors: ListType,
    distributions: ListType,
    categories: CategoriesListType,
    categoriesMode: CategoriesModeType,
    customMetadata: GroupedListType
}


@Injectable()
export class EntriesStore extends FiltersStoreBase<EntriesFilters> implements OnDestroy {
    private _entries = {
        data: new BehaviorSubject<{ items: KalturaMediaEntry[], totalCount: number }>({items: [], totalCount: 0}),
        state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({loading: false, errorMessage: null})
    };

    private _paginationCacheToken = 'default';
    private _isReady = false;
    private _metadataProfiles: { id: number, name: string, lists: { id: string, name: string }[] }[];
    private _querySubscription: ISubscription;

    public readonly entries =
        {
            data$: this._entries.data.asObservable(),
            state$: this._entries.state.asObservable(),
            data: () => {
                return this._entries.data.getValue().items;
            }
        };

    public set paginationCacheToken(token: string) {
        this._paginationCacheToken = typeof token === 'string' && token !== '' ? token : 'default';
    }

    constructor(private kalturaServerClient: KalturaClient,
                private browserService: BrowserService,
                private metadataProfileService: MetadataProfileStore,
                _logger: KalturaLogger) {
        super(_logger);
        this._prepare();
    }


    protected _preFilter(updates: Partial<EntriesFilters>): Partial<EntriesFilters> {
        if (typeof updates.pageIndex === 'undefined') {
            // reset page index to first page everytime filtering the list by any filter that is not page index
            updates.pageIndex = 0;
        }

        if (typeof updates.categoriesMode !== 'undefined')
        {
            this.browserService.setInLocalStorage('contentShared.categoriesTree.selectionMode', updates.categoriesMode);
        }

        return updates;
    }

    private _prepare(): void {
        if (!this._isReady) {
            this._entries.state.next({loading: true, errorMessage: null});
            this.metadataProfileService.get(
                {
                    type: MetadataProfileTypes.Entry,
                    ignoredCreateMode: MetadataProfileCreateModes.App
                })
                .cancelOnDestroy(this)
                .first()
                .monitor('entries store: get metadata profiles')
                .subscribe(
                    metadataProfiles => {
                        this._isReady = true;
                        this._metadataProfiles = metadataProfiles.items.map(metadataProfile => (
                            {
                                id: metadataProfile.id,
                                name: metadataProfile.name,
                                lists: (metadataProfile.items || []).map(item => ({id: item.id, name: item.name}))
                            }));

                        const defaultPageSize = this.browserService.getFromLocalStorage(this._getPaginationCacheKey());
                        if (defaultPageSize !== null && (defaultPageSize !== this.cloneFilter('pageSize', null))) {
                            this.filter({
                                pageSize: defaultPageSize
                            });
                        }

                        this._registerToFilterStoreDataChanges();
                        this._executeQuery();
                    },
                    (error) => {
                        this._entries.state.next({loading: false, errorMessage: error.message});
                    }
                );
        }
    }

    private _registerToFilterStoreDataChanges(): void {
        this.filtersChange$
            .cancelOnDestroy(this)
            .subscribe(() => {
                this._executeQuery();
            });

    }

    private _getPaginationCacheKey(): string {
        return `entries.${this._paginationCacheToken}.list.pageSize`;
    }

    ngOnDestroy() {
        this._entries.state.complete();
        this._entries.data.complete();
    }

    public reload(): void {
        if (this._entries.state.getValue().loading) {
            return;
        }

        if (this._isReady) {
            this._executeQuery();
        } else {
            this._prepare();
        }
    }

    private _executeQuery(): void {

        if (this._querySubscription) {
            this._querySubscription.unsubscribe();
            this._querySubscription = null;
        }

        const pageSize = this.cloneFilter('pageSize', null);
        if (pageSize) {
            this.browserService.setInLocalStorage(this._getPaginationCacheKey(), pageSize);
        }

        this._entries.state.next({loading: true, errorMessage: null});
        this._querySubscription = this.buildQueryRequest()
            .cancelOnDestroy(this)
            .subscribe(
                response => {
                    this._querySubscription = null;

                    this._entries.state.next({loading: false, errorMessage: null});

                    this._entries.data.next({
                        items: <any[]>response.objects,
                        totalCount: <number>response.totalCount
                    });
                },
                error => {
                    this._querySubscription = null;
                    const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
                    this._entries.state.next({loading: false, errorMessage});
                });


    }

    private buildQueryRequest(): Observable<KalturaBaseEntryListResponse> {
        try {

            // create request items
            const filter: KalturaMediaEntryFilter = new KalturaMediaEntryFilter({});
            let responseProfile: KalturaDetachedResponseProfile = null;
            let pagination: KalturaFilterPager = null;

            const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
            advancedSearch.type = KalturaSearchOperatorType.searchAnd;

            const data: EntriesFilters = this._getFiltersAsReadonly();

            // filter 'freeText'
            if (data.freetext) {
                filter.freeText = data.freetext;
            }

            // filter 'createdAt'
            if (data.createdAt) {
                if (data.createdAt.fromDate) {
                    filter.createdAtGreaterThanOrEqual = KalturaUtils.getStartDateValue(data.createdAt.fromDate);
                }

                if (data.createdAt.toDate) {
                    filter.createdAtLessThanOrEqual = KalturaUtils.getEndDateValue(data.createdAt.toDate);
                }
            }

            // filters of joined list
            this._updateFilterWithJoinedList(data.mediaTypes, filter, 'mediaTypeIn');
            this._updateFilterWithJoinedList(data.ingestionStatuses, filter, 'statusIn');
            this._updateFilterWithJoinedList(data.durations, filter, 'durationTypeMatchOr');
            this._updateFilterWithJoinedList(data.moderationStatuses, filter, 'moderationStatusIn');
            this._updateFilterWithJoinedList(data.replacementStatuses, filter, 'replacementStatusIn');
            this._updateFilterWithJoinedList(data.accessControlProfiles, filter, 'accessControlIdIn');
            this._updateFilterWithJoinedList(data.flavors, filter, 'flavorParamsIdsMatchOr');

            // filter 'distribution'
            if (data.distributions && data.distributions.length > 0) {
                const distributionItem = new KalturaSearchOperator({
                    type: KalturaSearchOperatorType.searchOr
                });

                advancedSearch.items.push(distributionItem);

                data.distributions.forEach(item => {
                    // very complex way to make sure the value is number (an also bypass both typescript and tslink checks)
                    if (isFinite(+item.value) && parseInt(item.value) == <any>item.value) { // tslint:disable-line
                        const newItem = new KalturaContentDistributionSearchItem(
                            {
                                distributionProfileId: +item.value,
                                hasEntryDistributionValidationErrors: false,
                                noDistributionProfiles: false
                            }
                        );

                        distributionItem.items.push(newItem)
                    } else {
                        this._logger.warn(`cannot convert distribution value '${item.value}' into number. ignoring value`);
                    }
                });
            }

            // filter 'originalClippedEntries'
            if (data.originalClippedEntries && data.originalClippedEntries.length > 0) {
                let originalClippedEntriesValue: KalturaNullableBoolean = null;

                data.originalClippedEntries.forEach(item => {
                    switch (item.value) {
                        case '0':
                            if (originalClippedEntriesValue == null) {
                                originalClippedEntriesValue = KalturaNullableBoolean.falseValue;
                            } else if (originalClippedEntriesValue === KalturaNullableBoolean.trueValue) {
                                originalClippedEntriesValue = KalturaNullableBoolean.nullValue;
                            }
                            break;
                        case '1':
                            if (originalClippedEntriesValue == null) {
                                originalClippedEntriesValue = KalturaNullableBoolean.trueValue;
                            } else if (originalClippedEntriesValue === KalturaNullableBoolean.falseValue) {
                                originalClippedEntriesValue = KalturaNullableBoolean.nullValue;
                            }
                            break;
                    }
                });

                if (originalClippedEntriesValue !== null) {
                    filter.isRoot = originalClippedEntriesValue;
                }
            }

            // filter 'timeScheduling'
            if (data.timeScheduling && data.timeScheduling.length > 0) {
                data.timeScheduling.forEach(item => {
                    switch (item.value) {
                        case 'past':
                            if (filter.endDateLessThanOrEqual === undefined || filter.endDateLessThanOrEqual < (new Date())) {
                                filter.endDateLessThanOrEqual = (new Date());
                            }
                            break;
                        case 'live':
                            if (filter.startDateLessThanOrEqualOrNull === undefined || filter.startDateLessThanOrEqualOrNull > (new Date())) {
                                filter.startDateLessThanOrEqualOrNull = (new Date());
                            }
                            if (filter.endDateGreaterThanOrEqualOrNull === undefined || filter.endDateGreaterThanOrEqualOrNull < (new Date())) {
                                filter.endDateGreaterThanOrEqualOrNull = (new Date());
                            }
                            break;
                        case 'future':
                            if (filter.startDateGreaterThanOrEqual === undefined || filter.startDateGreaterThanOrEqual > (new Date())) {
                                filter.startDateGreaterThanOrEqual = (new Date());
                            }
                            break;
                        case 'scheduled':
                            if (data.scheduledAt.fromDate) {
                                if (filter.startDateGreaterThanOrEqual === undefined
                                    || filter.startDateGreaterThanOrEqual > (KalturaUtils.getStartDateValue(data.scheduledAt.fromDate))
                                ) {
                                    filter.startDateGreaterThanOrEqual = (KalturaUtils.getStartDateValue(data.scheduledAt.fromDate));
                                }
                            }

                            if (data.scheduledAt.toDate) {
                                if (filter.endDateLessThanOrEqual === undefined
                                    || filter.endDateLessThanOrEqual < (KalturaUtils.getEndDateValue(data.scheduledAt.toDate))
                                ) {
                                    filter.endDateLessThanOrEqual = (KalturaUtils.getEndDateValue(data.scheduledAt.toDate));
                                }
                            }

                            break;
                        default:
                            break
                    }
                });
            }

            // filters of custom metadata lists
            if (this._metadataProfiles && this._metadataProfiles.length > 0) {

                this._metadataProfiles.forEach(metadataProfile => {
                    // create advanced item for all metadata profiles regardless if the user filtered by them or not.
                    // this is needed so freetext will include all metadata profiles while searching.
                    const metadataItem: KalturaMetadataSearchItem = new KalturaMetadataSearchItem(
                        {
                            metadataProfileId: metadataProfile.id,
                            type: KalturaSearchOperatorType.searchAnd,
                            items: []
                        }
                    );
                    advancedSearch.items.push(metadataItem);

                    metadataProfile.lists.forEach(list => {
                        const metadataProfileFilters = data.customMetadata[list.id];
                        if (metadataProfileFilters && metadataProfileFilters.length > 0) {
                            const innerMetadataItem: KalturaMetadataSearchItem = new KalturaMetadataSearchItem({
                                metadataProfileId: metadataProfile.id,
                                type: KalturaSearchOperatorType.searchOr,
                                items: []
                            });
                            metadataItem.items.push(innerMetadataItem);

                            metadataProfileFilters.forEach(filterItem => {
                                const searchItem = new KalturaSearchCondition({
                                    field: `/*[local-name()='metadata']/*[local-name()='${list.name}']`,
                                    value: filterItem.value
                                });

                                innerMetadataItem.items.push(searchItem);
                            });
                        }
                    });
                });
            }

            if (data.categories && data.categories.length) {
                const categoriesValue = data.categories.map(item => item.value).join(',');
                if (data.categoriesMode === CategoriesModes.SelfAndChildren) {
                    filter.categoryAncestorIdIn = categoriesValue;
                } else {
                    filter.categoriesIdsMatchOr = categoriesValue;
                }
            }

            // remove advanced search arg if it is empty
            if (advancedSearch.items && advancedSearch.items.length === 0) {
                delete filter.advancedSearch;
            }

            // handle default value for media types
            if (!filter.mediaTypeIn) {
                filter.mediaTypeIn = '1,2,5,6,201';
            }

            // handle default value for statuses
            if (!filter.statusIn) {
                filter.statusIn = '-1,-2,0,1,2,7,4';
            }


            // update the sort by args
            if (data.sortBy) {
                filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
            }

            // update desired fields of entries
                responseProfile = new KalturaDetachedResponseProfile({
                    type: KalturaResponseProfileType.includeFields,
                    fields: 'id,name,thumbnailUrl,mediaType,plays,createdAt,duration,status,startDate,endDate,moderationStatus,tags,categoriesIds,downloadUrl,sourceType'
                });

            // update pagination args
            if (data.pageIndex || data.pageSize) {
                pagination = new KalturaFilterPager(
                    {
                        pageSize: data.pageSize,
                        pageIndex: data.pageIndex + 1
                    }
                );
            }

            // build the request
            return <any>this.kalturaServerClient.request(
                new BaseEntryListAction({
                    filter,
                    pager: pagination,
                    responseProfile,
                    acceptedTypes: [KalturaLiveStreamAdminEntry, KalturaLiveStreamEntry, KalturaExternalMediaEntry]
                })
            )
        } catch (err) {
            return Observable.throw(err);
        }

    }

    private _updateFilterWithJoinedList(list: ListType, requestFilter: KalturaMediaEntryFilter, requestFilterProperty: keyof KalturaMediaEntryFilter): void {
        const value = (list || []).map(item => item.value).join(',');

        if (value) {
            requestFilter[requestFilterProperty] = value;
        }
    }

    public deleteEntry(entryId: string): Observable<void> {

        return Observable.create(observer => {
            let subscription: ISubscription;
            if (entryId && entryId.length) {
                subscription = this.kalturaServerClient.request(new BaseEntryDeleteAction({entryId: entryId})).subscribe(
                    result => {
                        observer.next();
                        observer.complete();
                    },
                    error => {
                        observer.error(error);
                    }
                );
            } else {
                observer.error(new Error('missing entryId argument'));
            }
            return () => {
                if (subscription) {
                    subscription.unsubscribe();
                }
            }
        });

    }

    protected _createDefaultFiltersValue(): EntriesFilters {

        const savedAutoSelectChildren: CategoriesModes = this.browserService
            .getFromLocalStorage('contentShared.categoriesTree.selectionMode');
        const categoriesMode = typeof savedAutoSelectChildren === 'number'
            ? savedAutoSelectChildren
            : CategoriesModes.SelfAndChildren;

        return {
            freetext: '',
            pageSize: 50,
            pageIndex: 0,
            sortBy: 'createdAt',
            sortDirection: SortDirection.Desc,
            createdAt: {fromDate: null, toDate: null},
            scheduledAt: {fromDate: null, toDate: null},
            mediaTypes: [],
            timeScheduling: [],
            ingestionStatuses: [],
            durations: [],
            originalClippedEntries: [],
            moderationStatuses: [],
            replacementStatuses: [],
            accessControlProfiles: [],
            flavors: [],
            distributions: [],
            categories: [],
            categoriesMode,
            customMetadata: {}
        };
    }

    protected _getTypeAdaptersMapping(): TypeAdaptersMapping<EntriesFilters> {
        return {
            freetext: new StringTypeAdapter(),
            pageSize: new NumberTypeAdapter(),
            pageIndex: new NumberTypeAdapter(),
            sortBy: new StringTypeAdapter(),
            sortDirection: new NumberTypeAdapter(),
            createdAt: new DatesRangeAdapter(),
            scheduledAt: new DatesRangeAdapter(),
            mediaTypes: new ListAdapter(),
            timeScheduling: new ListAdapter(),
            ingestionStatuses: new ListAdapter(),
            durations: new ListAdapter(),
            originalClippedEntries: new ListAdapter(),
            moderationStatuses: new ListAdapter(),
            replacementStatuses: new ListAdapter(),
            accessControlProfiles: new ListAdapter(),
            flavors: new ListAdapter(),
            distributions: new ListAdapter(),
            categories: new CategoriesListAdapter(),
            categoriesMode: new CategoriesModeAdapter(),
            customMetadata: new GroupedListAdapter()
        };
    }
}
