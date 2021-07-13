import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {KalturaPlaylist} from 'kaltura-ngx-client';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {KalturaBaseSyndicationFeed} from 'kaltura-ngx-client';
import {KalturaUiConf} from 'kaltura-ngx-client';
import {KalturaFlavorParams} from 'kaltura-ngx-client';
import {FeedsService} from 'applications/content-syndication-app/feeds/feeds.service';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui';
import {KalturaSyndicationFeedType} from 'kaltura-ngx-client';
import {FlavoursStore} from 'app-shared/kmc-shared';
import { Observable, forkJoin } from 'rxjs';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {KalturaSyndicationFeedEntryCount} from 'kaltura-ngx-client';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PlayersStore} from 'app-shared/kmc-shared/players/players-store.service';
import {KalturaPlaylistType} from 'kaltura-ngx-client';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {PlayerTypes} from 'app-shared/kmc-shared/players';
import { KMCPermissions , KMCPermissionsService} from 'app-shared/kmc-shared/kmc-permissions';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

export abstract class DestinationComponentBase {
  abstract getData(): KalturaBaseSyndicationFeed;
}

export type FeedFormMode = 'edit' | 'new';

@Component({
  selector: 'kFeedDetails',
  templateUrl: './feed-details.component.html',
  styleUrls: ['./feed-details.component.scss'],
    providers: [KalturaLogger.createLogger('FeedDetailsComponent')]
})
export class FeedDetailsComponent implements OnInit, OnDestroy {
  public _kmcPermissions = KMCPermissions;
  @Input() parentPopupWidget: PopupWidgetComponent;

  @Input()
  feed: KalturaBaseSyndicationFeed = null;

    @Input() loadingPlaylists = false;

    @Input()
    set playlists(data: KalturaPlaylist[]) {
        if (data && data.length) {
            this._idToPlaylistMap = new Map<string, KalturaPlaylist>();
            data.forEach(playlist => {
                this._idToPlaylistMap.set(playlist.id, playlist);
            });
            this._playlists = data;
        } else {
            this._playlists = [];
        }

        this._availablePlaylists = this._playlists.map(playlist => ({
            value: playlist.id,
            label: playlist.name || playlist.id
        }));
    }

    @Output() searchPlaylists = new EventEmitter<string>();

  @ViewChild(DestinationComponentBase) destinationComponent: DestinationComponentBase;

    public _playlists: KalturaPlaylist[] = [];
    public _idToPlaylistMap: Map<string, KalturaPlaylist> = null; // map between KalturaPlaylist id to KalturaPlaylist.name object
  public _form: FormGroup;
  public _players: KalturaUiConf[] = null;
  public _flavors: KalturaFlavorParams[] = null;
  public _entriesCountData: { count: number, showWarning: boolean, warningCount: number, flavorName: string } =
    {count: 0, showWarning: false, warningCount: 0, flavorName: null};
  public _availableDestinations: Array<{ value: KalturaSyndicationFeedType, label: string }> = [];
  public _availablePlaylists: Array<{ value: string, label: string }> = [];
  public _kalturaSyndicationFeedType = KalturaSyndicationFeedType;
  public _currentDestinationFormState: { isValid: boolean, isDirty: boolean } = {isValid: true, isDirty: false};
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _isReady = false; // determined when received entryCount, feed, flavors and players
  public _mode: FeedFormMode = 'new';
  public _newFeedText = 'New Feed';
  public _missingPlaylist = false;

  private get _isPlaylistMissing(): boolean {
      return this.feed && this.feed.playlistId && !this._idToPlaylistMap.get(this.feed.playlistId);
  }

  public get _saveBtnDisabled(): boolean {
    return !this._form.valid || !this._currentDestinationFormState.isValid
      || (!this._form.dirty && !this._currentDestinationFormState.isDirty)
      || (this._newFeedText === 'edit' && !this._permissionsService.hasPermission(KMCPermissions.SYNDICATION_UPDATE))
      || this._missingPlaylist;
  }

  constructor(private _appLocalization: AppLocalization,
              private _fb: FormBuilder,
              private _feedsService: FeedsService,
              private _flavorsStore: FlavoursStore,
              private _playersStore: PlayersStore,
              private _permissionsService: KMCPermissionsService,
              private _logger: KalturaLogger) {
    // prepare form
    this._createForm();
  }

  ngOnInit() {
    this._newFeedText = this._appLocalization.get('applications.content.syndication.details.header.newFeed');
    this._fillAvailableDestinations();
    this._mode = this.feed ? 'edit' : 'new';
    this._restartFormData();
    this._prepare();
  }

  ngOnDestroy() {
  }

    private _fillAvailableDestinations(): void {
    this._availableDestinations = [
      {
        value: KalturaSyndicationFeedType.googleVideo,
        label: this._appLocalization
          .get('applications.content.syndication.details.availableDestinations.google')
      },
      {
        value: KalturaSyndicationFeedType.yahoo,
        label: this._appLocalization
          .get('applications.content.syndication.details.availableDestinations.yahoo')
      },
      {
        value: KalturaSyndicationFeedType.itunes,
        label: this._appLocalization
          .get('applications.content.syndication.details.availableDestinations.itunes')
      },
      {
        value: KalturaSyndicationFeedType.rokuDirectPublisher,
        label: this._appLocalization
          .get('applications.content.syndication.details.availableDestinations.roku')
      },
      {
        value: KalturaSyndicationFeedType.operaTvSnap,
        label: this._appLocalization
          .get('applications.content.syndication.details.availableDestinations.opera')
      },
      {
        value: KalturaSyndicationFeedType.kalturaXslt,
        label: this._appLocalization
          .get('applications.content.syndication.details.availableDestinations.flexibleFormat')
      }
    ];
  }

  private _prepare(): void {
      this._logger.debug(`prepare component, load data`);
    if (this._isReady) {
        this._logger.trace(`component is already prepared, skip duplicating action`);
      return undefined;
    }

    this._isBusy = true;
    this._queryData()
      .pipe(cancelOnDestroy(this))
      .subscribe(response => {
        this._logger.debug(`handle successful data loading`);
        this._isBusy = false;
        this._isReady = true;
        this._players = response.players;
        this._flavors = response.flavors;
        if (this._isPlaylistMissing) {
            this._feedsService.getPlaylist(this.feed.playlistId)
                .pipe(cancelOnDestroy(this))
                .subscribe((playlist: KalturaPlaylist) => {
                    this._idToPlaylistMap.set(playlist.id, playlist);
                    this._playlists.push(playlist);
                    this._availablePlaylists.push({
                        value: playlist.id,
                        label: playlist.name || playlist.id
                    });
                    this._form.patchValue({ selectedPlaylist: playlist.id });
                    this._missingPlaylist = this._isPlaylistMissing;
                    this.setEntriesCount(response);
                },
                err => {
                    this._form.patchValue({ playlistId: null });
                });
        } else {
            this._missingPlaylist = this._isPlaylistMissing;
            this.setEntriesCount(response);
        }
      }, error => {
          this._logger.warn(`handle failed data loading, show confirmation`, { errorMessage: error.message });
          this._isBusy = false;
          if (error.code === "INVALID_ENTRY_ID"){
              this._blockerMessage = new AreaBlockerMessage({
                  message: this._appLocalization.get('applications.content.syndication.details.errors.deletedPlaylist', {0: this.feed.playlistId}),
                  buttons: [
                      {
                          label: this._appLocalization.get('app.common.close'),
                          action: () => {
                              this._logger.info(`The playlist used to create this feed could not be found (deleted?). Closing the panel.`);
                              this._blockerMessage = null;
                              this._close();
                          }
                      }
                  ]
              });
          } else {
              this._blockerMessage = new AreaBlockerMessage({
                  message: this._appLocalization.get('applications.content.syndication.details.errors.loadFailed'),
                  buttons: [
                      {
                          label: this._appLocalization.get('app.common.retry'),
                          action: () => {
                              this._logger.info(`user confirmed, retry action`);
                              this._blockerMessage = null;
                              this._prepare();
                          }
                      }, {
                          label: this._appLocalization.get('app.common.close'),
                          action: () => {
                              this._logger.info(`user didn't confirm, abort action`);
                              this._blockerMessage = null;
                              this._close();
                          }
                      }
                  ]
              });
          }
      });
  }

  private setEntriesCount(response): void{
      if (response.entriesCount) {
          const showEntriesCountWarning: boolean =
              [KalturaSyndicationFeedType.googleVideo, KalturaSyndicationFeedType.itunes, KalturaSyndicationFeedType.yahoo].indexOf(this.feed.type) >= 0;

          const getFlavorName = () => {
              if (!showEntriesCountWarning) {
                  return null;
              }
              const flavor = this._flavors.find(flvr => flvr.id === this.feed.flavorParamId);
              // return flavor ID if couldn't get flavor name
              return ((flavor && flavor.name) ||
                  (this.feed.flavorParamId &&
                      this._appLocalization.get('applications.content.syndication.details.entriesCountData.flavorId',
                          {0: this.feed.flavorParamId.toString()})));
          };

          this._entriesCountData = {
              count: response.entriesCount.actualEntryCount,
              showWarning: showEntriesCountWarning && response.entriesCount.totalEntryCount > response.entriesCount.actualEntryCount,
              warningCount: showEntriesCountWarning ? response.entriesCount.requireTranscodingCount : null,
              flavorName: getFlavorName()
          };
      }
  }

  private _queryData(): Observable<{ players: KalturaUiConf[], flavors: KalturaFlavorParams[], entriesCount?: KalturaSyndicationFeedEntryCount }> {
      this._logger.debug(`query data`, { mode: this._mode });
    if (this._mode === 'edit' && (!this.feed || !this.feed.id)) {
        this._logger.warn(`cannot load data for edit mode without feedId`);
      return throwError('An error occurred while trying to load feed');
    }

    const getPlayers$ = this._playersStore.get({type: PlayerTypes.Entry}).pipe(cancelOnDestroy(this));
    const getFlavours$ = this._flavorsStore.get().pipe(cancelOnDestroy(this));
    const requests: Observable<any>[] = [getPlayers$, getFlavours$];

    if (this._mode === 'edit') {
        this._logger.debug(`get entries for edit mode`);
      const getEntriesCount$ = this._feedsService.getFeedEntryCount(this.feed.id).pipe(cancelOnDestroy(this));
      requests.push(getEntriesCount$);
    }
    return forkJoin(...requests)
      .pipe(cancelOnDestroy(this))
      .pipe(map(response => {
        const players = response[0].items.map(player => ({
          id: player.id,
          version: player.tags.indexOf('kalturaPlayerJs') > -1 ? '3' : '2',
          name: player.name || this._appLocalization.get('applications.content.syndication.details.playerName', {0: player.id})
        }));

        return {players, flavors: response[1].items, entriesCount: this._mode === 'edit' ? response[2] : null};
      }));
  }

  // Create empty structured form on loading
  private _createForm(): void {
      this._logger.debug(`create details form`);
    this._form = this._fb.group({
      name: ['', Validators.required],
      contentType: ['allContent'],
      selectedPlaylist: [null],
      destination: [{value: null, disabled: false}, [Validators.required]],
    });
  }

  private _restartFormData(): void {
      this._logger.debug(`reset form data`);
      const name = this._mode === 'edit' ? this.feed.name : this._form.get('name').value || '';
      const contentType = this._mode === 'edit' ? (this.feed.playlistId ? 'playlist' : 'allContent') : this._form.get('contentType').value || 'allContent';
      const selectedPlaylist = this._mode === 'edit'
          ? this.feed.playlistId || null
          : this._form.get('selectedPlaylist').value || (this._playlists && this._playlists.length && this._playlists[0].id);

    this._form.reset({
      name,
      contentType,
      selectedPlaylist,
      destination: {
        value: this._mode === 'edit' ? this.feed.type : this._form.get('destination').value,
        disabled: this._mode === 'edit'
      },
    });

    if (this._mode === 'edit' && !this._permissionsService.hasPermission(KMCPermissions.SYNDICATION_UPDATE)) {
      this._form.disable({ emitEvent: false });
    }
 }

    public _setAllContent(): void {
        this._missingPlaylist = false;
        this._form.patchValue({ selectedPlaylist: null });
    }

    public _setPlaylist(): void {
        this._missingPlaylist = this._isPlaylistMissing;
        const selectedPlaylist = this._availablePlaylists.length ? this._availablePlaylists[0].value : null;
        if (!this._missingPlaylist) {
            this._form.patchValue({ selectedPlaylist });
        } else {
            this._form.patchValue({ selectedPlaylist: null });
        }
    }

    public _onSelectPlaylist(event: { originalEvent: MouseEvent, value: string }): void {
      if (event.value) {
          this._missingPlaylist = false;
      }
    }

  public _save(): void {
    if (!this._form.valid ||
      !this._currentDestinationFormState.isValid ||
      (!this._form.dirty && !this._currentDestinationFormState.isDirty)) {
      this._logger.warn('Unable to submit invalid feed form');
      return undefined;
    }

    const syndicationFeed = this.destinationComponent.getData();

    if (syndicationFeed) {
        const { name, contentType, selectedPlaylist } = this._form.value;
        syndicationFeed.name = name;
        syndicationFeed.playlistId = contentType === 'playlist' ? selectedPlaylist : '';

      if (this._mode === 'edit') {
        this._updateFeed(this.feed.id, syndicationFeed);
      } else {
        this._addNewFeed(syndicationFeed);
      }
    }
  }

  private _addNewFeed(syndicationFeed: KalturaBaseSyndicationFeed): void {
      this._logger.info(`handle add new feed request`);
    this._blockerMessage = null;

    this._feedsService.create(syndicationFeed)
      .pipe(tag('block-shell'))
      .pipe(cancelOnDestroy(this))
      .subscribe((feed) => {
          this._logger.info(`handle successful request`);
        this._feedsService.reload();
        this._close();
      }, error => {
          this._logger.warn(`handle failed request, show confirmation`, { errorMessage: error.message });
        const buttons = [{
          label: this._appLocalization.get('app.common.close'),
          action: () => {
              this._logger.info(`user didn't confirm, abort request`);
            this._blockerMessage = null;
            this._close();
          }
        }];

        if (error.code === 'client::unknown-error') {
          buttons.unshift({
            label: this._appLocalization.get('app.common.retry'),
            action: () => {
                this._logger.info(`user confirmed, retry request`);
              this._blockerMessage = null;
              this._addNewFeed(syndicationFeed);
            }
          });
        }

        this._blockerMessage = new AreaBlockerMessage({
          message: error.message,
          buttons: buttons
        });
      });
  }

  private _updateFeed(id: string, syndicationFeed: KalturaBaseSyndicationFeed): void {
      this._logger.info(`handle update feed request`, { feedId: id });
    this._blockerMessage = null;

    this._feedsService.update(id, syndicationFeed)
      .pipe(tag('block-shell'))
      .pipe(cancelOnDestroy(this))
      .subscribe(() => {
          this._logger.info(`handle successful request`);
        this._feedsService.reload();
        this._close();
      }, error => {
          this._logger.warn(`handle failed request, show confirmation`, { errorMessage: error.message });
        const buttons = [{
          label: this._appLocalization.get('app.common.close'),
          action: () => {
              this._logger.info(`user didn't confirm, abort request`);
            this._blockerMessage = null;
            this._close();
          }
        }];

        if (error.code === 'client::unknown-error') {
          buttons.unshift({
            label: this._appLocalization.get('app.common.retry'),
            action: () => {
                this._logger.info(`user confirmed, retry request`);
              this._blockerMessage = null;
              this._updateFeed(id, syndicationFeed);
            }
          });
        }

        this._blockerMessage = new AreaBlockerMessage({
          message: error.message,
          buttons: buttons
        });
      });
  }

  public _close(): void {
      this._logger.info(`handle close action by user`);
    if (this.parentPopupWidget) {
      this.parentPopupWidget.close();
    } else {
        this._logger.debug(`parentPopupWidget is not provided abort action`);
    }
  }

  public _updateCurrentDestinationFormState($event: { isValid: boolean, isDirty: boolean }) {
    this._currentDestinationFormState = $event;
  }

  public _deleteFeed() {
      this._logger.info(`handle delete feed action by user`, { feedId: this.feed.id });
    const executeDelete = () => {
      this._blockerMessage = null;
      this._logger.info(`handle delete feed request`, { feedId: this.feed.id });
      this._feedsService.deleteFeeds([this.feed.id])
        .pipe(cancelOnDestroy(this))
        .pipe(tag('block-shell'))
        .subscribe(
          result => {
              this._logger.info(`handle successful request`);
            this._feedsService.reload();
            this._close();
          }, // reload is handled by service
          error => {
              this._logger.warn(`handle failed request, show confirmation`, { errorMessage: error.message });
            this._blockerMessage = new AreaBlockerMessage({
              message: error.message,
              buttons: [
                {
                  label: this._appLocalization.get('app.common.retry'),
                  action: () => {
                      this._logger.info(`user confirmed, retry request`);
                    this._blockerMessage = null;
                    executeDelete();
                  }
                }, {
                  label: this._appLocalization.get('app.common.cancel'),
                  action: () => {
                      this._logger.info(`user didn't confirm, abort request`);
                    this._blockerMessage = null;
                  }
                }
              ]
            });
          }
        );
    };

    if (this._mode === 'edit') {
        this._logger.info(`handle delete feeds action in edit mode`);
      this._feedsService.confirmDelete([this.feed])
        .pipe(cancelOnDestroy(this))
        .subscribe(result => {
          if (result.confirmed) {
            executeDelete();
          }
        }, error => {
            this._logger.warn(`handle failed confirmation request, show alert`, { errorMessage: error.message });
          this._blockerMessage = new AreaBlockerMessage({
            message: error.message,
            buttons: [
              {
                label: this._appLocalization.get('app.common.ok'),
                action: () => {
                    this._logger.info(`user dismissed alert`);
                  this._blockerMessage = null;
                }
              }
            ]
          });
        });
    }
  }
}
