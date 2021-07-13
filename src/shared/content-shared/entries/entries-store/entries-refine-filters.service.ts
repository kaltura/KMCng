import { Injectable } from '@angular/core';
import { Observable, forkJoin, throwError } from 'rxjs';
import { publishReplay, refCount, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';
import { DistributionProfileListAction } from 'kaltura-ngx-client';
import { AccessControlListAction } from 'kaltura-ngx-client';
import {
    FlavoursStore,
    MetadataItemTypes,
    MetadataProfile,
    MetadataProfileCreateModes,
    MetadataProfileStore,
    MetadataProfileTypes
} from 'app-shared/kmc-shared';

import { KalturaAccessControlFilter } from 'kaltura-ngx-client';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaFlavorParams } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';

import { DefaultFiltersList } from './default-filters-list';

import * as R from 'ramda';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { KalturaAccessControlListResponse } from 'kaltura-ngx-client';
import { KalturaDistributionProfileListResponse } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

export interface RefineGroupListItem {
    value: string;
    label: string;
    disabled?: boolean;
}

export class RefineGroupList {
    public items: RefineGroupListItem[] = [];

    constructor(public name: string,
                public label: string,
                public group?: string,
                public value?: any
    ) {
    }
}

export interface RefineGroup {
    label: string;
    lists: RefineGroupList[];
}

@Injectable()
export class EntriesRefineFiltersService {

    private _getRefineFilters$: Observable<RefineGroup[]>;

    constructor(private kalturaServerClient: KalturaClient,
                private _permissionsService: KMCPermissionsService,
                private _metadataProfileStore: MetadataProfileStore,
                private _flavoursStore: FlavoursStore,
                private _logger: KalturaLogger) {
        this._logger = _logger.subLogger('EntriesRefineFiltersService');
    }

    public getFilters(): Observable<RefineGroup[]> {
        this._logger.debug(`handle get entries refine filters request`);
        if (!this._getRefineFilters$) {
            // execute the request
            const metadataFilters$ = this._getMetadataFilters();
            const serverFilters$ = this._buildQueryRequest();
            const flavorsFilter$ = this._flavoursStore.get();
            this._getRefineFilters$ = forkJoin(metadataFilters$, serverFilters$, flavorsFilter$)
                .pipe(map(
                    ([metadataResponse, serverResponse, flavorsResponse]) => {
                        if (serverResponse.hasErrors()) {
                            throw new Error('failed to load refine filters');
                        } else {
                            this._logger.debug(`handle successful get entries refine filters request, mapping response`);
                            const defaultFilterGroup = this._buildDefaultFiltersGroup(serverResponse, flavorsResponse.items);
                            const result = [defaultFilterGroup];

                            if (metadataResponse) {
                                const metadataData = this._buildMetadataFiltersGroups(metadataResponse.items);
                                result.push(...metadataData.groups);
                            }

                            return result;
                        }
                    }))
                .pipe(catchError(err => {
                    this._logger.warn(`failed to create refine filters`, { errorMessage: err.message });
                    this._getRefineFilters$ = null;
                    return throwError(err);
                }))
                .pipe(publishReplay(1))
                .pipe(refCount());
        }

        return this._getRefineFilters$;
    }

    private _getMetadataFilters(): Observable<{ items: MetadataProfile[] }> {
        if (this._permissionsService.hasPermission(KMCPermissions.METADATA_PLUGIN_PERMISSION)) {
            return this._metadataProfileStore.get({
                type: MetadataProfileTypes.Entry,
                ignoredCreateMode: MetadataProfileCreateModes.App
            });
        }

        return of(null);
    }

    private _buildMetadataFiltersGroups(metadataProfiles: MetadataProfile[]): { metadataProfiles: number[], groups: RefineGroup[] } {
        const result: { metadataProfiles: number[], groups: RefineGroup[] } = { metadataProfiles: [], groups: [] };

        metadataProfiles.forEach(metadataProfile => {
            result.metadataProfiles.push(metadataProfile.id);

            // get only fields that are list, searchable and has values
            const profileLists = R.filter(field => {
                return (field.type === MetadataItemTypes.List && field.isSearchable && field.optionalValues.length > 0);
            }, metadataProfile.items);

            // if found relevant lists, create a group for that profile
            if (profileLists && profileLists.length > 0) {
                const filterGroup = { label: metadataProfile.name, lists: [] };
                result.groups.push(filterGroup);


                profileLists.forEach(list => {
                    const group = new RefineGroupList(
                        list.id,
                        list.label,
                        'customMetadata');

                    filterGroup.lists.push(group);

                    list.optionalValues.forEach(item => {
                      group.items.push({
                        value: item.value,
                        label: item.text
                      })

                    });
                });
            }
        });

        return result;
    }

    private _buildDefaultFiltersGroup(responses: KalturaMultiResponse, flavours: KalturaFlavorParams[]): RefineGroup {
        const result: RefineGroup = { label: '', lists: [] };

        // build constant filters
        DefaultFiltersList.forEach((defaultFilterList) => {
            const newRefineFilter = new RefineGroupList(
                defaultFilterList.name,
                defaultFilterList.label,
                null,
                defaultFilterList.value
            );
            result.lists.push(newRefineFilter);
            defaultFilterList.items.forEach((item: any) => {
              if (item.value !== '201' || this._permissionsService.hasPermission(KMCPermissions.FEATURE_LIVE_STREAM)) {
                newRefineFilter.items.push({ value: item.value, label: item.label });
              }
            });

        });

        // build flavors filters
        if (flavours.length > 0) {
          const group = new RefineGroupList(
            'flavors',
            'Flavors');
          result.lists.push(group);
          flavours.forEach((flavor: KalturaFlavorParams) => {
            group.items.push({ value: flavor.id + '', label: flavor.name });
          });
        }

        responses.forEach(response => {
          if (!response.result.objects.length) {
            return;
          }

          if (response.result instanceof KalturaAccessControlListResponse) { // build access control profile filters
            const group = new RefineGroupList(
              'accessControlProfiles',
              'Access Control Profiles'
            );
            result.lists.push(group);
            response.result.objects.forEach((accessControlProfile) => {
              group.items.push({
                value: accessControlProfile.id + '',
                label: accessControlProfile.name
              });
            });
          } else if (response.result instanceof KalturaDistributionProfileListResponse) { // build distributions filters
            const group = new RefineGroupList(
              'distributions',
              'Destinations');
            result.lists.push(group);
            response.result.objects.forEach((distributionProfile) => {
              group.items.push({ value: distributionProfile.id + '', label: distributionProfile.name });
            });
          }
        });

        return result;
    }


    private _buildQueryRequest(): Observable<KalturaMultiResponse> {

        try {
            const accessControlFilter = new KalturaAccessControlFilter({});
            accessControlFilter.orderBy = '-createdAt';

            const accessControlPager = new KalturaFilterPager({});
            accessControlPager.pageSize = 1000;

            const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
                fields: 'id,name',
                type: KalturaResponseProfileType.includeFields
            });

            const request = new KalturaMultiRequest(
                new AccessControlListAction({
                    pager: accessControlPager,
                    filter: accessControlFilter
                }).setRequestOptions({
                    responseProfile
                }),
            );

            if (this._permissionsService.hasPermission(KMCPermissions.CONTENTDISTRIBUTION_PLUGIN_PERMISSION)) {
              const distributionProfilePager = new KalturaFilterPager({});
              distributionProfilePager.pageSize = 500;
              const distributionProfileListAction = new DistributionProfileListAction({ pager: distributionProfilePager });

              request.requests.push(distributionProfileListAction);
            }

            return <any>this.kalturaServerClient.multiRequest(request);
        } catch (error) {
            return throwError(error);
        }
    }
}
