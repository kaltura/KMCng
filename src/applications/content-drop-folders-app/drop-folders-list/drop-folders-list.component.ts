import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DropFoldersFilters, DropFoldersStoreService, SortDirection } from '../drop-folders-store/drop-folders-store.service';
import { Router } from '@angular/router';
import { subApplicationsConfig } from 'config/sub-applications';
import { KalturaDropFolderFile } from 'kaltura-ngx-client';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { StickyComponent } from '@kaltura-ng/kaltura-ui';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { DropFoldersRefineFiltersService, RefineList } from '../drop-folders-store/drop-folders-refine-filters.service';
import { ContentEntryViewSections, ContentEntryViewService } from 'app-shared/kmc-shared/kmc-views/details-views';
import { ContentDropFoldersMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { RefineGroup } from 'app-shared/content-shared/entries/entries-store/entries-refine-filters.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'kDropFoldersList',
  templateUrl: './drop-folders-list.component.html',
  styleUrls: ['./drop-folders-list.component.scss'],
    providers: [DropFoldersRefineFiltersService]
})

export class DropFoldersListComponent implements OnInit, OnDestroy {
  @ViewChild('tags', { static: true }) private _tags: StickyComponent;

    public _isBusy = false;
    public _blockerMessage: AreaBlockerMessage = null;
    public _tableIsBusy = false;
    public _tableBlockerMessage: AreaBlockerMessage = null;
    public _refineFilters: RefineGroup[];
  public _selectedDropFolders: KalturaDropFolderFile[] = [];
  public _query = {
    freeText: '',
    pageIndex: 0,
    pageSize: null, // pageSize is set to null by design. It will be modified after the first time loading drop folders
    sortBy: 'createdAt',
    sortDirection: SortDirection.Desc
  };

  constructor(public _dropFoldersStore: DropFoldersStoreService,
              private _refineFiltersService: DropFoldersRefineFiltersService,
              private _appLocalization: AppLocalization,
              private _router: Router,
              private _contentEntryViewService: ContentEntryViewService,
              private _contentDropFoldersMainView: ContentDropFoldersMainViewService,
              private _browserService: BrowserService) {
  }

  ngOnInit() {
      if (this._contentDropFoldersMainView.viewEntered()) {
          this._prepare();
      }
  }

  ngOnDestroy() {
  }

    private _prepare(): void {

        // NOTICE: do not execute here any logic that should run only once.
        // this function will re-run if preparation failed. execute your logic
        // only once the filters were fetched successfully.

        this._isBusy = true;
        this._refineFiltersService.getFilters()
            .pipe(cancelOnDestroy(this))
            .pipe(first()) // only handle it once, no need to handle changes over time
            .subscribe(
                filters => {
                    this._isBusy = false;
                    this._refineFilters = filters;
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
                                this._dropFoldersStore.reload();
                            }
                        }
                        ]
                    });
                });
    }

    private _registerToDataChanges(): void {
        this._dropFoldersStore.dropFolders.state$
            .pipe(cancelOnDestroy(this))
            .subscribe(
                result => {

                    this._tableIsBusy = result.loading;

                    if (result.errorMessage) {
                        this._tableBlockerMessage = new AreaBlockerMessage({
                            message: result.errorMessage || 'Error loading drop folders',
                            buttons: [{
                                label: 'Retry',
                                action: () => {
                                    this._tableBlockerMessage = null;
                                    this._dropFoldersStore.reload();
                                }
                            }
                            ]
                        });
                    } else {
                        this._tableBlockerMessage = null;
                    }
                },
                error => {
                    console.warn('[kmcng] -> could not load drop folders'); // navigate to error page
                    throw error;
                });
    }

  private _restoreFiltersState(): void {
    this._updateComponentState(this._dropFoldersStore.cloneFilters(
      [
        'pageSize',
        'pageIndex',
        'freeText',
        'sortBy',
        'sortDirection'
      ]
    ));
  }

  private _updateComponentState(updates: Partial<DropFoldersFilters>): void {
    if (typeof updates.freeText !== 'undefined') {
      this._query.freeText = updates.freeText || '';
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
  }

  private _registerToFilterStoreDataChanges(): void {
    this._dropFoldersStore.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(({ changes }) => {
        this._updateComponentState(changes);
        this._clearSelection();
        this._browserService.scrollToTop();
      });
  }

  private _deleteDropFiles(ids: number[]): void {
    const execute = () => {
      this._dropFoldersStore.deleteDropFiles(ids)
        .pipe(cancelOnDestroy(this))
        .pipe(tag('block-shell'))
        .subscribe(
          () => {
            this._dropFoldersStore.reload();
            this._clearSelection();
          },
          error => {
            this._blockerMessage = new AreaBlockerMessage({
              message: this._appLocalization.get('applications.content.dropFolders.errors.errorDropFoldersFiles'),
              buttons: [
                {
                  label: this._appLocalization.get('app.common.retry'),
                  action: () => {
                    this._blockerMessage = null;
                    this._deleteDropFiles(ids);
                  }
                },
                {
                  label: this._appLocalization.get('app.common.cancel'),
                  action: () => {
                    this._blockerMessage = null;
                  }
                }
              ]
            });
          }
        );
    };

    if (ids.length > subApplicationsConfig.shared.bulkActionsLimit) {
      this._browserService.confirm({
        header: this._appLocalization.get('applications.content.bulkActions.note'),
        message: this._appLocalization.get('applications.content.bulkActions.confirmDropFolders', { '0': ids.length }),
        accept: () => execute()
      });
    } else {
      execute();
    }
  }

  public _bulkDelete(_selectedDropFolders: KalturaDropFolderFile[]): void {
    const dropFolderFilesToDelete = _selectedDropFolders.map((file, index) => `${index + 1}: ${(file.fileName)}`);
    const dropFolderFiles = _selectedDropFolders.length <= 10 ? dropFolderFilesToDelete.join(',').replace(/,/gi, '\n') : '';
    this._browserService.confirm({
      header: this._appLocalization.get('applications.content.dropFolders.deleteFiles'),
      message: this._appLocalization.get('applications.content.dropFolders.confirmDelete', { 0: dropFolderFiles }),
      accept: () => {
        setTimeout(() => {
          this._deleteDropFiles(_selectedDropFolders.map(file => file.id));
        }, 0);
      }
    });
  }

  public _clearSelection(): void {
    this._selectedDropFolders = [];
  }

  public _onFreetextChanged(): void {
      // prevent searching for empty strings
      if (this._query.freeText.length > 0 && this._query.freeText.trim().length === 0){
          this._query.freeText = '';
      }else {
          this._dropFoldersStore.filter({freeText: this._query.freeText});
      }
  }

  public _onSortChanged(event): void {
      if (event.field !== this._query.sortBy || event.order !== this._query.sortDirection) {
          this._dropFoldersStore.filter({
              sortBy: event.field,
              sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
          });
      }
  }

  public _reload(): void {
    this._clearSelection();
    this._dropFoldersStore.reload();
  }

  public _navigateToEntry(entryId: string): void {
      this._dropFoldersStore.isEntryExist(entryId)
          .pipe(cancelOnDestroy(this))
          .pipe(tag('block-shell'))
          .subscribe(() => {
              this._contentEntryViewService.openById(entryId, ContentEntryViewSections.Metadata);
          });
  }

  public _deleteDropFolderFiles(event): void {
    this._browserService.confirm({
      header: this._appLocalization.get('applications.content.dropFolders.deleteFiles'),
      message: this._appLocalization.get('applications.content.dropFolders.confirmDeleteSingle', {
        0: event.name ? event.name : event.fileName
      }),
      accept: () => this._deleteDropFiles([event.id])
    });
  }

  public _onPaginationChanged(state: any): void {
    if (state.page !== this._query.pageIndex || state.rows !== this._query.pageSize) {
      this._dropFoldersStore.filter({
        pageIndex: state.page,
        pageSize: state.rows
      });
    }
  }

  public _onTagsChange() {
    this._tags.updateLayout();
  }
}
