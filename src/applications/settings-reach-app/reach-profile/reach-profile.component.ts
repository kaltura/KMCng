import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {NotificationTypes, ActionTypes, ReachProfileStore, StatusArgs} from './reach-profile-store.service';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { Observable } from 'rxjs';
import { ReachProfileWidgetsManager } from './reach-profile-widgets-manager';
import { ReachProfileSectionsListWidget } from './reach-profile-sections-list/reach-profile-sections-list-widget.service';
import { ReachProfileDetailsWidget } from './reach-profile-details/reach-profile-details-widget.service';
import { ReachProfileSettingsWidget } from './reach-profile-settings/reach-profile-settings-widget.service';
import { ReachProfileServiceWidget } from './reach-profile-service/reach-profile-service-widget.service';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { ReachProfilesStore } from "../reach-profiles/reach-profiles-store/reach-profiles-store.service";
import { SettingsReachProfileViewSections, SettingsReachProfileViewService } from "app-shared/kmc-shared/kmc-views/details-views/settings-reach-profile-view.service";
import { ReachProfileCreditWidget } from "./reach-profile-credit/reach-profile-credit-widget.service";
import { ReachProfileDictionaryWidget } from "./reach-profile-dictionary/reach-profile-dictionary-widget.service";
import { ReachProfileRulesWidget } from "./reach-profile-rules/reach-profile-rules-widget.service";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kReachProfile',
  templateUrl: './reach-profile.component.html',
  styleUrls: ['./reach-profile.component.scss'],
  providers: [
    ReachProfileStore,
    ReachProfileWidgetsManager,
    ReachProfileSectionsListWidget,
    ReachProfileDetailsWidget,
    ReachProfileSettingsWidget,
    ReachProfileServiceWidget,
    ReachProfileCreditWidget,
    ReachProfileDictionaryWidget,
    ReachProfileRulesWidget
  ]
})
export class ReachProfileComponent implements OnInit, OnDestroy {

  public _profileName: string;
  public _showLoader = false;
  public _areaBlockerMessage: AreaBlockerMessage;
  public _currentProfileId: string;
  public _enablePrevButton: boolean;
  public _enableNextButton: boolean;
  public _profileHasChanges: boolean;

  public get _isSaveDisabled(): boolean {
    const updateAllowed = this._profileWidgetsManager.isNewData || this._permissionsService.hasPermission(KMCPermissions.REACH_PLUGIN_PERMISSION);
    return !this._profileStore.profileIsDirty || !updateAllowed;
  }

  constructor(widget1: ReachProfileSectionsListWidget,
              widget2: ReachProfileDetailsWidget,
              widget3: ReachProfileSettingsWidget,
              widget4: ReachProfileServiceWidget,
              widget5: ReachProfileCreditWidget,
              widget6: ReachProfileDictionaryWidget,
              widget7: ReachProfileRulesWidget,
              private _permissionsService: KMCPermissionsService,
              private _profileWidgetsManager: ReachProfileWidgetsManager,
              private _appLocalization: AppLocalization,
              public _profilesStore: ReachProfilesStore,
              public _profileStore: ReachProfileStore,
              private _settingsReachProfileViewService: SettingsReachProfileViewService,
              private _profileRoute: ActivatedRoute
  ) {
    _profileWidgetsManager.registerWidgets([widget1, widget2, widget3, widget4, widget5, widget6, widget7]);
  }

  ngOnDestroy() {
  }

  private _updateNavigationState() {
    const profiles = this._profilesStore.profiles.data().items;
    if (profiles && this._currentProfileId) {
      const currentProfile = profiles.find(profile => profile.id === Number(this._currentProfileId));
      const currentProfileIndex = currentProfile ? profiles.indexOf(currentProfile) : -1;
      this._enableNextButton = currentProfileIndex >= 0 && (currentProfileIndex < profiles.length - 1);
      this._enablePrevButton = currentProfileIndex > 0;

    } else {
      this._enableNextButton = false;
      this._enablePrevButton = false;
    }
  }

  ngOnInit() {

      this._profileStore.notifications$
          .pipe(cancelOnDestroy(this))
          .subscribe(
              ({ type, error }) => {
                  switch(type) {
                      case NotificationTypes.ViewEntered:
                          const profile = this._profileStore.profile.data();

                          if (profile) {
                              this._settingsReachProfileViewService.viewEntered({
                                  profile,
                                  activatedRoute: this._profileRoute,
                                  section: SettingsReachProfileViewSections.ResolveFromActivatedRoute
                              });
                          }
                          break;
                      default:
                          break;
                  }
              });
    this._profileStore.profile.state$
      .pipe(cancelOnDestroy(this))
      .pipe(filter(Boolean))
      .subscribe(
          (status: StatusArgs) => {
          this._showLoader = false;
          this._areaBlockerMessage = null;
          switch (status.action) {
            case ActionTypes.ProfileLoading:
              this._showLoader = true;
              // when loading new profile in progress, the 'profileID' property
              // reflect the profile that is currently being loaded
              // while 'profile$' stream is null
              this._currentProfileId = this._profileStore.profileId;
              this._profileHasChanges = false;
              break;
            case ActionTypes.ProfileLoaded:
              const profile = this._profileStore.profile.data();
              this._profileName = profile.name;
              this._updateNavigationState();
              break;
            case ActionTypes.ProfileLoadingFailed:
              let message = status.error ? status.error.message : '';
              message = message || this._appLocalization.get('applications.settings.reach.profile.errors.loadError');
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: message,
                buttons: [
                  this._createBackToProfilesButton(),
                  {
                    label: this._appLocalization.get('app.common.retry'),
                    action: () => {
                      this._profileStore.reloadProfile();
                    }
                  }
                ]
              });
              break;
            case ActionTypes.ProfileSaving:
              break;
            case ActionTypes.ProfileSavingFailed:
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.settings.reach.profile.errors.saveError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.reach.profile.errors.reload'),
                    action: () => {
                      this._profileStore.reloadProfile();
                    }
                  }
                ]
              });
              break;
            case ActionTypes.ProfileDataIsInvalid:
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.settings.reach.profile.errors.validationError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.reach.profile.errors.dismiss'),
                    action: () => {
                      this._areaBlockerMessage = null;
                    }
                  }
                ]
              });
              break;
            case ActionTypes.ActiveSectionBusy:
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.settings.reach.profile.errors.busyError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.reach.profile.errors.dismiss'),
                    action: () => {
                      this._areaBlockerMessage = null;
                    }
                  }
                ]
              });
              break;
            case ActionTypes.ProfilePrepareSavingFailed:
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.settings.reach.profile.errors.savePrepareError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.reach.profile.errors.dismiss'),
                    action: () => {
                      this._areaBlockerMessage = null;
                    }
                  }
                ]
              });
              break;
            default:
              break;
          }
        },
        error => {
          // TODO [kmc] navigate to error page
          throw error;
        });
  }

  private _createBackToProfilesButton(): AreaBlockerMessageButton {
    return {
      label: this._appLocalization.get('applications.settings.reach.profile.backToProfiles'),
      action: () => this._backToList()
    };
  }

  public _backToList() {
    this._profileStore.returnToProfiles();
  }

  public _save() {
    this._profileStore.saveProfile();
  }

  public _navigateToPrevious(): void {
    const profiles = this._profilesStore.profiles.data().items;

    if (profiles && this._currentProfileId) {
      const currentProfile = profiles.find(profile => String(profile.id) === this._currentProfileId);
      const currentProfileIndex = currentProfile ? profiles.indexOf(currentProfile) : -1;
      if (currentProfileIndex > 0) {
        const prevProfile = profiles[currentProfileIndex - 1];
        this._profileStore.openProfile(prevProfile);
      }
    }
  }

  public _navigateToNext(): void {
    const profiles = this._profilesStore.profiles.data().items;
    if (profiles && this._currentProfileId) {
      const currentProfile = profiles.find(profile => String(profile.id) === this._currentProfileId);
      const currentProfileIndex = currentProfile ? profiles.indexOf(currentProfile) : -1;
      if (currentProfileIndex >= 0 && (currentProfileIndex < profiles.length - 1)) {
        const nextProfile = profiles[currentProfileIndex + 1];
        this._profileStore.openProfile(nextProfile);
      }
    }
  }

  public canLeave(): Observable<{ allowed: boolean }> {
    return this._profileStore.canLeave();
  }

}

