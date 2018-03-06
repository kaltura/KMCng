import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Menu, MenuItem } from 'primeng/primeng';
import { KalturaPlaylist } from 'kaltura-ngx-client/api/types/KalturaPlaylist';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';

@Component({
  selector: 'kPlaylistsTable',
  templateUrl: './playlists-table.component.html',
  styleUrls: ['./playlists-table.component.scss']
})
export class PlaylistsTableComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() set playlists(data: KalturaPlaylist[]) {
    if (!this._deferredLoading) {
      this._playlists = [];
      this._cdRef.detectChanges();
      this._playlists = data;
      this._cdRef.detectChanges();
    } else {
      this._deferredPlaylists = data;
    }
  }

  @Input() sortField: string = null;
  @Input() sortOrder: number = null;
  @Input() selectedPlaylists: any[] = [];

  @Output() sortChanged = new EventEmitter<{ field: string, order: number }>();
  @Output() selectedPlaylistsChange = new EventEmitter<any>();
  @Output() actionSelected = new EventEmitter<any>();

  @ViewChild('actionsmenu') private actionsMenu: Menu;

  private _deferredPlaylists: KalturaPlaylist[];

  public _deferredLoading = true;
  public _emptyMessage = '';
  public _playlists: KalturaPlaylist[] = [];
  public _items: MenuItem[];

  public rowTrackBy: Function = (index: number, item: any) => item.id;

  constructor(private _appLocalization: AppLocalization,
              private _cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this._emptyMessage = this._appLocalization.get('applications.content.table.noResults');
  }

  ngAfterViewInit() {
    if (this._deferredLoading) {
      // use timeout to allow the DOM to render before setting the data to the datagrid.
      // This prevents the screen from hanging during datagrid rendering of the data.
      setTimeout(() => {
        this._deferredLoading = false;
        this._playlists = this._deferredPlaylists;
        this._deferredPlaylists = null;
      }, 0);
    }
  }

  openActionsMenu(event: any, playlist: KalturaPlaylist) {
    if (this.actionsMenu) {
      this.actionsMenu.toggle(event);
      this.buildMenu(playlist);
      this.actionsMenu.show(event);
    }
  }

  ngOnDestroy() {
    this.actionsMenu.hide();
  }

  buildMenu(playlist: KalturaPlaylist): void {
    this._items = [
      {
        label: this._appLocalization.get('applications.content.table.previewAndEmbed'),
        command: () => this.onActionSelected('preview', playlist)
      },
      {
        label: this._appLocalization.get('applications.content.table.delete'),
        command: () => this.onActionSelected('delete', playlist)
      },
      {
        label: this._appLocalization.get('applications.content.table.view'),
        command: () => this.onActionSelected('view', playlist)
      }
    ];
    if (playlist.status !== KalturaEntryStatus.ready) {
      this._items.shift();
    }
  }


  onSelectionChange(event) {
    this.selectedPlaylistsChange.emit(event);
  }

  onActionSelected(action: string, playlist: KalturaPlaylist) {
    this.actionSelected.emit({ 'action': action, 'playlist': playlist });
  }

  onSortChanged(event) {
    if (event.field && event.order) {
      // primeng workaround: must check that field and order was provided to prevent reset of sort value
      this.sortChanged.emit({ field: event.field, order: event.order });
    }
  }
}

