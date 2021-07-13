import { Injectable } from '@angular/core';
import { UploadFileAdapter, UploadFileData } from '@kaltura-ng/kaltura-common';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { KalturaClient } from 'kaltura-ngx-client';
import { UploadTokenAddAction } from 'kaltura-ngx-client';
import { UploadTokenUploadAction } from 'kaltura-ngx-client';
import { KalturaUploadToken } from 'kaltura-ngx-client';
import { KalturaUploadFile } from './kaltura-upload-file';
import { KalturaRequest } from 'kaltura-ngx-client';
import { UploadTokenListAction } from 'kaltura-ngx-client';
import { KalturaUploadTokenFilter } from 'kaltura-ngx-client';
import { KalturaUploadTokenListResponse } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

@Injectable()
export class KalturaUploadAdapter extends UploadFileAdapter<KalturaUploadFile> {
    constructor(private _serverClient: KalturaClient,
                private _logger: KalturaLogger) {
        super();
        this._logger = _logger.subLogger('KalturaUploadAdapter');
    }

    get label(): string {
        return 'Kaltura OVP server';
    }

    private _getUploadToken(uploadFile: KalturaUploadFile): Observable<string> {

        return this._serverClient.request(
            new UploadTokenAddAction({
                uploadToken: new KalturaUploadToken()
            })
        )
            .map(
                (response) => {
                    return response.id;
                }
            );
    }

    supportChunkUpload(): boolean{
        return new UploadTokenUploadAction({
            uploadTokenId : 'uploadTokenId',
            fileData : <File>({})
        }).supportChunkUpload();
    }

    prepare(files: { id: string, data: KalturaUploadFile }[]): Observable<{ id: string, status: boolean }[]> {
        const multiRequest: KalturaRequest<any>[] = [];

        files.forEach(file => {
            multiRequest.push(
                new UploadTokenAddAction({
                    uploadToken: new KalturaUploadToken()
                })
            );
        });
        return this._serverClient.multiRequest(multiRequest)
            .pipe(map(responses => {
                return files.map((file, index) => {
                    const response = responses[index];
                    let status = !!response.result;

                    if (response.result) {
                        file.data.serverUploadToken = response.result.id;
                        this._logger.debug(`updated server upload token to '${response.result.id}' for file '${file.id}'`);
                    } else {
                        this._logger.warn(`failed to prepare file '${file.id}`);
                    }

                    return {id: file.id, status};
                });
            }));
    }

    canHandle(uploadFile: UploadFileData): boolean {
        return uploadFile instanceof KalturaUploadFile;
    }

    resume(id: string, fileData: KalturaUploadFile): Observable<{ id: string, progress?: number }> {
      if (!fileData || !(fileData instanceof KalturaUploadFile) || !fileData.serverUploadToken) {
        return throwError('missing upload token');
      }
    }

    upload(id: string, fileData: KalturaUploadFile): Observable<{ id: string, progress?: number }> {
        return Observable.create((observer) => {
            if (fileData && fileData instanceof KalturaUploadFile) {
                this._logger.info(`starting upload for file '${id}'`);

                let requestSubscription = of(fileData.serverUploadToken)
                    .pipe(switchMap(serverUploadToken =>
                    {
                        if (!serverUploadToken)
                        {
                            // start from the beginning
                            return of(0);
                        }else
                        {
                            return this._serverClient.request(
                                new UploadTokenListAction({
                                    filter: new KalturaUploadTokenFilter({ idIn: fileData.serverUploadToken })
                                })
                            ).pipe(map((response: KalturaUploadTokenListResponse) => {
                                const uploadedFileSize = response && response.objects && response.objects.length > 0 ? response.objects[0].uploadedFileSize : null;

                                if (typeof uploadedFileSize === 'number') {
                                    this._logger.info(`file '${id}': got from server 'uploadedFileSize' value ${uploadedFileSize} for '${fileData.serverUploadToken}'. resume upload. `);
                                    return uploadedFileSize*1;
                                }else
                                {
                                    this._logger.info(`file '${id}': server resulted without information about previous uploads '${fileData.serverUploadToken}'. (re)start new upload.`);
                                    return 0;
                                }
                            })).pipe(catchError(caught =>
                            {
                                this._logger.warn(`file '${id}': failed to get 'uploadedFileSize' for '${fileData.serverUploadToken}'. re-start new upload. error: ${caught.message}`);
                                return of(0);
                            }));
                        }
                    }))
                    .pipe(switchMap(uploadedFileSize =>
                    {
                        const payload = {
                            uploadTokenId: fileData.serverUploadToken,
                            fileData: fileData.file,
                            uploadedFileSize: uploadedFileSize
                        };

                        return this._serverClient.request(
                            new UploadTokenUploadAction(payload).setProgress(
                                (uploaded, total) => {
                                    const progress = total && total !== 0 ? uploaded / total : null;
                                    observer.next({id: id, progress});
                                }
                            )
                        )
                    }))
                    .subscribe(
                        () => {
                            requestSubscription = null;
                            this._logger.info(`file upload completed for file with upload token '${id}'`);
                            observer._complete();
                        },
                        (error) => {
                            requestSubscription = null;
                            this._logger.warn(`file upload failed for file with upload token '${id}' (reason: ${error.message})`);
                            observer.error(error);
                        }
                    );

                return () => {
                    if (requestSubscription) {
                        this._logger.info(`cancelling upload file to the server with upload token '${id}'`);
                        requestSubscription.unsubscribe();
                        requestSubscription = null;
                    }
                };
            } else {
                observer.error(new Error('missing upload token and content'));
            }

        });
    }
}
