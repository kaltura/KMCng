import { Component, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { EntriesListComponent } from 'app-shared/content-shared/entries-list/entries-list.component';
import { BrowserService } from 'app-shared/kmc-shell';
import { EntriesStore } from 'app-shared/content-shared/entries-store/entries-store.service';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { EntriesTableColumns } from 'app-shared/content-shared/entries-table/entries-table.component';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { ModerationStore } from '../moderation-store/moderation-store.service';
import { BulkService } from '../bulk-service/bulk.service';

@Component({
  selector: 'kEntriesListHolder',
  templateUrl: './entries-list-holder.component.html',
  providers : [ ModerationStore, BulkService ]
})
export class EntriesListHolderComponent implements OnDestroy {
  @ViewChild(EntriesListComponent) private _entriesList: EntriesListComponent;

  _blockerMessage: AreaBlockerMessage = null;
  _isBusy = false;
  currentEntryId: string = '';
  isEntryPermissionApproved: boolean = false;
  isEntryPermissionRejected: boolean = false;

  _columns: EntriesTableColumns = {
    thumbnailUrl: { width: '100px' },
    name: { sortable: true },
    id: { width: '100px' },
    mediaType: { sortable: true, width: '80px', align: 'center' },
    plays: { sortable: true, width: '76px' },
    moderationCount: { sortable: true, width: '76px' },
    createdAt: { sortable: true, width: '140px' },
    moderationStatus: { width: '125px' }
  };

  @ViewChild('moderationDetails') public moderationDetails: PopupWidgetComponent;

  _rowActions = [
    {
      label: this._appLocalization.get('applications.content.table.reportsAndDetails'),
      commandName: 'view'
    },
    {
      label: this._appLocalization.get('applications.content.table.approve'),
      commandName: 'approve'
    },
    {
      label: this._appLocalization.get('applications.content.table.reject'),
      commandName: 'reject'
    }
  ];

  constructor(private _router: Router,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization,
              private _entriesStore: EntriesStore,
              private _bulkService: BulkService) {
    this._entriesStore.paginationCacheToken = 'entries-list';
  }

  openModerationDetails(entryId): void {
    this.currentEntryId = entryId;
    this.moderationDetails.open();
  }

  approveEntry(entryId: string, entryName: string): void {
    if(!this.isEntryPermissionApproved) { // TODO [kmcng] need to get such permissions from somewhere
      this._browserService.confirm(
        {
          header: this._appLocalization.get('applications.content.moderation.approveMedia'),
          message: this._appLocalization.get('applications.content.moderation.sureToApprove', {0: entryName}),
          accept: () => {
            this.doApproveEntry(entryId);
          }
        }
      )
    } else {
      this.doApproveEntry(entryId);
    }
  }

  doApproveEntry(entryId: string): void {
    this._isBusy = true;
    this._bulkService.approveEntry(entryId)
      .cancelOnDestroy(this)
      .subscribe(
        () => {
          this._isBusy = false;
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
                  action: () => {
                    this._blockerMessage = null;
                    this.doApproveEntry(entryId);
                  }
                },
                {
                  label: this._appLocalization.get('app.common.cancel'),
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

  rejectEntry(entryId: string, entryName: string): void {
    if(!this.isEntryPermissionRejected) { // TODO [kmcng] need to get such permissions from somewhere
      this._browserService.confirm(
        {
          header: this._appLocalization.get('applications.content.moderation.rejectMedia'),
          message: this._appLocalization.get('applications.content.moderation.sureToReject', {0: entryName}),
          accept: () => {
            this.doRejectEntry(entryId);
          }
        }
      );
    } else {
      this.doRejectEntry(entryId);
    }
  }

  doRejectEntry(entryId: string): void {
    this._isBusy = true;
    this._bulkService.rejectEntry(entryId)
      .cancelOnDestroy(this)
      .subscribe(
        () => {
          this._isBusy = false;
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
                  action: () => {
                    this._blockerMessage = null;
                    this.doRejectEntry(entryId);
                  }
                },
                {
                  label: this._appLocalization.get('app.common.cancel'),
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

  _onActionSelected({ action, entryId, entryName }) {
    switch (action) {
      case 'view':
        this.openModerationDetails(entryId);
        break;
      case 'approve':
        this.approveEntry(entryId, entryName);
        break;
      case 'reject':
        this.rejectEntry(entryId, entryName);
        break;
      default:
        break;
    }
  }

  ngOnDestroy() {}
}
