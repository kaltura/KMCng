import { Injectable, OnDestroy } from '@angular/core';
import { TrackedFileStatuses, UploadManagement } from '@kaltura-ng/kaltura-common';
import { NewEntryUploadFile } from 'app-shared/kmc-shell';
import { UploadMonitorStatuses } from './upload-monitor.component';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NewEntryFlavourFile } from 'app-shared/kmc-shell/new-entry-flavour-file';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

@Injectable()
export class NewUploadMonitorService implements OnDestroy {
  private _newUploadFiles: { [key: string]: { status: string } } = {};
  private _totals = new BehaviorSubject<UploadMonitorStatuses>({ uploading: 0, queued: 0, completed: 0, errors: 0 });
  public totals$ = this._totals.asObservable();

  constructor(private _uploadManagement: UploadManagement,
              private _logger: KalturaLogger) {
      this._logger = _logger.subLogger('NewUploadMonitorService');
      this._logger.info(`init service, subscribe to tracked files changed (NewEntryUploadFile and NewEntryFlavourFile)`);
    this._uploadManagement
      .onTrackedFileChanged$
      .filter(trackedFile => trackedFile.data instanceof NewEntryUploadFile || trackedFile.data instanceof NewEntryFlavourFile)
      .filter(({ status }) => TrackedFileStatuses.purged !== status)
      .cancelOnDestroy(this)
      .subscribe(trackedFile => {
          let relevantFile = this._newUploadFiles[trackedFile.id];
          if (!relevantFile) {
            relevantFile = { status: trackedFile.status };
            this._newUploadFiles[trackedFile.id] = relevantFile;
          } else {
            relevantFile.status = trackedFile.status;
          }

          this._totals.next(this._calculateTotalsFromState());
        }
      );
  }

  ngOnDestroy() {
    this._totals.complete();
  }

  private _calculateTotalsFromState(): UploadMonitorStatuses {
    return Object.keys(this._newUploadFiles).reduce((totals, key) => {
      const upload = this._newUploadFiles[key];
      switch (upload.status) {
        case TrackedFileStatuses.added:
        case TrackedFileStatuses.pendingPrepare:
        case TrackedFileStatuses.preparing:
        case TrackedFileStatuses.prepared:
        case TrackedFileStatuses.pendingUpload:
          totals.queued += 1;
          break;
        case TrackedFileStatuses.uploading:
          totals.uploading += 1;
          break;
        case TrackedFileStatuses.uploadCompleted:
          totals.completed += 1;
          break;
        case TrackedFileStatuses.failure:
          totals.errors += 1;
          break;
        default:
          break;
      }

      return totals;
    }, { uploading: 0, queued: 0, completed: 0, errors: 0 });
  }
}
