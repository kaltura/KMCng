import {Injectable, OnDestroy} from '@angular/core';
import { Observable } from 'rxjs';
import {BehaviorSubject} from 'rxjs';
import {SelectItem} from 'primeng/api';

import {KalturaMultiRequest} from 'kaltura-ngx-client';
import {KalturaMediaEntry} from 'kaltura-ngx-client';
import {KalturaAccessControl} from 'kaltura-ngx-client';
import {KalturaSiteRestriction} from 'kaltura-ngx-client';
import {KalturaSiteRestrictionType} from 'kaltura-ngx-client';
import {KalturaCountryRestriction} from 'kaltura-ngx-client';
import {KalturaCountryRestrictionType} from 'kaltura-ngx-client';
import {KalturaIpAddressRestriction} from 'kaltura-ngx-client';
import {KalturaIpAddressRestrictionType} from 'kaltura-ngx-client';
import {KalturaLimitFlavorsRestriction} from 'kaltura-ngx-client';
import {KalturaLimitFlavorsRestrictionType} from 'kaltura-ngx-client';
import {KalturaSessionRestriction} from 'kaltura-ngx-client';
import {KalturaPreviewRestriction} from 'kaltura-ngx-client';
import {KalturaFlavorParams} from 'kaltura-ngx-client';
import {AccessControlProfileStore, FlavoursStore} from 'app-shared/kmc-shared';
import {KalturaUtils} from '@kaltura-ng/kaltura-common';
import {AppLocalization} from '@kaltura-ng/mc-shared';
import { throwError } from 'rxjs';
import { forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import * as R from 'ramda';
import {EntryWidget} from '../entry-widget';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

@Injectable()
export class EntryAccessControlWidget extends EntryWidget implements OnDestroy {

  private _accessControlProfiles = new BehaviorSubject<{ items: SelectItem[] }>({items: []});

  public _accessControlProfiles$ = this._accessControlProfiles.asObservable();

  private _selectedProfile: KalturaAccessControl = null;
  public set selectedProfile(profile: KalturaAccessControl) {
    this._selectedProfile = profile;
    this._setRestrictions();
  }

  public get selectedProfile() {
    return this._selectedProfile;
  }

  public _domainsRestriction: string = "";
  public _countriesRestriction: string = "";
  public _ipRestriction: string = "";
  public _flavourRestriction: string = "";
  public _advancedRestriction: string = "";

  private _flavourParams: KalturaFlavorParams[] = [];

  constructor(private _accessControlProfileStore: AccessControlProfileStore,
              private _appLocalization: AppLocalization,
              private _flavoursStore: FlavoursStore,
              logger: KalturaLogger) {
    super(ContentEntryViewSections.AccessControl, logger);
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset() {
  }

  protected onActivate(firstTimeActivating: boolean) {
    if (firstTimeActivating) {
      super._showLoader();
      this._accessControlProfiles.next({items: []});

      const getAPProfiles$ = this._accessControlProfileStore.get().pipe(cancelOnDestroy(this));
      const getFlavours$ = this._flavoursStore.get().pipe(cancelOnDestroy(this));

      return forkJoin(getAPProfiles$, getFlavours$)
        .pipe(cancelOnDestroy(this))
        .pipe(map(
          response => {
            let ACProfiles = response[0].items;
            if (ACProfiles.length) {
              // check if any of the access control profiles is defined as default
              const defaultIndex = R.findIndex(R.propEq('isDefault', 1))(ACProfiles);
              if (defaultIndex > -1) {
                // put the default profile at the beginning of the profiles array
                const defaultProfile: KalturaAccessControl[] = ACProfiles.splice(defaultIndex, 1);
                ACProfiles.splice(0, 0, defaultProfile[0]);
              }
              let profilesDataProvider: SelectItem[] = [];
              ACProfiles.forEach((profile: KalturaAccessControl) => {
                profilesDataProvider.push({"label": profile.name, "value": profile});
              });
              this._flavourParams = response[1].items;
              this._accessControlProfiles.next({items: profilesDataProvider});
              this._setProfile();
              super._hideLoader();
            }

              return {failed: false};

          }))
        .pipe(catchError((error, caught) => {
            super._hideLoader();
            super._showActivationError();
            this._accessControlProfiles.next({items: []});
            return throwError(error);
          }
        ));
    } else {
      this._setProfile();
    }
  }

  protected onDataSaving(data: KalturaMediaEntry, request: KalturaMultiRequest) {
    if (this.selectedProfile) {
      data.accessControlId = this.selectedProfile.id;
    }

  }

  private _fetchAccessControlProfiles(): void {

  }

  private _setProfile() {
    // search for the current entry access profile and select it in the drop down if found
    let profilesDataProvider = this._accessControlProfiles.getValue().items;
    let profilesArr: KalturaAccessControl[] = [];
    profilesDataProvider.forEach(profile => {
      profilesArr.push(profile.value)
    });
    let entryACProfileIndex = R.findIndex(R.propEq('id', this.data.accessControlId))(profilesArr);
    entryACProfileIndex = entryACProfileIndex === -1 ? 0 : entryACProfileIndex;
    this.selectedProfile = profilesArr[entryACProfileIndex];
  }

  private _setRestrictions() {

    this._domainsRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyDomain');
    this._countriesRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyCountry');
    this._ipRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyIP');
    this._flavourRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyFlavour');
    this._advancedRestriction = "";

    const restrictions = this.selectedProfile.restrictions;
    if (restrictions.length) {
      restrictions.forEach(restriction => {
        // domains restrictions
        if (restriction instanceof KalturaSiteRestriction) {
          if (restriction.siteRestrictionType === KalturaSiteRestrictionType.allowSiteList) {
            this._domainsRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowDomains', {"0": restriction.siteList});
          }
          if (restriction.siteRestrictionType === KalturaSiteRestrictionType.restrictSiteList) {
            this._domainsRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockDomains', {"0": restriction.siteList});
          }
        }
        // countries restrictions
        if (restriction instanceof KalturaCountryRestriction) {
          if (restriction.countryRestrictionType === KalturaCountryRestrictionType.allowCountryList) {
            this._countriesRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowCountries', {"0": this._getCountriesByCode(restriction.countryList)});
          }
          if (restriction.countryRestrictionType === KalturaCountryRestrictionType.restrictCountryList) {
            this._countriesRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockCountries', {"0": this._getCountriesByCode(restriction.countryList)});
          }
        }
        // IP restrictions
        if (restriction instanceof KalturaIpAddressRestriction) {
          if (restriction.ipAddressRestrictionType === KalturaIpAddressRestrictionType.allowList) {
            this._ipRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowIPs', {"0": restriction.ipAddressList});
          }
          if (restriction.ipAddressRestrictionType === KalturaIpAddressRestrictionType.restrictList) {
            this._ipRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockIPs', {"0": restriction.ipAddressList});
          }
        }
        // Flavour restrictions
        if (restriction instanceof KalturaLimitFlavorsRestriction && this._flavourParams.length) {
          // convert flavour IDs to flavour names
          let flavourIDs = restriction.flavorParamsIds.split(",");
          let flavourNames = [];
          flavourIDs.forEach(flavourId => {
            let flavour: KalturaFlavorParams = R.find(R.propEq('id', parseInt(flavourId)))(this._flavourParams);
            if (flavour !== undefined) {
              flavourNames.push(flavour.name);
            }
          });

          if (restriction.limitFlavorsRestrictionType === KalturaLimitFlavorsRestrictionType.allowList) {
            this._flavourRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowFlavours', {"0": flavourNames.join(", ")});
          }
          if (restriction.limitFlavorsRestrictionType === KalturaLimitFlavorsRestrictionType.restrictList) {
            this._flavourRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockFlavours', {"0": flavourNames.join(", ")});
          }
        }
        // Advanced restrictions
        if (restriction instanceof KalturaSessionRestriction) {
          this._advancedRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.ks');
        }
        if (restriction instanceof KalturaPreviewRestriction) {
          this._advancedRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.freePreview', {"0": KalturaUtils.formatTime(restriction.previewLength, true)});
        }
      });
    }
  }

  public setDirty() {
    super.updateState({isDirty: true});
  }

  private _getCountriesByCode(codesList: string): string {
    let countries = [];
    const codes = codesList.split(",");
    codes.forEach(code => {
      const country = this._appLocalization.get('countries.' + code.toLowerCase());
      if (country) {
        countries.push(country);
      }
    });
    return countries.join(", ");
  }

  ngOnDestroy()
  {

  }

}
