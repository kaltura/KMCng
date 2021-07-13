import { Observable } from 'rxjs';
import {FormBuilder, FormGroup} from '@angular/forms';
import {Injectable, OnDestroy} from '@angular/core';
import {CategoryWidget} from '../category-widget';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {CategoryService} from '../category.service';
import {KalturaClient, KalturaMultiRequest} from 'kaltura-ngx-client';
import {KalturaCategory} from 'kaltura-ngx-client';
import {CategoryGetAction} from 'kaltura-ngx-client';
import {KalturaInheritanceType} from 'kaltura-ngx-client';
import {KalturaNullableBoolean} from 'kaltura-ngx-client';
import {KalturaUser} from 'kaltura-ngx-client';
import {UserGetAction} from 'kaltura-ngx-client';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { ContentCategoryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { merge } from 'rxjs';
import { throwError } from 'rxjs';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class CategoryEntitlementsWidget extends CategoryWidget implements OnDestroy {

  public entitlementsForm: FormGroup;
  public parentCategory: KalturaCategory = null;

  public inheritUsersPermissionsOriginalValue: boolean;

  constructor(private _kalturaClient: KalturaClient,
              private _formBuilder: FormBuilder,
              private _appLocalization: AppLocalization,
              private _permissionsService: KMCPermissionsService,
              private _categoryService: CategoryService,
              logger: KalturaLogger) {
    super(ContentCategoryViewSections.Entitlements, logger);

    this._buildForm();
  }

  public fetchUpdatedMembersCount(): Observable<number> {
      if (this.data) {
          return this._kalturaClient.request(
              new CategoryGetAction({id: this.data.id})
          ).pipe(cancelOnDestroy(this, this.widgetReset$))
              .pipe(map(value => {
                  return value.membersCount;
              }));
      } else {
          return throwError(new Error('missing data'));
      }
  }

  protected onActivate(firstTimeActivating: boolean): Observable<{ failed: boolean }> {
    if (!this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_CATEGORY_USERS)) {
	    this.entitlementsForm.disable({emitEvent: false});
    }

    super._showLoader();

    return this._fetchAdditionalData()
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .pipe(map(({owner, parentCategory}) => {
        super._hideLoader();
        this.parentCategory = parentCategory || null;
        this._resetFormData(owner);
        this._monitorFormChanges();
        return {failed: false};
      }))
      .pipe(catchError(error => {
        super._hideLoader();
        super._showActivationError();
        return of({failed: true, error});
      }));
  }


  private _fetchAdditionalData(): Observable<{owner: KalturaUser, parentCategory?: KalturaCategory}> {

      const multiRequest = new KalturaMultiRequest();
      if (this.data.owner) {
          multiRequest.requests.push(
              new UserGetAction({userId: this.data.owner})
          );
      }

      if (this.data.parentId > 0) {
          multiRequest.requests.push(new CategoryGetAction({
              id: this.data.parentId
          }));
      }

      if (multiRequest.requests.length) {
          return this._kalturaClient.multiRequest(multiRequest)
              .pipe(
                  map(
                      data => {
                          if (data.hasErrors()) {
                              // check for missing user error, in which case we can continue
                              let missingUserError = false;
                              data.forEach(response => {
                                  if (response.error && response.error.code === "INVALID_USER_ID") {
                                      missingUserError = true;
                                      super._showUserError();
                                  }
                              });
                              if (!missingUserError) {
                                  throw new Error('error occurred in action \'_fetchAdditionalData\'');
                              }
                          }

                          let owner: KalturaUser = null;
                          let parentCategory = null;
                          data.forEach(response => {
                              if (response.result instanceof KalturaCategory) {
                                  parentCategory = response.result;
                              } else if (response.result instanceof KalturaUser) {
                                  owner = response.result;
                              }
                          });
                          return {owner, parentCategory};
                      })
              );
      }else
      {
          return of({ owner: null, parentCategory: null});
      }
  }

  private _buildForm(): void {
    this.entitlementsForm = this._formBuilder.group({
      contentPrivacy: null,
      categoryListing: null,
      contentPublishPermissions: null,
      moderateContent: null,
      inheritUsersPermissions: null, // no
      defaultPermissionLevel: {value: null},
      owner: null,
      permittedUsers: []
    });
  }

  private _monitorFormChanges() {
    merge(this.entitlementsForm.valueChanges, this.entitlementsForm.statusChanges)
      .pipe(cancelOnDestroy(this, this.widgetReset$))
      .subscribe(
        () => {
          const isValid = this.entitlementsForm.status !== 'INVALID';
          const isDirty = this.entitlementsForm.dirty;
          if (this.isDirty !== isDirty || this.isValid !== isValid) {
            super.updateState({
              isValid: isValid,
              isDirty: isDirty
            });
          }
        }
      );
  }

  public setDirty() {
    super.updateState({
      isDirty: true
    });
  }

  private _resetFormData(owner: KalturaUser) {

      const hasCanModifyPermission = this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_CATEGORY_USERS);

    this.inheritUsersPermissionsOriginalValue = this.parentCategory && this.data.inheritanceType === KalturaInheritanceType.inherit;
    this.entitlementsForm.reset(
      {
        contentPrivacy: this.data.privacy,
        categoryListing: this.data.appearInList,
        contentPublishPermissions: this.data.contributionPolicy,
        moderateContent: this.data.moderation === KalturaNullableBoolean.trueValue,
        inheritUsersPermissions: this.inheritUsersPermissionsOriginalValue,
        defaultPermissionLevel: {
          value: this.data.defaultPermissionLevel,
          disabled: !hasCanModifyPermission || this.inheritUsersPermissionsOriginalValue
        },
        owner: {
          value: owner,
          disabled: !hasCanModifyPermission || this.inheritUsersPermissionsOriginalValue
        },
        permittedUsers: []
      }
    );
  }


  protected onDataSaving(newData: KalturaCategory, request: KalturaMultiRequest): void {

    if (!this.entitlementsForm.valid) {
      throw new Error('Cannot perform save operation since the entitlement form is invalid');
    }

    const metadataFormValue = this.entitlementsForm.value;
    // save Entitlements Form
    newData.privacy = metadataFormValue.contentPrivacy;
    newData.appearInList = metadataFormValue.categoryListing;
    newData.contributionPolicy = metadataFormValue.contentPublishPermissions;
    newData.moderation = metadataFormValue.moderateContent !== true ? KalturaNullableBoolean.falseValue : KalturaNullableBoolean.trueValue;
    newData.inheritanceType = metadataFormValue.inheritUsersPermissions ? KalturaInheritanceType.inherit : KalturaInheritanceType.manual;
    if (!metadataFormValue.inheritUsersPermissions) {
      newData.defaultPermissionLevel = metadataFormValue.defaultPermissionLevel;

      if (metadataFormValue.owner) {
          newData.owner = metadataFormValue.owner.id;
      }
    }
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset() {
    this.entitlementsForm.reset({});
    this.parentCategory = null;
  }

  onValidate(wasActivated: boolean): Observable<{ isValid: boolean }> {
    return Observable.create(observer => {
      this.entitlementsForm.updateValueAndValidity();
      const isValid = this.entitlementsForm.valid;
      observer.next({isValid});
      observer.complete();
    });
  }



  ngOnDestroy() {
  }

  public openCategory(category: KalturaCategory): void {
    if (category && category.id) {
      this._categoryService.openCategory(category);
    }
  }
}


