import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';
import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import { Observable, forkJoin } from 'rxjs';
import {ISubscription} from 'rxjs/Subscription';
import { map } from 'rxjs/operators';
import {KalturaFilterPager, PlaylistGetAction} from 'kaltura-ngx-client';
import {KalturaClient, KalturaMultiRequest, KalturaMultiResponse, KalturaRequest} from 'kaltura-ngx-client';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {
  FiltersStoreBase,
  NumberTypeAdapter,
  StringTypeAdapter,
  TypeAdaptersMapping
} from '@kaltura-ng/mc-shared';
import {KalturaSearchOperator} from 'kaltura-ngx-client';
import {KalturaSearchOperatorType} from 'kaltura-ngx-client';
import {SyndicationFeedListAction} from 'kaltura-ngx-client';
import {KalturaBaseSyndicationFeedFilter} from 'kaltura-ngx-client';
import {KalturaTubeMogulSyndicationFeedOrderBy} from 'kaltura-ngx-client';
import {KalturaBaseSyndicationFeed} from 'kaltura-ngx-client';
import {KalturaGenericSyndicationFeed} from 'kaltura-ngx-client';
import {KalturaGenericXsltSyndicationFeed} from 'kaltura-ngx-client';
import {KalturaBaseSyndicationFeedListResponse} from 'kaltura-ngx-client';
import {KalturaPlaylistFilter} from 'kaltura-ngx-client';
import {KalturaPlaylist} from 'kaltura-ngx-client';
import {PlaylistListAction} from 'kaltura-ngx-client';
import {KalturaPlaylistOrderBy} from 'kaltura-ngx-client';
import {KalturaPlaylistListResponse} from 'kaltura-ngx-client';
import {SyndicationFeedDeleteAction} from 'kaltura-ngx-client';
import {AppLocalization} from '@kaltura-ng/mc-shared';
import {KalturaSyndicationFeedEntryCount, KalturaPlaylistType} from 'kaltura-ngx-client';
import {SyndicationFeedGetEntryCountAction} from 'kaltura-ngx-client';
import {SyndicationFeedAddAction} from 'kaltura-ngx-client';
import {SyndicationFeedUpdateAction} from 'kaltura-ngx-client';
import { subApplicationsConfig } from 'config/sub-applications';
import { ContentSyndicationMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { globalConfig } from 'config/global';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { filter as oFilter, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface UpdateStatus {
  loading: boolean;
  errorMessage: string;
}

export interface Feeds {
  items: KalturaBaseSyndicationFeed[],
  totalCount: number
}

export enum SortDirection {
  Desc = -1,
  Asc = 1
}

export interface FeedsFilters {
  pageSize: number,
  pageIndex: number,
  sortBy: string,
  sortDirection: number,
}


@Injectable()
export class FeedsService extends FiltersStoreBase<FeedsFilters> implements OnDestroy {

  private _feeds = {
    data: new BehaviorSubject<Feeds>({items: [], totalCount: 0}),
    state: new BehaviorSubject<UpdateStatus>({loading: false, errorMessage: null})
  };

  public readonly feeds =
    {
      data$: this._feeds.data.asObservable(),
      state$: this._feeds.state.asObservable(),
      data: () => {
        return this._feeds.data.getValue().items;
      }
    };

  private _isReady = false;
  private _querySubscription: ISubscription;
  private readonly _pageSizeCacheKey = 'feeds.list.pageSize';


  constructor(private _kalturaClient: KalturaClient,
              contentSyndicationMainView: ContentSyndicationMainViewService,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization,
              _logger: KalturaLogger) {
    super(_logger);
    if (contentSyndicationMainView.isAvailable()) {
        this._prepare();
    }
  }

  private _prepare(): void {
      this._logger.trace(`handle prepare service action`);
    if (!this._isReady) {
      this._registerToFilterStoreDataChanges();
      this._isReady = true;
    }
  }

  private _registerToFilterStoreDataChanges(): void {
    this.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(() => {
        this._executeQuery();
      });

  }

  ngOnDestroy() {
    this._feeds.state.complete();
    this._feeds.data.complete();
  }

  public reload(): void {
      this._logger.info(`handle reload request by user`);
    if (this._feeds.state.getValue().loading) {
        this._logger.debug(`loading in progress, skip duplicating request`);
      return;
    }

    if (this._isReady) {
      this._executeQuery();
    } else {
      this._prepare();
    }
  }

  private _executeQuery(): void {

    if (this._querySubscription) {
      this._querySubscription.unsubscribe();
      this._querySubscription = null;
    }

    this._feeds.state.next({loading: true, errorMessage: null});

    this._logger.debug(`handle loading of feeds data`);

    this._querySubscription = this.buildQueryRequest()
      .pipe(cancelOnDestroy(this))
      .subscribe((response: Feeds) => {
              this._logger.trace(`handle successful loading of feeds data`);

          this._querySubscription = null;

          this._feeds.state.next({loading: false, errorMessage: null});

          this._feeds.data.next({
            items: response.items,
            totalCount: response.totalCount
          });
        },
        error => {
          this._querySubscription = null;
          const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
            this._logger.warn(`notify failure during loading of feeds data`, { errorMessage });
          this._feeds.state.next({loading: false, errorMessage});
        });
  }

  private buildQueryRequest(): Observable<any>{
    try {
      // create request items
      const filter: KalturaBaseSyndicationFeedFilter = new KalturaBaseSyndicationFeedFilter({
        orderBy: KalturaTubeMogulSyndicationFeedOrderBy.createdAtDesc.toString()
      });
      let pagination: KalturaFilterPager = null;

      const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
      advancedSearch.type = KalturaSearchOperatorType.searchAnd;

      const data: FeedsFilters = this._getFiltersAsReadonly();


      // update the sort by args
      if (data.sortBy) {
        filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
      }

      // update pagination args
      if (data.pageIndex || data.pageSize) {
        pagination = new KalturaFilterPager(
          {
            pageSize: data.pageSize,
            pageIndex: data.pageIndex + 1
          }
        );
      }

      // remove advanced search arg if it is empty
      if (advancedSearch.items && advancedSearch.items.length === 0) {
        delete filter.advancedSearch;
      }

      // build the request
      return this._kalturaClient.request(
        new SyndicationFeedListAction({
          filter,
          pager: pagination
        })
      ).pipe(map((response: KalturaBaseSyndicationFeedListResponse) => {
        const feedsArray: KalturaBaseSyndicationFeed[] = [];
        response.objects.forEach(feed => {
          if (feed instanceof KalturaBaseSyndicationFeed) {
            if (feed instanceof KalturaGenericSyndicationFeed && !(feed instanceof KalturaGenericXsltSyndicationFeed)) {
              this._logger.warn(
                `feed was removed from list since it's a generic syndication feed with XSLT type which is not generic.`, { id: feed.id });
              return undefined; // stop processing this iteration if it's a generic syndication feed with XSLT type which is not generic
            } else {
              feedsArray.push(feed);
            }
          }
        });
        return {items: feedsArray, totalCount: response.totalCount};
      }))
      .pipe(oFilter(Boolean));
    } catch (err) {
      return throwError(err);
    }

  }

  public getPlaylists(freeText = ''): Observable<KalturaPlaylist[]> {
    const filter = new KalturaPlaylistFilter({orderBy: KalturaPlaylistOrderBy.createdAtDesc.toString(), freeText: freeText || ''});
    const pager = new KalturaFilterPager({pageSize: 500});

    return this._kalturaClient.request(
      new PlaylistListAction({filter, pager})
    )
      .pipe(map((response: KalturaPlaylistListResponse) => {
        return response.objects.filter( (playlist: KalturaPlaylist) => playlist.playlistType !== KalturaPlaylistType.path && (!playlist.adminTags || (playlist.adminTags && playlist.adminTags.split(',').indexOf('raptentry') === -1)));
      }));

  }
  public getPlaylist(id: string): Observable<KalturaPlaylist> {
    return this._kalturaClient.request(
      new PlaylistGetAction({id})
    );
  }

  // bulk delete
  public deleteFeeds(ids: string[]): Observable<void> {
    if (!ids || !ids.length) {
      return throwError(new Error('An error occurred while trying to delete feeds, please review your selection'));
    }

    return Observable.create(observer => {

      const requests: SyndicationFeedDeleteAction[] = [];

      ids.forEach(id => {
        requests.push(new SyndicationFeedDeleteAction({id}));
      });

      this._transmit(requests, true)
          .subscribe(
        result => {
          observer.next({});
          observer.complete();
        },
        error => {
          observer.error(error);
        }
      );
    })
      .pipe(tap(result => {
        this.reload();
      }));
  }

  private _transmit(requests: KalturaRequest<any>[], chunk: boolean): Observable<{}> {
    let maxRequestsPerMultiRequest = requests.length;
    if (chunk) {
      maxRequestsPerMultiRequest = subApplicationsConfig.shared.bulkActionsLimit;
    }

    const multiRequests: Observable<KalturaMultiResponse>[] = [];
    let mr: KalturaMultiRequest = new KalturaMultiRequest();

    let counter = 0;
    for (let i = 0; i < requests.length; i++) {
      if (counter === maxRequestsPerMultiRequest) {
        multiRequests.push(this._kalturaClient.multiRequest(mr));
        mr = new KalturaMultiRequest();
        counter = 0;
      }
      mr.requests.push(requests[i]);
      counter++;
    }
    multiRequests.push(this._kalturaClient.multiRequest(mr));

    return forkJoin(multiRequests)
      .pipe(map(responses => {
        const mergedResponses = [].concat.apply([], responses);
        const hasFailure = !!mergedResponses.find(function (response) {
          return response.error
        });
        if (hasFailure) {
          throw new Error('An error occurred while trying to delete feeds');
        } else {
          return {};
        }
      }));
  }


  protected _preFilter(updates: Partial<FeedsFilters>): Partial<FeedsFilters> {
    if (typeof updates.pageIndex === 'undefined') {
      // reset page index to first page everytime filtering the list by any filter that is not page index
      updates.pageIndex = 0;
    }

    if (typeof updates.pageSize !== 'undefined') {
      this._browserService.setInLocalStorage(this._pageSizeCacheKey, updates.pageSize);
    }

    return updates;
  }

  protected _createDefaultFiltersValue(): FeedsFilters {
    const defaultPageSize = this._browserService.getFromLocalStorage(this._pageSizeCacheKey);

    return {
      pageSize: defaultPageSize || globalConfig.client.views.tables.defaultPageSize,
      pageIndex: 0,
      sortBy: 'createdAt',
      sortDirection: SortDirection.Desc
    };
  }

  protected _getTypeAdaptersMapping(): TypeAdaptersMapping<FeedsFilters> {
    return {
      pageSize: new NumberTypeAdapter(),
      pageIndex: new NumberTypeAdapter(),
      sortBy: new StringTypeAdapter(),
      sortDirection: new NumberTypeAdapter()
    };
  }

  public confirmDelete(feeds: KalturaBaseSyndicationFeed[]): Observable<{ confirmed: boolean, error?: Error }> {

    if (!feeds || !feeds.length) {
      return throwError(new Error(this._appLocalization.get('applications.content.syndication.errors.deleteAttemptFailed')))
    }

    return Observable.create(observer => {

        this._logger.info(`confirm delete action`, { feeds: feeds.map(feed => feed.id) });

      const message: string = feeds.length < 5 ?
        (feeds.length === 1 ? this._appLocalization.get('applications.content.syndication.deleteConfirmation.singleFeed',
          {0: feeds[0].name}) :
          this._appLocalization.get('applications.content.syndication.deleteConfirmation.upTo5Feed',
            {0: feeds.map((feed, i) => `${i + 1}: ${feed.name}`).join('\n')})) :
        this._appLocalization.get('applications.content.syndication.deleteConfirmation.moreThan5');

      this._browserService.confirm({
          header: this._appLocalization.get('applications.content.syndication.deleteConfirmation.title'),
          message: this._appLocalization.get(message),
          accept: () => {
            observer.next({failed: false, confirmed: true});
            observer.complete();
          }, reject: () => {
            observer.next({failed: false, confirmed: false});
            observer.complete();
          }
        }
      );
      return () => {
      };
    });
  }

  public getFeedEntryCount(feedId: string): Observable<KalturaSyndicationFeedEntryCount> {
    if (!feedId) {
      return throwError(new Error(this._appLocalization.get('applications.content.syndication.errors.getFeedEntryCount')))
    }

    return this._kalturaClient.request(
      new SyndicationFeedGetEntryCountAction({feedId})
    );
  }

  public update(id: string, syndicationFeed: KalturaBaseSyndicationFeed): Observable<void> {
    return this._kalturaClient.request(
      new SyndicationFeedUpdateAction({id, syndicationFeed})
    )
      .pipe(map(() => undefined));
  }

  public create(syndicationFeed: KalturaBaseSyndicationFeed): Observable<KalturaBaseSyndicationFeed> {
    if (syndicationFeed.id) {
      return throwError(new Error('An error occurred while trying to Add Feed. \n Unable to add feed that already exists.'));
    }
    return this._kalturaClient.request(
      new SyndicationFeedAddAction({syndicationFeed})
    );
  }
}
