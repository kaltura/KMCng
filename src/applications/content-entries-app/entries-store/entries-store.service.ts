import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { Scheduler } from 'rxjs';
import 'rxjs/add/operator/subscribeOn';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

import {
    KalturaBaseEntryListResponse,
    KalturaDetachedResponseProfile,
    KalturaFilterPager,
    KalturaMediaEntryFilter,
    KalturaMediaEntry,
    KalturaMetadataSearchItem,
    KalturaResponseProfileType,
    KalturaSearchOperator,
    KalturaSearchOperatorType,
    BaseEntryListAction
} from 'kaltura-typescript-client/types'

import { KalturaClient } from '@kaltura-ng/kaltura-client';


import * as R from 'ramda';
import { FilterItem } from "./filter-item";
import { BrowserService } from "kmc-shell/providers/browser.service";

export type UpdateStatus = {
    loading : boolean;
    errorMessage : string;
};

export interface Entries{
    items : KalturaMediaEntry[],
    totalCount : number
}

export interface QueryData
{
    pageIndex? : number,
    pageSize? : number,
    sortBy? : string,
    sortDirection? : SortDirection,
    fields? : string,
    metadataProfiles? : number[]
}

export interface FilterArgs
{
    filter : KalturaMediaEntryFilter,
    advancedSearch : KalturaSearchOperator
}

export enum SortDirection {
    Desc,
    Asc
}

export interface QueryRequestArgs {
    filters: FilterItem[];
    addedFilters: FilterItem[];
    removedFilters: FilterItem[];
    data : QueryData;
}

export type FilterTypeConstructor<T extends FilterItem> = {new(...args : any[]) : T;};

@Injectable()
    export class EntriesStore implements OnDestroy{

    private static filterTypeMapping = {};

    public static registerFilterType<T extends FilterItem>(filterType : FilterTypeConstructor<T>, handler: (items : T[], request : FilterArgs) => void) : void
    {
        EntriesStore.filterTypeMapping[filterType.name] = handler;
    }

    private _entries: BehaviorSubject<Entries> = new BehaviorSubject({items: [], totalCount: 0});
    private _status : BehaviorSubject<UpdateStatus> = new BehaviorSubject<UpdateStatus>({ loading : false, errorMessage : null});
    private _querySource : ReplaySubject<QueryRequestArgs> = new ReplaySubject<QueryRequestArgs>(1,null);

    public queryData : QueryData = {
        pageIndex: 0,
        pageSize: 50,
        sortBy: 'createdAt',
        sortDirection: SortDirection.Desc,
        fields: 'id,name,thumbnailUrl,mediaType,plays,createdAt,duration,status,startDate,endDate,moderationStatus'
    };

    private _activeFilters : FilterItem[] = [];
    private _activeFiltersMap : {[key : string] : FilterItem[]} = {};
    private executeQuerySubscription : ISubscription = null;

    public entries$: Observable<Entries> = this._entries.asObservable();
    public status$: Observable<UpdateStatus> = this._status.asObservable();
    public query$ : Observable<QueryRequestArgs> = this._querySource.asObservable();



    constructor(private kalturaServerClient: KalturaClient,
                private browserService: BrowserService,) {
        console.warn("KMCng entriesStore:ctor() - missing handling of metadata profiles");

        const defaultPageSize = this.browserService.getFromLocalStorage("entries.list.pageSize");
        if (defaultPageSize !== null){
            this.queryData.pageSize = defaultPageSize;
        }

        this._executeQuery({addedFilters : [], removedFilters : []});
    }

    ngOnDestroy()
    {
        if (this.executeQuerySubscription) {
            this.executeQuerySubscription.unsubscribe();
            this.executeQuerySubscription = null;
        }

        this._activeFilters = null;
        this._activeFiltersMap = null;
        this._status.complete();
        this._querySource.complete();
        this._entries.complete();
    }

    public get entries() : KalturaMediaEntry[]
    {
        return this._entries.getValue().items;
    }

    public reload(query? : QueryData) : void
    {
        if (query)
        {
            Object.assign(this.queryData,query);
        }

        this._executeQuery();
    }


    public removeFiltersByType(filterType : FilterTypeConstructor<FilterItem>) : void {
        if (filterType && filterType.name) {
            const filtersOfType = this._activeFiltersMap[filterType.name];

            if (filtersOfType) {
                this.removeFilters(...filtersOfType);
            }
        }
    }

    public getFirstFilterByType<T extends FilterItem>(filterType : FilterTypeConstructor<T>) : T
    {
        const filters = <T[]>this.getFiltersByType(filterType);
        return filters && filters.length > 0 ? filters[0] : null;
    }

    public getFiltersByType<T extends FilterItem>(filterType : FilterTypeConstructor<T>) : T[] {
        if (filterType.name) {
            const filtersOfType = <T[]>this._activeFiltersMap[filterType.name];
            return filtersOfType ? [...filtersOfType] : [];
        } else {
            return [];
        }
    }

    public clearAllFilters()
    {
        const previousFilters = this._activeFilters;
        this._activeFilters = [];
        this._activeFiltersMap = {};
        this._executeQuery({ removedFilters : previousFilters, addedFilters : []});
    }


    public addFilters(...filters : FilterItem[]) : void{
        if (filters)
        {
            const addedFilters = [];

            filters.forEach(filter =>
            {
                const index = this._activeFilters.indexOf(filter);

                if (index === -1 )
                {
                    addedFilters.push(filter);
                    this._activeFiltersMap[filter.constructor.name] = this._activeFiltersMap[filter.constructor.name] || [];
                    this._activeFiltersMap[filter.constructor.name].push(filter);
                }
            });

            if (addedFilters.length > 0)
            {
                this._activeFilters = [...this._activeFilters, ...addedFilters];
                this.queryData.pageIndex = 1;
                this._executeQuery({  removedFilters : [], addedFilters : addedFilters });
            }
        }
    }

    public removeFilters(...filters : FilterItem[]) : void{
        if (filters)
        {
            const removedFilters : FilterItem[] = [];

            filters.forEach(filter =>
            {
               const index = this._activeFilters.indexOf(filter);

               if (index >= 0)
               {
                   removedFilters.push(filter);
                   this._activeFilters = R.remove(index,1, this._activeFilters);

                   const filterByType = this._activeFiltersMap[filter.constructor.name];
                   this._activeFiltersMap[filter.constructor.name] = R.remove(filterByType.indexOf(filter),1, filterByType);
               }
            });

            if (removedFilters.length > 0)
            {
                this.queryData.pageIndex = 1;
                this._executeQuery({ removedFilters : removedFilters, addedFilters : [] });
            }
        }
    }

    private _executeQuery({addedFilters,removedFilters} : {addedFilters: FilterItem[],removedFilters: FilterItem[]} = { addedFilters : [], removedFilters : []})
    {
        // cancel previous requests
        if (this.executeQuerySubscription)
        {
            this.executeQuerySubscription.unsubscribe();
            this.executeQuerySubscription = null;
        }

        this.browserService.setInLocalStorage("entries.list.pageSize", this.queryData.pageSize);

        // execute the request
        this.executeQuerySubscription = Observable.create(observer => {

            this._status.next({loading: true, errorMessage: null});
            const queryArgs : QueryRequestArgs = Object.assign({},
                {
                    filters : this._activeFilters,
                    addedFilters : addedFilters || [],
                    removedFilters : removedFilters || [],
                    data : this.queryData
                });

            this._querySource.next(queryArgs);

            let requestSubscription = this.buildQueryRequest(queryArgs).subscribe(observer);

            return () => {
                if (requestSubscription) {
                    requestSubscription.unsubscribe();
                    requestSubscription = null;
                }
            }
        }).subscribeOn(Scheduler.async).subscribe(
            response => {
                this.executeQuerySubscription = null;

                this._status.next({loading: false, errorMessage: null});

                this._entries.next({
                    items: <any[]>response.objects,
                    totalCount: <number>response.totalCount
                });
            },
            error => {
                this.executeQuerySubscription = null;
                this._status.next({loading: false, errorMessage: (<Error>error).message || <string>error});
            });

    }

    private buildQueryRequest({filters : activeFilters, data : queryData } : { filters : FilterItem[], data : QueryData}) : Observable<KalturaBaseEntryListResponse> {

        try {
            let filter: KalturaMediaEntryFilter = new KalturaMediaEntryFilter({});
            let responseProfile: KalturaDetachedResponseProfile = null;
            let pagination: KalturaFilterPager = null;

            const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
            advancedSearch.type = KalturaSearchOperatorType.searchAnd;

            const requestContext: FilterArgs = {
                filter: filter,
                advancedSearch: advancedSearch
            };

            // build request args by converting filters using registered handlers
            if (activeFilters && activeFilters.length > 0) {

                Object.keys(this._activeFiltersMap).forEach(key => {
                    const handler = EntriesStore.filterTypeMapping[key];
                    const items = this._activeFiltersMap[key];

                    if (handler && items && items.length > 0) {
                        handler(items, requestContext);
                    }
                });
            }

            // handle default args of metadata profiles (we must send all metadata profiles that should take part of the freetext searching
            if (queryData.metadataProfiles && queryData.metadataProfiles.length > 0) {
                const missingMetadataProfiles = [...queryData.metadataProfiles]; // create a new array (don't alter the original one)

                // find metadataprofiles that are not part of the request query
                (advancedSearch.items || []).forEach(metadataProfileItem => {
                    if (metadataProfileItem instanceof KalturaMetadataSearchItem) {
                        const indexOfMetadata = missingMetadataProfiles.indexOf((<KalturaMetadataSearchItem>metadataProfileItem).metadataProfileId);
                        if (indexOfMetadata >= 0) {
                            missingMetadataProfiles.splice(indexOfMetadata, 1);
                        }
                    }

                });

                // add default values to the missing metadata profiles
                missingMetadataProfiles.forEach((metadataProfileId: number) => {
                    const metadataItem: KalturaMetadataSearchItem = new KalturaMetadataSearchItem({
                        metadataProfileId : metadataProfileId,
                        type : KalturaSearchOperatorType.searchAnd,
                        items : []
                    });

                    advancedSearch.items.push(metadataItem);
                });
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
            if (queryData.sortBy) {
                filter.orderBy = `${queryData.sortDirection === SortDirection.Desc ? '-' : '+'}${queryData.sortBy}`;
            }

            // update desired fields of entries
            if (queryData.fields) {
                responseProfile = new KalturaDetachedResponseProfile({
                    type : KalturaResponseProfileType.includeFields,
                    fields : queryData.fields
                });

            }

            // update pagination args
            if (queryData.pageIndex || queryData.pageSize) {
                pagination = new KalturaFilterPager(
                    {
                        pageSize: queryData.pageSize,
                        pageIndex: queryData.pageIndex
                    }
                );
            }

            // build the request
            return <any>this.kalturaServerClient.request(
                new BaseEntryListAction({
                    filter: requestContext.filter,
                    pager: pagination,
                    responseProfile: responseProfile
                })
            )
        }catch(err)
        {
            return Observable.throw(err);
        }

    }
}
