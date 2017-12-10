import {Component, OnDestroy, OnInit} from '@angular/core';
import {CategoryEntitlementsWidget} from './category-entitlements-widget.service';
import {AppLocalization} from '@kaltura-ng/kaltura-common';
import {KalturaCategoryUserPermissionLevel} from 'kaltura-ngx-client/api/types/KalturaCategoryUserPermissionLevel';
import {KalturaUser} from 'kaltura-ngx-client/api/types/KalturaUser';
import {KalturaContributionPolicyType} from 'kaltura-ngx-client/api/types/KalturaContributionPolicyType';
import {KalturaAppearInListType} from 'kaltura-ngx-client/api/types/KalturaAppearInListType';
import {KalturaPrivacyType} from 'kaltura-ngx-client/api/types/KalturaPrivacyType';


interface KalturaCategory {
}

@Component({
  selector: 'kCategoryEntitlements',
  templateUrl: './category-entitlements.component.html',
  styleUrls: ['./category-entitlements.component.scss'],
})
export class CategoryEntitlementsComponent implements OnInit, OnDestroy {


  public _defaultPermissionLevelOptions: { value: number, label: string }[] = [];
  public _parentCategory: KalturaCategory = null;

  constructor(public _widgetService: CategoryEntitlementsWidget,
              private _appLocalization: AppLocalization) {
  }

  ngOnInit() {
    this._widgetService.attachForm();

    this._widgetService.parentCategory$.subscribe(parentCategory => {
      this._parentCategory = parentCategory;
    })

    this._defaultPermissionLevelOptions = [{
      value: KalturaCategoryUserPermissionLevel.member,
      label: this._appLocalization.get('applications.content.categoryDetails.entitlements.defaultPermissionLevel.member')
    }, {
      value: KalturaCategoryUserPermissionLevel.contributor,
      label: this._appLocalization.get('applications.content.categoryDetails.entitlements.defaultPermissionLevel.contributor')
    }, {
      value: KalturaCategoryUserPermissionLevel.moderator,
      label: this._appLocalization.get('applications.content.categoryDetails.entitlements.defaultPermissionLevel.moderator')
    }, {
      value: KalturaCategoryUserPermissionLevel.manager,
      label: this._appLocalization.get('applications.content.categoryDetails.entitlements.defaultPermissionLevel.manager')
    }];
  }

  ngOnDestroy() {
    this._widgetService.detachForm();
  }

  get _contentPrivacyOptions() {
    return KalturaPrivacyType;
  }

  get _categoryListingOptions() {
    return KalturaAppearInListType;
  }

  get _contentPublishPermissionsOptions() {
    return KalturaContributionPolicyType;
  }

  // owner changed
  onOwnerChanged(owner: KalturaUser): void {
    // reset the form to have the new user in the textbox
    this._widgetService.entitlementsForm.patchValue({ owner: owner.email});

    this._widgetService.setDirty();
  }

  public _toggleInherit({originalEvent, checked}: { originalEvent: Event, checked: boolean }) {
    const affectedControls =
      [this._widgetService.entitlementsForm.get('defaultPermissionLevel'),
       this._widgetService.entitlementsForm.get('owner')];

    affectedControls.forEach(ctrl => {
      if (checked === false) {
        ctrl.enable();
      } else {
        ctrl.disable();
      }
    });

    this._widgetService.setDirty();
  }
}
