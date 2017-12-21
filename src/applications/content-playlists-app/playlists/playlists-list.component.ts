import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ISubscription } from 'rxjs/Subscription';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { BrowserService } from 'app-shared/kmc-shell';
import { AreaBlockerMessage, StickyComponent } from '@kaltura-ng/kaltura-ui';
import { environment } from 'app-environment';

import { PlaylistsStore, SortDirection } from './playlists-store/playlists-store.service';
import { BulkDeleteService } from './bulk-service/bulk-delete.service';
import { KalturaPlaylist } from 'kaltura-ngx-client/api/types/KalturaPlaylist';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';

import * as moment from 'moment';
import { KalturaPlaylistType } from 'kaltura-ngx-client/api/types/KalturaPlaylistType';
import { routingAliases } from 'app-shared/app-routing-aliases';

export interface Filter {
  type: string;
  label: string;
  tooltip: string
}

@Component({
  selector: 'kPlaylistsList',
  templateUrl: './playlists-list.component.html',
  styleUrls: ['./playlists-list.component.scss'],
  providers: [BulkDeleteService]
})
export class PlaylistsListComponent implements OnInit, OnDestroy {

  @ViewChild('addNewPlaylist') public addNewPlaylist: PopupWidgetComponent;
  @ViewChild('tags') private tags: StickyComponent;

  private querySubscription: ISubscription;

  public _blockerMessage: AreaBlockerMessage = null;

  public _filter = {
    pageIndex: 0,
    freetextSearch: '',
    createdAfter: null,
    createdBefore: null,
    pageSize: null, // pageSize is set to null by design. It will be modified after the first time loading playlists
    sortBy: 'createdAt',
    sortDirection: SortDirection.Desc
  };

  public _selectedPlaylists: KalturaPlaylist[] = [];
  public activeFilters: Filter[] = [];

  constructor(public _playlistsStore: PlaylistsStore,
              private appLocalization: AppLocalization,
              private router: Router,
              private _browserService: BrowserService,
              public _bulkDeleteService: BulkDeleteService) {
  }

  ngOnInit() {
    this.querySubscription = this._playlistsStore.query$.subscribe(
      query => {
        this._filter.pageSize = query.pageSize;
        this._filter.pageIndex = query.pageIndex - 1;
        this._filter.sortBy = query.sortBy;
        this._filter.sortDirection = query.sortDirection;
        this._filter.freetextSearch = query.freeText;
        this._filter.createdAfter = query.createdAfter;
        this._filter.createdBefore = query.createdBefore;

        this._syncFilters(query);
      }
    );
    this._playlistsStore.reload(false);
  }

  ngOnDestroy() {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
      this.querySubscription = null;
    }
  }

  private _proceedDeletePlaylists(ids: string[]): void {
    this._bulkDeleteService.deletePlaylist(ids)
      .tag('block-shell')
      .cancelOnDestroy(this)
      .subscribe(
        () => {
          this._playlistsStore.reload(true);
          this._clearSelection();
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage({
            message: this.appLocalization.get('applications.content.bulkActions.errorPlaylists'),
            buttons: [{
              label: this.appLocalization.get('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
              }
            }]
          });
        }
      );
  }

  private _deletePlaylist(ids: string[]): void {
    if (ids.length > environment.modules.contentPlaylists.bulkActionsLimit) {
      this._browserService.confirm(
        {
          header: this.appLocalization.get('applications.content.bulkActions.note'),
          message: this.appLocalization.get('applications.content.bulkActions.confirmPlaylists', { '0': ids.length }),
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
      .cancelOnDestroy(this)
      .tag('block-shell')
      .subscribe(
        () => {
          this._clearSelection();
          this._playlistsStore.reload(true);
        },
        error => {
          this._blockerMessage = new AreaBlockerMessage(
            {
              message: error.message,
              buttons: [
                {
                  label: this.appLocalization.get('app.common.retry'),
                  action: () => {
                    this._blockerMessage = null;
                    this._deleteCurrentPlaylist(playlistId);
                  }
                },
                {
                  label: this.appLocalization.get('app.common.cancel'),
                  action: () => {
                    this._blockerMessage = null;
                  }
                }
              ]
            }
          )
        }
      );
  }

  private _updateFilters(filter: Filter, flag?: number): void { // if flag == 1 we won't push filter to activeFilters
    if (!filter.label) {
      flag = 1;
    }
    this.activeFilters.forEach((el, index, arr) => {
      if (el.type === filter.type) {
        arr.splice(index, 1);
      }
    });
    if (!flag) {
      this.activeFilters.push(filter);
    }
  }

  private _syncFilters(query): void {
    const freeTextFilter: Filter = {
      type: 'freeText',
      label: query.freeText,
      tooltip: this.appLocalization.get('applications.content.filters.freeText')
    };
    this._updateFilters(freeTextFilter);

    const dateFilter: Filter = {
      type: 'Dates',
      label: freeTextFilter.type,
      tooltip: null
    };

    if (query.createdAfter || query.createdBefore) {
      dateFilter.type = 'Dates';
      dateFilter.label = dateFilter.type;
      if (!query.createdAfter) {
        dateFilter.tooltip = this.appLocalization.get(
          'applications.content.filters.dateFilter.until',
          {
            0: moment(query.createdBefore).format('LL')
          }
        );
      } else if (!query.createdBefore) {
        dateFilter.tooltip = this.appLocalization.get(
          'applications.content.filters.dateFilter.from',
          {
            0: moment(query.createdAfter).format('LL')
          }
        );
      } else {
        dateFilter.tooltip = `${moment(query.createdAfter).format('LL')} - ${moment(query.createdBefore).format('LL')}`;
      }
      this._updateFilters(dateFilter);
    }
  }

  public _onTagsChange(event): void {
    this.tags.updateLayout();
  }

  public _removeTag(tag: Filter): void {
    this._updateFilters(tag, 1);
    if (tag.type === 'freeText') {
      this._filter.freetextSearch = null;
    }
    if (tag.type === 'Dates') {
      this._filter.createdBefore = null;
      this._filter.createdAfter = null;
    }
    this._playlistsStore.reload({
      freeText: this._filter.freetextSearch,
      createdBefore: this._filter.createdBefore,
      createdAfter: this._filter.createdAfter,
      pageIndex: 1
    });
  }

  public _removeAllTags(): void {
    this._clearSelection();
    this._playlistsStore.reload({
      freeText: '',
      createdBefore: null,
      createdAfter: null,
      pageIndex: 1
    });
    this.activeFilters = [];
  }

  public _onActionSelected(event: { action: string, playlist: KalturaPlaylist }): void {
    switch (event.action) {
      case 'view':
        if (event.playlist.playlistType === KalturaPlaylistType.dynamic) {
          this._onShowNotSupportedMsg(false);
        } else {
          this.router.navigate(routingAliases.content.playlist(event.playlist.id));
        }
        break;
      case 'delete':
        this._browserService.confirm(
          {
            header: this.appLocalization.get('applications.content.playlists.deletePlaylist'),
            message: this.appLocalization.get('applications.content.playlists.confirmDeleteSingle', { 0: event.playlist.id }),
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
    const freeText = this._filter.freetextSearch.trim();
    this._playlistsStore.reload({ freeText });
  }

  public _onSortChanged(event): void {
    this._playlistsStore.reload({
      sortBy: event.field,
      sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
    });
  }

  public _onPaginationChanged(state: any): void {
    if (state.page !== this._filter.pageIndex || state.rows !== this._filter.pageSize) {
      this._filter.pageSize = state.page + 1;
      this._filter.pageIndex = state.rows;
      this._playlistsStore.reload({
        pageIndex: state.page + 1,
        pageSize: state.rows
      });
      this._clearSelection();
    }
  }

  public _onCreatedChanged(dates): void {
    this._playlistsStore.reload({
      createdAfter: dates.createdAfter,
      createdBefore: dates.createdBefore,
      pageIndex: 1
    });

    if (!dates.createdAfter && !dates.createdBefore) {
      this._clearDates();
    }
  }

  public _clearDates(): void {
    this.activeFilters.forEach((el, index, arr) => {
      if (el.type === 'Dates') {
        arr.splice(index, 1);
      }
    });
  }

  public _reload(): void {
    this._clearSelection();
    this._playlistsStore.reload(true);
  }

  public _clearSelection(): void {
    this._selectedPlaylists = [];
  }

  public _deletePlaylists(selectedPlaylists: KalturaPlaylist[]): void {
    const playlistsToDelete = selectedPlaylists.map((playlist, index) => `${index + 1}: ${playlist.name}`);
    const playlists = selectedPlaylists.length <= 10 ? playlistsToDelete.join(',').replace(/,/gi, '\n') : '';
    const message = selectedPlaylists.length > 1 ?
      this.appLocalization.get('applications.content.playlists.confirmDeleteMultiple', { 0: playlists }) :
      this.appLocalization.get('applications.content.playlists.confirmDeleteSingle', { 0: playlists });
    this._browserService.confirm(
      {
        header: this.appLocalization.get('applications.content.playlists.deletePlaylist'),
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

  public _onShowNotSupportedMsg(newPlaylist = true): void {
    const message = newPlaylist ? 'applications.content.addNewPlaylist.notSupportedMsg' : 'applications.content.playlists.notSupportedMsg';
    this._browserService.alert(
      {
        header: this.appLocalization.get('app.common.note'),
        message: this.appLocalization.get(message)
      }
    );
  }
}
