import { Injectable, OnDestroy } from '@angular/core';
import { PartnerProfileStore } from '../partner-profile';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaMetadataObjectType } from 'kaltura-ngx-client';
import { MetadataProfileListAction } from 'kaltura-ngx-client';
import { MetadataProfile } from './metadata-profile';
import { MetadataProfileParser } from './kaltura-metadata-parser';
import { KalturaMetadataProfileCreateMode } from 'kaltura-ngx-client';
import { KalturaMetadataProfileFilter } from 'kaltura-ngx-client';
import { KalturaMetadataProfileListResponse } from 'kaltura-ngx-client';
import { AppEventsService } from 'app-shared/kmc-shared/app-events';
import { MetadataProfileUpdatedEvent } from 'app-shared/kmc-shared/events/metadata-profile-updated.event';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { of } from 'rxjs';

export enum MetadataProfileCreateModes {
    Api,
    App,
    Kmc
}

export enum MetadataProfileTypes {
    Entry = 1,
    Category
}

export interface GetFilters
{
    type : MetadataProfileTypes;
    ignoredCreateMode : MetadataProfileCreateModes
}

@Injectable()
export class MetadataProfileStore extends PartnerProfileStore implements OnDestroy
{
    private _cachedProfiles : { [key : string] : MetadataProfile[]} = {};

    constructor(private _kalturaServerClient: KalturaClient,
                private _permissionsService: KMCPermissionsService,
                _appEvents: AppEventsService) {
        super();

        _appEvents.event(MetadataProfileUpdatedEvent)
          .pipe(cancelOnDestroy(this))
          .subscribe(() => {
            this._clearMetadataProfilesCache();
          })
    }

    ngOnDestroy() {

    }

    private _clearMetadataProfilesCache(): void {
      this._cachedProfiles = {};
    }

    public get(filters : GetFilters) : Observable<{items : MetadataProfile[]}>
    {
        if (!this._permissionsService.hasPermission(KMCPermissions.METADATA_PLUGIN_PERMISSION)) {
            return of({ items: [] });
        }

        return Observable.create(observer =>
        {
	        let sub: ISubscription;
            const cacheKey = this._createCacheKey(filters);
            const cachedResults = this._cachedProfiles[cacheKey];
            if (cachedResults)
            {
                observer.next({items : cachedResults});
                observer.complete();
            }else {
                    sub = this._buildGetRequest(filters).subscribe(
                    response =>
                    {
                    	sub = null;
                        const parser = new MetadataProfileParser();
                        let parsedProfiles = [];
                        let parseFirstError: Error = null;

                        response.objects.forEach(kalturaProfile =>
                        {
                            const parsedProfile = parser.parse(<any>kalturaProfile);
                            if (parsedProfile.error)
                            {
                                parseFirstError = parsedProfile.error;
                            }
                            else if (parsedProfile.profile)
                            {
                                parsedProfiles.push(parsedProfile.profile);
                            }
                        });

                        if (parseFirstError) {
                            observer.error(parseFirstError);
                        } else {
                            parsedProfiles = this._enhanceMetadataProfileItemsGuid(parsedProfiles);
                            this._cachedProfiles[cacheKey] = parsedProfiles;
                            observer.next({items: parsedProfiles});
                            observer.complete();
                        }
                    },
                    error =>
                    {
                    	sub = null;
                        observer.error(error);
                    }
                );
            }
            return () =>{
            	if (sub) {
		            sub.unsubscribe();
	            }
            }
        });

    }

    // metadata items GUID might not be unique
    // use profile id to enhance profile item guid
    private _enhanceMetadataProfileItemsGuid(metadataProfiles: MetadataProfile[]): MetadataProfile[] {
        if (Array.isArray(metadataProfiles)) {
            return metadataProfiles.map(item =>
                Array.isArray(item.items)
                    ? { ...item, items: item.items.map(subItem => ({ ...subItem, id: `${item.id}_${subItem.id}` })) }
                    : item
            );
        }

        return metadataProfiles;
    }

    private _createCacheKey(filters : GetFilters)
    {
        if (filters) {
            return `_${filters.type ? filters.type : ''}_${filters.ignoredCreateMode ? filters.ignoredCreateMode : ''}_` ;
        } else {
            return 'all';
        }
    }

    private _getAPICreateMode(createMode : MetadataProfileCreateModes) : KalturaMetadataProfileCreateMode
    {
        let result : KalturaMetadataProfileCreateMode;

        switch (createMode)
        {
            case MetadataProfileCreateModes.Api:
                result = KalturaMetadataProfileCreateMode.api;
                break;
            case MetadataProfileCreateModes.App:
                result = KalturaMetadataProfileCreateMode.app;
                break;
            case MetadataProfileCreateModes.Kmc:
                result = KalturaMetadataProfileCreateMode.kmc;
                break;
            default:
        }

        return result;
    }

     private _buildGetRequest(filters: GetFilters): Observable<KalturaMetadataProfileListResponse> {
        const metadataProfilesFilter = new KalturaMetadataProfileFilter();
        metadataProfilesFilter.createModeNotEqual = this._getAPICreateMode(filters.ignoredCreateMode);
        metadataProfilesFilter.orderBy = '-createdAt';

        if (filters && filters.type && typeof filters.type !== 'undefined') {

            const filterType = filters.type;

            switch (filterType) {
                case MetadataProfileTypes.Entry:
                    metadataProfilesFilter.metadataObjectTypeEqual = KalturaMetadataObjectType.entry;
                    break;
                case MetadataProfileTypes.Category:
                    metadataProfilesFilter.metadataObjectTypeEqual = KalturaMetadataObjectType.category;
                    break;

            }
        }

        return <any>this._kalturaServerClient.request(new MetadataProfileListAction({
            filter: metadataProfilesFilter
        }));
    }
}
