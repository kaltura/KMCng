import { Injectable, OnDestroy } from '@angular/core';
import { EntriesDataProvider, EntriesFilters, MetadataProfileData, SortDirection } from './entries-store.service';
import {
    BaseEntryListAction,
    KalturaBaseEntry,
    KalturaClient,
    KalturaContentDistributionSearchItem,
    KalturaDetachedResponseProfile,
    KalturaExternalMediaEntry,
    KalturaFilterPager,
    KalturaLiveStreamAdminEntry,
    KalturaLiveStreamEntry,
    KalturaMediaEntryFilter,
    KalturaMetadataSearchItem,
    KalturaNullableBoolean,
    KalturaQuizAdvancedFilter,
    KalturaResponseProfileType,
    KalturaSearchCondition,
    KalturaSearchOperator,
    KalturaSearchOperatorType,
    KalturaExternalMediaSourceType,
    KalturaExternalMediaEntryFilter,
    KalturaEntryCaptionAdvancedFilter,
    KalturaLiveChannel
} from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { cancelOnDestroy, KalturaUtils } from '@kaltura-ng/kaltura-common';
import { CategoriesModes } from 'app-shared/content-shared/categories/categories-mode-type';
import { MetadataProfileCreateModes, MetadataProfileStore, MetadataProfileTypes } from 'app-shared/kmc-shared';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { first } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable()
export class EntriesStoreDataProvider implements EntriesDataProvider, OnDestroy {
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

  public getServerFilter(data: EntriesFilters): Observable<KalturaMediaEntryFilter> {
    try {
      return this._getMetadataProfiles()
        .pipe(map(metadataProfiles => {
          // create request items
            const filter = data.youtubeVideo
                ? new KalturaExternalMediaEntryFilter({ externalSourceTypeEqual: KalturaExternalMediaSourceType.youtube })
                : new KalturaMediaEntryFilter({});

          const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
          advancedSearch.type = KalturaSearchOperatorType.searchAnd;

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

          // filter 'lastPlayedAt'
          if (data.lastPlayedAt) {
              filter.lastPlayedAtLessThanOrEqual = KalturaUtils.getEndDateValue(new Date(data.lastPlayedAt * 1000));
          }

          // filters of joined list
          this._updateFilterWithJoinedList(data.mediaTypes, filter, 'mediaTypeIn');
          this._updateFilterWithJoinedList(data.ingestionStatuses, filter, 'statusIn');
          this._updateFilterWithJoinedList(data.durations, filter, 'durationTypeMatchOr');
          this._updateFilterWithJoinedList(data.moderationStatuses, filter, 'moderationStatusIn');
          this._updateFilterWithJoinedList(data.replacementStatuses, filter, 'replacementStatusIn');
          this._updateFilterWithJoinedList(data.accessControlProfiles, filter, 'accessControlIdIn');
          this._updateFilterWithJoinedList(data.flavors, filter, 'flavorParamsIdsMatchOr');

          // filter video quiz
            if (data.videoQuiz) {
                advancedSearch.items.push(new KalturaSearchOperator({
                    type: KalturaSearchOperatorType.searchOr,
                    items: [new KalturaQuizAdvancedFilter({ isQuiz: KalturaNullableBoolean.trueValue })]
                }));
            }

          // filter video captions
            if (data.videoCaptions) {
                advancedSearch.items.push(new KalturaSearchOperator({
                    type: KalturaSearchOperatorType.searchOr,
                    items: [new KalturaEntryCaptionAdvancedFilter({ hasCaption: KalturaNullableBoolean.trueValue })]
                }));
            }

          // filter video without captions
            if (data.videoNoCaptions) {
                advancedSearch.items.push(new KalturaSearchOperator({
                    type: KalturaSearchOperatorType.searchOr,
                    items: [new KalturaEntryCaptionAdvancedFilter({ hasCaption: KalturaNullableBoolean.falseValue })]
                }));
            }

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

                distributionItem.items.push(newItem)
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

          // filter 'timeScheduling'
          if (data.timeScheduling && data.timeScheduling.length > 0) {
            data.timeScheduling.forEach(item => {
              switch (item) {
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
          if (metadataProfiles && metadataProfiles.length > 0) {

            metadataProfiles.forEach(metadataProfile => {
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
          if (!filter.mediaTypeIn) {
	          filter.mediaTypeIn = '1,2,5,6';
	          if (this._appPermissions.hasPermission(KMCPermissions.FEATURE_LIVE_STREAM)) {
		          filter.mediaTypeIn += ',201';
	          }
          }

          // handle default value for statuses
          if (!filter.statusIn) {
            filter.statusIn = '-1,-2,0,1,2,7,4';
          }


          // update the sort by args
          if (data.sortBy) {
            filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
          }

          return filter;
        }));
    } catch (err) {
      return throwError(err);
    }
  }

  public executeQuery(data: EntriesFilters): Observable<{ entries: KalturaBaseEntry[], totalCount?: number }> {
    const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,name,thumbnailUrl,mediaType,plays,createdAt,duration,status,startDate,endDate,moderationStatus,moderationCount,tags,adminTags,categoriesIds,downloadUrl,sourceType,entitledUsersPublish,entitledUsersView,entitledUsersEdit,externalSourceType,capabilities'
    });
    let pagination: KalturaFilterPager = null;

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
          new BaseEntryListAction({
            filter,
            pager: pagination,
          }).setRequestOptions({
                  responseProfile,
                  acceptedTypes: [KalturaLiveStreamAdminEntry, KalturaLiveStreamEntry, KalturaExternalMediaEntry, KalturaLiveChannel]
              })
        ))).pipe(map(response => ({ entries: response.objects, totalCount: response.totalCount }))
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
      sortBy: 'createdAt',
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
      limits: 200,
      youtubeVideo: false,
      videoQuiz: false,
      videoCaptions: false,
      videoNoCaptions: false,
    };
  }
}
