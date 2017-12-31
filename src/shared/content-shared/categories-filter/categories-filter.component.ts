import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ISubscription } from 'rxjs/Subscription';

import { PrimeTreeNode } from '@kaltura-ng/kaltura-primeng-ui';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { AutoComplete, SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui/auto-complete';

import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { CategoriesTreeComponent } from 'app-shared/content-shared/categories-tree/categories-tree.component';
import {CategoriesSearchService, CategoryData} from 'app-shared/content-shared/categories-search.service';
import { ScrollToTopContainerComponent } from '@kaltura-ng/kaltura-ui/components/scroll-to-top-container.component';
import { EntriesFilters, EntriesStore } from 'app-shared/content-shared/entries-store/entries-store.service';

export enum TreeSelectionModes {
    Self = 0,
    SelfAndChildren = 1
}

@Component({
    selector: 'kCategoriesFilter',
    templateUrl: './categories-filter.component.html',
    styleUrls: ['./categories-filter.component.scss']
})
export class CategoriesFilterComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() parentPopupWidget: PopupWidgetComponent;

    @ViewChild(ScrollToTopContainerComponent) _treeContainer: ScrollToTopContainerComponent;
    @ViewChild('categoriesTree') _categoriesTree: CategoriesTreeComponent;
    @ViewChild('searchCategory')

    private _autoComplete: AutoComplete = null;
    private _searchCategoriesRequest$: ISubscription;
    private filterUpdateSubscription: ISubscription;
    private parentPopupStateChangeSubscription: ISubscription;

    public _suggestionsProvider = new Subject<SuggestionsProviderData>();
    public _categoriesLoaded = false;
    public _selectionMode: TreeSelectionModes = TreeSelectionModes.Self;
    public _selection: PrimeTreeNode[] = [];
    public _TreeSelectionModes = TreeSelectionModes;

    constructor(private _entriesStore: EntriesStore,
                private _categoriesPrimeService: CategoriesSearchService,
                private _browserService: BrowserService,
                private _filtersRef: ElementRef) {
    }

    ngOnInit() {
        this._prepare();
    }


    private _restoreFiltersState(): void {
        this._updateComponentState(this._entriesStore.cloneFilters(['categories']
        ));
        this._fixPrimeTreePropagation();
    }

    private _fixPrimeTreePropagation()
    {
        // setTimeout(() =>
        // {
        //     if (this._primeTreesActions)
        //     {
        //         this._primeTreesActions.forEach(item =>
        //         {
        //             item.fixPropagation();
        //         })
        //     }
        // });
    }

    private _updateComponentState(updates: Partial<EntriesFilters>): void {
        // if (typeof updates.createdAt !== 'undefined') {
        //     this._createdAfter = updates.createdAt.fromDate || null;
        //     this._createdBefore = updates.createdAt.toDate || null;
        // }
        //
        // let updatedPrimeTreeSelections = false;
        // Object.keys(this._primeListsMap).forEach(listName => {
        //     const listData = this._primeListsMap[listName];
        //     let listFilter: { value: string, label: string }[];
        //     if (listData.group === 'customMetadata') {
        //         const customMetadataFilter = updates['customMetadata'];
        //         listFilter = customMetadataFilter ? customMetadataFilter[listName] : null;
        //     } else {
        //         listFilter = updates[listName];
        //     }
        //
        //     if (typeof listFilter !== 'undefined') {
        //         const listSelectionsMap = this._categoriesService.filtersUtils.toMap(listData.selections, 'value');
        //         const listFilterMap = this._categoriesService.filtersUtils.toMap(listFilter, 'value');
        //         const diff = this._categoriesService.filtersUtils.getDiff(listSelectionsMap, listFilterMap);
        //
        //         diff.added.forEach(addedItem => {
        //             const listItems = listData.items.length > 0 ? listData.items[0].children : [];
        //             const matchingItem = listItems.find(item => item.value === (<any>addedItem).value);
        //             if (!matchingItem) {
        //                 console.warn(`[categories-refine-filters]: failed to sync filter for '${listName}'`);
        //             } else {
        //                 updatedPrimeTreeSelections = true;
        //                 listData.selections.push(matchingItem);
        //             }
        //         });
        //
        //         diff.deleted.forEach(removedItem => {
        //
        //             if (removedItem.value !== null && typeof removedItem.value !== 'undefined') {
        //                 // ignore root items (they are managed by the component tree)
        //                 listData.selections.splice(
        //                     listData.selections.indexOf(removedItem),
        //                     1
        //                 );
        //                 updatedPrimeTreeSelections = true;
        //             }
        //         });
        //     }
        // });
        //
        // if (updatedPrimeTreeSelections) {
        //     this._fixPrimeTreePropagation();
        // }
    }


    private _registerToFilterStoreDataChanges(): void {
        this._entriesStore.filtersChange$
            .cancelOnDestroy(this)
            .subscribe(
                ({changes}) => {
                    this._updateComponentState(changes);
                }
            );
    }

    private _prepare(): void {

        // update components when the active filter list is updated
        const savedAutoSelectChildren: TreeSelectionModes = this._browserService
            .getFromLocalStorage('contentShared.categoriesTree.selectionMode');
        this._selectionMode = typeof savedAutoSelectChildren === 'number'
            ? savedAutoSelectChildren
            : TreeSelectionModes.SelfAndChildren;

        this._restoreFiltersState();
        this._registerToFilterStoreDataChanges();
    }


    ngAfterViewInit() {
        if (this.parentPopupWidget) {
            this.parentPopupStateChangeSubscription = this.parentPopupWidget.state$.subscribe(event => {
                if (event.state === PopupWidgetStates.Open) {
                    const inputFields: any[] = this._filtersRef.nativeElement.getElementsByTagName('input');
                    if (inputFields.length && inputFields[0].focus) {
                        setTimeout(() => inputFields[0].focus(), 0);
                    }
                }
                if (event.state === PopupWidgetStates.Close && this._treeContainer) {
                    this._treeContainer.scrollToTop();
                }
            });
        }
    }

    private _createFilter(item: CategoryData | PrimeTreeNode): any {
        // const mode = this._selectionMode === TreeSelectionModes.SelfAndChildren ? CategoriesFilterModes.Ancestor : CategoriesFilterModes.Exact;
        //
        // if (item) {
        //   if (item instanceof PrimeTreeNode) {
        //     return new CategoriesFilter(
        //       item.label,
        //       <number>item.data,
        //       mode,
        //       { token: (item.origin.fullNamePath || []).join(' > ') },
        //       item.origin.fullIdPath
        //     );
        //   } else {
        //     // create filter directly from auto complete selection (lazy mode)
        //     return new CategoriesFilter(item.name, item.id, mode, { token: (item.fullNamePath || []).join(' > ') }, item.fullIdPath);
        //   }
        // }
    }


    public _onFilterAdded(filter: any) {
        // const nodeOfFilter = this._categoriesTree.findNodeByFullIdPath(filter.fullIdPath);
        //
        // if (nodeOfFilter) {
        //
        //   // update selection of tree - handle situation when the node was added by auto-complete
        //   if (this._selection.indexOf(nodeOfFilter) === -1) {
        //     // IMPORTANT - we create a new array and not altering the existing one due to out-of-sync issue with angular binding.
        //     this._selection = [...this._selection, nodeOfFilter];
        //   }
        // }
    }


    public _onFilterRemoved(filter: any) {

        // const nodeOfFilter = this._categoriesTree.findNodeByFullIdPath(filter.fullIdPath);
        //
        // if (nodeOfFilter) {
        //
        //   const nodeIndexInSelection = this._selection.indexOf(nodeOfFilter);
        //
        //   if (nodeIndexInSelection > -1) {
        //     // IMPORTANT - we create a new array and not altering the existing one due to out-of-sync issue with angular binding.
        //     this._selection = this._selection.filter(item => item !== nodeOfFilter);
        //   }
        // }
    }

    public _onTreeNodeUnselected(node: PrimeTreeNode) {
        const newFilterItem = this._entriesStore.cloneFilter('categories', []);
        const itemIndex = newFilterItem.findIndex(item => item.value === node.data);
        if (itemIndex > -1) {
            newFilterItem.splice(itemIndex, 1);
            this._entriesStore.filter({'categories': newFilterItem});
        }
    }

    public _onTreeNodeSelected(node: PrimeTreeNode) {

        const newFilterItem = this._entriesStore.cloneFilter('categories', []);
        if (!newFilterItem.find(item => item.value === node.data)) {
            newFilterItem.push({value: node.data + '', label: node.label });
            this._entriesStore.filter({'categories': newFilterItem});
        }
    }

    private updateFilters(newFilters: any[], removedFilters: any[]): void {

        // removedFilters = removedFilters || [];
        // newFilters = newFilters || [];
        //
        // const categoriesFilters = this._entriesStore.getFiltersByType(CategoriesFilter);
        //
        // if (categoriesFilters && this._selectionMode === TreeSelectionModes.SelfAndChildren) {
        //   newFilters.forEach((newFilter: CategoriesFilter) => {
        //     // when this component is running with ExactIncludingChildren mode, in lazy mode we need to manually unselect
        //     // the first nested child (if any) that currently selected
        //     const childToRemove = categoriesFilters.find(filter => {
        //       let result = false;
        //
        //       // check if this item is a parent of another item (don't validate last item which is the node itself)
        //       for (let i = 0, length = filter.fullIdPath.length; i < length - 1 && !result; i++) {
        //         result = filter.fullIdPath[i] === newFilter.value;
        //       }
        //
        //       return result;
        //     });
        //
        //     if (childToRemove) {
        //       removedFilters.push(childToRemove);
        //     }
        //   });
        // }
        //
        // if (newFilters.length > 0) {
        //   this._entriesStore.addFilters(...newFilters);
        // }
        //
        // if (removedFilters.length > 0) {
        //   this._entriesStore.removeFilters(...removedFilters);
        // }
    }


    public _onNodeChildrenLoaded({ node }) {
        // if (node instanceof PrimeTreeNode) {
        //   const categoriesFilters = this._entriesStore.getFiltersByType(CategoriesFilter);
        //
        //   node.children.forEach(nodeChild => {
        //     const isNodeChildSelected = !!categoriesFilters.find(categoryFilter => categoryFilter.value + '' === nodeChild.data + '');
        //     this._categoriesTree.updateNodeState(nodeChild, isNodeChildSelected);
        //   });
        // }
    }

    public _onCategoriesLoad({ categories }: { categories: PrimeTreeNode[] }): void {
        // this._categoriesLoaded = categories && categories.length > 0;
        //
        // if (!this.filterUpdateSubscription) {
        //   this._entriesStore.activeFilters$
        //     .cancelOnDestroy(this)
        //     .first()
        //     .subscribe(result => {
        //       result.filters.forEach(filter => {
        //         if (filter instanceof CategoriesFilter) {
        //           this._onFilterAdded(filter);
        //         }
        //       });
        //     });
        //
        //   this.filterUpdateSubscription = this._entriesStore.query$.subscribe(
        //     filter => {
        //       if (filter.removedFilters && filter.removedFilters.length > 0) {
        //         filter.removedFilters.forEach(removedFilter => {
        //           if (removedFilter instanceof CategoriesFilter) {
        //             this._onFilterRemoved(removedFilter);
        //           }
        //         });
        //       }
        //
        //       if (filter.addedFilters && filter.addedFilters.length > 0) {
        //         filter.addedFilters.forEach(addedFilter => {
        //           if (addedFilter instanceof CategoriesFilter) {
        //             this._onFilterAdded(addedFilter);
        //           }
        //         });
        //       }
        //     }
        //   );
        // }
    }

    private createTreeHandlerArguments(items: any[], parentNode: PrimeTreeNode = null): any {
        return {
            items: items,
            idProperty: 'id',
            nameProperty: 'name',
            parentIdProperty: 'parentId',
            sortByProperty: 'sortValue',
            childrenCountProperty: 'childrenCount',
            rootParent: parentNode
        }
    }

    private _resetNodeSelectionMode(node: PrimeTreeNode) {
        node.partialSelected = false;
        node.selectable = true;

        if (node.children && node.children.length) {
            node.children.forEach(childNode => this._resetNodeSelectionMode(childNode));
        }
    }

    public _onSelectionModeChanged(value) {
        // clear current selection
        this._clearAll();

        (this._categoriesTree._categories || []).forEach(node => {
            this._resetNodeSelectionMode(node);
        });

        this._selectionMode = value;
        this._browserService.setInLocalStorage('contentShared.categoriesTree.selectionMode', this._selectionMode);

    }

    public _clearAll() {
        //this._entriesStore.removeFiltersByType(CategoriesFilter);
    }

    public _blockTreeSelection(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    close() {
        if (this.parentPopupWidget) {
            this.parentPopupWidget.close();
        }
    }

    ngOnDestroy() {
        this._suggestionsProvider.complete();

        if (this.filterUpdateSubscription) {
            this.filterUpdateSubscription.unsubscribe();
            this.filterUpdateSubscription = null;
        }

        if (this.parentPopupStateChangeSubscription) {
            this.parentPopupStateChangeSubscription.unsubscribe();
            this.parentPopupStateChangeSubscription = null;
        }
    }

    _onSuggestionSelected(): void {

        const selectedItem = this._autoComplete.getValue();
        if (selectedItem) {
            const data = selectedItem.data;

            const nodeToBeSelected = this._categoriesTree.findNodeByFullIdPath(data.fullIdPath);
            if (nodeToBeSelected) {
                // the requested node found in the tree - select that node
                this._onTreeNodeSelected(nodeToBeSelected);

                nodeToBeSelected.expand();

            } else {
                // the requested node is not part of the tree - create a filter directly
                this.updateFilters([this._createFilter(data)], null);
            }

            // clear user text from component
            this._autoComplete.clearValue();
        }
    }


    _searchSuggestions(event): void {
        this._suggestionsProvider.next({ suggestions: [], isLoading: true });

        if (this._searchCategoriesRequest$) {
            // abort previous request
            this._searchCategoriesRequest$.unsubscribe();
            this._searchCategoriesRequest$ = null;
        }

        this._searchCategoriesRequest$ = this._categoriesPrimeService.getSuggestions(event.query).subscribe(data => {
                const suggestions = [];

                // (data || []).forEach(item => {
                //   const label = item.fullNamePath.join(' > ') + (item.referenceId ? ` (${item.referenceId})` : '');
                //
                //   const isSelectable = !this._entriesStore.getFiltersByType(CategoriesFilter).find(categoryFilter => {
                //
                //     if (this._selectionMode === TreeSelectionModes.SelfAndChildren) {
                //       let alreadySelected = false;
                //       for (let length = item.fullIdPath.length, i = length - 1; i >= 0 && !alreadySelected; i--) {
                //         alreadySelected = item.fullIdPath[i] === categoryFilter.value;
                //       }
                //       return alreadySelected;
                //     } else {
                //       return categoryFilter.value === item.id;
                //     }
                //   });
                //   suggestions.push({ data: item, label: label, isSelectable: isSelectable });
                // });

                this._suggestionsProvider.next({ suggestions: suggestions, isLoading: false });
            },
            (err) => {
                this._suggestionsProvider.next({ suggestions: [], isLoading: false, errorMessage: <any>(err.message || err) });
            });
    }

}

