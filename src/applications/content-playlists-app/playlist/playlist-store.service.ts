import { Host, Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {BehaviorSubject, EMPTY} from 'rxjs';
import { Subject } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { KalturaClient, KalturaMultiRequest, KalturaObjectBaseFactory } from 'kaltura-ngx-client';
import { PlaylistGetAction } from 'kaltura-ngx-client';
import { KalturaPlaylist } from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { PlaylistUpdateAction } from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { AppAuthentication, BrowserService } from 'app-shared/kmc-shell';
import { PlaylistsStore } from '../playlists/playlists-store/playlists-store.service';
import { KalturaPlaylistType } from 'kaltura-ngx-client';
import { PlaylistAddAction } from 'kaltura-ngx-client';
import { PlaylistWidgetsManager } from './playlist-widgets-manager';
import { OnDataSavingReasons } from '@kaltura-ng/kaltura-ui';
import { PageExitVerificationService } from 'app-shared/kmc-shell/page-exit-verification';
import { PlaylistCreationService } from 'app-shared/kmc-shared/events/playlist-creation';
import { subApplicationsConfig } from 'config/sub-applications';
import { ContentPlaylistViewService } from 'app-shared/kmc-shared/kmc-views/details-views';
import { ContentPlaylistViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-playlist-view.service';
import { ContentPlaylistsMainViewService } from 'app-shared/kmc-shared/kmc-views/main-views/content-playlists-main-view.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { debounce } from 'rxjs/operators';
import { timer } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

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
export enum NotificationTypes {
    ViewEntered
}
export interface StatusArgs {
  action: ActionTypes;
  error?: Error;
}

@Injectable()
export class PlaylistStore implements OnDestroy {
    private _notifications = new Subject<{ type: NotificationTypes, error?: Error }>();
    public notifications$ = this._notifications.asObservable();
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
              private _playlistRoute: ActivatedRoute,
              private _appAuth: AppAuthentication,
              private _kalturaServerClient: KalturaClient,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _playlistsStore: PlaylistsStore,
              private _playlistCreationService: PlaylistCreationService,
              private _contentPlaylistView: ContentPlaylistViewService,
              private _contentPlaylistsMainView: ContentPlaylistsMainViewService,
              private _pageExitVerificationService: PageExitVerificationService,
              @Host() private _widgetsManager: PlaylistWidgetsManager) {
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
      .pipe(cancelOnDestroy(this))
      .pipe(debounce(() => timer(500)))
      .subscribe(
        sectionsState => {
          const newDirtyState = Object.keys(sectionsState)
            .reduce((result, sectionName) => result || sectionsState[sectionName].isDirty, false);

          if (newDirtyState && this._playlistIsDirty !== newDirtyState) {
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
      return this._state.next({ action: ActionTypes.PlaylistLoadingFailed, error: new Error('Missing playlistId') });
    }

    this._loadPlaylistSubscription = this._kalturaServerClient
      .request(new PlaylistGetAction({ id }))
      .pipe(cancelOnDestroy(this))
      .subscribe(playlist => {
              this._playlist.next({ playlist });
              this._notifications.next({ type: NotificationTypes.ViewEntered });

              if (this._contentPlaylistView.isAvailable({
              playlist,
              activatedRoute: this._playlistRoute,
              section: ContentPlaylistViewSections.ResolveFromActivatedRoute
          })) {
              if (playlist.playlistType === KalturaPlaylistType.dynamic) {
                  if (typeof playlist.totalResults === 'undefined' || playlist.totalResults <= 0) {
                      playlist.totalResults = subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults;
                  }
              }

              this._loadPlaylistSubscription = null;

              const playlistLoadedResult = this._widgetsManager.notifyDataLoaded(playlist, { isNewData: false });
              if (playlistLoadedResult.errors.length) {
                  this._state.next({
                      action: ActionTypes.PlaylistLoadingFailed,
                      error: new Error('one of the widgets failed while handling data loaded event')
                  });
              } else {
                  this._state.next({ action: ActionTypes.PlaylistLoaded });
              }
          }
        },
        error => {
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
      .pipe(cancelOnDestroy(this))
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(
        () => {
          const currentPlaylistId = this._playlistRoute.snapshot.params.id;

          if (currentPlaylistId !== this._playlistId) {
            if (currentPlaylistId === 'new') {
              const newData = this._playlistCreationService.popNewPlaylistData();

              if (newData) {
                this._playlistId = currentPlaylistId;
                this._playlistIsDirty = true;

                  const playlist = new KalturaPlaylist({
                      name: newData.name,
                      description: newData.description,
                      playlistContent: newData.playlistContent,
                      playlistType: newData.type,
                      creatorId: this._appAuth.appUser.id,
                      totalResults: subApplicationsConfig.contentPlaylistsApp.ruleBasedTotalResults
                  });

                  (<any>playlist).id = 'new';

                this._playlist.next({ playlist });

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
                  this._contentPlaylistsMainView.open();
              }
            } else {
              // we must defer the loadPlaylist to the next event cycle loop to allow components
              // to init them-selves when entering this module directly.
              setTimeout(() => this._loadPlaylist(currentPlaylistId), 0);
            }
          } else {
              this._notifications.next({ type: NotificationTypes.ViewEntered });
          }
        }
      );
  }

  public savePlaylist(): void {
    if (this.playlist && this.playlist instanceof KalturaPlaylist) {
      const newPlaylist = <KalturaPlaylist>KalturaObjectBaseFactory.createObject(this.playlist);
      newPlaylist.playlistType = this.playlist.playlistType;

      if (newPlaylist.playlistType === KalturaPlaylistType.dynamic) {
        newPlaylist.totalResults = this.playlist.totalResults;
      }

      const id = this._getPlaylistId();
      const action = id === 'new'
        ? new PlaylistAddAction({ playlist: newPlaylist })
        : new PlaylistUpdateAction({ id, playlist: newPlaylist });
      const request = new KalturaMultiRequest(action);

      this._widgetsManager.notifyDataSaving(newPlaylist, request, this.playlist)
        .pipe(cancelOnDestroy(this))
        .pipe(tag('block-shell'))
        .pipe(switchMap((response: { ready: boolean, reason?: OnDataSavingReasons, errors?: Error[] }) => {
            if (response.ready) {
              this._savePlaylistInvoked = true;

              return this._kalturaServerClient.multiRequest(request)
                .pipe(tag('block-shell'))
                .pipe(map(([res]) => {
                    if (res.error) {
                      this._state.next({ action: ActionTypes.PlaylistSavingFailed });
                    } else {
                      if (id === 'new') {
                        this._playlistIsDirty = false;
                          this._contentPlaylistView.open({ playlist: res.result, section: ContentPlaylistViewSections.Metadata });
                      } else {
                        this._loadPlaylist(this.playlistId);
                      }
                    }

                    return EMPTY;
                  }
                ))
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

              return EMPTY;
            }
          }
        ))
        .subscribe(
          response => {
            // do nothing - the service state is modified inside the map functions.
          },
          error => {
            this._state.next({ action: ActionTypes.PlaylistSavingFailed, error });
          }
        );
    } else {
      console.error(new Error(`Failed to create a new instance of the playlist type '${this.playlist ? typeof this.playlist : 'n/a'}`));
      this._state.next({ action: ActionTypes.PlaylistPrepareSavingFailed });
    }
  }

  public reloadPlaylist(): void {
    if (this._getPlaylistId()) {
      this._loadPlaylist(this.playlistId);
    }
  }

  public openSection(sectionKey: ContentPlaylistViewSections): void {
     this._contentPlaylistView.open({ section: sectionKey, playlist: this.playlist });
  }

  public openPlaylist(playlist: KalturaPlaylist) {
    if (this.playlistId !== playlist.id) {
      this.canLeaveWithoutSaving()
            .pipe(
                filter(({ allowed }) => allowed),
                cancelOnDestroy(this)
            )
            .subscribe(() => {
                this._contentPlaylistView.open({ playlist, section: ContentPlaylistViewSections.Metadata });
            });
    }
  }

  public canLeaveWithoutSaving(): Observable<{ allowed: boolean }> {
    return Observable.create(observer => {
      if (this._playlistIsDirty) {
        this._browserService.confirm(
          {
            header: 'Cancel Edit',
            message: 'Discard all changes?',
            accept: () => {
              this._playlistIsDirty = false;
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

  public returnToPlaylists(): void {
    this.canLeaveWithoutSaving()
      .pipe(cancelOnDestroy(this))
      .pipe(filter(({ allowed }) => allowed))
      .subscribe(() => {
          this._contentPlaylistsMainView.open();
      });
  }
}
