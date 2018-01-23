import { Injectable, OnDestroy } from '@angular/core';
import { PlaylistRule } from 'app-shared/content-shared/playlist-rule.interface';
import { Observable } from 'rxjs/Observable';
import { EntriesFilters, EntriesStore, SortDirection } from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { CategoriesModes } from 'app-shared/content-shared/categories/categories-mode-type';
import { environment } from 'app-environment';
import { KalturaMediaEntryFilterForPlaylist } from 'kaltura-ngx-client/api/types/KalturaMediaEntryFilterForPlaylist';
import { KalturaPlayableEntryOrderBy } from 'kaltura-ngx-client/api/types/KalturaPlayableEntryOrderBy';
import { KalturaSearchOperator } from 'kaltura-ngx-client/api/types/KalturaSearchOperator';
import { KalturaSearchOperatorType } from 'kaltura-ngx-client/api/types/KalturaSearchOperatorType';
import { GroupedListType } from '@kaltura-ng/mc-shared/filters';
import { KalturaMetadataSearchItem } from 'kaltura-ngx-client/api/types/KalturaMetadataSearchItem';
import { KalturaSearchCondition } from 'kaltura-ngx-client/api/types/KalturaSearchCondition';
import { MetadataProfileCreateModes, MetadataProfileStore, MetadataProfileTypes } from 'app-shared/kmc-shared';
import { MetadataProfile } from 'app-shared/kmc-shared/custom-metadata/metadata-profile';
import * as Immutable from 'seamless-immutable';
import { KalturaEntryType } from 'kaltura-ngx-client/api/types/KalturaEntryType';

@Injectable()
export class PlaylistRuleParserService implements OnDestroy {
  constructor(private _metadataProfileService: MetadataProfileStore,
              public _entriesStore: EntriesStore) {
  }

  ngOnDestroy() {

  }

  // TODO [kmcng] get rid of duplicated requests for metadataProfiles
  // in current implementation there're 2 requests for metadataProfiles to the server
  private _getMetadataProfiles(): Observable<{ items: MetadataProfile[] }> {
    return this._metadataProfileService
      .get({
        type: MetadataProfileTypes.Entry,
        ignoredCreateMode: MetadataProfileCreateModes.App
      })
      .cancelOnDestroy(this)
      .first()
      .monitor('playlist-rule-parser: get metadata profiles');
  }

  /*
  * Steps:
  * 1) Get rid of items nesting:
  *    [{items: [{items: [{items: [searchCondition]}, ...] }] }] => [[[searchCondition], ...]]
  *    And assign metadataProfileId for each search condition
  *
  * 2) Flatten array from step 1:
  *    [[[searchCondition], ...]] => [searchCondition, searchCondition, searchCondition]
  *
  * 3) Parse search condition's field to get localName then find parentMetadataId for this condition and create GroupedListItem.
  *    Item also contains parentId to create valid customMetadata structure on step 5.
  *    parentId === metadataProfileId.id from MetadataProfile[] array
  *    if there's no matching items from metadataProfiles array or can't get localName return null for current item
  *    [searchCondition, searchCondition, searchCondition] x MetadataProfile[] => [{value, label, parentId, tooltip}, null, ...]
  *
  * 4) Exclude null values from array created on step 3
  *    [{value, label, parentId, tooltip}, null, ...] => [{value, label, parentId, tooltip}, ...]
  *
  * 5) Create customMetadata: GroupedListType
  *    [{value, label, parentId, tooltip}, ...] => {parentId: [value, label, tooltip}], ...}
  */
  private _mapCustomMetadata(advancedSearch: KalturaSearchOperator): Observable<GroupedListType<string>> {
    // Step 1 handler
    const assignMetadataProfileId = (obj, metadataProfileId = null) => {
      if (obj && obj.items) {
        return obj.items.map(subItem => assignMetadataProfileId(subItem, obj.metadataProfileId))
      }
      return Object.assign(obj, { metadataProfileId });
    };

    // Step 2 handler
    const deepFlatten = (arr) => [].concat(...arr.map(x => Array.isArray(x) ? deepFlatten(x) : x));

    // Step 3 handler
    const createGroupedListItem = (metadata, item) => {
      const localNameMatch = item.field.match(/\/\*\[local-name\(\)='([\w]*)'\]$/);
      const relevantMetadata = metadata.items.find(({ id }) => id === item.metadataProfileId);
      if (relevantMetadata && localNameMatch && localNameMatch[1]) {
          const localName = localNameMatch[1];
          const relevantMetadataItem = relevantMetadata.items.find(({name}) => name === localName);
          if (relevantMetadataItem) {
              return {
                  value: item.value,
                  listName: relevantMetadataItem.id
              }
          }
      }

      return null;
    };

    // Step 5 handler
    const createGroupedList = (acc, item) => {
      const itemList = acc[item.listName];
      if (!itemList) {
        acc[item.listName] = [item.value];
      } else {
          itemList.push(item.value);
      }

      return acc;
    };

    return this._getMetadataProfiles()
      .map(metadata => {
        const relevantItems = advancedSearch.items.filter((searchItem: KalturaMetadataSearchItem) => !!searchItem.items.length);
        const assignedItems = relevantItems.map(item => assignMetadataProfileId(item)); // Step 1
        return deepFlatten(assignedItems) // Step 2
          .map(item => createGroupedListItem(metadata, item)) // Step 3
          .filter(Boolean) // Step 4
          .reduce(createGroupedList, {}); // Step 5
      });
  }

  private _mapAdvancedSearch(customMetadata: GroupedListType<string>): Observable<KalturaSearchOperator> {
    if (!customMetadata) {
      return Observable.of(null);
    }

    return this._getMetadataProfiles()
      .map(metadataProfiles => {
        return metadataProfiles.items.map(metadataProfile => ({
          id: metadataProfile.id,
          name: metadataProfile.name,
          lists: (metadataProfile.items || []).map(item => ({ id: item.id, name: item.name }))
        }));
      })
      .map(metadataProfiles => {
        const advancedSearch = new KalturaSearchOperator({});
        advancedSearch.type = KalturaSearchOperatorType.searchAnd;

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
              const metadataProfileFilters = customMetadata[list.id];
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

        return advancedSearch;
      });
  }

  public toEntriesFilters(rule: PlaylistRule): Observable<Partial<EntriesFilters>> {
    const { originalFilter } = rule;
    const getListTypeFilterFromRule = (ruleItem: string): any[] => {
      if (!ruleItem) {
        return null;
      }
      return ruleItem.split(',');
    };

    const getSortDirection = (value) => value === '+' ? SortDirection.Asc : SortDirection.Desc;
    const sortBy = rule.orderBy ? rule.orderBy.toString().substr(1) : null;
    const sortDirection = sortBy ? getSortDirection(rule.orderBy.toString().charAt(0)) : null;
    const categoriesIds = (originalFilter.categoryAncestorIdIn || '').split(',')
        .concat(...((originalFilter.categoriesIdsMatchOr || '').split(',')));
    const uniqueCategoriesIds = Array.from(new Set<number>(categoriesIds.filter(Number).map(Number)));

    return this._mapCustomMetadata(<KalturaSearchOperator>originalFilter.advancedSearch)
      .map(customMetadata => {
        return {
          customMetadata: customMetadata,
          mediaTypes: getListTypeFilterFromRule(originalFilter.mediaTypeIn),
          durations: getListTypeFilterFromRule(originalFilter.durationTypeMatchOr),
          replacementStatuses: getListTypeFilterFromRule(originalFilter.replacementStatusIn),
          flavors: getListTypeFilterFromRule(originalFilter.flavorParamsIdsMatchOr),
          limits: rule.limit,
          categories: uniqueCategoriesIds,
          freetext: originalFilter.freeText,
          sortBy: sortBy,
          sortDirection: sortDirection,
          createdAt: {
            fromDate: new Date(originalFilter.createdAtGreaterThanOrEqual),
            toDate: new Date(originalFilter.createdAtLessThanOrEqual)
          }
        }
      });
  }

  public toPlaylistRule(payload: { name: string, orderBy: KalturaPlayableEntryOrderBy, limit: number, rule: PlaylistRule }): Observable<PlaylistRule> {
    const filters = {}; // TODO kmc - removed temoprary this._entriesStore.cloneFilters();
    const entries = this._entriesStore.entries.data() || [];
    // TODO [kmcng] find a better way to get customMetadata filter
    const isCustomMetadata = (item) => // not stable way to determine customMetadata filter
      Immutable.isImmutable(item) && !item.hasOwnProperty('length') && !item.hasOwnProperty('fromDate') && !item.hasOwnProperty('toDate');

    // Get currently applied filters
    const convertedFilters = <any>Object.keys(filters).reduce((rules, key) => {
      const item = filters[key];
      if (item !== undefined) {
        if (typeof item === 'string' || typeof item === 'number' || item.fromDate || item.toDate || isCustomMetadata(item)) {
          rules[key] = item;
        } else if (item.length) {
          rules[key] = item.map(({ value }) => value).join(',')
        }
      }

      return rules;
    }, {});

    const originalFilter = new KalturaMediaEntryFilterForPlaylist({
      isRoot: 1, // default
      typeIn: [KalturaEntryType.mediaClip.toString(), KalturaEntryType.liveStream.toString()].join(','), // default
      moderationStatusIn: convertedFilters.moderationStatuses, // default, defined in _enforcedFilters
      statusIn: convertedFilters.ingestionStatuses, // default, defined in _enforcedFilters
      name: payload.name,
      freeText: convertedFilters.freetext,
      limit: convertedFilters.limits || environment.modules.contentPlaylists.ruleBasedTotalResults,
      mediaTypeIn: convertedFilters.mediaTypes,
      flavorParamsIdsMatchOr: convertedFilters.flavors,
      durationTypeMatchOr: convertedFilters.durations,
      createdAtGreaterThanOrEqual: convertedFilters.createdAt ? convertedFilters.createdAt.fromDate : undefined,
      createdAtLessThanOrEqual: convertedFilters.createdAt ? convertedFilters.createdAt.toDate : undefined,
      replacementStatusIn: convertedFilters.replacementStatuses,
      orderBy: convertedFilters.sortBy ? `${convertedFilters.sortDirection === SortDirection.Desc ? '-' : '+'}${convertedFilters.sortBy}` : undefined
    });

    if (convertedFilters.categoriesMode === CategoriesModes.SelfAndChildren) {
      originalFilter.categoryAncestorIdIn = convertedFilters.categories;
    } else {
      originalFilter.categoriesIdsMatchOr = convertedFilters.categories;
    }

    const entriesDuration = entries.reduce((duration, entry) => duration + entry.duration, 0) || 0;
    const entriesCount = entries.length || 0;

    return this._mapAdvancedSearch(convertedFilters.customMetadata)
      .map(advancedSearch => {
        if (advancedSearch) {
          originalFilter.advancedSearch = advancedSearch;
        }

        return Object.assign({}, payload.rule, {
          name: payload.name,
          orderBy: payload.orderBy,
          limit: payload.limit,
          entriesDuration,
          entriesCount,
          originalFilter
        });
      });
  }
}
