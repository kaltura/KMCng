import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AreaBlockerMessage, StickyComponent } from '@kaltura-ng/kaltura-ui';
import { CategoriesStatusMonitorService, CategoriesStatus } from '../../categories-status/categories-status-monitor.service';
import { EntriesFilters, EntriesStore, SortDirection } from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { EntriesTableColumns } from 'app-shared/content-shared/entries/entries-table/entries-table.component';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { KalturaEntryStatus, KalturaMediaEntry, KalturaMediaType, KalturaSourceType } from 'kaltura-ngx-client';
import { CategoriesModes } from 'app-shared/content-shared/categories/categories-mode-type';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { Menu } from 'primeng/menu';
import { EntriesRefineFiltersService, RefineGroup } from 'app-shared/content-shared/entries/entries-store/entries-refine-filters.service';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { ViewCategoryEntriesService } from 'app-shared/kmc-shared/events/view-category-entries';
import { ReachAppViewService, ReachPages } from 'app-shared/kmc-shared/kmc-views/details-views';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { MenuItem } from 'primeng/api';
import { EntriesSearchFiltersComponent } from "app-shared/content-shared/entries/entries-search-filters/entries-search-filters.component";
import { filter } from 'rxjs/operators';
import { first } from 'rxjs/operators';

export interface CustomMenuItem extends MenuItem {
    metadata?: any;
    commandName: string;
    command?: (args?: any) => void;
}

@Component({
  selector: 'kEntriesList',
  templateUrl: './entries-list.component.html',
  styleUrls: ['./entries-list.component.scss'],
    providers: [EntriesRefineFiltersService]
})
export class EntriesListComponent implements OnInit, OnDestroy, OnChanges {
    @Input() showReload = true;
    @Input() selectedEntries: any[] = [];
    @Input() columns: EntriesTableColumns | null;
    @Input() rowActions: { label: string, commandName: string, styleClass: string }[];
    @Input() enforcedFilters: Partial<EntriesFilters>;
    @Input() defaultFilters: Partial<EntriesFilters>;
    @Input() showEnforcedFilters = false;

    @ViewChild('tags', { static: true }) private tags: StickyComponent;
    @ViewChild('actionsmenu', { static: true }) private actionsMenu: Menu;
    @ViewChild('entriesSearchFilter', { static: true }) private entriesSearchFilter: EntriesSearchFiltersComponent;

  @Output() onActionsSelected = new EventEmitter<{ action: string, entry: KalturaMediaEntry }>();

    public _isBusy = false;
    public _blockerMessage: AreaBlockerMessage = null;
    public _tableIsBusy = false;
    public _tableBlockerMessage: AreaBlockerMessage = null;
    public _refineFilters: RefineGroup[];
    public _entriesDuration = 0;
    public _items: CustomMenuItem[];

    public _categoriesUpdating = false;
    public _isTagsBarVisible = false;

    public _query = {
        freetext: '',
        freetextSearchField: '',
        includeCaptions: false,
        createdAfter: null,
        createdBefore: null,
        pageIndex: 0,
        pageSize: null,
        sortBy: null,
        sortDirection: null,
        categories: [],
        categoriesMode: null
    };
    public searchFieldsTooltip = '';

    constructor(public _entriesStore: EntriesStore,
                private _entriesRefineFilters: EntriesRefineFiltersService,
                private _appLocalization: AppLocalization,
                private _browserService: BrowserService,
                private _permissionsService: KMCPermissionsService,
                private _reachAppViewService: ReachAppViewService,
                private _categoriesStatusMonitorService: CategoriesStatusMonitorService,
                private _viewCategoryEntries: ViewCategoryEntriesService) {
  }

    ngOnInit() {
        this._categoriesStatusMonitorService.status$
		    .pipe(cancelOnDestroy(this))
		    .subscribe((status: CategoriesStatus) => {
                this._categoriesUpdating = status.update;
            });

      this._entriesStore.entries.data$
        .pipe(cancelOnDestroy(this))
        .pipe(filter(data => Array.isArray(data.items)))
        .subscribe(({ items }) => {
          this._entriesDuration = items.reduce((total, entry) => total + entry.duration, 0);
        });

        this._prepare();
    }

    ngOnChanges(changes)
    {
        if (typeof changes.enforcedFilters !== 'undefined' && changes.enforcedFilters.currentValue)
        {
            this._entriesStore.filter(changes.enforcedFilters.currentValue);
        }

        if (typeof changes.defaultFilters !== 'undefined' && changes.defaultFilters.currentValue)
        {
            this._entriesStore.filter(changes.defaultFilters.currentValue);
        }
    }

    private _hideMenuItems(entry: KalturaMediaEntry, { commandName }: { commandName: string }): boolean {
        const { sourceType, status, mediaType } = entry;
        const isReadyStatus = status === KalturaEntryStatus.ready;
        const isLiveStreamFlash = mediaType && mediaType === KalturaMediaType.liveStreamFlash;
        const isPreviewCommand = commandName === 'preview';
        const isViewCommand = commandName === 'view';
        const isKalturaLive = (sourceType === KalturaSourceType.liveStream || sourceType === KalturaSourceType.manualLiveStream || sourceType === KalturaSourceType.akamaiLive || sourceType === KalturaSourceType.akamaiUniversalLive);
        const isWebcast = isKalturaLive && entry.adminTags && entry.adminTags.indexOf('kms-webcast-event') !== -1;
        const isLiveDashboardCommand = commandName === 'liveDashboard';
        const isRealTimeAnalyticsCommand = commandName === 'realTimeAnalytics';
        const isWebcastAnalyticsCommand = commandName === 'webcastAnalytics';
        const cannotDeleteEntry = commandName === 'delete' && !this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_DELETE);
        const isCaptionRequestCommand = commandName === 'captionRequest';
        return !(
            (!isReadyStatus && isPreviewCommand) || // hide if trying to share & embed entry that isn't ready
            (!isReadyStatus && isLiveStreamFlash && isViewCommand) || // hide if trying to view live that isn't ready
            (isLiveDashboardCommand && !isKalturaLive) || // hide live-dashboard menu item for entry that isn't kaltura live
            (isRealTimeAnalyticsCommand && !isKalturaLive) || // hide real time analytics menu item for entry that isn't kaltura live
            (isWebcastAnalyticsCommand && !isWebcast) || // hide webcast analytics menu item for entry that isn't kaltura live webcast
            cannotDeleteEntry ||
            (isCaptionRequestCommand && !this._reachAppViewService.isAvailable({ entry, page: ReachPages.entry })) // hide caption request if not audio/video or if it is then if not ready or it's forbidden by permission
        );
    }

    private _buildMenu(entry: KalturaMediaEntry): void {
        this._items = this.rowActions
            .filter(item => this._hideMenuItems(entry, item))
            .map(action =>
                Object.assign({} as CustomMenuItem, action, {
                    command: ({ item }) => {
                        const actionAllowed = this._allowDrilldown(action.commandName, entry.mediaType, entry.status);
                        if (actionAllowed) {
                            this.onActionsSelected.emit({ action: action.commandName, entry });
                        }
                    }
                })
            );
    }

    public _openActionsMenu(evt: { event: any, entry: KalturaMediaEntry }): void {
        if (this.actionsMenu) {
            this._buildMenu(evt.entry);
            this.actionsMenu.toggle(evt.event);
        }
    }

    private _allowDrilldown(action: string, mediaType: KalturaMediaType, status: KalturaEntryStatus): boolean {
        if (action !== 'view') {
            return true;
        }

        const isLiveStream = mediaType && mediaType === KalturaMediaType.liveStreamFlash;
        const isReady = status !== KalturaEntryStatus.ready;
        return !(isLiveStream && isReady);
    }

    private _prepare(): void {
        // NOTICE: do not execute here any logic that should run only once.
        // this function will re-run if preparation failed. execute your logic
        // only once the filters were fetched successfully.

        this._isBusy = true;
        this._entriesRefineFilters.getFilters()
            .pipe(cancelOnDestroy(this))
            .pipe(first()) // only handle it once, no need to handle changes over time
            .subscribe(
                groups => {

                    this._entriesStore.preFilter$
                        .pipe(cancelOnDestroy(this))
                        .subscribe(
                            filters => {
                                if (this.enforcedFilters && !this.showEnforcedFilters) {
                                    Object.keys(this.enforcedFilters).forEach(filterName => {
                                        delete filters[filterName];
                                    });
                                }
                            }
                        );

                    this._isBusy = false;
                    this._refineFilters = this.showEnforcedFilters ? this._mapEnforcedTags(groups) : groups;
                    this._restoreFiltersState();
                    this._registerToFilterStoreDataChanges();
                    this._registerToDataChanges();
                    this._applyCategoryFilter();
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
                                this._entriesStore.reload();
                            }
                        }
                        ]
                    });
                });
    }

    private _mapEnforcedTags(groups: RefineGroup[]): RefineGroup[] {
        if (!this.enforcedFilters) {
            return groups;
        }

        const enforcedFiltersKeys = Object.keys(this.enforcedFilters);
        const defaultFilters = groups.find(({ label }) => label === '');
        const defaultFiltersIndex = groups.indexOf(defaultFilters);

        if (defaultFiltersIndex === -1) {
            return groups;
        }

        groups.splice(defaultFiltersIndex, 1);

        defaultFilters.lists.forEach(list => {
            const relevantFilterValues = enforcedFiltersKeys.indexOf(list.name) !== -1 ? this.enforcedFilters[list.name] : null;
            if (relevantFilterValues) {
                list.items.forEach(item => {
                    item.disabled = relevantFilterValues.indexOf(item.value) !== -1;
                });
            }
        });

        return [defaultFilters, ...groups];
    }

    private _applyCategoryFilter(): void {
      setTimeout(() => { // run code in the next event loop to show actual value of the filter in the tags
        const categoryId = this._viewCategoryEntries.popCategoryId();
        if (categoryId) {
          this.onCategorySelected(categoryId);
        }
      }, 0);
    }

    private _registerToDataChanges(): void {
        this._entriesStore.entries.state$
            .pipe(cancelOnDestroy(this))
            .subscribe(
                result => {

                    this._tableIsBusy = result.loading;

                    if (result.errorMessage) {
                        this._tableBlockerMessage = new AreaBlockerMessage({
                            message: result.errorMessage || 'Error loading entries',
                            buttons: [{
                                label: this._appLocalization.get('app.common.retry'),
                                action: () => {
                                    this._tableBlockerMessage = null;
                                    this._entriesStore.reload();
                                }
                            }
                            ]
                        })
                    } else {
                        this._tableBlockerMessage = null;
                    }
                },
                error => {
                    console.warn('[kmcng] -> could not load entries'); // navigate to error page
                    throw error;
                });
    }

  private _restoreFiltersState(): void {
    this._updateComponentState(this._entriesStore.cloneFilters([
      'freetext',
      'includeCaptions',
      'freetextSearchField',
      'pageSize',
      'pageIndex',
      'sortBy',
      'sortDirection',
      'categories',
      'categoriesMode'
    ]));
  }

  private _updateComponentState(updates: Partial<EntriesFilters>): void {
    if (typeof updates.freetext !== 'undefined') {
      this._query.freetext = updates.freetext || '';
    }

    if (typeof updates.includeCaptions !== 'undefined') {
      this._query.includeCaptions = updates.includeCaptions || false;
    }
    if (typeof updates.freetextSearchField !== 'undefined') {
      this._query.freetextSearchField = updates.freetextSearchField || '';
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

  onClearAllTags() {
    this.searchFieldsTooltip = '';
    this.entriesSearchFilter.reset();
  }
  onCategoriesModeChanged(categoriesMode) {
    this._entriesStore.filter({
      categoriesMode
    })
  }

  onCategoriesUnselected(categoriesToRemove: number[]) {
    const categories = this._entriesStore.cloneFilter('categories', []);

    categoriesToRemove.forEach(categoryToRemove => {
      const categoryIndex = categories.findIndex(item => item === categoryToRemove);
      if (categoryIndex !== -1) {
        categories.splice(
          categoryIndex,
          1
        );
      }
    });
    this._entriesStore.filter({ categories });
  }

    onCategorySelected(category: number){
        const categories = this._entriesStore.cloneFilter('categories', []);
        if (!categories.find(item => item === category)) {

            categories.push(category);
            this._entriesStore.filter({'categories': categories});
        }
    }

  private _registerToFilterStoreDataChanges(): void {
    this._entriesStore.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(({ changes }) => {
        this._updateComponentState(changes);
        this.clearSelection();
        this._browserService.scrollToTop();
      });
  }

  onFreetextChanged(): void {
      // prevent searching for empty strings
      if (this._query.freetext.length > 0 && this._query.freetext.trim().length === 0){
          this._query.freetext = '';
      }else {
          this._entriesStore.filter({freetext: this._query.freetext, freetextSearchField: this._query.freetextSearchField, includeCaptions: this._query.includeCaptions});
      }
  }

  onSortChanged(event) {
      if (event.field !== this._query.sortBy || event.order !== this._query.sortDirection) {
          this._entriesStore.filter({
              sortBy: event.field,
              sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
          });
      }
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
      this.actionsMenu.hide();
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

    public applySearchFields(fields: {selectedSearchField: string, includeCaptions: boolean}): void {
        if (fields.selectedSearchField === 'all') {
            this.searchFieldsTooltip = '';
            this._query.freetextSearchField = '';
            this._query.includeCaptions = fields.includeCaptions === true;
        } else {
            this._query.freetextSearchField = fields.selectedSearchField;
            this.searchFieldsTooltip = this._appLocalization.get('applications.content.filters.searchFields.tooltips.' + fields.selectedSearchField);
        }
        if (this._query.freetext) {
            this._entriesStore.filter({
                freetext: this._query.freetext,
                freetextSearchField: this._query.freetextSearchField,
                includeCaptions: this._query.includeCaptions
            });
        }

    }
}

