import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient } from 'kaltura-ngx-client';
import { BulkListAction } from 'kaltura-ngx-client/api/types/BulkListAction';
import { KalturaBatchJobStatus } from 'kaltura-ngx-client/api/types/KalturaBatchJobStatus';
import { KalturaBulkUploadFilter } from 'kaltura-ngx-client/api/types/KalturaBulkUploadFilter';
import { Observable } from 'rxjs/Observable';
import { KalturaBulkUploadListResponse } from 'kaltura-ngx-client/api/types/KalturaBulkUploadListResponse';
import { KmcServerPolls } from 'app-shared/kmc-shared/server-polls';
import { BulkLogUploadingStartedEvent } from 'app-shared/kmc-shared/events/bulk-log-uploading-started.event';
import { AppEventsService } from 'app-shared/kmc-shared';
import { BrowserService } from 'app-shared/kmc-shell';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client/api/types/KalturaDetachedResponseProfile';
import { KalturaResponseProfileType } from 'kaltura-ngx-client/api/types/KalturaResponseProfileType';
import { KalturaBulkUpload } from 'kaltura-ngx-client/api/types/KalturaBulkUpload';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { UploadMonitorStatuses } from './upload-monitor.component';
import { KalturaBulkUploadObjectType } from 'kaltura-ngx-client/api/types/KalturaBulkUploadObjectType';
import { BulkUploadRequestFactory } from './bulk-upload-request-factory';

interface BulkUploadFile
{
  status: KalturaBatchJobStatus;
  uploadedOn: Date;
  id: number;
}

interface TrackedBulkUploadFile extends BulkUploadFile
{
    allowPurging: boolean;
}

@Injectable()
export class BulkUploadMonitorService implements OnDestroy {

    // TODO [kmcng] replace this function with log library
    private _log(level: 'silly' | 'verbose' | 'info' | 'warn' | 'error', message: string, context?: string): void {
        const messageContext = context || 'general';
        const origin = 'bulk upload monitor';
        const formattedMessage = `log: [${level}] [${origin}] ${messageContext}: ${message}`;
        switch (level) {
            case 'silly':
            case 'verbose':
            case 'info':
                console.log(formattedMessage);
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            case 'error':
                console.error(formattedMessage);
                break;
        }
    }

    private _bulkUploadFiles: { [key: string]: TrackedBulkUploadFile } = {};

    private _initializeState: null | 'busy' | 'succeeded' | 'failed' = null;
    private _poolingState: null | 'running' = null;

    private _totals = {
        data: new BehaviorSubject<UploadMonitorStatuses>({uploading: 0, queued: 0, completed: 0, errors: 0}),
        state: new BehaviorSubject<{ loading: boolean, error: boolean, isErrorRecoverable?: boolean }>({
            loading: false,
            error: false,
            isErrorRecoverable: false
        })
    };
    public readonly totals = {data$: this._totals.data.asObservable(), state$: this._totals.state.asObservable()};

    private _bulkUploadChangesFactory = new BulkUploadRequestFactory();
    private _bulkUploadObjectTypeIn = [
        KalturaBulkUploadObjectType.entry,
        KalturaBulkUploadObjectType.category,
        KalturaBulkUploadObjectType.user,
        KalturaBulkUploadObjectType.categoryUser
    ];
    private _activeStatuses = [
        KalturaBatchJobStatus.dontProcess,
        KalturaBatchJobStatus.pending,
        KalturaBatchJobStatus.queued,
        KalturaBatchJobStatus.processing,
        KalturaBatchJobStatus.almostDone,
        KalturaBatchJobStatus.retry
    ];

    constructor(private _kalturaClient: KalturaClient,
                private _kmcServerPolls: KmcServerPolls,
                private _appEvents: AppEventsService,
                private _browserService: BrowserService) {
        this._log('silly', 'constructor()');
        this._log('verbose', `registering to app event 'BulkLogUploadingStartedEvent'`);
        this._appEvents
            .event(BulkLogUploadingStartedEvent)
            .cancelOnDestroy(this)
            .subscribe(({id, status, uploadedOn}) => {
                this._log('verbose', `handling app event 'BulkLogUploadingStartedEvent. { id: '${id}' }`);
                this._trackNewFile({id, status, uploadedOn});
                this._totals.data.next(this._calculateTotalsFromState());
            });

        // this._initTracking();
    }

    private _trackNewFile(file: BulkUploadFile) {
        this._log('verbose', `tracking new file with id: '${file.id}'`);
        if (this._bulkUploadFiles[file.id]) {
            this._log('warn', `cannot track new file with id: '${file.id}'. a file with such id already exists`);
        } else {
            this._bulkUploadFiles[file.id] = {id: file.id, status: file.status, uploadedOn: file.uploadedOn, allowPurging: false};
        }
    }

    private _getTrackedFiles(): TrackedBulkUploadFile[] {
        return Object.keys(this._bulkUploadFiles).map(key => this._bulkUploadFiles[key]);
    }

    ngOnDestroy() {
        this._log('silly', 'ngOnDestroy()');
        this._totals.data.complete();
        this._totals.state.complete();
    }

    private _calculateTotalsFromState(): UploadMonitorStatuses {

        if (this._initializeState !== 'succeeded') {
            return {uploading: 0, queued: 0, completed: 0, errors: 0};
        } else {
            return this._getTrackedFiles().reduce((totals, upload) => {
                switch (upload.status) {
                    case KalturaBatchJobStatus.pending:
                    case KalturaBatchJobStatus.queued:
                    case KalturaBatchJobStatus.dontProcess:
                        totals.queued += 1;
                        break;
                    case KalturaBatchJobStatus.processing:
                    case KalturaBatchJobStatus.almostDone:
                    case KalturaBatchJobStatus.retry:
                        totals.uploading += 1;
                        break;
                    case KalturaBatchJobStatus.finished:
                    case KalturaBatchJobStatus.finishedPartially:
                    case KalturaBatchJobStatus.processed:
                        totals.completed += 1;
                        break;
                    case KalturaBatchJobStatus.failed:
                    case KalturaBatchJobStatus.fatal:
                    case KalturaBatchJobStatus.aborted:
                    case KalturaBatchJobStatus.movefile:
                        totals.errors += 1;
                        break;
                    default:
                        break;
                }

                return totals;
            }, {uploading: 0, queued: 0, completed: 0, errors: 0});
        }
    }

    private _getActiveUploadsList(): Observable<KalturaBulkUploadListResponse> {
        const activeUploads = new BulkListAction({
            bulkUploadFilter: new KalturaBulkUploadFilter({
                statusIn: this._activeStatuses.join(','),
                bulkUploadObjectTypeIn: this._bulkUploadObjectTypeIn.join(','),
            }),
            responseProfile: new KalturaDetachedResponseProfile({
                type: KalturaResponseProfileType.includeFields,
                fields: 'id,status,uploadedOn'
            })
        });

        return this._kalturaClient.request(activeUploads);
    }

    private _cleanDeletedUploads(uploads: KalturaBulkUpload[]): void {
        const uploadIds = uploads.map(({id}) => id);
        this._getTrackedFiles().forEach(file => {
            const trackedUploadIsNotInResponse = uploadIds.indexOf(Number(file.id)) === -1;
            if (file.allowPurging && trackedUploadIsNotInResponse) {
                this._log('info', `server poll returned without upload with id '${file.id}'. removing file from tracking list`);
                delete this._bulkUploadFiles[file.id];
            }
        })
    }

    private _initTracking(): void {

        if (this._initializeState === 'failed' || this._initializeState === null) {
            this._log('info', `getting active uploads status from server`);
            this._initializeState = 'busy';
            this._totals.state.next({loading: true, error: false});

            this._getActiveUploadsList()
                .subscribe(
                    response => {
                        this._log('verbose', `syncing tracking file list from server. got ${response.objects.length} files to track`);
                        response.objects.forEach(upload => {
                            this._trackNewFile(upload);
                        });

                        this._updateServerQueryUploadedOnFilter();

                        this._totals.state.next({loading: false, error: false});
                        this._initializeState = 'succeeded';
                        this._startPolling();
                    },
                    () => {
                        this._totals.state.next({loading: false, error: true, isErrorRecoverable: true});
                        this._initializeState = 'failed';
                    }
                );
        } else {
            this._log('info', `everything is operating normally, no need to re-initialize`);
        }
    }

    private _updateServerQueryUploadedOnFilter(): void{
        const oldestUploadedOnFile = this._getTrackedFiles().reduce((acc, item) => !acc || item.uploadedOn < acc.uploadedOn ?  item : acc, null);
        const uploadedOnFrom = oldestUploadedOnFile ? oldestUploadedOnFile.uploadedOn : this._browserService.sessionStartedAt;
        if (this._bulkUploadChangesFactory.uploadedOn !== uploadedOnFrom) {
            this._log('verbose', `updating poll server query request with uploadedOn from ${uploadedOnFrom && uploadedOnFrom.toString()}`);
            this._bulkUploadChangesFactory.uploadedOn = uploadedOnFrom;
        }
    }

    private _startPolling(): void {

        if (this._poolingState !== 'running') {
            this._poolingState = 'running';
            this._log('info', `start server polling every 10 seconds to sync bulk upload status`);


            this._kmcServerPolls.register<KalturaBulkUploadListResponse>(10, this._bulkUploadChangesFactory)
                .cancelOnDestroy(this)
                .subscribe((response) => {
                    if (response.error) {
                        this._log('warn', `error occurred while trying to sync bulk upload status from server. server error: ${response.error.message}`);
                        this._totals.state.next({loading: false, error: true, isErrorRecoverable: false});
                        return;
                    }

                    const serverFiles = response.result.objects;



                    if (serverFiles.length > 0) {
                        this._cleanDeletedUploads(serverFiles);
                        this._updateTrackedFilesFromServer(serverFiles);
                        this._updateServerQueryUploadedOnFilter();
                        this._updateAllowPurgingMode();
                        this._totals.data.next(this._calculateTotalsFromState());
                    }else {
                        this._cleanDeletedUploads(serverFiles);
                        this._updateAllowPurgingMode();
                        this._totals.data.next(this._calculateTotalsFromState());
                    }

                    if (this._totals.state.getValue().error) {
                        this._totals.state.next({loading: false, error: false});
                    }
                });
        }
    }

    private _updateAllowPurgingMode(): void{
        this._getTrackedFiles().filter(item => !item.allowPurging).forEach(file => {
            this._log('verbose', `update file '${file.id} to allow purging next time syncing from the server`);
            file.allowPurging = true;
        });
    }

    private _updateTrackedFilesFromServer(serverFiles: BulkUploadFile[]): void{
        serverFiles.forEach(upload => {
            const currentUploadIsActive = this._activeStatuses.indexOf(upload.status) !== -1;
            const relevantUpload = this._bulkUploadFiles[upload.id];

            if (relevantUpload) { // update status for existing upload
                if (relevantUpload.status !== upload.status) {
                    this._log('info', `sync upload file '${upload.id} with status '${upload.status}'`);
                    relevantUpload.status = upload.status;
                }
            } else if (currentUploadIsActive) { // track new active upload
                this._trackNewFile({
                    id: upload.id,
                    status: upload.status,
                    uploadedOn: upload.uploadedOn
                });
            }
        });

    }

    public retryTracking(): void {
        this._log('silly', `retryTracking()`);

        this._initTracking();
    }
}
