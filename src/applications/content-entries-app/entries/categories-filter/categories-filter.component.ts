import { Component, OnInit, OnDestroy,  ViewChild, Input,  AfterViewInit, ElementRef } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { ISubscription } from 'rxjs/Subscription';

import { AreaBlockerMessage } from '@kaltura-ng2/kaltura-ui';
import { PrimeTreeNode, NodeChildrenStatuses } from '@kaltura-ng2/kaltura-primeng-ui';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng2/kaltura-ui/popup-widget/popup-widget.component';
import { AppUser,AppAuthentication } from '@kaltura-ng2/kaltura-common';
import { SuggestionsProviderData } from '@kaltura-ng2/kaltura-primeng-ui/auto-complete';
import { CategoriesTreeComponent } from '../../shared/categories-tree/categories-tree.component';
import { CategoriesPrime } from '../../shared/categories-prime.service';
import { CategoryData } from '../categories-store.service';

import * as R from 'ramda';

import { OnSelectionChangedArgs,TreeSelectionModes,TreeSelectionChangedOrigins } from '@kaltura-ng2/kaltura-primeng-ui/tree-selection';
import { BrowserService } from "kmc-shell/providers/browser.service";
import { FilterItem } from "../entries-store/filter-item";
import { ValueFilter } from "../entries-store/value-filter";
import { EntriesStore } from "../entries-store/entries-store.service";
import { CategoriesFilter, CategoriesFilterModes } from "../entries-store/filters/categories-filter";
import { AutoComplete } from '@kaltura-ng2/kaltura-primeng-ui/auto-complete';

@Component({
    selector: 'kCategoriesFilter',
    templateUrl: './categories-filter.component.html',
    styleUrls: ['./categories-filter.component.scss']
})
export class CategoriesFilterComponent implements OnInit, AfterViewInit, OnDestroy{

    public _loading : boolean = false;
    public _categories: PrimeTreeNode[] = [];
    private appUser : AppUser;
    private inLazyMode : boolean = false;
    private filterUpdateSubscription : ISubscription;
    private parentPopupStateChangeSubscription : ISubscription;
    public _suggestionsProvider = new Subject<SuggestionsProviderData>();
    private _searchCategoriesRequest$ : ISubscription;
    public _selectionMode :TreeSelectionModes = TreeSelectionModes.Self;
	public _blockerMessage: AreaBlockerMessage = null;

    @ViewChild('searchCategory')
    private _autoComplete : AutoComplete = null;


    public NodeChildrenStatuses : any = NodeChildrenStatuses; // we expose the enum so we will be able to use it as part of template expression

	@ViewChild('categoriesTree') categoriesTree: CategoriesTreeComponent;

    @Input() parentPopupWidget: PopupWidgetComponent;

    constructor(
        appAuthentication : AppAuthentication,
        private entriesStore : EntriesStore,
        private _categoriesPrime: CategoriesPrime,
        public browserService: BrowserService,
        public filtersRef: ElementRef
    ) {
        this.appUser = appAuthentication.appUser;
    }

    ngOnInit() {
        // update components when the active filter list is updated
        this.filterUpdateSubscription = this.entriesStore.query$.subscribe(
            filter => {
                if (filter.removedFilters && filter.removedFilters.length > 0) {
                    // only removedFilters items should be handled (because relevant addedFilters filters are originated from this component)
                    this.syncTreeComponents(filter.removedFilters);
                }
            }
        );

        const savedAutoSelectChildren: TreeSelectionModes = this.browserService.getFromLocalStorage("contentShared.categoriesTree.selectionMode");
        this._selectionMode = typeof savedAutoSelectChildren === 'number' ? savedAutoSelectChildren : TreeSelectionModes.SelfAndChildren;

        // TODO [kmcng] consider using constants for permissions flags
        this.inLazyMode = this.appUser.permissionsFlags.indexOf('DYNAMIC_FLAG_KMC_CHUNKED_CATEGORY_LOAD') !== -1;
        this.reloadCategories();
    }

    private reloadCategories() : void
    {
	    this._loading = true;
	    this._blockerMessage = null;
	    this._categoriesPrime.getCategories()
		    .subscribe( result => {
				    this._categories = result.categories;
				    this._loading = false;
			    },
			    error => {
				    this._blockerMessage = new AreaBlockerMessage({
					    message: error.message || "Error loading categories",
					    buttons: [{
						    label: 'Retry',
						    action: () => {
							    this.reloadCategories();
						    }}
					    ]
				    })
				    this._loading = false;
			    });
    }

    ngAfterViewInit(){
        if (this.parentPopupWidget){
            this.parentPopupStateChangeSubscription = this.parentPopupWidget.state$.subscribe(event => {
                if (event.state === PopupWidgetStates.Open){
                    const inputFields: any[] = this.filtersRef.nativeElement.getElementsByTagName("input");
                    if (inputFields.length && inputFields[0].focus){
                        setTimeout(() => {
                            inputFields[0].focus();
                        },0);
                    }
                }
                if (event.state === PopupWidgetStates.Close){
                    const nativeElement: HTMLElement = this.filtersRef.nativeElement;
                    if (nativeElement && nativeElement.getElementsByClassName("kTreeContainer").length > 0){
                        nativeElement.getElementsByClassName("kTreeContainer")[0].scrollTop = 0;
                    }
                }
            });
        }
    }

    private _createFilter(item : CategoryData | PrimeTreeNode) : CategoriesFilter
    {
        const mode = this._selectionMode === TreeSelectionModes.SelfAndChildren ? CategoriesFilterModes.Ancestor : CategoriesFilterModes.Exact;

        if (item) {
            if (item instanceof PrimeTreeNode) {
                return new CategoriesFilter(<number>item.data, mode, item.label, {token: (item.origin.fullNamePath || []).join(' > ')}, item.origin.fullIdPath);
            } else {
                return new CategoriesFilter(item.id, mode, item.name, {token: (item.fullNamePath || []).join(' > ')},item.fullIdPath);
            }
        }
    }

    public _onTreeSelectionChanged(args : OnSelectionChangedArgs) : void {

        // update filters only if the change was done from this component (either by the user selecting inside the tree or when the user clicks on 'clear all'
        if (args.origin === TreeSelectionChangedOrigins.UnselectAll || args.origin === TreeSelectionChangedOrigins.UserSelection) {
            let newFilters: CategoriesFilter[] = [];
            let removedFilters: CategoriesFilter[] = [];

            let categoriesFilters = this.entriesStore.getFiltersByType(CategoriesFilter);

            args.added.forEach((node: PrimeTreeNode) => {
                newFilters.push(this._createFilter(node));
            });

            if (categoriesFilters) {

                args.removed.forEach((node: PrimeTreeNode) => {
                    const filter = R.find(R.propEq('value', node.data), categoriesFilters);

                    if (filter) {
                        removedFilters.push(filter);
                    }
                });
            }

            this.updateFilters(newFilters,removedFilters);
        }
    }

    private updateFilters(newFilters : CategoriesFilter[], removedFilters : CategoriesFilter[]) : void{

        removedFilters = removedFilters || [];
        newFilters = newFilters || [];

        let categoriesFilters = this.entriesStore.getFiltersByType(CategoriesFilter);

        if (categoriesFilters && this._selectionMode === TreeSelectionModes.SelfAndChildren && this.inLazyMode) {
            newFilters.forEach((newFilter: CategoriesFilter) => {
                // when this component is running with ExactIncludingChildren mode, in lazy mode we need to manually unselect
                // the first nested child (if any) that currently selected
                const childToRemove = categoriesFilters.find(filter => {
                    let result = false;

                    // check if this item is a parent of another item (don't validate last item which is the node itself)
                    for (let i = 0, length = filter.fullIdPath.length; i < length - 1 && !result; i++) {
                        result = filter.fullIdPath[i] === newFilter.value;
                    }

                    return result;
                });

                if (childToRemove) {
                    removedFilters.push(childToRemove);
                }
            });
        }

        if (newFilters.length > 0) {
            this.entriesStore.addFilters(...newFilters);
        }

        if (removedFilters.length > 0) {
            this.entriesStore.removeFilters(...removedFilters);
        }
    }

    private syncTreeComponents(removedFilters : FilterItem[]) : void
    {
        // traverse on removed filters and update tree selection accordingly
        if (removedFilters)
        {
            const nodesToRemove : PrimeTreeNode[] = [];

            removedFilters.forEach(filter =>
            {
                if (filter instanceof ValueFilter)
                {
                    let nodeToRemove = R.find(R.propEq('data',filter.value),this.categoriesTree.treeSelection.getSelections());

                    if (nodeToRemove)
                    {
                        nodesToRemove.push(nodeToRemove);
                    }
                }
            });

            if (nodesToRemove.length > 0)
            {
                this.categoriesTree.treeSelection.unselectItems(nodesToRemove);
            }
        }
    }

    public _onNodeExpand(event : any) : void
    {
        // load node children, relevant only if 'inLazyMode' and node children weren't loaded already
        if (this.inLazyMode && event && event.node instanceof PrimeTreeNode)
        {
            const node : PrimeTreeNode = <PrimeTreeNode>event.node;


	        this._categoriesPrime.loadNodeChildren(node, (children) => {
		        // check if one of the children was already selected and should be added to
		        // tree selection. Scenario: in lazy tree and selection mode SelfAndChildren when the user select a
		        // child node using the search component and then expand its' parent
		        const newSelectedChildren = [];
		        this.entriesStore.getFiltersByType(CategoriesFilter).forEach(filter =>
		        {
			        const child = children.find(childToCompare => filter.value === childToCompare.data);

			        if (child)
			        {
				        newSelectedChildren.push(child);
			        }
		        });

		        if (newSelectedChildren.length)
		        {
			        setTimeout(() => {
					        this.categoriesTree.treeSelection.selectItems(newSelectedChildren);
				        }
				        ,300);

		        }
		        // ask tree selection to refresh node status, required in
		        // 'ExactBlockChildren' mode to update children status if needed
		        this.categoriesTree.treeSelection.syncItemStatus(node);

		        return children;
	        });

        }
    }

    private createTreeHandlerArguments(items : any[], parentNode : PrimeTreeNode = null) : any {
        return {
            items: items,
            idProperty: 'id',
            nameProperty: 'name',
            parentIdProperty: 'parentId',
            sortByProperty: 'sortValue',
            childrenCountProperty: 'childrenCount',
            rootParent : parentNode
        }
    }

    public _onSelectionModeChanged(value) {
        // clear current selection
        this._clearAll();

        // important - updates selection mode only after the remove all filters was invoked to be sure the component is sync correctly.
        this._selectionMode = value;
        this.browserService.setInLocalStorage("contentShared.categoriesTree.selectionMode", this._selectionMode);
    }

    public _clearAll(){
        this.entriesStore.removeFiltersByType(CategoriesFilter);
        this.categoriesTree.treeSelection.unselectAll();
    }

    public _blockTreeSelection(e: MouseEvent){
        e.preventDefault();
        e.stopPropagation();
    }

    close(){
        if (this.parentPopupWidget){
            this.parentPopupWidget.close();
        }
    }

    ngOnDestroy(){

        this._suggestionsProvider.complete();

        if (this.parentPopupStateChangeSubscription) {
            this.parentPopupStateChangeSubscription.unsubscribe();
            this.parentPopupStateChangeSubscription = null;
        }
    }

    _onSuggestionSelected() : void {

        const selectedItem = this._autoComplete.getValue();
        if (selectedItem) {

            const data = selectedItem.data;

            // find the item in the tree (if exists)
            let treeItem : PrimeTreeNode = null;
            for(let i=0,length=data.fullIdPath.length; i<length ; i++)
            {
                const itemIdToSearchFor = data.fullIdPath[i];
                treeItem = ((treeItem ? treeItem.children : this._categories) || []).find(child => child.data  === itemIdToSearchFor);

                if (!treeItem)
                {
                    break;
                }
            }

            if (treeItem)
            {
                // select the node to create the filter and update tree status
                this.categoriesTree.treeSelection.simulateUserInteraction(treeItem);

                // expand tree to show selected node
                let nodeParent= treeItem.parent;

                while(nodeParent != null)
                {
                    nodeParent.expanded = true;
                    nodeParent = nodeParent.parent;
                }
            }else {
                // add new filter
                this.updateFilters([this._createFilter(data)],null);
            }

            // clear user text from component
            this._autoComplete.clearValue();
        }
    }



    _searchSuggestions(event) : void {
        this._suggestionsProvider.next({ suggestions : [], isLoading : true});

        if (this._searchCategoriesRequest$)
        {
            // abort previous request
            this._searchCategoriesRequest$.unsubscribe();
            this._searchCategoriesRequest$ = null;
        }

        this._searchCategoriesRequest$ = this._categoriesPrime.searchCategories(event.query).subscribe(data => {
                const suggestions = [];

                (data || []).forEach(item => {
                    let label = item.fullNamePath.join(' > ') + (item.referenceId ? ` (${item.referenceId})` : '');

                    const isSelectable = !this.entriesStore.getFiltersByType(CategoriesFilter).find(categoryFilter => {

                        if (this._selectionMode === TreeSelectionModes.SelfAndChildren) {
                            let alreadySelected = false;
                            for (let length = item.fullIdPath.length,i = length-1;i >= 0 && !alreadySelected;i--)
                            {
                                alreadySelected = item.fullIdPath[i] === categoryFilter.value;
                            }
                            return alreadySelected;
                        }else {
                            return categoryFilter.value === item.id;
                        }
                    });
                    suggestions.push({data: item, label: label, isSelectable: isSelectable});
                });

                this._suggestionsProvider.next({suggestions: suggestions, isLoading: false});
            },
            (err) => {
                 this._suggestionsProvider.next({ suggestions : [], isLoading : false, errorMessage : <any>(err.message || err)});
            });
    }

}

