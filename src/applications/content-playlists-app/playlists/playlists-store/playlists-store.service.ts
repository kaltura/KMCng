import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { KalturaClient, KalturaPlaylistType } from 'kaltura-ngx-client';
import { PlaylistListAction } from 'kaltura-ngx-client';
import { KalturaPlaylistFilter } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';
import { PlaylistDeleteAction } from 'kaltura-ngx-client';
import { KalturaPlaylist } from 'kaltura-ngx-client';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { DatesRangeAdapter, DatesRangeType } from '@kaltura-ng/mc-shared';
import { FiltersStoreBase, TypeAdaptersMapping } from '@kaltura-ng/mc-shared';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaSearchOperatorType } from 'kaltura-ngx-client';
import { KalturaSearchOperator } from 'kaltura-ngx-client';
import { StringTypeAdapter } from '@kaltura-ng/mc-shared';
import { NumberTypeAdapter } from '@kaltura-ng/mc-shared';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import { ContentPlaylistsMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { globalConfig } from 'config/global';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { KalturaPlaylistListResponse } from 'kaltura-ngx-client';
import {PlaylistsUtilsService} from "../../playlists-utils.service";
import { map } from 'rxjs/operators';

export enum SortDirection {
  Desc = -1,
  Asc = 1
}

export interface PlaylistsFilters {
  pageSize: number,
  pageIndex: number,
  freeText: string,
  sortBy: string,
  adminTagsMultiLikeOr: string,
  sortDirection: number,
  createdAt: DatesRangeType
}

export interface ExtendedPlaylist extends KalturaPlaylist {
    tooltip?: string;
    isRapt?: boolean;
    isPath?: boolean;
    isManual?: boolean;
    isRuleBased?: boolean;
}

const localStoragePageSizeKey = 'playlists.list.pageSize';

@Injectable()
export class PlaylistsStore extends FiltersStoreBase<PlaylistsFilters> implements OnDestroy {
  private _playlists = {
    data: new BehaviorSubject<{ items: ExtendedPlaylist[], totalCount: number }>({ items: [], totalCount: 0 }),
    state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({ loading: false, errorMessage: null })
  };
  private _isReady = false;
  private _querySubscription: ISubscription;

  public readonly playlists = {
    data$: this._playlists.data.asObservable(),
    state$: this._playlists.state.asObservable(),
    data: () => this._playlists.data.value
  };

  constructor(private _kalturaServerClient: KalturaClient,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _playlistsUtilsService: PlaylistsUtilsService,
              contentPlaylistsMainView: ContentPlaylistsMainViewService,
              _logger: KalturaLogger) {
        super(_logger);
        if (contentPlaylistsMainView.isAvailable()) {
            this._prepare();
        }
  }

  ngOnDestroy() {
    this._playlists.data.complete();
    this._playlists.state.complete();
  }

  private _prepare(): void {

      // NOTICE: do not execute here any logic that should run only once.
      // this function will re-run if preparation failed. execute your logic
      // only after the line where we set isReady to true

    if (!this._isReady) {
      this._isReady = true;

      const defaultPageSize = this._browserService.getFromLocalStorage(localStoragePageSizeKey);
      if (defaultPageSize !== null && (defaultPageSize !== this.cloneFilter('pageSize', null))) {
        this.filter({
          pageSize: defaultPageSize
        });
      }

      this._registerToFilterStoreDataChanges();
      this._executeQuery();
    }
  }

  private _registerToFilterStoreDataChanges(): void {
    this.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(() => {
        this._executeQuery();
      });
  }

  private _executeQuery(): void {

    if (this._querySubscription) {
      this._querySubscription.unsubscribe();
      this._querySubscription = null;
    }

    const pageSize = this.cloneFilter('pageSize', null);
    if (pageSize) {
      this._browserService.setInLocalStorage(localStoragePageSizeKey, pageSize);
    }

    this._playlists.state.next({ loading: true, errorMessage: null });
    this._querySubscription = this._buildQueryRequest()
      .pipe(cancelOnDestroy(this))
      .subscribe(
        response => {
          this._querySubscription = null;

          this._playlists.state.next({ loading: false, errorMessage: null });

          this._playlists.data.next({
            items: this._extendPlaylistsWithTooltipAndRapt(response.objects),
            totalCount: <number>response.totalCount
          });
        },
        error => {
          this._querySubscription = null;
          const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
          this._playlists.state.next({ loading: false, errorMessage });
        });
  }

  private _extendPlaylistsWithTooltipAndRapt(playlists: ExtendedPlaylist[]): ExtendedPlaylist[] {
      playlists.forEach(playlist => {
          const tags = playlist.tags ? playlist.tags.split(',').filter(item => !!item).map(item => item.trim()).join('\n') : null;
          playlist.isRapt = this._playlistsUtilsService.isRapt(playlist);
          playlist.isPath = this._playlistsUtilsService.isPath(playlist);
          playlist.isManual = this._playlistsUtilsService.isManual(playlist);
          playlist.isRuleBased = this._playlistsUtilsService.isRuleBased(playlist);
          playlist.tooltip = tags
              ? this._appLocalization.get('applications.content.table.nameTooltip', [playlist.name, tags])
              : playlist.name;
      });
      return playlists;
  }
    private _buildQueryRequest(): Observable<KalturaPlaylistListResponse> {
    try {

      // create request items
      const filter = new KalturaPlaylistFilter({});
      let responseProfile: KalturaDetachedResponseProfile = null;
      let pager: KalturaFilterPager = null;

      const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
      advancedSearch.type = KalturaSearchOperatorType.searchAnd;

      const data: PlaylistsFilters = this._getFiltersAsReadonly();

      // filter 'createdAt'
      if (data.createdAt) {
        if (data.createdAt.fromDate) {
          filter.createdAtGreaterThanOrEqual = KalturaUtils.getStartDateValue(data.createdAt.fromDate);
        }

        if (data.createdAt.toDate) {
          filter.createdAtLessThanOrEqual = KalturaUtils.getEndDateValue(data.createdAt.toDate);
        }
      }

      // filter interactive video
      if (data.adminTagsMultiLikeOr !== '') {
          filter.adminTagsMultiLikeOr = data.adminTagsMultiLikeOr;
      } else {
          delete filter.adminTagsMultiLikeOr;
      }

      // update desired fields of entries
        responseProfile = new KalturaDetachedResponseProfile({
          type: KalturaResponseProfileType.includeFields,
          fields: 'id,name,createdAt,playlistType,status,tags,adminTags'
        });

      // update the sort by args
      if (data.sortBy) {
        filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
      }

      // filter 'freeText'
      if (data.freeText) {
        filter.freeText = data.freeText;
      }

      // update pagination args
      if (data.pageIndex || data.pageSize) {
        pager = new KalturaFilterPager(
          {
            pageSize: data.pageSize,
            pageIndex: data.pageIndex + 1
          }
        );
      }

      let result: Observable<KalturaPlaylistListResponse> = null;
      // build the request
      if (filter.adminTagsMultiLikeOr) {
          // create multirequest for interactive videos list since we need to list both rapt and path
          // create path filter
          let pathFilter = Object.assign(new KalturaPlaylistFilter({}), filter);
          delete pathFilter.adminTagsMultiLikeOr;
          pathFilter.playListTypeEqual = KalturaPlaylistType.path;

          result = this._kalturaServerClient.multiRequest([
              new PlaylistListAction({filter: pathFilter, pager}).setRequestOptions({
                  responseProfile
              }),
              new PlaylistListAction({filter, pager}).setRequestOptions({
                  responseProfile
              }),
          ]).pipe(map(responses => {
              const path = responses[0]; // path result
              const rapt = responses[1]; // rapt result
              // merge rapt result to path result
              if (rapt.result.objects && path.result.objects) {
                  rapt.result.objects.forEach(playlist => path.result.objects.push(playlist));
              }
              // update totalCount to the sum of totalCount of both calls
              path.result.totalCount = path.result.totalCount + rapt.result.totalCount;
              return path.result;
          }));
      } else {
          // filter without interactive videos (dates or free text search)
          result = this._kalturaServerClient.request(
              new PlaylistListAction({filter, pager}).setRequestOptions({
                  responseProfile
              })
          );
      }
      return result;
    } catch (err) {
      return throwError(err);
    }
  }

    protected _preFiltersReset(updates: Partial<PlaylistsFilters>): Partial<PlaylistsFilters> {
        delete updates.sortBy;
        delete updates.sortDirection;
        return updates;
    }

    protected _preFilter(updates: Partial<PlaylistsFilters>): Partial<PlaylistsFilters> {
    if (typeof updates.pageIndex === 'undefined') {
      // reset page index to first page everytime filtering the list by any filter that is not page index
      updates.pageIndex = 0;
    }

    return updates;
  }

  protected _createDefaultFiltersValue(): PlaylistsFilters {
    const pageSize = this._browserService.getFromLocalStorage(localStoragePageSizeKey) || globalConfig.client.views.tables.defaultPageSize;
    return {
      pageSize: pageSize,
      pageIndex: 0,
      freeText: '',
      adminTagsMultiLikeOr: '',
      sortBy: 'createdAt',
      sortDirection: SortDirection.Desc,
      createdAt: { fromDate: null, toDate: null }
    };
  }

  protected _getTypeAdaptersMapping(): TypeAdaptersMapping<PlaylistsFilters> {
    return {
      pageSize: new NumberTypeAdapter(),
      pageIndex: new NumberTypeAdapter(),
      sortBy: new StringTypeAdapter(),
      sortDirection: new NumberTypeAdapter(),
      freeText: new StringTypeAdapter(),
      adminTagsMultiLikeOr: new StringTypeAdapter(),
      createdAt: new DatesRangeAdapter(),
    };
  }

  public reload(): void {
    if (this._playlists.state.getValue().loading) {
      return;
    }

    if (this._isReady) {
      this._executeQuery();
    } else {
      this._prepare();
    }
  }

  public deletePlaylist(id: string): Observable<void> {
    return this._kalturaServerClient
      .request(new PlaylistDeleteAction({ id }))
      .pipe(map(() => {
      }));
  }
}

