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
import { DataTable, Menu, MenuItem } from 'primeng/primeng';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { KalturaBulkUpload } from 'kaltura-ngx-client/api/types/KalturaBulkUpload';

@Component({
  selector: 'kBulkLogTable',
  templateUrl: './bulk-log-table.component.html',
  styleUrls: ['./bulk-log-table.component.scss']
})
export class BulkLogTableComponent implements AfterViewInit, OnInit, OnDestroy {


  public _bulkLog: any[] = [];
  private _deferredEntries: any[];

  @Input()
  set list(data: any[]) {
    if (!this._deferredLoading) {
      // the table uses 'rowTrackBy' to track changes by id. To be able to reflect changes of entries
      // (ie when returning from bulk log page) - we should force detect changes on an empty list
      this._bulkLog = [];
      this._cdRef.detectChanges();
      this._bulkLog = data;
      this._cdRef.detectChanges();
    } else {
      this._deferredEntries = data
    }
  }

  @Input() filter: any = {};
  @Input() selectedBulkLogItems: any[] = [];

  @Output()
  actionSelected = new EventEmitter<{ action: string, bulkLogItem: KalturaBulkUpload }>();
  @Output()
  selectedBulkLogItemsChange = new EventEmitter<any>();

  @ViewChild('dataTable') private dataTable: DataTable;
  @ViewChild('actionsmenu') private actionsMenu: Menu;
  private bulkLogItem: KalturaBulkUpload;

  public _deferredLoading = true;
  public _emptyMessage = '';

  public _items: MenuItem[];

  public rowTrackBy: Function = (index: number, item: any) => {
    return item.id
  };

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
        this._bulkLog = this._deferredEntries;
        this._deferredEntries = null;
      }, 0);
    }
  }

  ngOnDestroy() {
    this.actionsMenu.hide();
  }

  private _buildMenu(): void {
    this._items = [
      {
        label: this._appLocalization.get('applications.content.bulkUpload.table.actions.delete'),
        command: (event) => this._onActionSelected('delete', this.bulkLogItem)
      },
      {
        label: this._appLocalization.get('applications.content.bulkUpload.table.actions.downloadLog'),
        command: (event) => this._onActionSelected('downloadLog', this.bulkLogItem)
      },
      {
        label: this._appLocalization.get('applications.content.bulkUpload.table.actions.downloadFile'),
        command: (event) => this._onActionSelected('downloadFile', this.bulkLogItem)
      }
    ];
  }

  private _onActionSelected(action: string, bulkLogItem: KalturaBulkUpload): void {
    this.actionSelected.emit({ action, bulkLogItem });
  }

  public _openActionsMenu(event: any, bulkLogItem: KalturaBulkUpload): void {
    if (this.actionsMenu) {
      this.actionsMenu.toggle(event);
      if (!this.bulkLogItem || this.bulkLogItem.id !== bulkLogItem.id) {
        this.bulkLogItem = bulkLogItem;
        this._buildMenu();
        this.actionsMenu.show(event);
      }
    }
  }

  public _onSelectionChange(event): void {
    this.selectedBulkLogItemsChange.emit(event);
  }
}

