import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {NotificationTypes, ActionTypes, TranscodingProfileStore, StatusArgs} from './transcoding-profile-store.service';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { Observable } from 'rxjs';
import { KalturaConversionProfileType } from 'kaltura-ngx-client';
import { TranscodingProfileWidgetsManager } from './transcoding-profile-widgets-manager';
import { TranscodingProfileSectionsListWidget } from './transcoding-profile-sections-list/transcoding-profile-sections-list-widget.service';
import { TranscodingProfileDetailsWidget } from './transcoding-profile-details/transcoding-profile-details-widget.service';
import { TranscodingProfileMetadataWidget } from './transcoding-profile-metadata/transcoding-profile-metadata-widget.service';
import { TranscodingProfileFlavorsWidget } from './transcoding-profile-flavors/transcoding-profile-flavors-widget.service';
import { BaseTranscodingProfilesStore } from '../transcoding-profiles/transcoding-profiles-store/base-transcoding-profiles-store.service';
import { MediaTranscodingProfilesStore } from '../transcoding-profiles/transcoding-profiles-store/media-transcoding-profiles-store.service';
import { LiveTranscodingProfilesStore } from '../transcoding-profiles/transcoding-profiles-store/live-transcoding-profiles-store.service';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import {
    SettingsTranscodingProfileViewSections,
    SettingsTranscodingProfileViewService
} from 'app-shared/kmc-shared/kmc-views/details-views';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kTranscodingProfile',
  templateUrl: './transcoding-profile.component.html',
  styleUrls: ['./transcoding-profile.component.scss'],
  providers: [
    TranscodingProfileStore,
    TranscodingProfileWidgetsManager,
    TranscodingProfileSectionsListWidget,
    TranscodingProfileDetailsWidget,
    TranscodingProfileMetadataWidget,
    TranscodingProfileFlavorsWidget
  ]
})
export class TranscodingProfileComponent implements OnInit, OnDestroy {
  public _profilesStore: BaseTranscodingProfilesStore;

  public _profileName: string;
  public _profileType: KalturaConversionProfileType;
  public _showLoader = false;
  public _areaBlockerMessage: AreaBlockerMessage;
  public _currentProfileId: string;
  public _enablePrevButton: boolean;
  public _enableNextButton: boolean;
  public _profileHasChanges: boolean;

  public get _isSaveDisabled(): boolean {
    const updateAllowed = this._profileWidgetsManager.isNewData || this._permissionsService.hasPermission(KMCPermissions.TRANSCODING_UPDATE);
    return !this._profileStore.profileIsDirty || !updateAllowed;
  }

  constructor(widget1: TranscodingProfileSectionsListWidget,
              widget2: TranscodingProfileDetailsWidget,
              widget3: TranscodingProfileMetadataWidget,
              widget4: TranscodingProfileFlavorsWidget,
              private _permissionsService: KMCPermissionsService,
              private _profileWidgetsManager: TranscodingProfileWidgetsManager,
              private _appLocalization: AppLocalization,
              private _mediaTranscodingProfilesStore: MediaTranscodingProfilesStore,
              private _liveTranscodingProfilesStore: LiveTranscodingProfilesStore,
              public _profileStore: TranscodingProfileStore,
              private _settingsTranscodingProfileViewService: SettingsTranscodingProfileViewService,
              private _profileRoute: ActivatedRoute
  ) {
    _profileWidgetsManager.registerWidgets([widget1, widget2, widget3, widget4]);
  }

  ngOnDestroy() {
  }

  private _setProfilesStoreServiceByType(serviceType: KalturaConversionProfileType): void {
    if (serviceType === KalturaConversionProfileType.media) {
      this._profilesStore = this._mediaTranscodingProfilesStore;
    } else if (serviceType === KalturaConversionProfileType.liveStream) {
      this._profilesStore = this._liveTranscodingProfilesStore;
    } else {
      throw Error('Incorrect serviceType provided. It can be either KalturaConversionProfileType.media or KalturaConversionProfileType.liveStream type');
    }
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
                              this._settingsTranscodingProfileViewService.viewEntered({
                                  profile,
                                  activatedRoute: this._profileRoute,
                                  section: SettingsTranscodingProfileViewSections.ResolveFromActivatedRoute
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
              this._profileType = profile.type;
              this._setProfilesStoreServiceByType(profile.type);
              this._updateNavigationState();
              break;
            case ActionTypes.ProfileLoadingFailed:
              let message = status.error ? status.error.message : '';
              message = message || this._appLocalization.get('applications.settings.transcoding.profile.errors.loadError');
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
                message: this._appLocalization.get('applications.settings.transcoding.profile.errors.saveError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.transcoding.profile.errors.reload'),
                    action: () => {
                      this._profileStore.reloadProfile();
                    }
                  }
                ]
              });
              break;
            case ActionTypes.ProfileDataIsInvalid:
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.settings.transcoding.profile.errors.validationError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.transcoding.profile.errors.dismiss'),
                    action: () => {
                      this._areaBlockerMessage = null;
                    }
                  }
                ]
              });
              break;
            case ActionTypes.ActiveSectionBusy:
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.settings.transcoding.profile.errors.busyError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.transcoding.profile.errors.dismiss'),
                    action: () => {
                      this._areaBlockerMessage = null;
                    }
                  }
                ]
              });
              break;
            case ActionTypes.ProfilePrepareSavingFailed:
              this._areaBlockerMessage = new AreaBlockerMessage({
                message: this._appLocalization.get('applications.settings.transcoding.profile.errors.savePrepareError'),
                buttons: [
                  {
                    label: this._appLocalization.get('applications.settings.transcoding.profile.errors.dismiss'),
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
      label: this._appLocalization.get('applications.settings.transcoding.profile.backToProfiles'),
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

