import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AreaBlockerMessage, StickyComponent } from '@kaltura-ng/kaltura-ui';

import {
    CategoriesModes,
    EntriesFilters, EntriesStore,
    SortDirection
} from 'app-shared/content-shared/entries-store/entries-store.service';
import { EntriesTableColumns } from 'app-shared/content-shared/entries-table/entries-table.component';
import { BrowserService } from 'app-shared/kmc-shell';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { CategoriesSeclectionModes } from 'app-shared/content-shared/categories-filter/categories-filter.component';
import { CategoriesListItem } from 'app-shared/content-shared/categories/categories-list-type';

@Component({
  selector: 'kEntriesList',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.scss']

})
export class EntriesListComponent implements OnInit, OnDestroy {
    @Input() showReload = true;
    @Input() isBusy = false;
    @Input() blockerMessage: AreaBlockerMessage = null;
    @Input() selectedEntries: any[] = [];
    @Input() columns: EntriesTableColumns | null;
    @Input() rowActions: { label: string, commandName: string }[];

    @ViewChild('tags') private tags: StickyComponent;

  @Output() onActionsSelected = new EventEmitter<{ action: string, entry: KalturaMediaEntry }>();

    public _query = {
        freetext: '',
        createdAfter: null,
        createdBefore: null,
        pageIndex: 0,
        pageSize: null, // pageSize is set to null by design. It will be modified after the first time loading entries
        sortBy: 'createdAt',
        sortDirection: SortDirection.Desc,
        categories: [],
        categoriesMode: CategoriesSeclectionModes.Self
    };

    constructor(private _entriesStore: EntriesStore,
                private _browserService: BrowserService) {
    }

    ngOnInit() {
        this._prepare();
    }


    // TODO sakal
    // private _prepare(): void {
    //
    //     // TODO sakal
    //     //const mode = this._selectionMode === CategoriesSeclectionModes.SelfAndChildren ? CategoriesFilterModes.Ancestor : CategoriesFilterModes.Exact;
    //
    //     // update components when the active filter list is updated
    //     const savedAutoSelectChildren: CategoriesSeclectionModes = this._browserService
    //         .getFromLocalStorage('contentShared.categoriesTree.selectionMode');
    //     this.selectionMode = typeof savedAutoSelectChildren === 'number'
    //         ? savedAutoSelectChildren
    //         : CategoriesSeclectionModes.SelfAndChildren;
    // }

    private _prepare(): void{
        this._restoreFiltersState();
        this._registerToFilterStoreDataChanges();
    }

    private _restoreFiltersState(): void {
        this._updateComponentState(this._entriesStore.cloneFilters(
            [
                'freetext',
                'pageSize',
                'pageIndex',
                'sortBy',
                'sortDirection',
                'categories',
                'categoriesMode'
            ]
        ));
    }

    private _updateComponentState(updates: Partial<EntriesFilters>): void {
        if (typeof updates.freetext !== 'undefined') {
            this._query.freetext = updates.freetext || '';
        }

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

        if (typeof updates.categoriesMode !== 'undefined') {
            this._query.categoriesMode = updates.categoriesMode === CategoriesModes.Self ? CategoriesSeclectionModes.Self: CategoriesSeclectionModes.SelfAndChildren;
        }

        if (typeof updates.categories !== 'undefined') {
            this._query.categories = [...updates.categories];
        }
    }


    // TODO sakal
    // public _onTreeNodeUnselected(node: CategoriesTreeNode) {
    //     const newFilterItem = this._entriesStore.cloneFilter('categories', []);
    //     const itemIndex = newFilterItem.findIndex(item => item.value === node.data);
    //     if (itemIndex > -1) {
    //         newFilterItem.splice(itemIndex, 1);
    //         this._entriesStore.filter({'categories': newFilterItem});
    //     }
    // }

    onCategoriesModeChanged(categoriesMode)
    {
        this._query.categoriesMode = categoriesMode;
        this._browserService.setInLocalStorage('contentShared.categoriesTree.selectionMode', categoriesMode);
    }

    onCategoriesUnselected(categoriesToRemove: CategoriesListItem[]) {
        const categories = this._entriesStore.cloneFilter('categories', []);

        categoriesToRemove.forEach(categoryToRemove => {
            const categoryIndex = categories.findIndex(item => item.value === categoryToRemove.value);
            if (categoryIndex !== -1) {
                categories.splice(
                    categoryIndex,
                    1
                );
            }
        });
        this._entriesStore.filter({categories});
    }

    onCategorySelected(category: CategoriesListItem){
        const categories = this._entriesStore.cloneFilter('categories', []);
        if (!categories.find(item => item.value === category.value)) {
            if (this._query.categoriesMode === CategoriesSeclectionModes.SelfAndChildren) {
                // when this component is running with SelfAndChildren mode, we need to manually unselect
                // the first nested child (if any) that is currently selected
                const childToRemove = categories.find(item => {
                    // check if this item is a parent of another item (don't validate last item which is the node itself)
                    let result = false;
                    for (let i = 0, length = item.fullIdPath.length; i < length - 1 && !result; i++) {
                        result = item.fullIdPath[i] === category.value;
                    }
                    return result;
                });

                if (childToRemove) {
                    categories.splice(
                        categories.indexOf(childToRemove),
                        1);
                }
            }

            categories.push(category);

            this._entriesStore.filter({'categories': categories});
        }
    }


    private _registerToFilterStoreDataChanges(): void {
        this._entriesStore.filtersChange$
            .cancelOnDestroy(this)
            .subscribe(({changes}) => {
                this._updateComponentState(changes);
                this.clearSelection();
                this._browserService.scrollToTop();
            });
    }

    onFreetextChanged(): void {
        this._entriesStore.filter({freetext: this._query.freetext});
    }

    onSortChanged(event) {
        this._entriesStore.filter({
            sortBy: event.field,
            sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
        });
    }

    onPaginationChanged(state: any): void {
        if (state.page !== this._query.pageIndex || state.rows !== this._query.pageSize) {
            this._entriesStore.filter({
                pageIndex: state.page,
                pageSize: state.rows
            });
        }
    }


    ngOnDestroy() {
    }

    public _reload() {
        this.clearSelection();
        this._browserService.scrollToTop();
        this._entriesStore.reload();
    }

    clearSelection() {
        this.selectedEntries = [];
    }

    onTagsChange() {
        this.tags.updateLayout();
    }


    onBulkChange(event): void {
        if (event.reload === true) {
            this._reload();
        }
    }
}

