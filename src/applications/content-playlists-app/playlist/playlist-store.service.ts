import { Host, Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ISubscription } from 'rxjs/Subscription';
import { KalturaClient, KalturaMultiRequest, KalturaTypesFactory } from 'kaltura-ngx-client';
import { PlaylistGetAction } from 'kaltura-ngx-client/api/types/PlaylistGetAction';
import { KalturaPlaylist } from 'kaltura-ngx-client/api/types/KalturaPlaylist';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { PlaylistUpdateAction } from 'kaltura-ngx-client/api/types/PlaylistUpdateAction';
import { Observable } from 'rxjs/Observable';
import { AppAuthentication, BrowserService } from 'app-shared/kmc-shell';
import { PlaylistsStore } from '../playlists/playlists-store/playlists-store.service';
import { KalturaPlaylistType } from 'kaltura-ngx-client/api/types/KalturaPlaylistType';
import { PlaylistAddAction } from 'kaltura-ngx-client/api/types/PlaylistAddAction';
import { PlaylistWidgetsManager } from './playlist-widgets-manager';
import { OnDataSavingReasons } from '@kaltura-ng/kaltura-ui';
import { PageExitVerificationService } from 'app-shared/kmc-shell/page-exit-verification';
import { PlaylistCreationService } from 'app-shared/kmc-shared/events/playlist-creation';
import { subApplicationsConfig } from 'config/sub-applications';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';

export enum ActionTypes {
  PlaylistLoading,
  PlaylistLoaded,
  PlaylistLoadingFailed,
  PlaylistSaving,
  PlaylistPrepareSavingFailed,
  PlaylistSavingFailed,
  PlaylistDataIsInvalid,
  ActiveSectionBusy
}

export interface StatusArgs {
  action: ActionTypes;
  error?: Error;
}

@Injectable()
export class PlaylistStore implements OnDestroy {
  private _loadPlaylistSubscription: ISubscription;
  private _sectionToRouteMapping: { [key: number]: string } = {};
  private _state = new BehaviorSubject<StatusArgs>({ action: ActionTypes.PlaylistLoading, error: null });
  private _playlistIsDirty = false;
  private _savePlaylistInvoked = false;
  private _playlistId: string;
  private _playlist = new BehaviorSubject<{ playlist: KalturaPlaylist }>({ playlist: null });
  private _pageExitVerificationToken: string;

  public state$ = this._state.asObservable();

  private _getPlaylistId(): string {
    return this._playlistRoute.snapshot.params.id ? this._playlistRoute.snapshot.params.id : null;
  }

  public get playlist(): KalturaPlaylist {
    return this._playlist.getValue().playlist;
  }

  public get playlistId(): string {
    return this._playlistId;
  }

  public get playlistIsDirty(): boolean {
    return this._playlistIsDirty;
  }

  constructor(private _router: Router,
              private _logger: KalturaLogger,
              private _playlistRoute: ActivatedRoute,
              private _appAuth: AppAuthentication,
              private _kalturaServerClient: KalturaClient,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _playlistsStore: PlaylistsStore,
              private _playlistCreationService: PlaylistCreationService,
              private _pageExitVerificationService: PageExitVerificationService,
              @Host() private _widgetsManager: PlaylistWidgetsManager) {
      this._logger = _logger.subLogger('PlaylistStore');
    this._widgetsManager.playlistStore = this;
    this._mapSections();
    this._onSectionsStateChanges();
    this._onRouterEvents();
  }

  ngOnDestroy() {
    this._playlist.complete();
    this._state.complete();

    if (this._pageExitVerificationToken) {
      this._pageExitVerificationService.remove(this._pageExitVerificationToken);
    }

    if (this._loadPlaylistSubscription) {
      this._loadPlaylistSubscription.unsubscribe();
    }

    if (this._savePlaylistInvoked) {
      this._playlistsStore.reload();
    }
  }

  private _onSectionsStateChanges(): void {
    this._widgetsManager.widgetsState$
      .cancelOnDestroy(this)
      .debounce(() => Observable.timer(500))
      .subscribe(
        sectionsState => {
          const newDirtyState = Object.keys(sectionsState)
            .reduce((result, sectionName) => result || sectionsState[sectionName].isDirty, false);

          if (this._playlistIsDirty !== newDirtyState) {
            this._playlistIsDirty = newDirtyState;

            this._updatePageExitVerification();
          }
        }
      );
  }

  private _updatePageExitVerification(): void {
    if (this._playlistIsDirty) {
      this._pageExitVerificationToken = this._pageExitVerificationService.add();
    } else {
      if (this._pageExitVerificationToken) {
        this._pageExitVerificationService.remove(this._pageExitVerificationToken);
      }
      this._pageExitVerificationToken = null;
    }
  }

  private _loadPlaylist(id: string): void {
      this._logger.info(`handle load playlist request`, { playlistId: id });
    if (this._loadPlaylistSubscription) {
      this._loadPlaylistSubscription.unsubscribe();
      this._loadPlaylistSubscription = null;
    }

    this._playlistId = id;
    this._playlistIsDirty = false;
    this._updatePageExitVerification();

    this._state.next({ action: ActionTypes.PlaylistLoading });
    this._widgetsManager.notifyDataLoading(id);

    if (!id) {
        this._logger.info(`playlistId is not defined, abort action`);
      return this._state.next({ action: ActionTypes.PlaylistLoadingFailed, error: new Error('Missing playlistId') });
    }

    this._loadPlaylistSubscription = this._kalturaServerClient
      .request(new PlaylistGetAction({ id }))
      .cancelOnDestroy(this)
      .subscribe(playlist => {
          this._logger.info(`handle successful loading playlist request`);
          if (playlist.playlistType === KalturaPlaylistType.dynamic) {
            if (typeof playlist.totalResults === 'undefined' || playlist.totalResults <= 0) {
              playlist.totalResults = subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults;
            }
          }

          this._loadPlaylistSubscription = null;
          this._playlist.next({ playlist });
          const playlistLoadedResult = this._widgetsManager.notifyDataLoaded(playlist, { isNewData: false });
          if (playlistLoadedResult.errors.length) {
            this._state.next({
              action: ActionTypes.PlaylistLoadingFailed,
              error: new Error('one of the widgets failed while handling data loaded event')
            });
          } else {
            this._state.next({ action: ActionTypes.PlaylistLoaded });
          }
        },
        error => {
            this._logger.warn(`handle failed loading playlist request`, { errorMessage: error.message });
          this._loadPlaylistSubscription = null;
          this._state.next({ action: ActionTypes.PlaylistLoadingFailed, error });
        }
      );
  }

  private _mapSections(): void {
    if (!this._playlistRoute || !this._playlistRoute.snapshot.data.playlistRoute) {
      throw new Error('this service can be injected from component that is associated to the playlist route');
    }

    this._playlistRoute.snapshot.routeConfig.children.forEach(childRoute => {
      const routeSectionType = childRoute.data ? childRoute.data.sectionKey : null;

      if (routeSectionType !== null) {
        if (Array.isArray(routeSectionType)) {
          routeSectionType.forEach(type => {
            this._sectionToRouteMapping[type] = childRoute.path;
          });
        } else {
          this._sectionToRouteMapping[routeSectionType] = childRoute.path;
        }
      }
    });
  }

  private _onRouterEvents(): void {
    this._router.events
      .cancelOnDestroy(this)
      .filter(event => event instanceof NavigationEnd)
      .subscribe(
        () => {
          const currentPlaylistId = this._playlistRoute.snapshot.params.id;

          if (currentPlaylistId !== this._playlistId) {
            if (currentPlaylistId === 'new') {
              const newData = this._playlistCreationService.popNewPlaylistData();

              if (newData) {
                this._playlistId = currentPlaylistId;

                this._playlist.next({
                  playlist: new KalturaPlaylist({
                    name: newData.name,
                    description: newData.description,
                    playlistContent: newData.playlistContent,
                    playlistType: newData.type,
                    creatorId: this._appAuth.appUser.id,
                    totalResults: subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults
                  })
                });

                setTimeout(() => {
                  const playlistLoadedResult = this._widgetsManager.notifyDataLoaded(this.playlist, { isNewData: true });
                  if (playlistLoadedResult.errors.length) {
                    this._state.next({
                      action: ActionTypes.PlaylistLoadingFailed,
                      error: new Error('one of the widgets failed while handling data loaded event')
                    });
                  } else {
                    this._state.next({ action: ActionTypes.PlaylistLoaded });
                  }
                }, 0);
              } else {
                this._router.navigate(['content/playlists']);
              }
            } else {
              // we must defer the loadPlaylist to the next event cycle loop to allow components
              // to init them-selves when entering this module directly.
              setTimeout(() => this._loadPlaylist(currentPlaylistId), 0);
            }
          }
        }
      );
  }

  public savePlaylist(): void {
      this._logger.info(`handle save playlist request by user`);
    if (this.playlist && this.playlist instanceof KalturaPlaylist) {
      const newPlaylist = <KalturaPlaylist>KalturaTypesFactory.createObject(this.playlist);
      newPlaylist.playlistType = this.playlist.playlistType;

      if (newPlaylist.playlistType === KalturaPlaylistType.dynamic) {
        newPlaylist.totalResults = this.playlist.totalResults;
      }

      const id = this._getPlaylistId();
      const action = id === 'new'
        ? new PlaylistAddAction({ playlist: newPlaylist })
        : new PlaylistUpdateAction({ id, playlist: newPlaylist });
      const request = new KalturaMultiRequest(action);

      this._logger.debug(`saving ${id === 'new' ? 'new' : 'existing'} playlist`);

      this._widgetsManager.notifyDataSaving(newPlaylist, request, this.playlist)
        .cancelOnDestroy(this)
        .monitor('playlist store: prepare playlist for save')
        .tag('block-shell')
        .switchMap((response: { ready: boolean, reason?: OnDataSavingReasons, errors?: Error[] }) => {
            if (response.ready) {
              this._savePlaylistInvoked = true;

              return this._kalturaServerClient.multiRequest(request)
                .tag('block-shell')
                .monitor('playlist store: save playlist')
                .map(([res]) => {
                    if (res.error) {
                        this._logger.warn(`handle failed save playlist request`, { errorMessage: res.error.message });
                      this._state.next({ action: ActionTypes.PlaylistSavingFailed });
                    } else {
                      if (id === 'new') {
                          this._logger.info(`handle successful creation of new playlist, navigate to new playlist`, { playlistId: res.result.id });
                        this._playlistIsDirty = false;
                        this._router.navigate(['playlist', res.result.id], { relativeTo: this._playlistRoute.parent });
                      } else {
                          this._logger.info(`handle successful save of existing playlist`, { playlistId: this.playlistId });
                        this._loadPlaylist(this.playlistId);
                      }
                    }

                    return Observable.empty();
                  }
                );
            } else {
              switch (response.reason) {
                case OnDataSavingReasons.validationErrors:
                  this._state.next({ action: ActionTypes.PlaylistDataIsInvalid });
                  break;
                case OnDataSavingReasons.attachedWidgetBusy:
                  this._state.next({ action: ActionTypes.ActiveSectionBusy });
                  break;
                case OnDataSavingReasons.buildRequestFailure:
                  this._state.next({ action: ActionTypes.PlaylistPrepareSavingFailed });
                  break;
              }

              return Observable.empty();
            }
          }
        )
        .subscribe(
          response => {
            // do nothing - the service state is modified inside the map functions.
          },
          error => {
            this._state.next({ action: ActionTypes.PlaylistSavingFailed, error });
          }
        );
    } else {
      this._logger.warn(`Failed to save/create instance of the playlist type '${this.playlist ? typeof this.playlist : 'n/a'}`);
      this._state.next({ action: ActionTypes.PlaylistPrepareSavingFailed });
    }
  }

  public reloadPlaylist(): void {
      this._logger.info(`handle reload playlist action`);
    if (this._getPlaylistId()) {
      this._loadPlaylist(this.playlistId);
    } else {
        this._logger.info(`current playlistId is not defined, abort action`);
    }
  }

  public openSection(sectionKey: string): void {
      this._logger.info(`handle open section action by user`, { sectionKey });
    const navigatePath = this._sectionToRouteMapping[sectionKey];

    if (navigatePath) {
        this._logger.info(`navigate to ${navigatePath} section`);
      this._router.navigate([navigatePath], { relativeTo: this._playlistRoute });
    } else {
        this._logger.info(`unknown section, abort action`);
    }
  }

  public openPlaylist(playlistId: string) {
      this._logger.info(`handle open playlist action by user`, { playlistId });
    if (this.playlistId !== playlistId) {
      this.canLeaveWithoutSaving()
        .cancelOnDestroy(this)
        .subscribe(
          response => {
            if (response.allowed) {
                this._logger.info(`navigate to playlist`, { playlistId });
              this._router.navigate(['playlist', playlistId], { relativeTo: this._playlistRoute.parent });
            }
          }
        );
    } else {
        this._logger.info(`playlist is already opened, abort action`);
    }
  }

  public canLeaveWithoutSaving(): Observable<{ allowed: boolean }> {
      this._logger.info(`check if user can leave page without confirmation`);
    return Observable.create(observer => {
      if (this._playlistIsDirty) {
          this._logger.info(`playlists is dirty, show confirmation`);
        this._browserService.confirm(
          {
            header: this._appLocalization.get('applications.content.playlistDetails.cancelEdit'),
            message: this._appLocalization.get('applications.content.playlistDetails.discardAllChanges'),
            accept: () => {
                this._logger.info(`user confirmed, allow to leave`);
              this._playlistIsDirty = false;
              observer.next({ allowed: true });
              observer.complete();
            },
            reject: () => {
                this._logger.info(`user didn't confirm, forbid to leave`);
              observer.next({ allowed: false });
              observer.complete();
            }
          }
        )
      } else {
        observer.next({ allowed: true });
        observer.complete();
      }
    }).monitor('playlist store: check if can leave section without saving');
  }

  public returnToPlaylists(): void {
      this._logger.info(`handle return to playlists action by user`);
    this.canLeaveWithoutSaving()
      .cancelOnDestroy(this)
      .filter(({ allowed }) => allowed)
      .monitor('playlist store: return to playlists list')
      .subscribe(() => {
        this._router.navigate(['content/playlists'])
      });
  }
}
