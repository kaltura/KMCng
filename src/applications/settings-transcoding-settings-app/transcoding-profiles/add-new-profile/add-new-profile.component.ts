import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { AppEventsService } from 'app-shared/kmc-shared';
import { KalturaConversionProfileType } from 'kaltura-ngx-client';
import { KalturaStorageProfile } from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { StorageProfilesStore } from 'app-shared/kmc-shared/storage-profiles';
import { BaseEntryGetAction } from 'kaltura-ngx-client';
import { KalturaAPIException, KalturaClient } from 'kaltura-ngx-client';
import { CreateNewTranscodingProfileEvent } from 'app-shared/kmc-shared/events/transcoding-profile-creation';
import { KalturaConversionProfile } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface NewTranscodingProfileFormData {
  name: string;
  description: string;
  defaultMetadataSettings: string;
  ingestFromRemoteStorage: { label: string, value: number };
}

@Component({
  selector: 'kAddNewTranscodingProfile',
  templateUrl: './add-new-profile.component.html',
  styleUrls: ['./add-new-profile.component.scss']
})
export class AddNewProfileComponent implements OnInit, OnDestroy {
  @Input() parentPopupWidget: PopupWidgetComponent;
  @Input() profileType: KalturaConversionProfileType;

  public _addNewProfileForm: FormGroup;
  public _nameField: AbstractControl;
  public _descriptionField: AbstractControl;
  public _defaultMetadataSettingsField: AbstractControl;
  public _ingestFromRemoteStorageField: AbstractControl;
  public _hideIngestFromRemoteStorage = false;
  public _remoteStorageProfilesOptions: { label: string, value: number }[] = [];
  public _dataLoading = false;
  public _blockerMessage: AreaBlockerMessage;

  constructor(private _formBuilder: FormBuilder,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization,
              private _permissionsService: KMCPermissionsService,
              private _storageProfilesStore: StorageProfilesStore,
              private _kalturaClient: KalturaClient,
              private _appEvents: AppEventsService) {
    // build FormControl group
    this._addNewProfileForm = _formBuilder.group({
      name: ['', Validators.required],
      description: '',
      defaultMetadataSettings: '',
      ingestFromRemoteStorage: { label: this._appLocalization.get('applications.settings.transcoding.na'), value: null }
    });
    this._nameField = this._addNewProfileForm.controls['name'];
    this._descriptionField = this._addNewProfileForm.controls['description'];
    this._defaultMetadataSettingsField = this._addNewProfileForm.controls['defaultMetadataSettings'];
    this._ingestFromRemoteStorageField = this._addNewProfileForm.controls['ingestFromRemoteStorage'];
  }

  ngOnInit() {
    this._prepare();
  }

  ngOnDestroy() {

  }

  private _prepare(): void {
    const hasStorageProfilesPermission = this._permissionsService.hasPermission(KMCPermissions.FEATURE_REMOTE_STORAGE_INGEST);
    this._hideIngestFromRemoteStorage = (this.profileType && this.profileType === KalturaConversionProfileType.liveStream) || !hasStorageProfilesPermission;
    if (!this._hideIngestFromRemoteStorage) {
      this._dataLoading = true;
      this._loadRemoteStorageProfiles()
        .pipe(cancelOnDestroy(this))
        .pipe(map(profiles => profiles.map(profile => ({ label: profile.name, value: profile.id }))))
        .subscribe(
          profiles => {
            this._dataLoading = false;
            this._remoteStorageProfilesOptions = profiles;
          },
          error => {
            this._blockerMessage = new AreaBlockerMessage({
              message: error.message || this._appLocalization.get('applications.settings.transcoding.errorLoadingRemoteStorageProfiles'),
              buttons: [
                {
                  label: this._appLocalization.get('app.common.retry'),
                  action: () => {
                    this._blockerMessage = null;
                    this._prepare();
                  }
                },
                {
                  label: this._appLocalization.get('app.common.cancel'),
                  action: () => {
                    this._blockerMessage = null;
                    this.parentPopupWidget.close();
                  }
                }
              ]
            });
          });
    }
  }

  private _loadRemoteStorageProfiles(): Observable<KalturaStorageProfile[]> {
    const createEmptyRemoteStorageProfile = () => {
      const emptyProfile = new KalturaStorageProfile({ name: this._appLocalization.get('applications.settings.transcoding.na') });
      (<any>emptyProfile).id = null;
      return emptyProfile;
    };

    return this._storageProfilesStore.get()
      .pipe(map(({ items }) => [createEmptyRemoteStorageProfile(), ...items]))
      .pipe(catchError((error) => {
        if (error.code && error.code === "SERVICE_FORBIDDEN") {
          return of([createEmptyRemoteStorageProfile()]);
        }
        return throwError(error);
      }));
  }

  private _validateEntryExists(entryId: string): Observable<boolean> {
    return this._kalturaClient.request(new BaseEntryGetAction({ entryId }))
      .pipe(map(Boolean))
      .pipe(catchError(
        error => (error instanceof KalturaAPIException && error.code === 'ENTRY_ID_NOT_FOUND')
          ? of(false)
          : throwError(error.message)
      ));
  }

  private _proceedSave(profile: KalturaConversionProfile): void {
    this._appEvents.publish(new CreateNewTranscodingProfileEvent({ profile }));
    this.parentPopupWidget.close();
  }

  private _mapFormDataToProfile(formData: NewTranscodingProfileFormData): KalturaConversionProfile {

    const newConversionProfile = new KalturaConversionProfile({
      type: this.profileType,
      name: formData.name
    });
    newConversionProfile.description = formData.description || '';
    if (formData.defaultMetadataSettings) {
      newConversionProfile.defaultEntryId = formData.defaultMetadataSettings;
    }

    if (formData.ingestFromRemoteStorage.value) {
      newConversionProfile.storageProfileId = formData.ingestFromRemoteStorage.value;
    }

    return newConversionProfile;
  }

  public _goNext(): void {
    if (this._addNewProfileForm.valid) {
      const formData = this._addNewProfileForm.value;
      const entryId = (formData.defaultMetadataSettings || '').trim();
      if (entryId) {
        this._dataLoading = true;
        this._validateEntryExists(entryId)
          .pipe(cancelOnDestroy(this))
          .subscribe(
            exists => {
              this._dataLoading = false;
              if (exists) {
                this._proceedSave(this._mapFormDataToProfile(formData));
              } else {
                this._browserService.alert({
                  header: this._appLocalization.get('applications.settings.transcoding.profile.errors.error'),
                  message: this._appLocalization.get('applications.settings.transcoding.entryNotFound', [entryId])
                });
              }
            },
            error => {
              this._dataLoading = false;
              this._browserService.alert({
                header: this._appLocalization.get('applications.settings.transcoding.profile.errors.error'),
                message: error.message
              });
            }
          );
      } else {
        this._proceedSave(this._mapFormDataToProfile(formData));
      }
    }
  }
}

