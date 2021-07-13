import { Host, Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {BehaviorSubject, EMPTY} from 'rxjs';
import { Subject } from 'rxjs';
import { throwError } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs';
import { KalturaClient, KalturaMultiRequest, KalturaObjectBaseFactory } from 'kaltura-ngx-client';
import { TranscodingProfileWidgetsManager } from './transcoding-profile-widgets-manager';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { PageExitVerificationService } from 'app-shared/kmc-shell/page-exit-verification';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaConversionProfileFilter } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaConversionProfileAssetParamsFilter } from 'kaltura-ngx-client';
import { ConversionProfileAssetParamsListAction } from 'kaltura-ngx-client';
import {
  BaseTranscodingProfilesStore,
  KalturaConversionProfileWithAsset
} from '../transcoding-profiles/transcoding-profiles-store/base-transcoding-profiles-store.service';
import { ConversionProfileGetAction } from 'kaltura-ngx-client';
import { KalturaConversionProfile } from 'kaltura-ngx-client';
import { TranscodingProfileCreationService } from 'app-shared/kmc-shared/events/transcoding-profile-creation';
import { OnDataSavingReasons } from '@kaltura-ng/kaltura-ui';
import { ConversionProfileAddAction } from 'kaltura-ngx-client';
import { ConversionProfileUpdateAction } from 'kaltura-ngx-client';
import { MediaTranscodingProfilesStore } from '../transcoding-profiles/transcoding-profiles-store/media-transcoding-profiles-store.service';
import { LiveTranscodingProfilesStore } from '../transcoding-profiles/transcoding-profiles-store/live-transcoding-profiles-store.service';
import { KalturaConversionProfileType } from 'kaltura-ngx-client';
import {
    SettingsTranscodingProfileViewSections,
    SettingsTranscodingProfileViewService
} from 'app-shared/kmc-shared/kmc-views/details-views';
import { SettingsTranscodingMainViewService } from 'app-shared/kmc-shared/kmc-views/main-views/settings-transcoding-main-view.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { TranscodingProfilesUpdatedEvent } from 'app-shared/kmc-shared/events';
import { AppEventsService } from 'app-shared/kmc-shared';
import { debounce, map, flatMap, switchMap } from 'rxjs/operators';
import { timer } from 'rxjs';
import { of } from 'rxjs';

export enum ActionTypes {
  ProfileLoading,
  ProfileLoaded,
  ProfileLoadingFailed,
  ProfileSaving,
  ProfilePrepareSavingFailed,
  ProfileSavingFailed,
  ProfileDataIsInvalid,
  ActiveSectionBusy
}
export enum NotificationTypes {
    ViewEntered
}
export interface StatusArgs {
  action: ActionTypes;
  error?: Error;
}

@Injectable()
export class TranscodingProfileStore implements OnDestroy {
    private _notifications = new Subject<{ type: NotificationTypes, error?: Error }>();
    public notifications$ = this._notifications.asObservable();
  private _profilesStore: BaseTranscodingProfilesStore;
  private _loadProfileSubscription: ISubscription;
  private _pageExitVerificationToken: string;
  private _saveProfileInvoked = false;
  private _profile = {
    data: new BehaviorSubject<KalturaConversionProfileWithAsset>(null),
    state: new BehaviorSubject<StatusArgs>({ action: ActionTypes.ProfileLoading, error: null })
  };
  private _profileId: string;
  private _profileIsDirty: boolean;

  public get profileIsDirty(): boolean {
    return this._profileIsDirty;
  }

  public get profileId(): string {
    return String(this._profileId);
  }

  public readonly profile = {
    data$: this._profile.data.asObservable(),
    state$: this._profile.state.asObservable(),
    data: () => this._profile.data.value
  };

  constructor(@Host() private _widgetsManager: TranscodingProfileWidgetsManager,
              private _kalturaServerClient: KalturaClient,
              private _router: Router,
              private _appEvents: AppEventsService,
              private _browserService: BrowserService,
              private _profileRoute: ActivatedRoute,
              private _pageExitVerificationService: PageExitVerificationService,
              private _appLocalization: AppLocalization,
              private _profileCreationService: TranscodingProfileCreationService,
              private _mediaTranscodingProfilesStore: MediaTranscodingProfilesStore,
              private _liveTranscodingProfilesStore: LiveTranscodingProfilesStore,
              private _settingsTranscodingProfileViewService: SettingsTranscodingProfileViewService,
              private _settingsTranscodingMainViewService: SettingsTranscodingMainViewService,
              private _logger: KalturaLogger) {


    this._widgetsManager.profileStore = this;
    this._onSectionsStateChanges();
    this._onRouterEvents();
  }

  private _onSectionsStateChanges(): void {
    this._widgetsManager.widgetsState$
      .pipe(cancelOnDestroy(this))
      .pipe(debounce(() => timer(500)))
      .subscribe(
        sectionsState => {
          const newDirtyState = Object
            .keys(sectionsState)
            .reduce((result, sectionName) => result || sectionsState[sectionName].isDirty, false);

          if (this._profileIsDirty !== newDirtyState) {
            this._logger.info(`update profile is dirty state to ${newDirtyState}`);
            this._profileIsDirty = newDirtyState;

            this._updatePageExitVerification();

          }
        }
      );
  }

  private _updatePageExitVerification(): void {
    if (this._profileIsDirty) {
      this._pageExitVerificationToken = this._pageExitVerificationService.add();
    } else {
      if (this._pageExitVerificationToken) {
        this._pageExitVerificationService.remove(this._pageExitVerificationToken);
      }
      this._pageExitVerificationToken = null;
    }
  }

  ngOnDestroy() {
    if (this._loadProfileSubscription) {
      this._loadProfileSubscription.unsubscribe();
    }

    this._profile.data.complete();
    this._profile.state.complete();

    if (this._pageExitVerificationToken) {
      this._pageExitVerificationService.remove(this._pageExitVerificationToken);
    }

    if (this._saveProfileInvoked && this._profilesStore) {
      this._profilesStore.reload();
    }
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

  private _onRouterEvents(): void {
    this._router.events
      .pipe(cancelOnDestroy(this))
      .subscribe(
        event => {
          if (event instanceof NavigationEnd) {
            const currentProfileId = this._profileRoute.snapshot.params.id;
            if (currentProfileId !== this._profileId) {
              if (currentProfileId === 'new') {
                const newData = this._profileCreationService.popNewProfileData();
                if (newData) {
                  this._profileId = currentProfileId;
                  this._setProfilesStoreServiceByType(newData.profile.type);
                    const newProfile = newData.profile;
                    (<any>newProfile).id = 'new';
                  this._profile.data.next(newData.profile);

                  setTimeout(() => {
                    const profileLoadedResult = this._widgetsManager.notifyDataLoaded(this.profile.data(), { isNewData: true });
                    if (profileLoadedResult.errors.length) {
                      this._profile.state.next({
                        action: ActionTypes.ProfileLoadingFailed,
                        error: new Error('one of the widgets failed while handling data loaded event')
                      });
                    } else {
                      this._profile.state.next({ action: ActionTypes.ProfileLoaded });
                    }
                  }, 0);
                } else {
                    this._settingsTranscodingMainViewService.open();
                }
              } else {

                // we must defer the loadProfile to the next event cycle loop to allow components
                // to init them-selves when entering this module directly.
                setTimeout(() => {
                  const profile = this.profile.data();
                  if (!profile || (profile && profile.id !== currentProfileId)) {
                    this._loadProfile(currentProfileId);
                  }
                });
              }
            } else {
                this._notifications.next({ type: NotificationTypes.ViewEntered });
            }
          }
        }
      );
  }

  private _checkFlavors(newProfile: KalturaConversionProfileWithAsset): Observable<{ proceedSave: boolean }> {
    if (newProfile.flavorParamsIds && newProfile.flavorParamsIds.trim().length) {
      return of({ proceedSave: true });
    }

    return Observable.create(observer => {
      this._browserService.confirm({
        message: this._appLocalization.get('applications.settings.transcoding.flavors.noFlavorsSelectedWarning'),
        accept: () => {
          observer.next({ proceedSave: true });
          observer.complete();
        },
        reject: () => {
          observer.next({ proceedSave: false });
          observer.complete();
        }
      });
    });
  }

  private _transmitSaveRequest(newProfile: KalturaConversionProfileWithAsset): void {
    this._profile.state.next({ action: ActionTypes.ProfileSaving });

    const id = this.profileId;
    const action = id === 'new'
      ? new ConversionProfileAddAction({ conversionProfile: newProfile })
      : new ConversionProfileUpdateAction({ id: Number(id), conversionProfile: newProfile });
    const request = new KalturaMultiRequest(action);

    this._widgetsManager.notifyDataSaving(newProfile, request, this.profile.data())
      .pipe(cancelOnDestroy(this))
      .pipe(tag('block-shell'))
      .pipe(flatMap(prepareResponse => {
        if (prepareResponse.ready) {
          return this._checkFlavors(newProfile)
            .pipe(switchMap(({ proceedSave }) => {
              if (!proceedSave) {
                return EMPTY;
              }

              return this._kalturaServerClient.multiRequest(request)
                .pipe(tag('block-shell'))
                .pipe(map(multiResponse => {
                  if (multiResponse.hasErrors()) {
                    const errorMessage = multiResponse.map(response => {
                      if (response.error) {
                        return response.error.message + '\n';
                      }
                    }).join('');
                    this._profile.state.next({ action: ActionTypes.ProfileSavingFailed, error: new Error(errorMessage) });
                  } else {
                    const isNew = id === 'new';
                    const [profileResponse] = multiResponse;

                    this._saveProfileInvoked = true;

                    if (isNew) {
                      this._profileIsDirty = false;
                        this._appEvents.publish(new TranscodingProfilesUpdatedEvent());
                        this._settingsTranscodingProfileViewService.open({ profile: profileResponse.result, section: SettingsTranscodingProfileViewSections.Metadata });
                    } else {
                      this._loadProfile(profileResponse.result.id);
                    }
                  }

                  return EMPTY;
                }));
            }));
        } else {
          switch (prepareResponse.reason) {
            case OnDataSavingReasons.validationErrors:
              this._profile.state.next({ action: ActionTypes.ProfileDataIsInvalid });
              break;
            case OnDataSavingReasons.attachedWidgetBusy:
              this._profile.state.next({ action: ActionTypes.ActiveSectionBusy });
              break;
            case OnDataSavingReasons.buildRequestFailure:
              this._profile.state.next({ action: ActionTypes.ProfilePrepareSavingFailed });
              break;
          }

          return EMPTY;
        }
      }))
      .subscribe(
        response => {
          // do nothing - the service state is modified inside the map functions.
        },
        error => {
          // should not reach here, this is a fallback plan.
          this._profile.state.next({ action: ActionTypes.ProfileSavingFailed, error });
        }
      );
  }

  public saveProfile(): void {
      const profile = this.profile.data();
      const newProfile = <KalturaConversionProfileWithAsset>KalturaObjectBaseFactory.createObject(profile);
      if (newProfile && newProfile instanceof KalturaConversionProfile) {
          if (this.profileId === 'new') {
              newProfile.type = profile.type;
          }

          newProfile.flavorParamsIds = profile.flavorParamsIds; // this field is provided always to allow flavor section to modify it as needed with new/removed flavors

          this._transmitSaveRequest(newProfile);
      } else {
          console.error(new Error(`Failed to create a new instance of the profile type '${this.profile ? typeof this.profile : 'n/a'}`));
          this._profile.state.next({action: ActionTypes.ProfilePrepareSavingFailed});
      }
  }

  public reloadProfile(): void {
    if (this.profileId) {
      this._loadProfile(this.profileId);
    }
  }

  private _loadProfile(profileId: string): void {
    if (this._loadProfileSubscription) {
      this._loadProfileSubscription.unsubscribe();
      this._loadProfileSubscription = null;
    }

    this._profileId = profileId;
    this._profileIsDirty = false;
    this._updatePageExitVerification();

    this._profile.state.next({ action: ActionTypes.ProfileLoading });
    this._widgetsManager.notifyDataLoading(profileId);

    this._loadProfileSubscription = this._getProfile(profileId)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        response => {
            this._profile.data.next(response);
            this._profileId = String(response.id);
            this._notifications.next({ type: NotificationTypes.ViewEntered });

            if (this._settingsTranscodingProfileViewService.isAvailable({
                profile: response,
                activatedRoute: this._profileRoute,
                section: SettingsTranscodingProfileViewSections.ResolveFromActivatedRoute
            })) {
                this._setProfilesStoreServiceByType(response.type);

                const dataLoadedResult = this._widgetsManager.notifyDataLoaded(response, { isNewData: false });
                if (dataLoadedResult.errors.length) {
                    this._profile.state.next({
                        action: ActionTypes.ProfileLoadingFailed,
                        error: new Error(`one of the widgets failed while handling data loaded event`)
                    });
                } else {
                    this._profile.state.next({ action: ActionTypes.ProfileLoaded });
                }
            }
        },
        error => {
          this._profile.state.next({ action: ActionTypes.ProfileLoadingFailed, error });

        }
      );
  }

  public openSection(sectionKey: SettingsTranscodingProfileViewSections): void {
     this._settingsTranscodingProfileViewService.open({ section: sectionKey, profile: this.profile.data() });
  }

  private _getProfile(profileId: string): Observable<KalturaConversionProfileWithAsset> {
    if (profileId) {
      const id = Number(profileId);
      const conversionProfileAction = new ConversionProfileGetAction({ id });
      const conversionProfileAssetParamsAction = new ConversionProfileAssetParamsListAction({
        filter: new KalturaConversionProfileAssetParamsFilter({
          conversionProfileIdFilter: new KalturaConversionProfileFilter({ idEqual: id })
        }),
        pager: new KalturaFilterPager({ pageSize: 1000 })
      });

      // build the request
      return this._kalturaServerClient
        .multiRequest(new KalturaMultiRequest(conversionProfileAction, conversionProfileAssetParamsAction))
        .pipe(map(([profilesResponse, assetsResponse]) => {
          if (profilesResponse.error) {
            throw Error(profilesResponse.error.message);
          }

          if (assetsResponse.error) {
            throw Error(assetsResponse.error.message);
          }

          const profile = profilesResponse.result;
          const assets = assetsResponse.result.objects;
          const flavorParamsIds = (profile.flavorParamsIds || '').trim();
          const flavors = flavorParamsIds ? flavorParamsIds.split(',').length : 0;
          return Object.assign(profile, { assets, flavors });
        }));
    } else {
      return throwError(new Error('missing profileId'));
    }
  }

  public openProfile(profile: KalturaConversionProfileWithAsset): void {
    this.canLeave()
        .filter(({ allowed }) => allowed)
        .pipe(cancelOnDestroy(this))
        .subscribe(() => {
            this._settingsTranscodingProfileViewService.open({ profile, section: SettingsTranscodingProfileViewSections.Metadata });
        });
  }

  public canLeave(): Observable<{ allowed: boolean }> {
    return Observable.create(observer => {
      if (this._profileIsDirty) {
        this._browserService.confirm(
          {
            header: this._appLocalization.get('applications.settings.transcoding.cancelEdit'),
            message: this._appLocalization.get('applications.settings.transcoding.discard'),
            accept: () => {
              this._profileIsDirty = false;
              observer.next({ allowed: true });
              observer.complete();
            },
            reject: () => {
              observer.next({ allowed: false });
              observer.complete();
            }
          }
        );
      } else {
        observer.next({ allowed: true });
        observer.complete();
      }
    });
  }

  public returnToProfiles(): void {
      this._settingsTranscodingMainViewService.open();
  }
}
