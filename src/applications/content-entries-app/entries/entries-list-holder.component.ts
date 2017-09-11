import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { EntriesListComponent } from 'app-shared/content-shared/entries-list/entries-list.component';
import { BrowserService } from 'app-shared/kmc-shell';
import { EntriesStore } from 'app-shared/content-shared/entries-store/entries-store.service';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import {
  EntriesTableColumns,
  EntriesTableConfig
} from 'app-shared/content-shared/entries-table/entries-table.component';

@Component({
  selector: 'kEntriesListHolder',
  templateUrl: './entries-list-holder.component.html',
  styles: [`.kTestPopupTrigger {
    color: gray;
    text-decoration: none;
    opacity: 0.1;
    position: absolute;
    top: 100px;
    z-index: 1;
  }`]
})
export class EntriesListHolderComponent {
  @ViewChild(EntriesListComponent) private _entriesList: EntriesListComponent;
  @ViewChild('popupTest') popupTest;

  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy = false;

  public _columns: EntriesTableColumns = {
    thumbnailUrl: { width: '100px' },
    name: { sortable: true },
    id: { width: '100px' },
    mediaType: { sortable: true, width: '80px', align: 'center' },
    plays: { sortable: true, width: '76px' },
    createdAt: { sortable: true, width: '140px' },
    duration: { sortable: true, width: '104px' },
    status: { width: '100px' },
    rowActions: []
  };

  public _scrollHeight = '100%';
  public _rowActions = [
    {
      label: this._appLocalization.get('applications.content.table.previewAndEmbed'),
      commandName: 'preview'
    },
    {
      label: this._appLocalization.get('applications.content.table.delete'),
      commandName: 'delete'
    },
    {
      label: this._appLocalization.get('applications.content.table.view'),
      commandName: 'view'
    }
  ];

  public _paginator = {
    rowsPerPageOptions: [25, 50, 75, 100]
  };

  constructor(private _router: Router,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization,
              private _entriesStore: EntriesStore) {
  }

  public _onActionSelected({ action, entryId }) {
    switch (action) {
      case 'view':
        this._viewEntry(entryId);
        break;
      case 'delete':
        this._browserService.confirm(
          {
            header: this._appLocalization.get('applications.content.entries._deleteEntry'),
            message: this._appLocalization.get('applications.content.entries.confirmDeleteSingle', { 0: entryId }),
            accept: () => this._deleteEntry(entryId)
          }
        );
        break;
      default:
        break;
    }
  }

  private _viewEntry(entryId: string): void {
    if (entryId) {
      this._router.navigate(['/content/entries/entry', entryId]);
    } else {
      console.error('EntryId is not defined');
    }
  }

  private _deleteEntry(entryId: string): void {
    if (!entryId) {
      console.error('EntryId is not defined');
      return;
    }

    this._isBusy = true;
    this._blockerMessage = null;
    this._entriesStore.deleteEntry(entryId).subscribe(
      () => {
        this._isBusy = false;
        this._browserService.showGrowlMessage({
          severity: 'success',
          detail: this._appLocalization.get('applications.content.entries.deleted')
        });
        this._entriesStore.reload(true);
      },
      error => {
        this._isBusy = false;

        this._blockerMessage = new AreaBlockerMessage(
          {
            message: error.message,
            buttons: [
              {
                label: this._appLocalization.get('app.common.retry'),
                action: () => this._deleteEntry(entryId)
              },
              {
                label: this._appLocalization.get('app.common.cancel'),
                action: () => this._blockerMessage = null
              }
            ]
          }
        );
      }
    );
  }
}
