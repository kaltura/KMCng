import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/forkJoin';

import { KalturaClient } from '@kaltura-ng/kaltura-client';
import {  KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-typescript-client';
import { DistributionProfileListAction, AccessControlListAction } from 'kaltura-typescript-client/types/all';
import { MetadataProfileStore, MetadataProfileTypes, MetadataProfileCreateModes, MetadataProfile, MetadataItemTypes, FlavoursStore } from '@kaltura-ng2/kaltura-common';

import {
    KalturaAccessControlFilter,
    KalturaAccessControlProfile,
    KalturaDetachedResponseProfile,
    KalturaDistributionProfile,
    KalturaFilterPager,
    KalturaFlavorParams,
    KalturaResponseProfileType
} from 'kaltura-typescript-client/types/all'

import { ConstantsFilters } from './constant-filters';

import * as R from 'ramda';

export type UpdateStatus = {
    loading : boolean;
    errorMessage : string;
};

export class RefineFilter
{
    public items :{id : string, name : string}[] = [];
    public metadataProfileId : number;
    public fieldPath : string[] = [];

    constructor(public name : string, public label : string )
    {

    }
}


export interface RefineFilterGroup
{
    label : string;
    filters : RefineFilter[];
    isMetadataGroup : boolean;
}


export enum AdditionalFilterLoadingStatus
{
    Loading,
    Loaded,
    FailedToLoad
}

@Injectable()
export class EntriesAdditionalFiltersStore {

    // TODO [KMC] - clear cached data on logout
    private _filters = new ReplaySubject<{groups : RefineFilterGroup[]}>(1);
    private _status: BehaviorSubject<UpdateStatus> = new BehaviorSubject<UpdateStatus>({
        loading: false,
        errorMessage: null
    });
    private executeQuerySubscription: ISubscription = null;

    public filters$ = this._filters.asObservable();
    public status$ = this._status.asObservable();


    constructor(private kalturaServerClient: KalturaClient,
    private _metadataProfileStore : MetadataProfileStore, private _flavoursStore: FlavoursStore) {
        this.load();
    }

    public load() {
        // cancel previous requests
        if (this.executeQuerySubscription) {
            this.executeQuerySubscription.unsubscribe();
            this.executeQuerySubscription = null;
        }

        // execute the request
        const getMetadata$ = this._metadataProfileStore.get({ type : MetadataProfileTypes.Entry, ignoredCreateMode : MetadataProfileCreateModes.App});
        const otherData$ = this.buildQueryRequest();
	    const getFlavours$ = this._flavoursStore.get();
        this.executeQuerySubscription = Observable.forkJoin(getMetadata$,otherData$,getFlavours$)
            .subscribe(
                (responses) => {
                this.executeQuerySubscription = null;
                    if (responses[1].hasErrors()) {
                        this._filters.next({ groups : []});
                        this._status.next({loading: false, errorMessage: 'failed to load refine filters'});

                    } else {
                        const metadataData = this._buildMetadataFiltersGroups(responses[0].items);
                        const defaultFilterGroup = this._buildDefaultFiltersGroup(responses[1], responses[2].items);

                        this._filters.next({groups: [defaultFilterGroup, ...metadataData.groups]});
                        this._status.next({loading: false, errorMessage: null});
                    }
            },
            (error) => {
                this.executeQuerySubscription = null;

                this._filters.next({ groups : []});
                this._status.next({loading: false, errorMessage: (<Error>error).message || <string>error});
            }
        );
    }

    private _buildMetadataFiltersGroups(metadataProfiles : MetadataProfile[]) : { metadataProfiles : number[] , groups : RefineFilterGroup[]} {

        const result: { metadataProfiles: number[] , groups: RefineFilterGroup[]} = {metadataProfiles: [], groups: []};

        metadataProfiles.forEach(metadataProfile => {
            result.metadataProfiles.push(metadataProfile.id);

            // get only fields that are list, searchable and has values
            const profileLists = R.filter(field => {
                return (field.type === MetadataItemTypes.List && field.isSearchable && field.optionalValues.length > 0);
            }, metadataProfile.items);

            // if found relevant lists, create a group for that profile
            if (profileLists && profileLists.length > 0) {
                const filterGroup = { label: metadataProfile.name, filters: [],isMetadataGroup : true };
                result.groups.push(filterGroup);

                profileLists.forEach(list => {
                    const refineFilter = new RefineFilter(list.id, list.label);
                    refineFilter.metadataProfileId = metadataProfile.id;
                    refineFilter.fieldPath = ['metadata',list.name];
                    filterGroup.filters.push(refineFilter);

                    list.optionalValues.forEach(item => {
                        refineFilter.items.push({
                            id: item.value,
                            name: item.text
                        })

                    });
                });
            }
        });

        return result;
    }

    private _buildDefaultFiltersGroup(responses : KalturaMultiResponse, flavours: KalturaFlavorParams[]) : RefineFilterGroup{
        const result : RefineFilterGroup = {label : '', filters : [], isMetadataGroup : false};

        // build constant filters
        ConstantsFilters.forEach((constantFilter) =>
        {
            const newRefineFilter = new RefineFilter(constantFilter.id,constantFilter.name);
            result.filters.push(newRefineFilter);
            constantFilter.items.forEach((item: any) => {
                newRefineFilter.items.push({id : item.id, name : item.name});
            });
        });

        // build access control profile filters
        if (responses[1].result.objects.length > 0) {
            const newRefineFilter = new RefineFilter('accessControlProfiles','Access Control Profiles');
            result.filters.push(newRefineFilter);
            responses[1].result.objects.forEach((accessControlProfile: KalturaAccessControlProfile) => {
                newRefineFilter.items.push({
                    id: accessControlProfile.id + '',
                    name: accessControlProfile.name
                });
            });
        }

	    //build flavors filters
	    if (flavours.length > 0) {
            const newRefineFilter = new RefineFilter('flavors',"Flavors");
		    result.filters.push(newRefineFilter);
		    flavours.forEach((flavor: KalturaFlavorParams) => {
                newRefineFilter.items.push({id: flavor.id+'', name: flavor.name});
		    });
	    }

	    // build distributions filters
	    if (responses[0].result.objects.length > 0) {
            const newRefineFilter = new RefineFilter('distributions',"Destinations")
		    result.filters.push(newRefineFilter);
		    responses[0].result.objects.forEach((distributionProfile: KalturaDistributionProfile) => {
                newRefineFilter.items.push({id : distributionProfile.id+'', name : distributionProfile.name});
		    });
	    }

	    return result;
    }

    private buildQueryRequest(): Observable<KalturaMultiResponse> {

        try {
            const accessControlFilter = new KalturaAccessControlFilter({});
            accessControlFilter.orderBy = '-createdAt';

            const distributionProfilePager = new KalturaFilterPager({});
            distributionProfilePager.pageSize = 500;

            const accessControlPager = new KalturaFilterPager({});
            distributionProfilePager.pageSize = 1000;

            const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
                fields : "id,name",
                type : KalturaResponseProfileType.includeFields
            });

            const request = new KalturaMultiRequest(
                new DistributionProfileListAction({pager: distributionProfilePager}),
                new AccessControlListAction({
                    pager: accessControlPager,
                    filter: accessControlFilter,
                    responseProfile
                }),
            );

            return <any>this.kalturaServerClient.multiRequest(request);
        } catch (error) {
            return Observable.throw(error);
        }
    }
}
