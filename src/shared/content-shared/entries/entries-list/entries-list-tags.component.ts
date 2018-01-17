import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';

import * as moment from 'moment';
import {GroupedListType} from '@kaltura-ng/mc-shared/filters';
import {EntriesFilters, EntriesStore} from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import {
    RefineGroup,
    RefineGroupList
} from 'app-shared/content-shared/entries/entries-store/entries-refine-filters.service';

export interface TagItem
{ type: string, value: any, label: string, tooltip: string}

const listTypes: Array<keyof EntriesFilters> = ['mediaTypes', 'timeScheduling', 'ingestionStatuses', 'durations', 'originalClippedEntries', 'moderationStatuses', 'replacementStatuses', 'accessControlProfiles', 'flavors', 'distributions', 'categories' ];

@Component({
    selector: 'k-entries-list-tags',
    templateUrl: './entries-list-tags.component.html',
    styleUrls: ['./entries-list-tags.component.scss']

})
export class EntriesListTagsComponent implements OnInit, OnDestroy {

    @Output() onTagsChange = new EventEmitter<void>();
    @Input() enforcedFilters: Partial<EntriesFilters>;

    @Input() set refineFilters(groups: RefineGroup[]) {
        this._refineFiltersMap.clear();

        (groups || []).forEach(group => {
            (group.lists || []).forEach(list => {
                this._refineFiltersMap.set(list.name, list);
            });
        });

        this._handleFiltersChange();
    }

    public _filterTags: TagItem[] = [];
    private _refineFiltersMap: Map<string, RefineGroupList> = new Map<string, RefineGroupList>();

    public _showTags = false;
    constructor(private _entriesStore: EntriesStore, private _appLocalization: AppLocalization) {
    }

    removeTag(tag: any) {
        if (listTypes.indexOf(tag.type) > -1) {
            // remove tag of type list from filters
            const previousData = this._entriesStore.cloneFilter(tag.type, []);
            const previousDataItemIndex = previousData.findIndex(item => item === tag.value);
            if (previousDataItemIndex > -1) {
                previousData.splice(
                    previousDataItemIndex
                    , 1
                );

                this._entriesStore.filter({
                    [tag.type]: previousData
                });
            }
        } else if (tag.type.indexOf('customMetadata|') === 0) {
            // remove tag of type custom metadata from filters
            const previousData = this._entriesStore.cloneFilter('customMetadata', {});
            const [, listId] = tag.type.split('|');
            const list = previousData[listId] || [];
            const listItemIndex = list.findIndex(item => item === tag.value);

            if (listItemIndex > -1) {
                list.splice(
                    listItemIndex
                    , 1
                );

                this._entriesStore.filter({customMetadata: previousData});
            }
        } else {
            switch (tag.type) {
                case "freetext":
                    this._entriesStore.filter({freetext: null});
                    break;
                case "createdAt":
                    this._entriesStore.filter({createdAt: {fromDate: null, toDate: null}});
            }
        }
    }

    removeAllTags() {
        this._entriesStore.resetFilters();
    }

    ngOnInit() {
        this._restoreFiltersState();
        this._registerToFilterStoreDataChanges();
        this._handleFiltersChange();
    }

    private _handleFiltersChange(): void {
        if (this._refineFiltersMap.size > 0) {
            this._showTags = true;

            (this._filterTags || []).forEach(tag => {
                if ((<string[]>listTypes).indexOf(tag.type) !== -1) {
                    tag.label = this._getRefineLabel(tag.type, tag.value);
                    tag.tooltip = this._appLocalization.get(`applications.content.filters.${tag.type}`, {'0': tag.label});
                }
            });

            this.onTagsChange.emit();
        } else {
            this._showTags = false;
            this.onTagsChange.emit();
        }
    }

    private _restoreFiltersState(): void
    {
        this._updateComponentState(this._entriesStore.cloneFilters(
            [
                'freetext',
                'customMetadata',
                ...listTypes
            ]
        ));
    }

    private _updateComponentState(updates: Partial<EntriesFilters>): void {

        if (this.enforcedFilters) {
            Object.keys(this.enforcedFilters).forEach(enforcedFilter => {
                delete updates[enforcedFilter];
            });
        }

        if (typeof updates.freetext !== 'undefined') {
            this._syncTagOfFreetext();
        }

        if (typeof updates.createdAt !== 'undefined') {
            this._syncTagOfCreatedAt();
        }

        if (typeof updates.customMetadata !== 'undefined') {
            this._syncTagsOfCustomMetadata(updates.customMetadata);
        }

        listTypes.forEach(listType => {
            if (typeof updates[listType] !== 'undefined') {
                this._syncTagsOfList(listType);
            }
        });
    }

    private _registerToFilterStoreDataChanges(): void {
        this._entriesStore.filtersChange$
            .cancelOnDestroy(this)
            .subscribe(({changes}) => {
                this._updateComponentState(changes);
            });
    }

    private _syncTagOfCreatedAt(): void {
        const previousItem = this._filterTags.findIndex(item => item.type === 'createdAt');
        if (previousItem !== -1) {
            this._filterTags.splice(
                previousItem,
                1);
        }

        const {fromDate, toDate} = this._entriesStore.cloneFilter('createdAt', { fromDate: null, toDate: null});
        if (fromDate || toDate) {
            let tooltip = '';
            if (fromDate && toDate) {
                tooltip = `${moment(fromDate).format('LL')} - ${moment(toDate).format('LL')}`;
            } else if (fromDate) {
                tooltip = `From ${moment(fromDate).format('LL')}`;
            } else if (toDate) {
                tooltip = `Until ${moment(toDate).format('LL')}`;
            }

            this._filterTags.push({type: 'createdAt', value: null, label: 'Dates', tooltip });
        }
    }

    private _syncTagOfFreetext(): void {
        const previousItem = this._filterTags.findIndex(item => item.type === 'freetext');
        if (previousItem !== -1) {
            this._filterTags.splice(
                previousItem,
                1);
        }

        const currentFreetextValue = this._entriesStore.cloneFilter('freetext', null);

        if (currentFreetextValue) {
            this._filterTags.push({
                type: 'freetext',
                value: currentFreetextValue,
                label: currentFreetextValue,
                tooltip: this._appLocalization.get(`applications.content.filters.freeText`)
            });
        }
    }

    private _syncTagsOfList(filterName: keyof EntriesFilters): void {
        const currentValue = this._entriesStore.cloneFilter(filterName, []);

        if (currentValue instanceof Array) {
          // Developer notice: we must make sure the type at runtime is an array. this is a safe check only we don't expect the value to be different
          const tagsFilters = this._filterTags.filter(item => item.type === filterName);

          const tagsFiltersMap = this._entriesStore.filtersUtils.toMap(tagsFilters, 'value');
          const currentValueMap = this._entriesStore.filtersUtils.toMap(<string[]>currentValue, null);
          const diff = this._entriesStore.filtersUtils.getDiff(tagsFiltersMap, currentValueMap);

          diff.deleted.forEach(item => {
            this._filterTags.splice(
              this._filterTags.indexOf(item),
              1);
          });

          diff.added.forEach(item => {
              const label = this._getRefineLabel(filterName, item);
            this._filterTags.push({
              type: filterName,
              value: item,
              label: label,
              tooltip:  this._appLocalization.get(`applications.content.filters.${filterName}`, {'0': label})
            });
          });
        }
    }

    private _getRefineLabel(listName: string, value: any): string {
        let result = String(value);
        if (this._refineFiltersMap.size > 0) {
            const list = this._refineFiltersMap.get(listName);
            if (list) {
                const item = list.items.find(listItem => String(listItem.value) === String(value));

                result = item ? item.label : result;
            }

        }
        return result;
    }

    private _syncTagsOfCustomMetadata(customMetadataFilters: GroupedListType): void {

        const customMetadataTagsMap: { [key: string]: TagItem[] } = this._filterTags.filter(item => item.type.indexOf('customMetadata|') === 0)
            .reduce((acc, item) =>
            {
                const [, listId] = item.type.split('|');
                const listItems = acc[listId] = acc[listId] || [];
                listItems.push(item);
                return acc;
            }, {});

            const uniqueListIds = new Set([...Object.keys(customMetadataTagsMap), ...Object.keys(customMetadataFilters)]);

            uniqueListIds.forEach(listId =>
            {
                const filtersListItems =  customMetadataFilters[listId];
                const existsInFilters = filtersListItems && filtersListItems.length > 0;
                const tagsListItems = customMetadataTagsMap[listId];
                const existsInTags = tagsListItems && tagsListItems.length > 0;

               if (existsInTags && !existsInFilters)
               {
                   tagsListItems.forEach(item =>
                   {
                       this._filterTags.splice(
                           this._filterTags.indexOf(item),
                           1
                       )
                   });
               }else {
                   const tagsListItemsMap = this._entriesStore.filtersUtils.toMap(tagsListItems, 'value');
                   const filtersListItemsMap = this._entriesStore.filtersUtils.toMap(filtersListItems, 'value');
                   const diff = this._entriesStore.filtersUtils.getDiff(tagsListItemsMap, filtersListItemsMap);

                   diff.deleted.forEach(item => {
                       this._filterTags.splice(
                           this._filterTags.indexOf(item),
                           1);
                   });

                   diff.added.forEach(item => {
                       const tooltip = item.tooltip  || item.label;
                       this._filterTags.push({
                           type: `customMetadata|${listId}`,
                           value: item.value,
                           label: item.label,
                           tooltip
                       });
                   });
               }
            });
    }

    ngOnDestroy() {
    }
}

