import { Component,  QueryList, ViewChildren, ElementRef, Inject, ViewChild, AfterViewInit,OnInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { Subject } from 'rxjs';
import { SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui';

import { MenuItem } from 'primeng/api';
import { ISubscription } from 'rxjs/Subscription';
import { EntryMetadataWidget } from './entry-metadata-widget.service';
import { PageScrollService, PageScrollInstance } from 'ngx-page-scroll';
import { JumpToSection } from './jump-to-section.component';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { CategoryTooltipPipe } from 'app-shared/content-shared/categories/category-tooltip.pipe';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { CategoriesStatusMonitorService, CategoriesStatus } from 'app-shared/content-shared/categories-status/categories-status-monitor.service';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { subApplicationsConfig } from 'config/sub-applications';
import {
    EntriesManualExecutionModeToken,
    EntriesStore
} from 'app-shared/content-shared/entries/entries-store/entries-store.service';

@Component({
    selector: 'kEntryMetadata',
    templateUrl: './entry-metadata.component.html',
    styleUrls: ['./entry-metadata.component.scss'],
    providers: [
        EntriesStore,
        { provide: EntriesManualExecutionModeToken, useValue: false}
    ]
})
export class EntryMetadata implements AfterViewInit, OnInit, OnDestroy {

    private _categoriesLocked = false;
    private _searchCategoriesSubscription : ISubscription;
    private _searchTagsSubscription : ISubscription;
    public _categoriesProvider = new Subject<SuggestionsProviderData>();
    public _tagsProvider = new Subject<SuggestionsProviderData>();
    public _kmcPermissions = KMCPermissions;
	public _jumpToMenu: MenuItem[] = [];
	@ViewChild('categoriesPopup', { static: true }) public categoriesPopup: PopupWidgetComponent;
	private _popupStateChangeSubscribe: ISubscription;
    @ViewChildren(JumpToSection) private _jumpToSectionQuery : QueryList<JumpToSection> = null;

	@ViewChild('metadataContainer', { static: true })
	public _container: ElementRef;

    @ViewChild('nameField', { static: true }) private nameField: ElementRef;

    private _categoriesTooltipPipe: CategoryTooltipPipe;
    public _categoriesTooltipResolver = (value: any) => {
        return this._categoriesTooltipPipe.transform(value);
    };

    public get _categoriesErrorMessage(): string {
        const limit = this._permissionsService.hasPermission(KMCPermissions.FEATURE_DISABLE_CATEGORY_LIMIT)
            ? subApplicationsConfig.contentEntriesApp.maxLinkedCategories.extendedLimit
            : subApplicationsConfig.contentEntriesApp.maxLinkedCategories.defaultLimit;
        return this._appLocalization.get('applications.content.entryDetails.metadata.maxCategoriesLinked', [limit]);
    }

    constructor(public _widgetService: EntryMetadataWidget,
                private _pageScrollService: PageScrollService,
                private _appLocalization: AppLocalization,
                private _browserService: BrowserService,
                private _permissionsService: KMCPermissionsService,
                private _categoriesStatusMonitorService: CategoriesStatusMonitorService,
                @Inject(DOCUMENT) private document: any) {
        this._categoriesTooltipPipe  = new CategoryTooltipPipe(this._appLocalization);
    }

    ngOnInit() {
        this._widgetService.attachForm();

        this._widgetService.data$.subscribe(
            data => {
                if (data) {
                    setTimeout(()=>{
                        if (this.nameField) {
                            this.nameField.nativeElement.focus(); // use timeout to allow data binding of ngIf to update the DOM
                        }
                    },0);

                }
            }
        );

        this._categoriesStatusMonitorService.status$
		    .pipe(cancelOnDestroy(this))
		    .subscribe((status: CategoriesStatus) => {
                this._categoriesLocked = status.lock;
            });
    }

    _searchTags(event) : void {
        this._tagsProvider.next({ suggestions : [], isLoading : true});

        if (this._searchTagsSubscription)
        {
            // abort previous request
            this._searchTagsSubscription.unsubscribe();
            this._searchTagsSubscription = null;
        }

        this._searchTagsSubscription = this._widgetService.searchTags(event.query).subscribe(data => {
                const suggestions = [];
                const entryTags = this._widgetService.metadataForm.value.tags || [];

                (data|| []).forEach(suggestedTag => {
                    const isSelectable = !entryTags.find(tag => {
                        return tag === suggestedTag;
                    });
                    suggestions.push({ item: suggestedTag, isSelectable: isSelectable});
                });
                this._tagsProvider.next({suggestions: suggestions, isLoading: false});
            },
            (err) => {
                this._tagsProvider.next({ suggestions : [], isLoading : false, errorMessage : <any>(err.message || err)});
            });
    }

    _searchCategories(event) : void {
        this._categoriesProvider.next({ suggestions : [], isLoading : true});

        if (this._searchCategoriesSubscription)
        {
            // abort previous request
            this._searchCategoriesSubscription.unsubscribe();
            this._searchCategoriesSubscription = null;
        }

        this._searchCategoriesSubscription = this._widgetService.searchCategories(event.query).subscribe(data => {
                const suggestions = [];
                const entryCategories = this._widgetService.metadataForm.value.categories || [];


                (data|| []).forEach(suggestedCategory => {
                    const label = suggestedCategory.fullName + (suggestedCategory.referenceId ? ` (${suggestedCategory.referenceId})` : '');

                    const isSelectable = !entryCategories.find(category => {
                        return category.id === suggestedCategory.id;
                    });


                    suggestions.push({ name: label, isSelectable: isSelectable, item : suggestedCategory});
                });
                this._categoriesProvider.next({suggestions: suggestions, isLoading: false});
            },
            (err) => {
                this._categoriesProvider.next({ suggestions : [], isLoading : false, errorMessage : <any>(err.message || err)});
            });
    }

    ngOnDestroy() {
        this._tagsProvider.complete();
        this._categoriesProvider.complete();
        this._searchTagsSubscription && this._searchTagsSubscription.unsubscribe();
        this._searchCategoriesSubscription && this._searchCategoriesSubscription.unsubscribe();
	    this._popupStateChangeSubscribe && this._popupStateChangeSubscribe.unsubscribe();

        this._widgetService.detachForm();
    }

    private _updateJumpToSectionsMenu()
    {
        const jumpToItems: any[] = [];

        this._jumpToSectionQuery.forEach(section =>
        {
            const jumpToLabel = section.label;
            jumpToItems.push({
                label: jumpToLabel,
                command: (event) => {
                    this._jumpTo(section.htmlElement);
                }
            });

        });

        setTimeout(() =>{
            this._jumpToMenu = jumpToItems;
        });
    }

    ngAfterViewInit() {

	    if (this.categoriesPopup) {
		    this._popupStateChangeSubscribe = this.categoriesPopup.state$
			    .subscribe(event => {
				    if (event.state === PopupWidgetStates.Close) {
					    if (event.context && event.context.isDirty){
						   this._widgetService.setDirty();
					    }
				    }
			    });
	    }

        this._jumpToSectionQuery.changes
            .pipe(cancelOnDestroy(this))
            .subscribe((query) => {
                this._updateJumpToSectionsMenu();
        });

        this._updateJumpToSectionsMenu();
    }

    _updateEntryCategories($event : any) : void{
        if ($event && $event instanceof Array)
        {
            this._widgetService.metadataForm.patchValue({ categories : $event});
            this._widgetService.metadataForm.get('categories').markAsTouched();
        }
    }

    private _jumpTo(element : HTMLElement){
        let pageScrollInstance: PageScrollInstance = PageScrollInstance.newInstance({
         document : this.document,
            scrollTarget : element,
            pageScrollOffset: 105
        });
        this._pageScrollService.start(pageScrollInstance);
    }

    openCategoriesBrowser(){
        if (this._categoriesLocked){
            this._browserService.alert({
                header: this._appLocalization.get('applications.content.categories.categoriesLockTitle'),
                message: this._appLocalization.get('applications.content.categories.categoriesLockMsg')
            });
        }else{
            this.categoriesPopup.open();
        }
    }


}

