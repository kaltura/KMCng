import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { subApplicationsConfig } from 'config/sub-applications';
import { PlaylistsFilters, PlaylistsStore, SortDirection } from '../playlists-store/playlists-store.service';
import { BulkDeleteService } from '../bulk-service/bulk-delete.service';
import { KalturaPlaylist } from 'kaltura-ngx-client';
import { StickyComponent } from '@kaltura-ng/kaltura-ui';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { PreviewAndEmbedEvent } from 'app-shared/kmc-shared/events';
import { AppEventsService } from 'app-shared/kmc-shared';
import { KMCPermissions } from 'app-shared/kmc-shared/kmc-permissions';
import { asyncScheduler } from 'rxjs';
import { ContentPlaylistViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-playlist-view.service';
import { ContentPlaylistViewService } from 'app-shared/kmc-shared/kmc-views/details-views';
import { ContentPlaylistsMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { observeOn } from 'rxjs/operators';

@Component({
  selector: 'kPlaylistsList',
  templateUrl: './playlists-list.component.html',
  styleUrls: ['./playlists-list.component.scss'],
  providers: [BulkDeleteService]
})
export class PlaylistsListComponent implements OnInit, OnDestroy {

	public _kmcPermissions = KMCPermissions;

	@ViewChild('addNewPlaylist', { static: true }) public addNewPlaylist: PopupWidgetComponent;
  @ViewChild('tags', { static: true }) private tags: StickyComponent;

    public _isBusy = false;
    public _blockerMessage: AreaBlockerMessage = null;
    public _tableIsBusy = false;
    public _tableBlockerMessage: AreaBlockerMessage = null;

  public _query = {
    freetext: '',
    createdAfter: null,
    createdBefore: null,
    pageIndex: 0,
    pageSize: null, // pageSize is set to null by design. It will be modified after the first time loading entries
    sortBy: 'createdAt',
    sortDirection: SortDirection.Desc
  };

  public _selectedPlaylists: KalturaPlaylist[] = [];

  constructor(public _playlistsStore: PlaylistsStore,
              private _appLocalization: AppLocalization,
              private _router: Router,
              private _appEvents: AppEventsService,
              private _browserService: BrowserService,
              private _contentPlaylistsMainViewService: ContentPlaylistsMainViewService,
              private _contentPlaylistViewService: ContentPlaylistViewService,
              public _bulkDeleteService: BulkDeleteService) {
  }

  ngOnInit() {
    if (this._contentPlaylistsMainViewService.viewEntered()) {
        this._prepare();
    }
  }

  ngOnDestroy() {
  }

  private _prepare(): void {
      this._restoreFiltersState();
      this._registerToFilterStoreDataChanges();
      this._registerToDataChanges();
  }

  private _proceedDeletePlaylists(ids: string[]): void {
    this._bulkDeleteService.deletePlaylist(ids)
      .pipe(tag('block-shell'))
      .pipe(cancelOnDestroy(this))
      .subscribe(
        () => {
          this._playlistsStore.reload();
          this._clearSelection();
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage({
            message: this._appLocalization.get('applications.content.bulkActions.cannotDeletePlaylists'),
            buttons: [{
              label: this._appLocalization.get('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          });
        }
      );
  }

  private _deletePlaylist(ids: string[]): void {
    if (ids.length > subApplicationsConfig.shared.bulkActionsLimit) {
      this._browserService.confirm(
        {
          header: this._appLocalization.get('applications.content.bulkActions.note'),
          message: this._appLocalization.get('applications.content.bulkActions.confirmPlaylists', { '0': ids.length }),
          accept: () => {
            this._proceedDeletePlaylists(ids);
          }
        }
      );
    } else {
      this._proceedDeletePlaylists(ids);
    }
  }

  private _deleteCurrentPlaylist(playlistId: string): void {
    this._playlistsStore.deletePlaylist(playlistId)
      .pipe(cancelOnDestroy(this))
      .pipe(tag('block-shell'))
      .subscribe(
        () => {
          this._clearSelection();
          this._playlistsStore.reload();
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage({
            message: error.message,
            buttons: [
              {
                label: this._appLocalization.get('app.common.retry'),
                action: () => {
                  this._blockerMessage = null;
                  this._deleteCurrentPlaylist(playlistId);
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
  }

  private _restoreFiltersState(): void {
    this._updateComponentState(this._playlistsStore.cloneFilters(
      [
        'freeText',
        'pageSize',
        'pageIndex',
        'sortBy',
        'sortDirection'
      ]
    ));
  }

  private _updateComponentState(updates: Partial<PlaylistsFilters>): void {
    if (typeof updates.freeText !== 'undefined') {
      this._query.freetext = updates.freeText || '';
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
    this._playlistsStore.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(({ changes }) => {
        this._updateComponentState(changes);
        this._clearSelection();
        this._browserService.scrollToTop();
      });
  }

    private _registerToDataChanges(): void {
        this._playlistsStore.playlists.state$
            .pipe(observeOn(asyncScheduler))
            .pipe(cancelOnDestroy(this))
            .subscribe(
                result => {

                    this._tableIsBusy = result.loading;

                    if (result.errorMessage) {
                        this._tableBlockerMessage = new AreaBlockerMessage({
                            message: result.errorMessage || 'Error loading playlists',
                            buttons: [{
                                label: 'Retry',
                                action: () => {
                                    this._tableBlockerMessage = null;
                                    this._playlistsStore.reload();
                                }
                            }
                            ]
                        })
                    } else {
                        this._tableBlockerMessage = null;
                    }
                },
                error => {
                    console.warn('[kmcng] -> could not load playlists'); // navigate to error page
                    throw error;
                });
    }

    private _openRaptAnalytics(id: string): void {
      this._router.navigate(['analytics/playlist'], { queryParams: { id } });
    }

  public _onTagsChange(): void {
    this.tags.updateLayout();
  }

  public _onActionSelected(event: { action: string, playlist: KalturaPlaylist }): void {
      switch (event.action) {
          case 'preview':
              this._appEvents.publish(new PreviewAndEmbedEvent(event.playlist));
              break;
          case 'view':
              this._contentPlaylistViewService.open({ playlist: event.playlist, section: ContentPlaylistViewSections.Metadata });
              break;
          case 'analytics':
              this._openRaptAnalytics( event.playlist.id );
              break;
          case 'delete':
              this._browserService.confirm(
                  {
                      header: this._appLocalization.get('applications.content.playlists.deletePlaylist'),
                      message: this._appLocalization.get('applications.content.playlists.confirmDeleteSingle', {0: event.playlist.name}),
                      accept: () => {
                          this._deleteCurrentPlaylist(event.playlist.id);
                      }
                  }
              );
              break;
          default:
              break;
      }
  }

  public _onFreetextChanged(): void {
      // prevent searching for empty strings
      if (this._query.freetext.length > 0 && this._query.freetext.trim().length === 0){
          this._query.freetext = '';
      }else {
          this._playlistsStore.filter({freeText: this._query.freetext});
      }
  }

  public _onSortChanged(event): void {
      if (event.field !== this._query.sortBy || event.order !== this._query.sortDirection) {
          this._playlistsStore.filter({
              sortBy: event.field,
              sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
          });
      }
  }

  public _onPaginationChanged(state: any): void {
    if (state.page !== this._query.pageIndex || state.rows !== this._query.pageSize) {
      this._playlistsStore.filter({
        pageIndex: state.page,
        pageSize: state.rows
      });
    }
  }

  public _reload(): void {
    this._clearSelection();
    this._playlistsStore.reload();
  }

  public _clearSelection(): void {
    this._selectedPlaylists = [];
  }

  public _deletePlaylists(selectedPlaylists: KalturaPlaylist[]): void {
    const playlistsToDelete = selectedPlaylists.map((playlist, index) => `${index + 1}: ${playlist.name}`);
    const playlists = selectedPlaylists.length <= 10 ? playlistsToDelete.join(',').replace(/,/gi, '\n') : '';
    const message = selectedPlaylists.length > 1 ?
      this._appLocalization.get('applications.content.playlists.confirmDeleteMultiple', { 0: playlists }) :
      this._appLocalization.get('applications.content.playlists.confirmDeleteSingle', { 0: playlists });
    this._browserService.confirm(
      {
        header: this._appLocalization.get('applications.content.playlists.deletePlaylist'),
        message: message,
        accept: () => {
          setTimeout(() => {
            this._deletePlaylist(selectedPlaylists.map(playlist => playlist.id));
          }, 0);
        }
      }
    );
  }

  public _addPlaylist(): void {
    this.addNewPlaylist.open();
  }
}
