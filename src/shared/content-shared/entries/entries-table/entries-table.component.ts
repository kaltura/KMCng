import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { DataTable, Menu, MenuItem } from 'primeng/primeng';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { KalturaMediaType } from 'kaltura-ngx-client/api/types/KalturaMediaType';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { KalturaSourceType } from 'kaltura-ngx-client/api/types/KalturaSourceType';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

export interface EntriesTableColumns {
  [key: string]: {
    width?: string;
    align?: string;
    sortable?: boolean;
  };
}

export interface CustomMenuItem extends MenuItem {
  metadata: any;
  commandName: string;
}

@Component({
  selector: 'kEntriesTable',
  templateUrl: './entries-table.component.html',
  styleUrls: ['./entries-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntriesTableComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() set columns(value: EntriesTableColumns) {
    this._columns = value || this._defaultColumns;
  }

  public _columnsMetadata: {
    [key: string]: { style: SafeStyle, sortable: boolean }
  } = {};

  @Input() rowActions: { label: string, commandName: string }[] = [];

  @Input()
  set entries(data: any[]) {
    if (!this._deferredLoading) {
      // the table uses 'rowTrackBy' to track changes by id. To be able to reflect changes of entries
      // (ie when returning from entry page) - we should force detect changes on an empty list
      this._entries = [];
      this.cdRef.detectChanges();
      this._entries = data;
      this.cdRef.detectChanges();
    } else {
      this._deferredEntries = data;
    }
  }

  @Input() showBulkSelect = true;
  @Input() sortField: string = null;
  @Input() sortOrder: number = null;
  @Input() selectedEntries: any[] = [];
  @Input() isTagsBarVisible = false;

  @Output() sortChanged = new EventEmitter<{ field: string, order: number }>();
  @Output() actionSelected = new EventEmitter<{ action: string, entry: KalturaMediaEntry }>();
  @Output() selectedEntriesChange = new EventEmitter<any>();

  @ViewChild('dataTable') private dataTable: DataTable;
  @ViewChild('actionsmenu') private actionsMenu: Menu;

  private _deferredEntries: any[];
  private _defaultColumns: EntriesTableColumns = {
    thumbnailUrl: { width: '100px' },
    name: { sortable: true },
    id: { width: '100px' }
  };

  public _columns?: EntriesTableColumns = this._defaultColumns;


  public _entries: any[] = [];
  private _deferredLoading = true;
  public _emptyMessage = '';
  public _items: CustomMenuItem[];

  constructor(private appLocalization: AppLocalization, private cdRef: ChangeDetectorRef, private sanitization: DomSanitizer) {
  }

  ngOnInit() {
    this._emptyMessage = this.appLocalization.get('applications.content.table.noResults');

    Object.keys(this._columns).forEach(columnName => {
      this._columnsMetadata[columnName] = {
        style: this._getColumnStyle(this._columns[columnName]),
        sortable: this._columns[columnName].sortable || false
      };
    });
  }

  ngOnDestroy() {
    this.actionsMenu.hide();
  }

  ngAfterViewInit() {
    if (this._deferredLoading) {
      // use timeout to allow the DOM to render before setting the data to the datagrid.
      // This prevents the screen from hanging during datagrid rendering of the data.
      setTimeout(() => {
        this._deferredLoading = false;
        this._entries = this._deferredEntries;
        this._deferredEntries = null;
        this.cdRef.detectChanges();
      }, 0);
    }
  }

  private _hideMenuItems(source, status, mediaType, { commandName }): boolean {
    const isReadyStatus = status === KalturaEntryStatus.ready;
    const isLiveStreamFlash = mediaType && mediaType === KalturaMediaType.liveStreamFlash;
    const isPreviewCommand = commandName === 'preview';
    const isViewCommand = commandName === 'view';
    const isKalturaLive = source === KalturaSourceType.liveStream;
    const isLiveDashboardCommand = commandName === 'liveDashboard';
    return !(
      (!isReadyStatus && isPreviewCommand) || // hide if trying to share & embed entry that isn't ready
      (!isReadyStatus && isLiveStreamFlash && isViewCommand) || // hide if trying to view live that isn't ready
      (isLiveDashboardCommand && !isKalturaLive) // hide live-dashboard menu item for entry that isn't kaltura live
    );
  }

  private _buildMenu(entry: KalturaMediaEntry): void {
    this._items = this.rowActions
      .filter(item => this._hideMenuItems(entry.sourceType, entry.status, entry.mediaType, item))
      .map(action =>
        Object.assign({} as CustomMenuItem, action, {
          command: ({ item }) => {
            this._onActionSelected(item.commandName, entry);
          }
        })
      );
  }

  public _rowTrackBy(index: number, item: any): string {
    return item.id;
  }

  public _openActionsMenu(event: any, entry: KalturaMediaEntry): void {
    if (this.actionsMenu) {
      this.actionsMenu.toggle(event);
      this._buildMenu(entry);
      this.actionsMenu.show(event);
    }
  }

  public _allowDrilldown(mediaType: KalturaMediaType, status: KalturaEntryStatus): boolean {
    const isLiveStream =  mediaType === KalturaMediaType.liveStreamFlash;
    const isReady = status && status !== KalturaEntryStatus.ready;
    return !(isLiveStream && isReady);
  }

  public _onActionSelected(action: string, entry: KalturaMediaEntry): void {
    this.actionSelected.emit({ action, entry });
  }

  public _onSortChanged(event) {
    if (event.field && event.order) {
      // primeng workaround: must check that field and order was provided to prevent reset of sort value
      this.sortChanged.emit({ field: event.field, order: event.order });
    }
  }

  public _onSelectionChange(event): void {
    this.selectedEntriesChange.emit(event);
  }

  public _getColumnStyle({ width = 'auto', align = 'left' } = {}): SafeStyle {
    return this.sanitization.bypassSecurityTrustStyle(`width: ${width};text-align: ${align}`);
  }
}

