import {Injectable, OnDestroy} from '@angular/core';
import { Observable } from 'rxjs';
import {ISubscription} from 'rxjs/Subscription';
import {KalturaClient} from 'kaltura-ngx-client';
import {KalturaFilterPager} from 'kaltura-ngx-client';
import {UiConfListAction} from 'kaltura-ngx-client';
import {KalturaUiConfListResponse} from 'kaltura-ngx-client';
import {KalturaUiConfFilter} from 'kaltura-ngx-client';
import {KalturaUiConfObjType} from 'kaltura-ngx-client';
import {KalturaUiConf} from 'kaltura-ngx-client';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {KalturaDetachedResponseProfile} from 'kaltura-ngx-client';
import {KalturaResponseProfileType} from 'kaltura-ngx-client';
import {AppEventsService} from "app-shared/kmc-shared";
import {PlayersUpdatedEvent} from "app-shared/kmc-shared/events";
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { publishReplay, refCount } from 'rxjs/operators';

export enum PlayerTypes {
  Entry = 1,
  Playlist = 2
}

export interface GetFilters {
  type: PlayerTypes;
}


@Injectable()
export class PlayersStore implements OnDestroy {
  private _cachedPlayers: { [key: string]: Observable<KalturaUiConf[]> } = {};
  private _logger: KalturaLogger;

  constructor(private _kalturaServerClient: KalturaClient, logger: KalturaLogger, private _appEvents: AppEventsService, private _permissionsService: KMCPermissionsService) {
    this._logger = logger.subLogger('PlayersStore');

    this._appEvents.event(PlayersUpdatedEvent)
      .pipe(cancelOnDestroy(this))
      .subscribe((event) => {
        this._logger.info(`clear players cache (triggered by PlayersUpdatedEvent)`);
        const cacheKeyToDelete = this._createCacheKey({type: event.isPlaylist ? PlayerTypes.Playlist : PlayerTypes.Entry});
        delete this._cachedPlayers[cacheKeyToDelete];
      });
  }

  ngOnDestroy() {

  }

  public get(filters: GetFilters): Observable<KalturaUiConf[]> {
    const cacheToken = this._createCacheKey(filters);
    let cachedResponse = this._cachedPlayers[cacheToken];

    // // no request found in queue - get from cache if already queried those categories
    // let cachedResponse = this._cachedPlayers[cacheToken];

    if (!cachedResponse) {
      this._logger.info(`caching players for token '${cacheToken}'`);
      this._cachedPlayers[cacheToken] = cachedResponse =
        Observable.create(observer => {
          let sub: ISubscription;
          let currentPageIndex = 0;
          let playersResults = [];
          const loadPlayers = () => {
            sub = this._buildRequest(filters, ++currentPageIndex).subscribe(
              response => {
                sub = null;
                  response.objects.filter( (uiConf) => {
                      let showPlayer = true;
                      if (uiConf.html5Url){
                          showPlayer = uiConf.html5Url.indexOf('html5lib/v1') === -1; // filter out V1 players
                      } else {
                          showPlayer = uiConf.tags.indexOf('kalturaPlayerJs') > -1 && this._permissionsService.hasPermission(KMCPermissions.FEATURE_V3_STUDIO_PERMISSION); // show V3 players if user has permissions
                      }
                      // filter out by tags
                      if (uiConf.tags && uiConf.tags.length){
                          const tags = uiConf.tags.split(',');
                          if (tags.indexOf('ott') > -1) {
                              showPlayer = false;
                          }
                      }
                      return showPlayer;
                  }).forEach(uiConf => {
                      playersResults.push(uiConf);
                  });

                  observer.next({items: playersResults});
                  observer.complete();
              },
              error => {
                sub = null;
                this._cachedPlayers[cacheToken] = null;
                observer.error(error);
              }
            );
          };

          loadPlayers();

          return () => {
          }
        })
          .pipe(publishReplay(1))
          .pipe(refCount());
    }

    return cachedResponse;
  }


  private _createCacheKey(filters: GetFilters) {
    if (filters) {
      return `_${filters.type ? filters.type : ''}_`;
    } else {
      throw new Error('filter argument missing')
    }
  }

  private _buildRequest(filters: GetFilters, pageIndex: number): Observable<KalturaUiConfListResponse> {
    const tags = filters && filters.type === PlayerTypes.Playlist ? 'playlist' : 'player';

    const filter: KalturaUiConfFilter = new KalturaUiConfFilter({
      objTypeEqual: KalturaUiConfObjType.player,
      tagsMultiLikeAnd: tags,
      'orderBy': '-updatedAt',
      'objTypeIn': '1,8',
      'creationModeEqual': 2
    });

    const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,name,html5Url,createdAt,updatedAt,width,height,tags'
    });

    const pager = new KalturaFilterPager({pageSize: 500, pageIndex});

    return this._kalturaServerClient.request(new UiConfListAction({filter, pager}).setRequestOptions({
        responseProfile
    }));
  }
}
