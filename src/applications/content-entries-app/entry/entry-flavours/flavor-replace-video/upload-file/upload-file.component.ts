import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { AppLocalization, UploadManagement } from '@kaltura-ng/kaltura-common';
import { KalturaMediaType } from 'kaltura-ngx-client/api/types/KalturaMediaType';
import { NewEntryUploadFile, NewEntryUploadService } from 'app-shared/kmc-shell';
import { AreaBlockerMessage, FileDialogComponent } from '@kaltura-ng/kaltura-ui';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { TranscodingProfileManagement } from 'app-shared/kmc-shared/transcoding-profile-management';
import { globalConfig } from 'config/global';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { Flavor } from '../../flavor';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { KalturaClient } from 'kaltura-ngx-client';
import { ConversionProfileAssetParamsListAction } from 'kaltura-ngx-client/api/types/ConversionProfileAssetParamsListAction';
import { KalturaConversionProfileAssetParamsFilter } from 'kaltura-ngx-client/api/types/KalturaConversionProfileAssetParamsFilter';
import { KalturaFilterPager } from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import { KalturaConversionProfileFilter } from 'kaltura-ngx-client/api/types/KalturaConversionProfileFilter';
import { KalturaConversionProfileOrderBy } from 'kaltura-ngx-client/api/types/KalturaConversionProfileOrderBy';
import { KalturaConversionProfileType } from 'kaltura-ngx-client/api/types/KalturaConversionProfileType';
import { KalturaConversionProfile } from 'kaltura-ngx-client/api/types/KalturaConversionProfile';
import { KalturaConversionProfileAssetParams } from 'kaltura-ngx-client/api/types/KalturaConversionProfileAssetParams';
import { KalturaAssetParamsOrigin } from 'kaltura-ngx-client/api/types/KalturaAssetParamsOrigin';
import { Observable } from 'rxjs/Observable';

export interface KalturaTranscodingProfileWithAsset extends Partial<KalturaConversionProfile> {
    assets: KalturaConversionProfileAssetParams[];
}

export interface UploadReplacementFile {
    file: File;
    name: string;
    hasError?: boolean;
    errorToken?: string;
    size: number;
    flavor?: number;
}

@Component({
    selector: 'kFlavorFileUploadSettings',
    templateUrl: './upload-file.component.html',
    styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() parentPopupWidget: PopupWidgetComponent;
    @Input() entry: KalturaMediaEntry;
    @Input() flavors: Flavor[] = [];
    @Input() replaceType: 'upload' | 'import';

    @ViewChild('fileDialog') _fileDialog: FileDialogComponent;

    private _transcodingProfiles: KalturaTranscodingProfileWithAsset[] = [];

    public _tableScrollableWrapper: Element;
    public _transcodingProfilesOptions: { value: number, label: string }[];
    public _profileForm: FormGroup;
    public _transcodingProfileField: AbstractControl;
    public _transcodingProfileError: AreaBlockerMessage;
    public _transcodingProfileLoading = false;
    public _files: UploadReplacementFile[] = [];
    public _kmcPermissions = KMCPermissions;
    public _title: string;
    public _flavorOptions: SelectItem[] = [];
    public _flavorsFieldDisabled = false;

    public _allowedVideoExtensions = `.flv,.asf,.qt,.mov,.mpg,.avi,.wmv,.mp4,.3gp,.f4v,.m4v`;
    public _allowedAudioExtensions = `.flv,.asf,.qt,.mov,.mpg,.avi,.wmv,.mp3,.wav`;

    public _allowedExtensions: string;

    constructor(private _newEntryUploadService: NewEntryUploadService,
                private _formBuilder: FormBuilder,
                private _kalturaClient: KalturaClient,
                private _transcodingProfileManagement: TranscodingProfileManagement,
                private _uploadManagement: UploadManagement,
                private _permissionsService: KMCPermissionsService,
                private _appLocalization: AppLocalization) {
        this._buildForm();
    }

    ngOnInit() {
        this._prepare();
    }

    ngOnDestroy() {

    }

    ngAfterViewInit(): void {
        if (this.replaceType === 'upload') {
            this._fileDialog.open();
        }

        this._tableScrollableWrapper = document.querySelector('.kUploadSettings .ui-datatable-scrollable-body');
    }

    private _buildForm(): void {
        this._profileForm = this._formBuilder.group({ 'transcodingProfile': '' });
        this._transcodingProfileField = this._profileForm.controls['transcodingProfile'];
    }

    private _prepare(): void {
        if (this.entry.mediaType === KalturaMediaType.video) {
            this._allowedExtensions = this._allowedVideoExtensions;
            this._title = this.entry.status === KalturaEntryStatus.noContent
                ? this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.addVideo')
                : this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.updateVideo');
        } else if (this.entry.mediaType === KalturaMediaType.audio) {
            this._allowedExtensions = this._allowedAudioExtensions;
            this._title = this.entry.status === KalturaEntryStatus.noContent
                ? this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.addAudio')
                : this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.updateAudio');
        }

        this._loadTranscodingProfiles();
    }

    public _handleSelectedFiles(files: FileList): void {
        const newItems = Array.from(files).map(file => {
            const { name, size } = file;
            return { file, name, size };
        });

        this._files = [...this._files, ...newItems];
    }

    private _loadConversionProfiles(): Observable<KalturaConversionProfileAssetParams[]> {
        const filter = new KalturaConversionProfileFilter({
            orderBy: KalturaConversionProfileOrderBy.createdAtDesc.toString(),
            typeEqual: KalturaConversionProfileType.media
        });

        // build the request
        return this._kalturaClient
            .request(new ConversionProfileAssetParamsListAction({
                filter: new KalturaConversionProfileAssetParamsFilter({ conversionProfileIdFilter: filter }),
                pager: new KalturaFilterPager({ pageSize: 1000 })
            })).map(res => res.objects);
    }

    private _loadTranscodingProfiles(): void {
        this._transcodingProfileLoading = true;

        this._transcodingProfileManagement.get()
            .switchMap(
                () => this._loadConversionProfiles(),
                (transcodingProfiles, assets) => {
                    return transcodingProfiles.map(profile => {
                        return {
                            id: profile.id,
                            name: profile.name,
                            isDefault: profile.isDefault,
                            assets: assets.filter(item => {
                                return item.conversionProfileId === profile.id && item.origin === KalturaAssetParamsOrigin.convert;
                            })
                        };
                    });
                }
            )
            .subscribe(
                (profilesWithAssets) => {
                    const transcodingProfiles = [...profilesWithAssets];
                    const defaultProfileIndex = transcodingProfiles.findIndex(({ isDefault }) => !!isDefault);
                    if (defaultProfileIndex !== -1) {
                        const [defaultProfile] = transcodingProfiles.splice(defaultProfileIndex, 1);
                        this._transcodingProfilesOptions = [
                            { label: defaultProfile.name, value: defaultProfile.id },
                            ...transcodingProfiles.map(({ name: label, id: value }) => ({ label, value }))
                        ];
                        this._transcodingProfileField.setValue(defaultProfile.id);
                    } else {
                        this._transcodingProfilesOptions = transcodingProfiles.map(({ name: label, id: value }) => ({ label, value }));
                        this._transcodingProfileField.setValue(this._transcodingProfilesOptions[0].value);
                    }

                    if (this.entry.conversionProfileId) {
                        this._transcodingProfileField.setValue(this.entry.conversionProfileId);
                    }

                    this._transcodingProfiles = profilesWithAssets;

                    this._updateFlavorsOption();

                    this._transcodingProfileLoading = false;
                },
                (error) => {
                    this._transcodingProfileError = new AreaBlockerMessage({
                        message: error.message,
                        buttons: [
                            {
                                label: this._appLocalization.get('app.common.retry'),
                                action: () => {
                                    this._transcodingProfileError = null;
                                    this._transcodingProfileLoading = false;
                                    this._loadTranscodingProfiles();
                                }
                            },
                            {
                                label: this._appLocalization.get('app.common.cancel'),
                                action: () => {
                                    this._transcodingProfileError = null;
                                    this._transcodingProfileLoading = false;
                                    this.parentPopupWidget.close();
                                }
                            }
                        ]
                    });
                });
    }

    private _setNoFlavorsOption(): void {
        this._flavorOptions = [{
            label: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.noFlavors'),
            value: null
        }];
        this._flavorsFieldDisabled = true;
    }

    public _removeFile(file: UploadReplacementFile): void {
        const fileIndex = this._files.indexOf(file);
        if (fileIndex !== -1) {
            const newList = Array.from(this._files);
            newList.splice(fileIndex, 1);
            this._files = newList;
        }
    }

    public _updateFlavorsOption(): void {
        this._flavorsFieldDisabled = false;
        const relevantTranscodingProfile = this._transcodingProfiles.find(profile => profile.id === this._transcodingProfileField.value);
        if (relevantTranscodingProfile && relevantTranscodingProfile.assets.length) {
            const assetParamsIds = relevantTranscodingProfile.assets.map(({ assetParamsId }) => assetParamsId);
            this._flavorOptions = this.flavors
                .filter((flavor) => assetParamsIds.indexOf(flavor.paramsId) !== -1)
                .map(({ name: label, id: value }) => ({ label, value }));

            if (!this._flavorOptions.length) {
                this._setNoFlavorsOption();
            }
        } else {
            this._setNoFlavorsOption();
        }
    }

    public _upload(): void {
        const transcodingProfileId = this._profileForm.value.transcodingProfile;

        if (transcodingProfileId === null || typeof transcodingProfileId === 'undefined' || transcodingProfileId.length === 0) {
            this._transcodingProfileError = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.upload.validation.missingTranscodingProfile'),
                buttons: [{
                    label: this._appLocalization.get('app.common.ok'),
                    action: () => {
                        this._transcodingProfileError = null;
                    }
                }]
            });
            return;
        }

        if (this._validateFiles(this._files)) {
            this.parentPopupWidget.close();
            const uploadFileDataList = this._files.map(fileData => ({
                file: fileData.file,
                entryName: fileData.name
            }));

            // this._newEntryUploadService.upload(uploadFileDataList, Number(transcodingProfileId));
        }
    }

    private _validateFiles(files: UploadReplacementFile[]): boolean {
        let result = true;
        const maxFileSize = globalConfig.kalturaServer.maxUploadFileSize;

        files.forEach(file => {
            const fileSize = file.size / 1024 / 1024; // convert to Mb

            if (Number.isInteger(file.flavor) && !this._flavorsFieldDisabled && this._permissionsService.hasPermission(KMCPermissions.FEATURE_MULTI_FLAVOR_INGESTION)) {
                result = false;
                file.errorToken = 'applications.upload.validation.selectFlavor';
                file.hasError = true;
            } else if (!(this._uploadManagement.supportChunkUpload(new NewEntryUploadFile(null, null, null, null)) || fileSize < maxFileSize)) {
                result = false;
                file.hasError = true;
                file.errorToken = 'applications.upload.validation.fileSizeExceeded';
            } else {
                file.hasError = false;
                file.errorToken = null;
            }
        });

        return result;
    }

    public _updateFileValidityOnTypeChange(file: UploadReplacementFile): void {
        if (file.hasError && file.errorToken === 'applications.upload.validation.selectFlavor') {
            file.errorToken = null;
            file.hasError = false;
        }
    }
}
