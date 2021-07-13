import {KalturaCategory} from 'kaltura-ngx-client';
import {AreaBlockerMessage, StickyComponent} from '@kaltura-ng/kaltura-ui';
import {CategoriesFilters, CategoriesService, SortDirection} from '../categories.service';
import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {CategoriesUtilsService} from '../../categories-utils.service';
import {PopupWidgetComponent, PopupWidgetStates} from '@kaltura-ng/kaltura-ui';
import { observeOn } from 'rxjs/operators';
import {CategoriesModes} from "app-shared/content-shared/categories/categories-mode-type";
import {CategoriesRefineFiltersService, RefineGroup} from '../categories-refine-filters.service';
import {
  CategoriesStatus,
  CategoriesStatusMonitorService
} from 'app-shared/content-shared/categories-status/categories-status-monitor.service';
import { AppEventsService } from 'app-shared/kmc-shared';
import { ViewCategoryEntriesEvent } from 'app-shared/kmc-shared/events/view-category-entries/view-category-entries.event';
import { KMCPermissions } from 'app-shared/kmc-shared/kmc-permissions';
import {
    ContentCategoryViewSections,
    ContentCategoryViewService,
    ReachAppViewService, ReachPages
} from 'app-shared/kmc-shared/kmc-views/details-views';
import { ContentNewCategoryViewService } from 'app-shared/kmc-shared/kmc-views/details-views/content-new-category-view.service';
import { asyncScheduler } from 'rxjs';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { ContentCategoriesMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { first } from 'rxjs/operators';

@Component({
  selector: 'kCategoriesList',
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.scss'],
    providers: [
        CategoriesRefineFiltersService,
        KalturaLogger.createLogger('CategoriesListComponent')
    ]
})

export class CategoriesListComponent implements OnInit, OnDestroy, AfterViewInit {

    public _selectedCategories: KalturaCategory[] = [];
    public _selectedCategoryToMove: KalturaCategory;
    public _categoriesTotalCount: number = null;
    public _linkedEntries: { entryId: string }[] = [];
    @ViewChild('moveCategory', { static: true }) moveCategoryPopup: PopupWidgetComponent;
    @ViewChild('addNewCategory', { static: true }) addNewCategory: PopupWidgetComponent;
    public _categoriesLocked = false;
    public _categoriesUpdating = false;
    public _kmcPermissions = KMCPermissions;


  @ViewChild('tags', { static: true }) private tags: StickyComponent;

    public _isBusy = false;
    public _blockerMessage: AreaBlockerMessage = null;
    public _isReady = false; // prevents from calling prepare function twice
    public _tableIsBusy = false;
    public _tableBlockerMessage: AreaBlockerMessage = null;
    public _refineFilters: RefineGroup[];

    public _query = {
        freetext: '',
        pageIndex: 0,
        pageSize: null,
        sortBy: null,
        sortDirection: null,
        categories: [],
        categoriesMode: null
    };

    constructor(public _categoriesService: CategoriesService,
                private router: Router,
                private _refineFiltersService: CategoriesRefineFiltersService,
                private _browserService: BrowserService,
                private _appLocalization: AppLocalization,
                private _categoriesUtilsService: CategoriesUtilsService,
                public _contentNewCategoryView: ContentNewCategoryViewService,
                private _categoriesStatusMonitorService: CategoriesStatusMonitorService,
                private _contentCategoryView: ContentCategoryViewService,
                private _contentCategoriesMainViewService: ContentCategoriesMainViewService,
                private _appEvents: AppEventsService,
                private _reachAppViewService: ReachAppViewService,
                private _logger: KalturaLogger) {
    }

    ngOnInit() {
        if (this._contentCategoriesMainViewService.viewEntered()) {
            this._categoriesStatusMonitorService.status$
                .pipe(cancelOnDestroy(this))
                .subscribe((status: CategoriesStatus) => {
                    if (this._categoriesLocked && status.lock === false){
                        // categories were locked and now open - reload categories to reflect changes
                        this._reload();
                    }
                    this._categoriesLocked = status.lock;
                    this._categoriesUpdating = status.update;
                });

            this._prepare();
        }
    }

    private _prepare(): void {

        // NOTICE: do not execute here any logic that should run only once.
        // this function will re-run if preparation failed. execute your logic
        // only once the filters were fetched successfully.
        if (this._isReady) {
          return undefined;
        }

        this._isBusy = true;
        this._refineFiltersService.getFilters()
            .pipe(cancelOnDestroy(this))
            .pipe(first()) // only handle it once, no need to handle changes over time
            .subscribe(
                groups => {

                    this._categoriesService.categories.data$
                        .pipe(cancelOnDestroy(this))
                        .subscribe(response => {
                            this._categoriesTotalCount = response.totalCount;
                        });


                    this._isBusy = false;
                    this._isReady = true;
                    this._refineFilters = groups;
                    this._restoreFiltersState();
                    this._registerToFilterStoreDataChanges();
                    this._registerToDataChanges();
                },
                error => {
                    this._isBusy = false;
                    this._blockerMessage = new AreaBlockerMessage({
                        message: this._appLocalization.get('applications.content.filters.errorLoading'),
                        buttons: [{
                            label: this._appLocalization.get('app.common.retry'),
                            action: () => {
                                this._blockerMessage = null;
                                this._prepare();
                                this._categoriesService.reload();
                            }
                        }
                        ]
                    })
                });
    }

    private _registerToDataChanges(): void {
        this._categoriesService.categories.state$
            .pipe(observeOn(asyncScheduler))
            .pipe(cancelOnDestroy(this))
            .subscribe(
                result => {
                  this._clearSelection();

                    this._tableIsBusy = result.loading;

                    if (result.errorMessage) {
                        this._tableBlockerMessage = new AreaBlockerMessage({
                            message: result.errorMessage || 'Error loading categories',
                            buttons: [{
                                label: this._appLocalization.get('app.common.retry'),
                                action: () => {
                                    this._tableBlockerMessage = null;
                                    this._categoriesService.reload();
                                }
                            }
                            ]
                        })
                    } else {
                        this._tableBlockerMessage = null;
                    }
                },
                error => {
                    console.warn('[kmcng] -> could not load categories'); // navigate to error page
                    throw error;
                });
    }

    ngAfterViewInit() {

        this.addNewCategory.state$
            .pipe(cancelOnDestroy(this))
            .subscribe(event => {
                if (event.state === PopupWidgetStates.BeforeClose) {
                    this._linkedEntries = [];
                }
            });

        const newCategoryData = this._contentNewCategoryView.popNewCategoryData();
        if (newCategoryData) {
            this._linkedEntries = newCategoryData.entries.map(entry => ({entryId: entry.id}));
            this.addNewCategory.open();
        }
    }

    private _restoreFiltersState(): void {
        this._updateComponentState(this._categoriesService.cloneFilters(
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

    private _updateComponentState(updates: Partial<CategoriesFilters>): void {
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
            this._query.categoriesMode = updates.categoriesMode === CategoriesModes.Self ? CategoriesModes.Self : CategoriesModes.SelfAndChildren;
        }

        if (typeof updates.categories !== 'undefined') {
            this._query.categories = [...updates.categories];
        }
    }

    onCategoriesModeChanged(categoriesMode)
    {
        this._categoriesService.filter({
            categoriesMode
        })
    }

    onCategoriesUnselected(categoriesToRemove: number[]) {
        const categories = this._categoriesService.cloneFilter('categories', []);

        categoriesToRemove.forEach(categoryToRemove => {
            const categoryIndex = categories.findIndex(item => item === categoryToRemove);
            if (categoryIndex !== -1) {
                categories.splice(
                    categoryIndex,
                    1
                );
            }
        });
        this._categoriesService.filter({categories});
    }

    onCategorySelected(category: number){
        const categories = this._categoriesService.cloneFilter('categories', []);
        if (!categories.find(item => item === category)) {
            categories.push(category);
            this._categoriesService.filter({'categories': categories});
        }
    }


    private _registerToFilterStoreDataChanges(): void {
        this._categoriesService.filtersChange$
            .pipe(cancelOnDestroy(this))
            .subscribe(({changes}) => {
                this._updateComponentState(changes);
                this._clearSelection();
                this._browserService.scrollToTop();
            });
    }

    ngOnDestroy() {
    }

    public _reload() {
        this._logger.info(`handle reload action by user`);
        this._clearSelection();
        this._categoriesService.reload();
    }

    _clearSelection() {
        this._logger.info(`handle clear selection action by user`);
        this._selectedCategories = [];
    }

    _onSortChanged(event): void {
        if (event.field !== this._query.sortBy || event.order !== this._query.sortDirection) {
            this._categoriesService.filter({
                sortBy: event.field,
                sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
            });
        }
    }

    _onPaginationChanged(state: any): void {
        if (state.page !== this._query.pageIndex || state.rows !== this._query.pageSize) {
            this._categoriesService.filter({
                pageIndex: state.page,
                pageSize: state.rows
            });
        }
    }

    _onActionSelected({action, category}: { action: string, category: KalturaCategory }) {
        switch (action) {
            case 'edit':
                this._logger.info(`handle edit action by user`, { categoryId: category.id });
                this._contentCategoryView.open({ category, section: ContentCategoryViewSections.Metadata });
                break;
            case 'analytics':
                this.router.navigate(['analytics/category'], { queryParams: { id: category.id } });
                break;
            case 'delete':
                this.deleteCategory(category);
                break;
            case 'moveCategory':
                this._logger.info(`handle move category action by user`, { categoryId: category.id });
                // show category edit warning if needed
                if (category.tags && category.tags.indexOf('__EditWarning') > -1) {
                    this._logger.info(`category has '__EditWarning' tag, show confirmation`);
                    this._browserService.confirm(
                        {
                            header: this._appLocalization.get('applications.content.categories.editCategory'),
                            message: this._appLocalization.get('applications.content.categories.editWithEditWarningTags'),
                            accept: () => {
                                this._logger.info(`user confirmed, proceed action`);
                                this._selectedCategoryToMove = category;
                                this.moveCategoryPopup.open();
                            },
                            reject: () => {
                                this._logger.info(`user didn't confirm, abort action`);
                            }
                        }
                    );
                } else {
                    this._selectedCategoryToMove = category;
                    this.moveCategoryPopup.open();
                }
                break;
            case 'viewEntries':
                this._logger.info(`handle view entries action by user`, { categoryId: category.id });
                this._logger.debug(`publish 'ViewCategoryEntriesEvent' event`);
              this._appEvents.publish(new ViewCategoryEntriesEvent(category.id));
              break;
            case 'addServiceRule':
                this._logger.info(`handle add service rule action by user`, { categoryId: category.id });
                this._logger.debug(`publish 'CaptionRequestEvent' event`);
                this._reachAppViewService.open({
                    category,
                    page: ReachPages.category
                });
                break;
            default:
                break;
        }
    }

    private deleteCategory(category: KalturaCategory): void {
        this._logger.info(`handle delete category action by user`);
        this._categoriesUtilsService.confirmDelete(category)
            .pipe(cancelOnDestroy(this))
            .subscribe(result => {
                    if (result.confirmed) {
                        this._logger.info(`handle delete category request`);
                        this._blockerMessage = null;
                        this._categoriesService.deleteCategory(category.id)
                            .pipe(cancelOnDestroy(this))
                            .pipe(tag('block-shell'))
                            .subscribe(
                                () => {
                                    this._logger.info(`handle successful delete category request`);
                                    this._categoriesStatusMonitorService.updateCategoriesStatus();
                                    this._categoriesService.reload();
                                },
                                error => {
                                    this._logger.warn(`handle failed delete category request`, { errorMessage: error.message });
                                    this._browserService.alert({
                                        header: this._appLocalization.get('applications.content.categories.errors.deleteError.header'),
                                        message: this._appLocalization.get('applications.content.categories.errors.deleteError.message')
                                    });
                                }
                            );
                    }
                },
                error => {
                    this._logger.warn(`handle failed delete category request`, { errorMessage: error.message });
                    this._browserService.alert({
                        header: this._appLocalization.get('applications.content.categories.errors.deleteError.header'),
                        message: this._appLocalization.get('applications.content.categories.errors.deleteError.message')
                    });
                });
    }


    onBulkChange(event): void {
        if (event.reload === true) {
            this._reload();
        }
    }

    onFreetextChanged(): void {
        // prevent searching for empty strings
        if (this._query.freetext.length > 0 && this._query.freetext.trim().length === 0){
            this._query.freetext = '';
        }else {
            this._categoriesService.filter({freetext: this._query.freetext});
        }
    }

    onTagsChange() {
        this.tags.updateLayout();
    }

    onCategoryAdded(category: KalturaCategory): void {
        this._logger.info(`handle category added event`);
        if (!category) {
            this._logger.info('no category provided, abort action');
        } else {
            this._categoriesService.reload();
            // use a flag so the categories will be refreshed upon clicking 'back' from the category page
            this._contentCategoryView.open({ category, section: ContentCategoryViewSections.Metadata });
        }
    }
}
