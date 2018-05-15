import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient } from 'kaltura-ngx-client';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { TrackedFileStatuses, UploadManagement } from '@kaltura-ng/kaltura-common';
import { NewReplaceVideoUploadFile } from './new-replace-video-upload-file';
import { KalturaUploadedFileTokenResource } from 'kaltura-ngx-client/api/types/KalturaUploadedFileTokenResource';
import { KalturaAssetParamsResourceContainer } from 'kaltura-ngx-client/api/types/KalturaAssetParamsResourceContainer';
import { KalturaAssetsParamsResourceContainers } from 'kaltura-ngx-client/api/types/KalturaAssetsParamsResourceContainers';
import { MediaUpdateContentAction } from 'kaltura-ngx-client/api/types/MediaUpdateContentAction';
import { UploadTokenDeleteAction } from 'kaltura-ngx-client/api/types/UploadTokenDeleteAction';
import { TrackedFileData } from '@kaltura-ng/kaltura-common/upload-management/tracked-file';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';
import { KalturaUrlResource } from 'kaltura-ngx-client/api/types/KalturaUrlResource';
import { Subject } from 'rxjs/Subject';
import { MediaCancelReplaceAction } from 'kaltura-ngx-client/api/types/MediaCancelReplaceAction';
import { BrowserService } from 'app-shared/kmc-shell';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';
import { KalturaRemoteStorageResource } from 'kaltura-ngx-client/api/types/KalturaRemoteStorageResource';

export interface KmcNewReplaceEntryLink {
    url: string;
    assetParamsId: number;
}

export interface KmcNewReplaceEntryUpload {
    file: File;
    assetParamsId: number;
}

export interface KmcNewReplaceEntryImport {
    url: string;
    assetParamsId: number;
}

@Injectable()
export class NewReplaceVideoUploadService implements OnDestroy {
    private _mediaUpdated = new Subject<string>();

    private _preparedFilesList: {
        [entryId: string]: {
            files: TrackedFileData[],
            count: number
        }
    } = {};

    constructor(private _kalturaServerClient: KalturaClient,
                private _uploadManagement: UploadManagement,
                private _browserService: BrowserService,
                private _appLocalization: AppLocalization,
                private _logger: KalturaLogger) {
        this._logger = _logger.subLogger('NewReplaceVideoUploadService');
        this._monitorTrackedFilesChanges();
    }

    ngOnDestroy() {
        this._mediaUpdated.complete();
    }

    private _monitorTrackedFilesChanges(): void {
        this._uploadManagement.onTrackedFileChanged$
            .cancelOnDestroy(this)
            .filter(trackedFile => trackedFile.data instanceof NewReplaceVideoUploadFile)
            .subscribe(
                trackedFile => {
                    switch (trackedFile.status) {
                        case TrackedFileStatuses.cancelled:
                            this._cancelReplacement(trackedFile);
                            break;
                        case TrackedFileStatuses.purged:
                            this._cleanupUpload(trackedFile);
                            break;
                        case TrackedFileStatuses.prepared:
                            this._updatePreparedFilesList(trackedFile);
                            break;
                        default:
                            break;
                    }
                }
            );
    }

    private _cancelReplacement(trackedFile: TrackedFileData): void {
        const entryId = (<NewReplaceVideoUploadFile>trackedFile.data).entryId;

        this._uploadManagement.getTrackedFiles()
            .filter(file => file.data instanceof NewReplaceVideoUploadFile && file.data.entryId === entryId)
            .forEach(file => this._cancelUpload(file));

        this._kalturaServerClient.request(new MediaCancelReplaceAction({ entryId }))
            .cancelOnDestroy(this)
            .tag('block-shell')
            .subscribe(
                () => {
                },
                error => {
                    this._browserService.alert({
                        header: this._appLocalization.get('app.common.error'),
                        message: error.message
                    });
                }
            );
    }

    private _updatePreparedFilesList(trackedFileData: TrackedFileData): void {
        const file = <NewReplaceVideoUploadFile>trackedFileData.data;
        const filesList = this._preparedFilesList[file.entryId];

        if (!filesList) {
            return;
        }

        filesList.files.push(trackedFileData);

        if (filesList.count === filesList.files.length) {
            this._updateMediaContent(file.entryId, filesList.files);
        }
    }

    private _cancelUpload(trackedFile: TrackedFileData): void {
        this._uploadManagement.cancelUpload(trackedFile.id, true);
    }

    private _cleanupUpload(trackedFile: TrackedFileData): void {
        const trackedFileData = <NewReplaceVideoUploadFile>trackedFile.data;

        if (trackedFileData.createMediaEntrySubscription instanceof Subscription) {
            trackedFileData.createMediaEntrySubscription.unsubscribe();
            trackedFileData.createMediaEntrySubscription = null;
        }

        if (trackedFileData.serverUploadToken) {
            this._removeUploadToken(trackedFileData.serverUploadToken)
                .subscribe(
                    () => {
                    },
                    (error) => {
                        this._logger.warn(this._formatError('Failed to remove upload token', error));
                    }
                );
        }
    }

    private _updateMediaContent(entryId: string, trackedFiles: TrackedFileData[]): void {
        const files = <NewReplaceVideoUploadFile[]>trackedFiles.map(({ data }) => data);
        const conversionProfileId = files[0].transcodingProfileId;
        const resource = new KalturaAssetsParamsResourceContainers({
            resources: files.map(file => {
                const subSubResource = new KalturaUploadedFileTokenResource({ token: file.serverUploadToken });
                return new KalturaAssetParamsResourceContainer({ resource: subSubResource, assetParamsId: file.assetParamsId || 0 });
            })
        });

        this._kalturaServerClient.request(new MediaUpdateContentAction({ entryId, resource, conversionProfileId }))
            .subscribe(
                () => {
                    this._mediaUpdated.next(entryId);
                    delete this._preparedFilesList[entryId];
                },
                (error) => {
                    this._mediaUpdated.error(error);

                    trackedFiles.forEach(trackedFile => {
                        this._uploadManagement.cancelUploadWithError(trackedFile.id, this._formatError('Failed to create entry', error));
                    });
                }
            );
    }

    private _removeUploadToken(uploadTokenId: string): Observable<void> {
        return this._kalturaServerClient.request(new UploadTokenDeleteAction({ uploadTokenId }));
    }

    private _formatError(message: string, error: string | { message: string }): string {
        const errorMessage = typeof error === 'string' ? error : error && error.message ? error.message : 'unknown reason';
        return `${message}: ${errorMessage}`;
    }

    public upload(files: KmcNewReplaceEntryUpload[], entryId: string, flavorParamsId: number): Observable<string> {
        this._preparedFilesList[entryId] = { count: files.length, files: [] };

        this._uploadManagement.addFiles(
            files.map(file =>
                new NewReplaceVideoUploadFile(file.file, file.assetParamsId, flavorParamsId, entryId)
            )
        );

        return this._mediaUpdated.asObservable();
    }

    public import(files: KmcNewReplaceEntryImport[], entryId: string, conversionProfileId: number): Observable<void> {
        const resources = files.map(file => {
            return new KalturaAssetParamsResourceContainer({
                resource: new KalturaUrlResource({ url: file.url }),
                assetParamsId: file.assetParamsId || 0
            });
        });
        const resource = new KalturaAssetsParamsResourceContainers({ resources });

        return this._kalturaServerClient
            .request(new MediaUpdateContentAction({ entryId, resource, conversionProfileId }))
            .map(() => {
            });
    }

    public cancelUploadByEntryId(entryId: string): void {
        this._uploadManagement.getTrackedFiles()
            .filter(file => file.data instanceof NewReplaceVideoUploadFile && file.data.entryId === entryId)
            .forEach(file => this._cancelUpload(file));
    }

    public link(files: KmcNewReplaceEntryLink[], entryId: string, conversionProfileId: number, storageProfileId: number): Observable<void> {
        const resources = files.map(file => {
            return new KalturaAssetParamsResourceContainer({
                resource: new KalturaRemoteStorageResource({ url: file.url, storageProfileId }),
                assetParamsId: file.assetParamsId || 0
            });
        });
        const resource = new KalturaAssetsParamsResourceContainers({ resources });

        return this._kalturaServerClient
            .request(new MediaUpdateContentAction({ entryId, resource, conversionProfileId }))
            .map(() => {
            });
    }
}
