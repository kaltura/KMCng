import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { UploadManagement } from '@kaltura-ng/kaltura-common';
import { KalturaMediaType } from 'kaltura-ngx-client';
import { NewEntryUploadFile } from 'app-shared/kmc-shell';
import { AreaBlockerMessage, FileDialogComponent } from '@kaltura-ng/kaltura-ui';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { TranscodingProfileManagement } from 'app-shared/kmc-shared/transcoding-profile-management';
import { globalConfig } from 'config/global';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { Flavor } from '../../flavor';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { KalturaEntryStatus } from 'kaltura-ngx-client';
import { KalturaClient } from 'kaltura-ngx-client';
import { ConversionProfileAssetParamsListAction } from 'kaltura-ngx-client';
import { KalturaConversionProfileAssetParamsFilter } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaConversionProfileFilter } from 'kaltura-ngx-client';
import { KalturaConversionProfileOrderBy } from 'kaltura-ngx-client';
import { KalturaConversionProfileType } from 'kaltura-ngx-client';
import { KalturaConversionProfile } from 'kaltura-ngx-client';
import { KalturaConversionProfileAssetParams } from 'kaltura-ngx-client';
import { KalturaAssetParamsOrigin } from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { KalturaFlavorReadyBehaviorType } from 'kaltura-ngx-client';
import { urlRegex } from '@kaltura-ng/kaltura-ui';
import { NewReplaceVideoUploadService } from 'app-shared/kmc-shell/new-replace-video-upload';
import { EntryFlavoursWidget } from '../../entry-flavours-widget.service';
import { UploadMenuType } from '../replace-media-button/replace-media-button.component';
import { StorageProfileListAction } from 'kaltura-ngx-client';
import { KalturaStorageProfile } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { Observer } from 'rxjs/Observer';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { switchMap, map, filter } from 'rxjs/operators';
import { of as ObservableOf} from 'rxjs';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

export interface KalturaTranscodingProfileWithAsset extends Partial<KalturaConversionProfile> {
    assets: KalturaConversionProfileAssetParams[];
}

export interface UploadReplacementFile {
    file?: File;
    name?: string;
    hasError?: boolean;
    errorToken?: string;
    size?: number;
    flavor?: number;
    url?: string;
}

@Component({
    selector: 'kFlavorReplaceFile',
    templateUrl: './replace-file.component.html',
    styleUrls: ['./replace-file.component.scss'],
    providers: [KalturaLogger.createLogger('ReplaceFileComponent')]
})
export class ReplaceFileComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() parentPopupWidget: PopupWidgetComponent;
    @Input() entry: KalturaMediaEntry;
    @Input() flavors: Flavor[] = [];
    @Input() replaceType: UploadMenuType;

    @ViewChild('fileDialog', { static: true }) _fileDialog: FileDialogComponent;

    private _storageProfiles: KalturaStorageProfile[] = [];
    private _transcodingProfiles: KalturaTranscodingProfileWithAsset[] = [];
    private _replacementResultHandler: Observer<void> = {
        next: () => {
            this._logger.info(`handle successful replace files action, reload widget data`);
            this._widgetService.refresh();
            this.parentPopupWidget.close();
        },
        error: (error) => {
            this._logger.warn(`handle failed replace files action, show alert`, { errorMessage: error.message });
            this._blockerMessage = new AreaBlockerMessage({
                message: error.message,
                buttons: [{
                    label: this._appLocalization.get('app.common.ok'),
                    action: () => {
                        this._logger.info(`user dismissed alert, reload widget data`);
                        this._blockerMessage = null;
                        this._widgetService.refresh();
                        this.parentPopupWidget.close();
                    }
                }]
            });
        },
        complete: () => {
            // empty by design
        }
    };

    public _tableScrollableWrapper: Element;
    public _transcodingProfilesOptions: { value: number, label: string }[];
    public _profileForm: FormGroup;
    public _transcodingProfileField: AbstractControl;
    public _blockerMessage: AreaBlockerMessage;
    public _isLoading = false;
    public _files: UploadReplacementFile[] = [];
    public _kmcPermissions = KMCPermissions;
    public _title: string;
    public _flavorOptions: SelectItem[] = [];
    public _flavorsFieldDisabled = false;
    public _uploadBtnLabel: string;
    public _selectedStorageProfile: { name: string, id: number, displayId: string, url: string, directory: string } = {
        id: null,
        name: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na'),
        displayId: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na'),
        url: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na'),
        directory: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na')
    };

    public _allowedVideoExtensions = `.flv,.asf,.qt,.mov,.mpg,.avi,.wmv,.mp4,.3gp,.f4v,.m4v,.mpeg,.mxf,.rm,.rv,.rmvb,.ts,.ogg,.ogv,.vob,.webm,.mts,.arf,.mkv,.m2v`;
    public _allowedAudioExtensions = `.flv,.asf,.qt,.mov,.mpg,.avi,.wmv,.mp3,.wav,.flac`;

    public _allowedExtensions: string;

    constructor(private _newReplaceVideoUpload: NewReplaceVideoUploadService,
                private _formBuilder: FormBuilder,
                private _kalturaClient: KalturaClient,
                private _widgetService: EntryFlavoursWidget,
                private _transcodingProfileManagement: TranscodingProfileManagement,
                private _uploadManagement: UploadManagement,
                private _permissionsService: KMCPermissionsService,
                private _logger: KalturaLogger,
                private _appLocalization: AppLocalization) {
        this._buildForm();
    }

    ngOnInit() {
        this._prepare();
    }

    ngOnDestroy() {

    }

    ngAfterViewInit(): void {
        setTimeout(()=>{
            this._addFile();
            this._tableScrollableWrapper = document.querySelector('.kUploadSettings .ui-table-scrollable-body');
        },200);

    }

    private _buildForm(): void {
        this._profileForm = this._formBuilder.group({ 'transcodingProfile': '' });
        this._transcodingProfileField = this._profileForm.controls['transcodingProfile'];
    }

    private _prepare(): void {
        this._logger.info(`prepare replace file view`, { type: this.replaceType, entryId: this.entry.id, mediaType: this.entry.mediaType });
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

        switch (this.replaceType) {
            case 'upload':
                this._uploadBtnLabel = this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.upload');
                break;
            case 'import':
                this._uploadBtnLabel = this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.import');
                break;
            case 'link':
                this._uploadBtnLabel = this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.link');
                break;
            case 'match':
                this._uploadBtnLabel = this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.match');
                break;
            default:
                break;
        }

        this._loadReplaceData();
    }

    public _handleSelectedFiles(files: FileList): void {
        const newItems = Array.from(files).map(file => {
            const { name, size } = file;
            return { file, name, size };
        });

        this._logger.info(`handle file selected action by user`, { fileNames: newItems.map(({ name }) => name) });

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
            })).pipe(map(res => res.objects));
    }

    private _loadReplaceData(): void {
        this._logger.info(`handle loading of replacement data: transcoding profiles list and conversion profiles list`);
        this._isLoading = true;

        this._transcodingProfileManagement.get()
            .pipe(switchMap(
                (transcodingProfiles) => this._loadConversionProfiles().pipe(
                map(( assets) => {
                    return transcodingProfiles.map(profile => {
                        return {
                            id: profile.id,
                            name: profile.name,
                            isDefault: profile.isDefault,
                            storageProfileId: profile.storageProfileId,
                            assets: assets.filter(item => {
                                return item.conversionProfileId === profile.id && item.origin !== KalturaAssetParamsOrigin.convert;
                            })
                        };
                    });
                })
            )
            ),switchMap(
                (profilesWithAssets) => {
                    let result;
                    if (this.replaceType === 'link') {
                        this._logger.debug(`link replace type detected, load storage profiles list`);
                        result = this._kalturaClient
                            .request(new StorageProfileListAction())
                            .pipe(map(response => response.objects));
                    }else {
                        result = ObservableOf(null);
                    }

                    return result.pipe(
                map(( storageProfiles) => ({ profilesWithAssets, storageProfiles })));
                })
            )
            .subscribe(
                ({ profilesWithAssets, storageProfiles }) => {
                    this._logger.info(`handle successful loading of replacement data`);
                    this._storageProfiles = storageProfiles;
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

                    const preselectedProfile = transcodingProfiles.find(({ id }) => this.entry.conversionProfileId === id);
                    if (preselectedProfile) {
                        this._transcodingProfileField.setValue(preselectedProfile.id);
                    }

                    this._transcodingProfiles = profilesWithAssets;

                    this._updateFlavorsOption();
                    this._updateStorageProfile();

                    this._isLoading = false;
                },
                (error) => {
                    this._logger.warn(`handle failed loading of replacement data, show confirmation`, { errorMessage: error.message });
                    this._blockerMessage = new AreaBlockerMessage({
                        message: error.message,
                        buttons: [
                            {
                                label: this._appLocalization.get('app.common.retry'),
                                action: () => {
                                    this._logger.info(`user confirmed, retry action`);
                                    this._blockerMessage = null;
                                    this._isLoading = false;
                                    this._loadReplaceData();
                                }
                            },
                            {
                                label: this._appLocalization.get('app.common.cancel'),
                                action: () => {
                                    this._logger.info(`user didn't confirm, abort action`);
                                    this._blockerMessage = null;
                                    this._isLoading = false;
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
            value: 0
        }];
        this._flavorsFieldDisabled = true;
        this._files.forEach(file => file.flavor = 0);
    }

    public _removeFile(file: UploadReplacementFile): void {
        this._logger.info(`handle remove file from the list action by user`, { fileName: file.name || file.url });
        const fileIndex = this._files.indexOf(file);
        if (fileIndex !== -1) {
            const newList = Array.from(this._files);
            newList.splice(fileIndex, 1);
            this._files = newList;
        }
    }

    public _updateStorageProfile(): void {
        if (this.replaceType !== 'link') {
            return;
        }

        this._logger.info(`handle transcoding profile changed action - update storage profile`);

        const relevantTranscodingProfile = this._transcodingProfiles.find(profile => profile.id === this._transcodingProfileField.value);
        const relevantStorageProfile = relevantTranscodingProfile
            ? this._storageProfiles.find(({ id }) => id === relevantTranscodingProfile.storageProfileId)
            : null;
        if (relevantStorageProfile) {
            this._logger.debug(`relevant storage profile was found, update _selectedStorageProfile property`, { profileId: relevantStorageProfile.id });
            this._selectedStorageProfile = {
                id: relevantStorageProfile.id,
                name: relevantStorageProfile.name,
                displayId: String(relevantStorageProfile.id),
                url: relevantStorageProfile.storageUrl,
                directory: relevantStorageProfile.storageBaseDir
            };
        } else {
            this._logger.debug(`relevant storage profile was not found, update _selectedStorageProfile property with n/a values`);
            this._selectedStorageProfile = {
                id: null,
                name: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na'),
                displayId: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na'),
                url: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na'),
                directory: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.na')
            };
        }
    }

    public _updateFlavorsOption(): void {
        this._logger.info(`handle transcoding profile changed action - update flavors options`);
        this._flavorsFieldDisabled = false;
        const relevantTranscodingProfile = this._transcodingProfiles.find(profile => profile.id === this._transcodingProfileField.value);
        if (relevantTranscodingProfile && relevantTranscodingProfile.assets.length) {
            const assetParamsIds = relevantTranscodingProfile.assets.map(({ assetParamsId }) => assetParamsId);
            this._flavorOptions = this.flavors
                .filter((flavor) => assetParamsIds.indexOf(flavor.paramsId) !== -1)
                .map(({ name: label, paramsId: value }) => ({ label, value }));

            this._files.forEach(file => file.flavor = null);

            if (!this._flavorOptions.length) {
                this._setNoFlavorsOption();
            }
        } else {
            this._setNoFlavorsOption();
        }
    }

    public _upload(): void {
        this._logger.info(`handle upload action by user`);
        const transcodingProfileId = this._profileForm.value.transcodingProfile;

        if (transcodingProfileId === null || typeof transcodingProfileId === 'undefined' || transcodingProfileId.length === 0) {
            this._blockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.upload.validation.missingTranscodingProfile'),
                buttons: [{
                    label: this._appLocalization.get('app.common.ok'),
                    action: () => {
                        this._blockerMessage = null;
                    }
                }]
            });
            return;
        }

        const proceedReplacement = () => {
            switch (this.replaceType) {
                case 'upload':
                    this._uploadFiles(transcodingProfileId);
                    break;
                case 'import':
                    this._importFiles(transcodingProfileId);
                    break;
                case 'link':
                    this._linkFiles(transcodingProfileId);
                    break;
                case 'match':
                    // TBD
                    break;
                default:
                    this._logger.info(`unrecognized replace type, ignore action`, { replaceType: this.replaceType });
                    break;
            }
        };

        const { isValid, code } = this._validateFiles(this._files);
        if (isValid) {
            this._logger.info(`files are valid, proceed action`);
            proceedReplacement();
        } else if (code) {
            this._logger.info(`files are not valid, show confirmation`);
            if (code === 'uniqueFlavors') {
                this._blockerMessage = new AreaBlockerMessage({
                    message: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.errors.uniqueFlavors'),
                    buttons: [
                        {
                            label: this._appLocalization.get('app.common.ok'),
                            action: () => {
                                this._logger.info(`user confirmed, abort action`);
                                this._blockerMessage = null;
                            }
                        }
                    ]
                });
            } else if (code === 'missingFlavors') {
                this._blockerMessage = new AreaBlockerMessage({
                    message: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.errors.missingFlavor'),
                    buttons: [
                        {
                            label: this._appLocalization.get('applications.content.entryDetails.flavours.replaceVideo.continue'),
                            action: () => {
                                this._logger.info(`user confirmed, proceed action`);
                                proceedReplacement();
                            }
                        },
                        {
                            label: this._appLocalization.get('app.common.cancel'),
                            action: () => {
                                this._logger.info(`user didn't confirm, abort action`);
                                this._blockerMessage = null;
                            }
                        }
                    ]
                });
            }
        }
    }

    private _linkFiles(transcodingProfileId: string): void {
        const linkFileDataList = this._files.map(file => ({
            url: file.url,
            assetParamsId: file.flavor
        }));

        this._logger.info(`handle link files action`, {
            files: linkFileDataList, entryId: this.entry.id,
            transcodingProfileId: Number(transcodingProfileId),
            storageProfileId: this._selectedStorageProfile.id
        });
        this._newReplaceVideoUpload.link(linkFileDataList, this.entry.id, Number(transcodingProfileId), this._selectedStorageProfile.id)
            .pipe(cancelOnDestroy(this))
            .subscribe(this._replacementResultHandler);
    }

    private _importFiles(transcodingProfileId: string): void {
        const importFileDataList = this._files.map(file => ({
            url: file.url,
            assetParamsId: file.flavor
        }));

        this._logger.info(`handle import files action`, {
            files: importFileDataList,
            entryId: this.entry.id,
            transcodingProfileId: Number(transcodingProfileId)
        });
        this._newReplaceVideoUpload.import(importFileDataList, this.entry.id, Number(transcodingProfileId))
            .pipe(cancelOnDestroy(this))
            .subscribe(this._replacementResultHandler);
    }

    private _uploadFiles(transcodingProfileId: string): void {
        const uploadFileDataList = this._files.map(fileData => ({
            file: fileData.file,
            assetParamsId: fileData.flavor
        }));

        this._logger.info(`handle upload files action`, {
            files: uploadFileDataList,
            entryId: this.entry.id,
            transcodingProfileId: Number(transcodingProfileId)
        });

        this._newReplaceVideoUpload.upload(uploadFileDataList, this.entry.id, Number(transcodingProfileId))
            .pipe(cancelOnDestroy(this))
            .pipe(filter(entryId => entryId === this.entry.id))
            .pipe(map(() => {}))
            .subscribe(this._replacementResultHandler);
    }

    private _validateFiles(files: UploadReplacementFile[]): { isValid: boolean, code?: string } {
        let isValid = true;
        let code = null;
        const maxFileSize = globalConfig.kalturaServer.maxUploadFileSize;
        const selectedProfile = this._transcodingProfiles.find(profile => profile.id === this._transcodingProfileField.value);
        const conversionProfileAssetParams = selectedProfile ? selectedProfile.assets : [];
        const filesFlavors = files.map(({ flavor }) => flavor);

        files.forEach((file, index) => {
            const fileSize = file.size / 1024 / 1024; // convert to Mb

            file.errorToken = null;
            file.hasError = false;

            if (!Number.isInteger(file.flavor) && !this._flavorsFieldDisabled && this._permissionsService.hasPermission(KMCPermissions.FEATURE_MULTI_FLAVOR_INGESTION)) {
                isValid = false;
                file.errorToken = 'applications.upload.validation.selectFlavor';
                file.hasError = true;
            }

            if (this.replaceType === 'upload') {
                if (!(this._uploadManagement.supportChunkUpload(new NewEntryUploadFile(null, null, null, null)) || fileSize < maxFileSize)) {
                    isValid = false;
                    file.hasError = true;
                    file.errorToken = 'applications.upload.validation.fileSizeExceeded';
                }
            } else {
                const url = file.url ? file.url.trim() : '';
                if (!url) {
                    isValid = false;
                    file.hasError = true;
                    file.errorToken = 'applications.upload.validation.emptyUrl';
                } else if (this.replaceType !== 'link' && !urlRegex.test(url)) {
                    isValid = false;
                    file.hasError = true;
                    file.errorToken = 'applications.upload.validation.invalidUrl';
                }
            }

            if (file.errorToken !== 'applications.upload.validation.selectFlavor' && filesFlavors.indexOf(file.flavor) !== index) {
                isValid = false;
                code = 'uniqueFlavors';
            }

            conversionProfileAssetParams.forEach(asset => {
                if (asset.readyBehavior === KalturaFlavorReadyBehaviorType.required
                    && asset.origin === KalturaAssetParamsOrigin.ingest
                    && file.flavor !== asset.assetParamsId) {
                    isValid = false;
                    code = 'missingFlavors';
                }
            });
        });

        this._logger.debug(`validate uploading/importing/linking/matching files`, { isValid, code });

        return { isValid, code };
    }

    public _updateFileValidityOnTypeChange(file: UploadReplacementFile): void {
        if (file.hasError && file.errorToken === 'applications.upload.validation.selectFlavor') {
            file.errorToken = null;
            file.hasError = false;
        }
    }

    public _addFile(): void {
        this._logger.info(`handle add file action by user`);
        if (this.replaceType === 'upload') {
            this._logger.info(`open file selection dialog`);
            this._fileDialog.open();
        } else {
            setTimeout(() => {
                this._logger.info(`add empty file row for non-upload replacement`);
                this._files = [...this._files, { url: '' }];
            }, 0);
        }
    }
}
