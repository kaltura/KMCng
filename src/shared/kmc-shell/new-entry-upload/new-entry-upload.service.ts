import { Injectable, OnDestroy } from '@angular/core';
import { KalturaClient } from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { KalturaMediaType, KalturaEntryApplication } from 'kaltura-ngx-client';
import { TrackedFileStatuses, UploadManagement } from '@kaltura-ng/kaltura-common';
import { NewEntryUploadFile } from './new-entry-upload-file';
import { MediaAddAction } from 'kaltura-ngx-client';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { KalturaUploadedFileTokenResource } from 'kaltura-ngx-client';
import { KalturaAssetParamsResourceContainer } from 'kaltura-ngx-client';
import { KalturaAssetsParamsResourceContainers } from 'kaltura-ngx-client';
import { MediaUpdateContentAction } from 'kaltura-ngx-client';
import { UploadTokenDeleteAction } from 'kaltura-ngx-client';
import { TrackedFileData } from '@kaltura-ng/kaltura-common';
import { Subject } from 'rxjs';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { filter, switchMap, tap } from 'rxjs/operators';
import { globalConfig } from 'config/global';

export interface KmcNewEntryUpload {
  file: File;
  mediaType: KalturaMediaType;
  entryName: string;
}

@Injectable()
export class NewEntryUploadService implements OnDestroy {
  public _mediaCreated = new Subject<{ id?: string, entryId?: string }>();
  public onMediaCreated$ = this._mediaCreated.asObservable();

  constructor(private _kalturaServerClient: KalturaClient,
              private _uploadManagement: UploadManagement) {
    this._monitorTrackedFilesChanges();
  }

  ngOnDestroy() {

  }

  private _monitorTrackedFilesChanges(): void {
    this._uploadManagement.onTrackedFileChanged$
      .pipe(cancelOnDestroy(this))
      .pipe(filter(trackedFile => trackedFile.data instanceof NewEntryUploadFile))
      .subscribe(
        trackedFile => {
          // NOTE: this service handles only 'purged' and 'waitingUpload' statuses by design.
          switch (trackedFile.status) {
            case TrackedFileStatuses.purged:
              this._cleanupUpload(trackedFile);
              break;
            case TrackedFileStatuses.prepared:
              this._linkEntryWithFile(trackedFile);
              break;
            default:
              break;
          }
        }
      );
  }

  private _cleanupUpload(trackedFile: TrackedFileData): void {
    const trackedFileData = <NewEntryUploadFile>trackedFile.data;

    if (trackedFileData.createMediaEntrySubscription) {
      trackedFileData.createMediaEntrySubscription.unsubscribe();
      trackedFileData.createMediaEntrySubscription = null;
    }

    if (trackedFileData.serverUploadToken) {
      this._removeUploadToken(trackedFileData.serverUploadToken)
        .subscribe(
          () => {
          },
          (error) => {
            console.warn(this._formatError('Failed to remove upload token', error));
          }
        );
    }
  }

  private _linkEntryWithFile(trackedFile: TrackedFileData): void {
    (<NewEntryUploadFile>trackedFile.data).createMediaEntrySubscription = this._createMediaEntry(<NewEntryUploadFile>trackedFile.data)
      .pipe(tap(entry => {
        (<NewEntryUploadFile>trackedFile.data).entryId = entry.id;
        this._mediaCreated.next({ id: trackedFile.id, entryId: entry.id });
      }))
      .pipe(switchMap((entry: KalturaMediaEntry) => this._updateMediaContent(entry, <NewEntryUploadFile>trackedFile.data)))
      .subscribe(
        () => {
        },
        (error) => {
          this._uploadManagement.cancelUploadWithError(trackedFile.id, this._formatError('Failed to create entry', error));
        }
      );
  }

  private _updateMediaContent(entry: KalturaMediaEntry, file: NewEntryUploadFile): Observable<KalturaMediaEntry> {
    const entryId = entry.id;
    const conversionProfileId = file.transcodingProfileId;
    const subSubResource = new KalturaUploadedFileTokenResource({ token: file.serverUploadToken });
    let resource = null;

    if (file.mediaType === KalturaMediaType.image) {
      resource = subSubResource;
    } else {
      const subResource = new KalturaAssetParamsResourceContainer({ resource: subSubResource, assetParamsId: 0 });
      resource = new KalturaAssetsParamsResourceContainers({ resources: [subResource] });
    }

    return this._kalturaServerClient.request(new MediaUpdateContentAction({ entryId, resource, conversionProfileId }));
  }

  private _createMediaEntry(file: NewEntryUploadFile): Observable<KalturaMediaEntry> {
    return this._kalturaServerClient.request(new MediaAddAction({
      entry: new KalturaMediaEntry({
        application: KalturaEntryApplication.kmc,
        applicationVersion: globalConfig.client.appVersion,
        sourceVersion: 'desktop',
        mediaType: file.mediaType,
        name: file.entryName,
        conversionProfileId: file.transcodingProfileId
      })
    }));
  }

  private _removeUploadToken(uploadTokenId: string): Observable<void> {
    return this._kalturaServerClient.request(new UploadTokenDeleteAction({ uploadTokenId }))
  }

  private _formatError(message: string, error: string | { message: string }): string {
    const errorMessage = typeof error === 'string' ? error : error && error.message ? error.message : 'unknown reason';
    return `${message}: ${errorMessage}`;
  }

  public upload(files: KmcNewEntryUpload[], trancodingProfileId: number): void {
    this._uploadManagement.addFiles(
      files.map(file => new NewEntryUploadFile(file.file, file.mediaType, trancodingProfileId, file.entryName))
    );
  }
}
