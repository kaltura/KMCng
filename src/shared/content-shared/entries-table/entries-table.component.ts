import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { ISubscription } from 'rxjs/Subscription';
import { DataTable, Menu, MenuItem } from 'primeng/primeng';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaMediaType } from 'kaltura-typescript-client/types/KalturaMediaType';
import { KalturaEntryStatus } from 'kaltura-typescript-client/types/KalturaEntryStatus';
import { KalturaMediaEntry } from 'kaltura-typescript-client/types/KalturaMediaEntry';
import { EntriesStore } from 'app-shared/content-shared/entries-store/entries-store.service';

export interface EntriesTableConfig {
  dataKey?: string;
  scrollHeight?: string;
  fillHeight?: boolean;
  columns?: EntriesTableColumns;
}

export interface EntriesTableColumns {
  [key: string]: {
    width?: string;
    align?: string;
    sortable?: boolean | 'custom'
  }
}

@Component({
  selector: 'kEntriesTable',
  templateUrl: './entries-table.component.html',
  styleUrls: ['./entries-table.component.scss']
})
export class EntriesTableComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input()
  set tableConfig(value: EntriesTableConfig) {
    this._dataKey = value.dataKey || 'id';
    this._scrollHeight = value.scrollHeight || '100%';
    this._scrollable = !!value.scrollHeight;
    this._fillHeight = value.fillHeight;
    this._columns = value.columns || this._defaultColumns;
  }

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
      this._deferredEntries = data
    }
  }

  @Input() filter: any = {};
  @Input() selectedEntries: any[] = [];

  @Output() sortChanged = new EventEmitter<any>();
  @Output() actionSelected = new EventEmitter<any>();
  @Output() selectedEntriesChange = new EventEmitter<any>();

  @ViewChild('dataTable') private dataTable: DataTable;
  @ViewChild('actionsmenu') private actionsMenu: Menu;

  private _deferredEntries: any[];
  private entriesStoreStatusSubscription: ISubscription;
  private actionsMenuEntryId = '';
  private _defaultColumns: EntriesTableColumns = {
    thumbnailUrl: { width: '100px' },
    name: { sortable: 'custom' },
    id: { width: '100px' }
  };

  public _dataKey: string;
  public _scrollHeight: string;
  public _scrollable: boolean;
  public _columns?: EntriesTableColumns;
  public _fillHeight: boolean;

  public _blockerMessage: AreaBlockerMessage = null;
  public _entries: any[] = [];
  public _deferredLoading = true;
  public _emptyMessage = '';
  public _items: MenuItem[];

  constructor(private appLocalization: AppLocalization, public entriesStore: EntriesStore, private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this._blockerMessage = null;
    this._emptyMessage = '';
    let loadedOnce = false; // used to set the empty message to 'no results' only after search
    this.entriesStoreStatusSubscription = this.entriesStore.state$.subscribe(
      result => {
        if (result.errorMessage) {
          this._blockerMessage = new AreaBlockerMessage({
            message: result.errorMessage || 'Error loading entries',
            buttons: [{
              label: 'Retry',
              action: () => {
                this.entriesStore.reload(true);
              }
            }
            ]
          })
        } else {
          this._blockerMessage = null;
          if (result.loading) {
            this._emptyMessage = '';
            loadedOnce = true;
          } else {
            if (loadedOnce) {
              this._emptyMessage = this.appLocalization.get('applications.content.table.noResults');
            }
          }
        }
      },
      error => {
        console.warn('[kmcng] -> could not load entries'); // navigate to error page
        throw error;
      });
  }

  ngOnDestroy() {
    this.actionsMenu.hide();
    this.entriesStoreStatusSubscription.unsubscribe();
    this.entriesStoreStatusSubscription = null;
  }

  ngAfterViewInit() {
    const scrollBody = this.dataTable.el.nativeElement.getElementsByClassName('ui-datatable-scrollable-body');
    if (scrollBody && scrollBody.length > 0) {
      scrollBody[0].onscroll = () => {
        if (this.actionsMenu) {
          this.actionsMenu.hide();
        }
      }
    }
    if (this._deferredLoading) {
      // use timeout to allow the DOM to render before setting the data to the datagrid.
      // This prevents the screen from hanging during datagrid rendering of the data.
      setTimeout(() => {
        this._deferredLoading = false;
        this._entries = this._deferredEntries;
        this._deferredEntries = null;
      }, 0);
    }
  }

  private _buildMenu(mediaType: KalturaMediaType = null, status: any = null): void {
    this._items = [
      {
        label: this.appLocalization.get('applications.content.table.previewAndEmbed'),
        command: () => this._onActionSelected('preview', this.actionsMenuEntryId)
      },
      {
        label: this.appLocalization.get('applications.content.table.delete'),
        command: () => this._onActionSelected('delete', this.actionsMenuEntryId)
      },
      {
        label: this.appLocalization.get('applications.content.table.view'),
        command: () => this._onActionSelected('view', this.actionsMenuEntryId)
      }
    ];
    if (status instanceof KalturaEntryStatus && status.toString() !== KalturaEntryStatus.ready.toString()) {
      this._items.shift();
      if (mediaType && mediaType.toString() === KalturaMediaType.liveStreamFlash.toString()) {
        this._items.pop();
      }
    }
  }

  public _rowTrackBy(index: number, item: any): string {
    return item.id;
  }

  public _openActionsMenu(event: any, entry: KalturaMediaEntry) {
    if (this.actionsMenu) {
      this.actionsMenu.toggle(event);
      if (this.actionsMenuEntryId !== entry.id) {
        this._buildMenu(entry.mediaType, entry.status);
        this.actionsMenuEntryId = entry.id;
        this.actionsMenu.show(event);
      }
    }
  }

  public _allowDrilldown(mediaType: string, status: string) {
    const isLiveStream = mediaType && mediaType === KalturaMediaType.liveStreamFlash.toString();
    const isReady = status && status !== KalturaEntryStatus.ready.toString();
    return !(isLiveStream && isReady);
  }

  public _onActionSelected(action: string, entryID: string, mediaType: string = null, status: string = null) {
    if (this._allowDrilldown(mediaType, status)) {
      this.actionSelected.emit({ 'action': action, 'entryID': entryID });
    }
  }

  public _onSortChanged(event) {
    this.sortChanged.emit(event);
  }

  public _onSelectionChange(event) {
    this.selectedEntriesChange.emit(event);
  }

  public _getColumnStyle({ width = 'auto', align = 'left' } = {}): { 'width': string, 'text-align': string } {
    return { 'width': width, 'text-align': align };
  }

  public scrollToTop() {
    const scrollBodyArr = this.dataTable.el.nativeElement.getElementsByClassName('ui-datatable-scrollable-body');
    if (scrollBodyArr && scrollBodyArr.length > 0) {
      const scrollBody: HTMLDivElement = scrollBodyArr[0];
      scrollBody.scrollTop = 0;
    }
  }
}

