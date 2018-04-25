import { Component, Input, OnDestroy } from '@angular/core';
import { BulkUploadMonitorService } from './bulk-upload-monitor.service';
import { NewUploadMonitorService } from './new-upload-monitor.service';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { DropFoldersMonitorService } from './drop-folders-monitor.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

export interface UploadMonitorStatuses {
  uploading: number;
  queued: number;
  completed: number;
  errors: number;
}

@Component({
  selector: 'kUploadMonitor',
  templateUrl: './upload-monitor.component.html',
  styleUrls: ['./upload-monitor.component.scss'],
    providers: [KalturaLogger.createLogger('UploadMonitorComponent')]
})
export class UploadMonitorComponent implements OnDestroy {
  @Input() appmenu;

  private _sectionHeight = 91;

  public _popupHeight = 273; // default height that fits 3 sections
  public _showErrorIcon = false;
  public _menuOpened = false;
  public _upToDate = true;
  public _uploadFromDesktop: UploadMonitorStatuses = {
    uploading: 0,
    queued: 0,
    completed: 0,
    errors: 0,
  };
  public _bulkUpload: UploadMonitorStatuses = {
    uploading: 0,
    queued: 0,
    completed: 0,
    errors: 0,
  };
  public _dropFolders: UploadMonitorStatuses = {
    uploading: 0,
    queued: 0,
    completed: 0,
    errors: 0
  };

  public _bulkUploadLayout: 'loading' | 'totals' | 'error' | 'recoverableError' = null;
  public _dropFoldersLayout: 'loading' | 'totals' | 'error' | 'recoverableError' = null;

  constructor(private _bulkUploadMonitor: BulkUploadMonitorService,
              private _newUploadMonitor: NewUploadMonitorService,
              private _logger: KalturaLogger,
              private _dropFoldersMonitor: DropFoldersMonitorService) {
      this._logger.info(`init service, subscribe to uploads changes`);
    this._newUploadMonitor.totals$
      .cancelOnDestroy(this)
      .subscribe(totals => {
        if (this._uploadFromDesktop.errors < totals.errors) {
          this._updateErrorIconStatus();
        }
        this._uploadFromDesktop = totals;
        this._logger.info(`new upload from desktop updated`, { totals });
        this._checkUpToDate();
      });

    this._bulkUploadMonitor.totals.data$
      .cancelOnDestroy(this)
      .subscribe(totals => {
        if (this._bulkUpload.errors < totals.errors) {
          this._updateErrorIconStatus();
        }
        this._bulkUpload = totals;
          this._logger.info(`bulk upload updated`, { totals });
        this._checkUpToDate();
      });

    this._bulkUploadMonitor.totals.state$
      .cancelOnDestroy(this)
      .subscribe((state) => {
        if (state.error && state.isErrorRecoverable) {
          this._bulkUploadLayout = 'recoverableError';
        } else if (state.error && !state.isErrorRecoverable) {
          this._bulkUploadLayout = 'error';
        } else if (state.loading) {
          this._bulkUploadLayout = 'loading';
        } else {
          this._bulkUploadLayout = 'totals';
        }
      });

    this._dropFoldersMonitor.totals.state$
      .cancelOnDestroy(this)
      .subscribe(state => {
        if (state.error && state.notPermitted) {
          this._dropFoldersLayout = null;
          this._popupHeight -= this._sectionHeight; // reduce popup height
        } else if (state.error && state.isErrorRecoverable) {
          this._dropFoldersLayout = 'recoverableError';
        } else if (state.error && !state.isErrorRecoverable) {
          this._dropFoldersLayout = 'error';
        } else if (state.loading) {
          this._dropFoldersLayout = 'loading';
        } else {
          this._dropFoldersLayout = 'totals';
        }
      });

    this._dropFoldersMonitor.totals.data$
      .cancelOnDestroy(this)
      .subscribe(totals => {
        if (this._dropFolders.errors < totals.errors) {
          this._updateErrorIconStatus();
        }
        this._dropFolders = totals;
          this._logger.info(`drop folders updated`, { totals });
        this._checkUpToDate();
      });
  }

  ngOnDestroy() {
  }

  private _updateErrorIconStatus(): void {
    if (!this._menuOpened) {
      this._showErrorIcon = true;
    }
  }

  private _checkUpToDate(): void {
    const uploadFromDesktop = this._uploadFromDesktop.uploading + this._uploadFromDesktop.queued;
    const bulkUpload = this._bulkUpload.uploading + this._bulkUpload.queued;
    const dropFolders = this._dropFolders.uploading + this._dropFolders.queued;
    this._upToDate = !uploadFromDesktop && !bulkUpload && !dropFolders;
  }

  public _onMonitorOpen(): void {
      this._logger.info(`handle open upload monitor action by user`);
    this._showErrorIcon = false;
    this._menuOpened = true;
  }

  public _onMonitorClose(): void {
      this._logger.info(`handle close upload monitor action by user`);
    this._menuOpened = false;
  }

  public _bulkTryReconnect(): void {
      this._logger.info(`handle retry to connect to bulk upload monitor action by user`);
    this._bulkUploadMonitor.retryTracking();
  }

  public _dropFoldersTryReconnect(): void {
      this._logger.info(`handle retry to connect to drop folders monitor action by user`);
    this._dropFoldersMonitor.retryTracking();
  }
}
