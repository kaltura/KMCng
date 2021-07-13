import { Injectable, OnDestroy } from '@angular/core';
import { KalturaBaseEntry } from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { KalturaMetadataSearchItem } from 'kaltura-ngx-client';
import { KalturaNullableBoolean } from 'kaltura-ngx-client';
import { KalturaSearchOperatorType } from 'kaltura-ngx-client';
import { KalturaSearchOperator } from 'kaltura-ngx-client';
import { KalturaSearchCondition } from 'kaltura-ngx-client';
import { KalturaContentDistributionSearchItem } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';
import { KalturaMediaEntryFilter } from 'kaltura-ngx-client';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import { KalturaClient } from 'kaltura-ngx-client';
import { throwError } from 'rxjs';
import {
  EntriesDataProvider, EntriesFilters, MetadataProfileData,
  SortDirection
} from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { PlaylistExecuteFromFiltersAction } from 'kaltura-ngx-client';
import { KalturaMediaEntryFilterForPlaylist } from 'kaltura-ngx-client';
import { CategoriesModes } from 'app-shared/content-shared/categories/categories-mode-type';
import { subApplicationsConfig } from 'config/sub-applications';
import { MetadataProfileCreateModes, MetadataProfileStore, MetadataProfileTypes } from 'app-shared/kmc-shared';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { first } from 'rxjs/operators';
import { map, switchMap } from 'rxjs/operators';

@Injectable()
export class PlaylistEntriesDataProvider implements EntriesDataProvider, OnDestroy {
  constructor(private _kalturaServerClient: KalturaClient,
              private _appPermissions: KMCPermissionsService,
              private _metadataProfileService: MetadataProfileStore) {
  }

  ngOnDestroy() {

  }
  private saveFreetextSearchField = '';
  private _updateFilterWithJoinedList(list: any[],
                                      requestFilter: KalturaMediaEntryFilter,
                                      requestFilterProperty: keyof KalturaMediaEntryFilter): void {
    const value = (list || []).map(item => item).join(',');

    if (value) {
      requestFilter[requestFilterProperty.toString()] = value;
    }
  }

  private _getMetadataProfiles(): Observable<MetadataProfileData[]> {
    return this._metadataProfileService.get({
      type: MetadataProfileTypes.Entry,
      ignoredCreateMode: MetadataProfileCreateModes.App
    })
      .pipe(cancelOnDestroy(this))
      .pipe(first())
      .pipe(map(metadataProfiles => {
        return metadataProfiles.items.map(metadataProfile => ({
          id: metadataProfile.id,
          name: metadataProfile.name,
          lists: (metadataProfile.items || []).map(item => ({ id: item.id, name: item.name }))
        }));
      }));
  }

  public getServerFilter(data: EntriesFilters, mediaTypesDefault = true): Observable<KalturaMediaEntryFilterForPlaylist> {
    try {
      return this._getMetadataProfiles()
        .pipe(map(metadataProfiles => {
          // create request items
          const filter = new KalturaMediaEntryFilterForPlaylist({});

          const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
          advancedSearch.type = KalturaSearchOperatorType.searchAnd;

          if (data.videoQuiz || data.videoCaptions || data.videoNoCaptions) {
              // not supported by rulebased playlists, ignore it
          }

          // filter 'freeText'
            if (data.freetext) {
                if (data.freetextSearchField === '' || data.freetextSearchField === 'captions') {
                    if (this.saveFreetextSearchField.length) {
                        delete filter[this.saveFreetextSearchField];
                        this.saveFreetextSearchField = '';
                    }
                    filter.freeText = data.freetext;
                    if (data.freetextSearchField === '') {
                        if (data.includeCaptions) {
                            delete filter["excludedFreeTextGroups"];
                        } else {
                            filter.excludedFreeTextGroups = 'captions';
                        }
                    } else { // search only in captions
                        filter.excludedFreeTextGroups = 'entry,category_entry,cue_point,metadata';
                    }
                } else {
                    filter[data.freetextSearchField] = data.freetext;
                    this.saveFreetextSearchField = data.freetextSearchField;
                }
            } else {
                delete filter["excludedFreeTextGroups"];
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
          this._updateFilterWithJoinedList(data.durations, filter, 'durationTypeMatchOr');
          this._updateFilterWithJoinedList(data.replacementStatuses, filter, 'replacementStatusIn');
          this._updateFilterWithJoinedList(data.flavors, filter, 'flavorParamsIdsMatchOr');

          // filter 'distribution'
          if (data.distributions && data.distributions.length > 0) {
            const distributionItem = new KalturaSearchOperator({
              type: KalturaSearchOperatorType.searchOr
            });

            advancedSearch.items.push(distributionItem);

            data.distributions.forEach(item => {
              // very complex way to make sure the value is number (an also bypass both typescript and tslink checks)
              if (isFinite(+item) && parseInt(item) == <any>item) { // tslint:disable-line
                const newItem = new KalturaContentDistributionSearchItem(
                  {
                    distributionProfileId: +item,
                    hasEntryDistributionValidationErrors: false,
                    noDistributionProfiles: false
                  }
                );

                distributionItem.items.push(newItem);
              } else {
                // this._logger.warn(`cannot convert distribution value '${item}' into number. ignoring value`);
              }
            });
          }

          // filter 'originalClippedEntries'
          if (data.originalClippedEntries && data.originalClippedEntries.length > 0) {
            let originalClippedEntriesValue: KalturaNullableBoolean = null;

            data.originalClippedEntries.forEach(item => {
              switch (item) {
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

          // filters of custom metadata lists
          if (metadataProfiles && metadataProfiles.length > 0) {

            metadataProfiles.forEach(metadataProfile => {
              // create advanced item for all metadata profiles regardless if the user filtered by them or not.
              // this is needed so freetext will include all metadata profiles while searching.
              const metadataItem: KalturaMetadataSearchItem = new KalturaMetadataSearchItem({
                metadataProfileId: metadataProfile.id,
                type: KalturaSearchOperatorType.searchAnd,
                items: []
              });
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
                      value: filterItem
                    });

                    innerMetadataItem.items.push(searchItem);
                  });
                }
              });
            });
          }

          if (data.categories && data.categories.length) {
            const categoriesValue = data.categories.map(item => item).join(',');
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
          if (!filter.mediaTypeIn && mediaTypesDefault) {
            filter.mediaTypeIn = '1,2,5,6';
            if (this._appPermissions.hasPermission(KMCPermissions.FEATURE_LIVE_STREAM)) {
              filter.mediaTypeIn += ',201';
            }
          }

          // update the sort by args
          if (data.sortBy) {
            filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
          }

          if (data.youtubeVideo) {
              // not supported by rulebased playlists, ignore it
          }

          filter.limit = data.limits && data.limits > 0 && data.limits <= subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults
            ? data.limits
            : subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults;

          // readonly filters for rule-based playlist
          filter.statusIn = '1,2';
          filter.typeIn = '1,7';
          filter.moderationStatusIn = '1,2,5,6';

          return filter;
        }));
    } catch (err) {
      return throwError(err);
    }
  }


  public executeQuery(data: EntriesFilters): Observable<{ entries: KalturaBaseEntry[], totalCount?: number }> {
    let pagination: KalturaFilterPager = null;
    // update desired fields of entries
    const responseProfile = new KalturaDetachedResponseProfile({
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,name,thumbnailUrl,mediaType,plays,createdAt,duration,status,startDate,endDate,moderationStatus,tags,categoriesIds,downloadUrl,sourceType,externalSourceType,capabilities'
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
    return <any>
      this.getServerFilter(data)
        .pipe(switchMap(filter => this._kalturaServerClient.request(
          new PlaylistExecuteFromFiltersAction({
            filters: [filter],
            totalResults: subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults,
            pager: pagination
          }).setRequestOptions({
              responseProfile
          }))
        )).pipe(map(response => ({ entries: response, totalCount: response.length }))
      );
  }

  public getDefaultFilterValues(savedAutoSelectChildren: CategoriesModes, pageSize: number): EntriesFilters {
    const categoriesMode = typeof savedAutoSelectChildren === 'number'
      ? savedAutoSelectChildren
      : CategoriesModes.SelfAndChildren;

    return {
      freetext: '',
      freetextSearchField: '',
      includeCaptions: true,
      pageSize: pageSize,
      pageIndex: 0,
      sortBy: 'plays',
      sortDirection: SortDirection.Desc,
      createdAt: { fromDate: null, toDate: null },
      lastPlayedAt: null,
      scheduledAt: { fromDate: null, toDate: null },
      mediaTypes: [],
      timeScheduling: [],
      ingestionStatuses: [],
      durations: [],
      originalClippedEntries: [],
      moderationStatuses: [],
      replacementStatuses: [],
      accessControlProfiles: [],
      flavors: [],
      distributions: [], categories: [],
      categoriesMode,
      customMetadata: {},
      limits: subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults,
      youtubeVideo: false,
      videoQuiz: false,
      videoCaptions: false,
      videoNoCaptions: false
    };
  }
}
