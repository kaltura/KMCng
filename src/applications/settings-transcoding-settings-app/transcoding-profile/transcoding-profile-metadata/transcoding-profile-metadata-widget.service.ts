import { Injectable, OnDestroy } from '@angular/core';
import { KalturaAPIException, KalturaClient, KalturaMultiRequest } from 'kaltura-ngx-client';
import { Observable } from 'rxjs/Observable';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { async } from 'rxjs/scheduler/async';
import { TranscodingProfileWidget } from '../transcoding-profile-widget';
import { TranscodingProfileWidgetKeys } from '../transcoding-profile-widget-keys';
import { KalturaConversionProfileWithAsset } from '../../transcoding-profiles/transcoding-profiles-store/base-transcoding-profiles-store.service';
import { KalturaConversionProfileType } from 'kaltura-ngx-client/api/types/KalturaConversionProfileType';
import { KalturaStorageProfile } from 'kaltura-ngx-client/api/types/KalturaStorageProfile';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';
import { StorageProfilesStore } from 'app-shared/kmc-shared/storage-profiles';
import { BaseEntryGetAction } from 'kaltura-ngx-client/api/types/BaseEntryGetAction';

@Injectable()
export class TranscodingProfileMetadataWidget extends TranscodingProfileWidget implements OnDestroy {
  public metadataForm: FormGroup;
  public nameField: AbstractControl;
  public descriptionField: AbstractControl;
  public defaultEntryIdField: AbstractControl;
  public storageProfileIdField: AbstractControl;
  public remoteStorageProfilesOptions: { label: string, value: number }[] = [];
  public hideStorageProfileIdField = false;
  public entryNotFoundErrorParams: string = null;
  public entryValidationGeneralError = false;

  constructor(private _formBuilder: FormBuilder,
              private _appLocalization: AppLocalization,
              private _kalturaClient: KalturaClient,
              private _storageProfilesStore: StorageProfilesStore) {
    super(TranscodingProfileWidgetKeys.Metadata);
    this._buildForm();
  }

  ngOnDestroy() {

  }

  private _loadRemoteStorageProfiles(): Observable<KalturaStorageProfile[]> {
    const createEmptyRemoteStorageProfile = () => {
      const emptyProfile = new KalturaStorageProfile({ name: this._appLocalization.get('applications.settings.transcoding.na') });
      (<any>emptyProfile).id = null;
      return emptyProfile;
    };

    return this._storageProfilesStore.get()
      .map(({ items }) => [createEmptyRemoteStorageProfile(), ...items])
      .catch(() => Observable.of([createEmptyRemoteStorageProfile()]));
  }

  private _buildForm(): void {
    this.metadataForm = this._formBuilder.group({
      name: ['', Validators.required],
      description: '',
      defaultEntryId: '',
      storageProfileId: null
    });

    this.nameField = this.metadataForm.controls['name'];
    this.descriptionField = this.metadataForm.controls['description'];
    this.defaultEntryIdField = this.metadataForm.controls['defaultEntryId'];
    this.storageProfileIdField = this.metadataForm.controls['storageProfileId'];
  }

  private _monitorFormChanges(): void {
    Observable.merge(this.metadataForm.valueChanges, this.metadataForm.statusChanges)
      .cancelOnDestroy(this)
      .observeOn(async) // using async scheduler so the form group status/dirty mode will be synchornized
      .subscribe(() => {
          super.updateState({
            isValid: this.metadataForm.status === 'VALID',
            isDirty: this.metadataForm.dirty
          });
        }
      );
  }

  protected onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
    const formData = wasActivated ? this.metadataForm.value : this.data;
    const name = (formData.name || '').trim();
    const entryId = (formData.defaultEntryId || '').trim();
    const hasValue = name !== '';

    this.entryNotFoundErrorParams = null;
    this.entryValidationGeneralError = false;

    if (entryId) { // if user entered entryId check if it exists
      return this._kalturaClient.request(new BaseEntryGetAction({ entryId }))
        .map(() => ({ isValid: hasValue }))
        .catch(
          error => {
            if (error instanceof KalturaAPIException && error.code === 'ENTRY_ID_NOT_FOUND') {
              this.entryNotFoundErrorParams = entryId;
              return Observable.of({ isValid: false });
            } else {
              this.entryValidationGeneralError = true;
                return Observable.of({ isValid: false });
            }
          }
        );
    }

    return Observable.of({
      isValid: hasValue
    });
  }

  protected onDataSaving(newData: KalturaConversionProfileWithAsset, request: KalturaMultiRequest): void {
    const formData = this.wasActivated ? this.metadataForm.value : this.data;
    newData.name = formData.name;
    newData.description = formData.description || '';
    newData.defaultEntryId = formData.defaultEntryId || null;
    newData.storageProfileId = formData.storageProfileId || null;
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset(): void {
    this.metadataForm.reset();
    this.remoteStorageProfilesOptions = [];
    this.hideStorageProfileIdField = false;
    this.entryNotFoundErrorParams = null;
  }

  protected onActivate(firstTimeActivating: boolean): Observable<{ failed: boolean }> | void {
    const prepare = () => {
      if (firstTimeActivating) {
        this._monitorFormChanges();
      }

      this.metadataForm.reset({
        name: this.data.name,
        description: this.data.description,
        defaultEntryId: this.data.defaultEntryId,
        storageProfileId: this.data.storageProfileId || null
      });
    };
    super._showLoader();

    this.hideStorageProfileIdField = this.data.type && this.data.type === KalturaConversionProfileType.liveStream;
    if (!this.hideStorageProfileIdField) {
      return this._loadRemoteStorageProfiles()
        .cancelOnDestroy(this)
        .map(profiles => {
          prepare();
          this.remoteStorageProfilesOptions = profiles.map(profile => ({ label: profile.name, value: profile.id }));

          super._hideLoader();
          return { failed: false };
        });
    } else {
      prepare();
      super._hideLoader();
    }
  }
}
