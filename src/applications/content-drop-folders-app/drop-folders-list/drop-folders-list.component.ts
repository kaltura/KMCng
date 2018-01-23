import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DropFoldersFilters, DropFoldersStoreService } from '../drop-folders-store/drop-folders-store.service';
import { Router } from '@angular/router';
import { environment } from 'app-environment';
import { KalturaDropFolderFile } from 'kaltura-ngx-client/api/types/KalturaDropFolderFile';
import { BrowserService } from 'app-shared/kmc-shell';
import { StickyComponent } from '@kaltura-ng/kaltura-ui/sticky/components/sticky.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui/area-blocker/area-blocker-message';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';
import { DropFoldersRefineFiltersService, RefineList } from '../drop-folders-store/drop-folders-refine-filters.service';

@Component({
  selector: 'kDropFoldersList',
  templateUrl: './drop-folders-list.component.html',
  styleUrls: ['./drop-folders-list.component.scss'],
    providers: [DropFoldersRefineFiltersService]
})

export class DropFoldersListComponent implements OnInit, OnDestroy {
  @ViewChild('tags') private _tags: StickyComponent;

    public _isBusy = false;
    public _blockerMessage: AreaBlockerMessage = null;
    public _tableIsBusy = false;
    public _tableBlockerMessage: AreaBlockerMessage = null;
    public _refineFilters: RefineList[];
  public _selectedDropFolders: KalturaDropFolderFile[] = [];
  public _query = {
    freeText: '',
    pageIndex: 0,
    pageSize: null // pageSize is set to null by design. It will be modified after the first time loading drop folders
  };

  constructor(public _dropFoldersStore: DropFoldersStoreService,
              private _refineFiltersService: DropFoldersRefineFiltersService,
              private _appLocalization: AppLocalization,
              private _router: Router,
              private _browserService: BrowserService) {
  }

  ngOnInit() {
    this._prepare();
  }

  ngOnDestroy() {
  }

    private _prepare(): void {

        // NOTICE: do not execute here any logic that should run only once.
        // this function will re-run if preparation failed. execute your logic
        // only once the filters were fetched successfully.

        this._isBusy = true;
        this._refineFiltersService.getFilters()
            .cancelOnDestroy(this)
            .first() // only handle it once, no need to handle changes over time
            .subscribe(
                lists => {
                    this._isBusy = false;
                    this._refineFilters = lists;
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
                    })
                });
    }

    private _registerToDataChanges(): void {
        this._dropFoldersStore.dropFolders.state$
            .cancelOnDestroy(this)
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
                        })
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
        'freeText'
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
  }

  private _registerToFilterStoreDataChanges(): void {
    this._dropFoldersStore.filtersChange$
      .cancelOnDestroy(this)
      .subscribe(({ changes }) => {
        this._updateComponentState(changes);
        this._clearSelection();
        this._browserService.scrollToTop();
      });
  }

  private _deleteDropFiles(ids: number[]): void {
    const execute = () => {
      this._dropFoldersStore.deleteDropFiles(ids)
        .cancelOnDestroy(this)
        .tag('block-shell')
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
            })
          }
        );
    };

    if (ids.length > environment.modules.dropFolders.bulkActionsLimit) {
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
    this._dropFoldersStore.filter({ freeText: this._query.freeText });
  }

  public _reload(): void {
    this._clearSelection();
    this._dropFoldersStore.reload();
  }

  public _navigateToEntry(entryId: string): void {
    this._dropFoldersStore.isEntryExist(entryId)
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(
        exists => {
          if (exists) {
            this._router.navigate(['/content/entries/entry', entryId]);
          }
        },
        ({ message }) => this._browserService.alert({ message })
      );
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
