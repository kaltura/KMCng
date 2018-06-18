import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

import { ThumbAssetSetAsDefaultAction } from 'kaltura-ngx-client/api/types/ThumbAssetSetAsDefaultAction';
import { ThumbAssetGetByEntryIdAction } from 'kaltura-ngx-client/api/types/ThumbAssetGetByEntryIdAction';
import { KalturaThumbAsset } from 'kaltura-ngx-client/api/types/KalturaThumbAsset';
import { DistributionProfileListAction } from 'kaltura-ngx-client/api/types/DistributionProfileListAction';
import { KalturaDistributionProfileListResponse } from 'kaltura-ngx-client/api/types/KalturaDistributionProfileListResponse';
import { KalturaDistributionProfile } from 'kaltura-ngx-client/api/types/KalturaDistributionProfile';
import { KalturaThumbAssetStatus } from 'kaltura-ngx-client/api/types/KalturaThumbAssetStatus';
import { KalturaDistributionThumbDimensions } from 'kaltura-ngx-client/api/types/KalturaDistributionThumbDimensions';
import { ThumbAssetDeleteAction } from 'kaltura-ngx-client/api/types/ThumbAssetDeleteAction';
import { ThumbAssetAddFromImageAction } from 'kaltura-ngx-client/api/types/ThumbAssetAddFromImageAction';
import { AppAuthentication, BrowserService } from 'app-shared/kmc-shell';
import { AppLocalization } from '@kaltura-ng/mc-shared/localization';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaClient } from 'kaltura-ngx-client';
import { PreviewMetadataChangedEvent } from '../../preview-metadata-changed-event';
import { AppEventsService } from 'app-shared/kmc-shared';
import { EntryWidget } from '../entry-widget';
import { KalturaThumbParams } from 'kaltura-ngx-client/api/types/KalturaThumbParams';
import { ThumbAssetGenerateAction } from 'kaltura-ngx-client/api/types/ThumbAssetGenerateAction';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { KalturaMediaType } from 'kaltura-ngx-client/api/types/KalturaMediaType';
import { globalConfig } from 'config/global';
import { serverConfig, getKalturaServerUri } from 'config/server';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';

export interface ThumbnailRow {
  id: string;
  width: number;
  height: number;
  size: number;
  distributors: string;
  isDefault: boolean;
  url: string;
  status: KalturaThumbAssetStatus;
  uploadStatus: boolean;
  fileExt: string;
}

@Injectable()
export class EntryThumbnailsWidget extends EntryWidget {
    public allowGrabFromVideo = false;
    private _thumbnails = new BehaviorSubject<{ items: ThumbnailRow[] }>(
        {items: []}
    );

    public _thumbnails$ = this._thumbnails.asObservable();
    private _distributionProfiles: KalturaDistributionProfile[]; // used to save the response profiles array as it is loaded only once

    constructor(private _kalturaServerClient: KalturaClient, private _appAuthentication: AppAuthentication,
                private _permissionsService: KMCPermissionsService,
                private _appLocalization: AppLocalization, private _appEvents: AppEventsService, private _browserService: BrowserService,
                logger: KalturaLogger) {
        super(ContentEntryViewSections.Thumbnails, logger);
    }

    /**
     * Do some cleanups if needed once the section is removed
     */
    protected onReset() {
        this.allowGrabFromVideo = false;
    }

    protected onActivate(firstTimeActivating: boolean) {

        super._showLoader();

        this._thumbnails.next({items: []});

        const getThumbnails$ = this._kalturaServerClient.request(new ThumbAssetGetByEntryIdAction(
            {
                entryId: this.data.id
            }));

        const canLoadProfiles = this._permissionsService.hasPermission(KMCPermissions.CONTENTDISTRIBUTION_PLUGIN_PERMISSION);
        const getProfiles$ = canLoadProfiles
            ? this._kalturaServerClient.request(new DistributionProfileListAction({}))
            : Observable.of({});

        return Observable.forkJoin(getThumbnails$, getProfiles$)
            .cancelOnDestroy(this, this.widgetReset$)

            .catch((error, caught) => {
                super._hideLoader();
                super._showActivationError();
                this._thumbnails.next({items: []});
                return Observable.throw(error);
            })
            .do(responses => {
                const thumbnails = responses[0] || [];
                this._distributionProfiles = (responses[1] as KalturaDistributionProfileListResponse).objects || [];
                this.buildThumbnailsData(thumbnails);
                this.allowGrabFromVideo = (this.data.status
                    && [KalturaEntryStatus.ready.toString(), KalturaEntryStatus.moderate.toString()].indexOf(this.data.status.toString()) !== -1
                    && this.data.mediaType === KalturaMediaType.video);
                super._hideLoader();
            });

    }


    private buildThumbnailsData(thumbnails: KalturaThumbAsset[]): void {
        let thumbs: ThumbnailRow[] = [];
        // create a ThumbnailRow data for each of the loaded thumbnails
        thumbnails.forEach((thumbnail: KalturaThumbAsset) => {
            if (thumbnail.status.toString() === KalturaThumbAssetStatus.ready.toString()) {
                let thumb: ThumbnailRow = {
                    id: thumbnail.id,
                    status: thumbnail.status,
                    width: thumbnail.width,
                    height: thumbnail.height,
                    size: thumbnail.size,
                    isDefault: false,
                    distributors: "",
                    url: "",
                    uploadStatus: false,
                    fileExt: thumbnail.fileExt
                };
                thumb.isDefault = thumbnail.tags.indexOf("default_thumb") > -1;
                thumb.url = getKalturaServerUri(`/api_v3/index.php/service/thumbasset/action/serve/ks/${this._appAuthentication.appUser.ks}/thumbAssetId/${thumb.id}`);
                thumbs.push(thumb);
            }
        });
        // create an empty ThumbnailRow data for each missing thumbnail dimension specified in any response profile
        this._distributionProfiles.forEach((profile: KalturaDistributionProfile) => {
            const requiredThumbDimensions: KalturaDistributionThumbDimensions[] = profile.requiredThumbDimensions;
            requiredThumbDimensions.forEach((dimensions: KalturaDistributionThumbDimensions) => {
                const requiredWidth = dimensions.width;
                const requiredHeight = dimensions.height;
                let foundCorrespondingThumbnail = false;
                thumbs.forEach((thumbnail: ThumbnailRow) => {
                    // found thumbnail with the required dimensions - add the distrubution name to the thumbnail distributors
                    if (thumbnail.width === requiredWidth && thumbnail.height === requiredHeight) {
                        foundCorrespondingThumbnail = true;
                        thumbnail.distributors = thumbnail.distributors.length > 0 ? thumbnail.distributors + ", " + profile.name : profile.name;
                    }
                });
                if (!foundCorrespondingThumbnail) {
                    // create a new missing thumb placeholder and append it to the thumbnails array
                    let missingThumb: ThumbnailRow = {
                        id: "",
                        status: KalturaThumbAssetStatus.error,
                        width: requiredWidth,
                        height: requiredHeight,
                        size: NaN,
                        isDefault: false,
                        distributors: profile.name,
                        url: '',
                        uploadStatus: false,
                        fileExt: ''
                    };
                    thumbs.push(missingThumb);
                }
            });
        });
        this._thumbnails.next({items: thumbs});
    }

    private reloadThumbnails() {
        super._showLoader();
        const thumbs = Array.from(this._thumbnails.getValue().items);
        this._kalturaServerClient.request(new ThumbAssetGetByEntryIdAction(
            {
                entryId: this.data.id
            }))
            .cancelOnDestroy(this, this.widgetReset$)
            .subscribe(
                (responses) => {
                    const thumbnails = responses || [];
                    this.buildThumbnailsData(thumbnails);
                    super._hideLoader();
                },
                (error) => {
                    super._hideLoader();
                    this._showBlockerMessage(new AreaBlockerMessage(
                        {
                            message: this._appLocalization.get('applications.content.entryDetails.errors.thumbnailsError'),
                            buttons: [
                                {
                                    label: this._appLocalization.get('applications.content.entryDetails.errors.reload'),
                                    action: () => {
                                        this.reloadThumbnails();
                                    }
                                }
                            ]
                        }
                    ), true);
                }
            );
    }

    // animate uploading thumbnail row
    public _getRowStyle(rowData, rowIndex): string {
        return rowData.uploadStatus ? "uoloading" : '';
    }

    public _setAsDefault(thumb: ThumbnailRow): void {
        const thumbs = Array.from(this._thumbnails.getValue().items);

        const entryId = this.data ? this.data.id : null;

        this._kalturaServerClient.request(new ThumbAssetSetAsDefaultAction({thumbAssetId: thumb.id}))
            .cancelOnDestroy(this, this.widgetReset$)
            .tag('block-shell')
            .subscribe(
                () => {
                    thumbs.forEach(thumb => {
                        thumb.isDefault = false;
                    });
                    thumb.isDefault = true;

                    if (entryId) {
                        this._appEvents.publish(new PreviewMetadataChangedEvent(entryId));
                    }
                },
                error => {
                    this._showBlockerMessage(new AreaBlockerMessage(
                        {
                            message: 'Error setting default thumb',
                            buttons: [
                                {
                                    label: 'Retry',
                                    action: () => {
                                        this._setAsDefault(thumb);
                                    }
                                }
                            ]
                        }
                    ), true);
                }
            );
    }

    public deleteThumbnail(id: string): void {
        const thumbs = Array.from(this._thumbnails.getValue().items);

        this._kalturaServerClient.request(new ThumbAssetDeleteAction({thumbAssetId: id}))
            .cancelOnDestroy(this, this.widgetReset$)
            .tag('block-shell')
            .subscribe(
                () => {
                    this._browserService.scrollToTop();
                    this.reloadThumbnails();
                },
                error => {
                    this._showBlockerMessage(new AreaBlockerMessage(
                        {
                            message: 'Error deleting thumbnail',
                            buttons: [
                                {
                                    label: 'Retry',
                                    action: () => {
                                        this.deleteThumbnail(id);
                                    }
                                }
                            ]
                        }
                    ), true);
                }
            );
    }

    public _onFileSelected(selectedFiles: FileList) {
        if (selectedFiles && selectedFiles.length) {
            const fileData: File = selectedFiles[0];
            const maxFileSize = globalConfig.kalturaServer.maxUploadFileSize;
            const fileSize = fileData.size / 1024 / 1024; // convert to Mb
            if (fileSize > maxFileSize) {
                this._browserService.alert({
                    header: this._appLocalization.get('app.common.attention'),
                    message: this._appLocalization.get('applications.upload.validation.fileSizeExceeded')
                });
            } else {
                this._kalturaServerClient.request(new ThumbAssetAddFromImageAction({
                    entryId: this.data.id,
                    fileData: fileData
                }))
                    .tag('block-shell')
                    .cancelOnDestroy(this, this.widgetReset$)
                    .subscribe(
                        () => this.reloadThumbnails(),
                        () => {
                            this._showBlockerMessage(new AreaBlockerMessage({
                                message: this._appLocalization.get('applications.content.entryDetails.errors.thumbnailsUploadError'),
                                buttons: [{
                                    label: this._appLocalization.get('applications.content.entryDetails.errors.dismiss'),
                                    action: () => super._removeBlockerMessage()
                                }]
                            }), true);
                        }
                    );
            }
        }
    }


    public captureThumbnail(position: number): void {
        super._showLoader();
        let params: KalturaThumbParams = new KalturaThumbParams();
        params.videoOffset = position;
        params.quality = 75;
        params.stripProfiles = false;

        this._kalturaServerClient.request(new ThumbAssetGenerateAction({entryId: this.data.id, thumbParams: params}))
            .cancelOnDestroy(this, this.widgetReset$)
            .subscribe(
                () => {
                    super._hideLoader();
                    this.reloadThumbnails();
                },
                error => {
                    super._hideLoader();
                    this._showBlockerMessage(new AreaBlockerMessage(
                        {
                            message: 'Error capturing thumb',
                            buttons: [
                                {
                                    label: 'Dismiss',
                                    action: () => {
                                        this._removeBlockerMessage();
                                    }
                                },
                                {
                                    label: 'Retry',
                                    action: () => {
                                        this._removeBlockerMessage();
                                        this.captureThumbnail(position);
                                    }
                                }
                            ]
                        }
                    ), false);
                }
            );
    }


    ngOnDestroy() {
    }
}
