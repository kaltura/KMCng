import { Injectable, OnDestroy } from '@angular/core';
import {BehaviorSubject, EMPTY} from 'rxjs';
import { BrowserService } from 'shared/kmc-shell';
import { Observable, forkJoin } from 'rxjs';
import {
    BaseEntryGetAction,
    DropFolderFileDeleteAction,
    DropFolderFileListAction,
    DropFolderListAction,
    KalturaClient,
    KalturaDropFolder,
    KalturaDropFolderContentFileHandlerConfig,
    KalturaDropFolderContentFileHandlerMatchPolicy,
    KalturaDropFolderFile,
    KalturaDropFolderFileFilter,
    KalturaDropFolderFileHandlerType,
    KalturaDropFolderFileListResponse,
    KalturaDropFolderFileStatus,
    KalturaDropFolderFilter,
    KalturaDropFolderOrderBy,
    KalturaDropFolderStatus,
    KalturaFilterPager
} from 'kaltura-ngx-client';
import { cancelOnDestroy, KalturaUtils } from '@kaltura-ng/kaltura-common';
import {
    AppLocalization,
    DatesRangeAdapter,
    DatesRangeType,
    FiltersStoreBase,
    GroupedListAdapter,
    GroupedListType,
    ListTypeAdapter,
    NumberTypeAdapter,
    StringTypeAdapter,
    TypeAdaptersMapping
} from '@kaltura-ng/mc-shared';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { ISubscription } from 'rxjs/Subscription';
import { subApplicationsConfig } from 'config/sub-applications';
import { serverConfig } from 'config/server';
import { ContentDropFoldersMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { globalConfig } from 'config/global';
import { of } from 'rxjs';
import { switchMap, map, publishReplay, refCount } from 'rxjs/operators';

const localStoragePageSizeKey = 'dropFolders.list.pageSize';

export enum SortDirection {
  Desc = -1,
  Asc = 1
}

export interface DropFoldersFilters {
    pageSize: number;
    pageIndex: number;
    freeText: string;
    createdAt: DatesRangeType;
    status: string[];
    sortBy: string;
    sortDirection: number;
    dropFoldersNames: GroupedListType<string>;
}

@Injectable()
export class DropFoldersStoreService extends FiltersStoreBase<DropFoldersFilters> implements OnDestroy {
  private _dropFolders = {
    data: new BehaviorSubject<{ items: KalturaDropFolderFile[], totalCount: number }>({
      items: [],
      totalCount: 0
    }),
    state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({ loading: false, errorMessage: null })
  };
  private _allStatusesList = [
    KalturaDropFolderFileStatus.downloading,
    KalturaDropFolderFileStatus.errorDeleting,
    KalturaDropFolderFileStatus.errorDownloading,
    KalturaDropFolderFileStatus.errorHandling,
    KalturaDropFolderFileStatus.handled,
    KalturaDropFolderFileStatus.noMatch,
    KalturaDropFolderFileStatus.pending,
    KalturaDropFolderFileStatus.processing,
    KalturaDropFolderFileStatus.parsed,
    KalturaDropFolderFileStatus.uploading,
    KalturaDropFolderFileStatus.detected,
    KalturaDropFolderFileStatus.waiting
  ].join(',');
  private _isReady = false;
  private _querySubscription: ISubscription;
  private _dropFoldersList$;

  public readonly dropFolders = { data$: this._dropFolders.data.asObservable(), state$: this._dropFolders.state.asObservable() };

  constructor(private _kalturaServerClient: KalturaClient,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization,
              contentDropFoldersMainView: ContentDropFoldersMainViewService,
              _logger: KalturaLogger) {
    super(_logger);
    if (contentDropFoldersMainView.isAvailable()) {
        this._prepare();
    }
  }

  ngOnDestroy() {
    this._dropFolders.state.complete();
    this._dropFolders.data.complete();
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

  protected _preFilter(updates: Partial<DropFoldersFilters>): Partial<DropFoldersFilters> {
    if (typeof updates.pageIndex === 'undefined') {
      // reset page index to first page everytime filtering the list by any filter that is not page index
      updates.pageIndex = 0;
    }

    return updates;
  }

  private _registerToFilterStoreDataChanges(): void {
    this.filtersChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(() => {
        this._executeQuery(false);
      });
  }

  private _executeQuery(reloadFolders: boolean = true): void {

    if (this._querySubscription) {
      this._querySubscription.unsubscribe();
      this._querySubscription = null;
    }

    const pageSize = this.cloneFilter('pageSize', null);
    if (pageSize) {
      this._browserService.setInLocalStorage(localStoragePageSizeKey, pageSize);
    }

    this._dropFolders.state.next({ loading: true, errorMessage: null });
    this._querySubscription = this._buildQueryRequest(reloadFolders)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        response => {
          this._querySubscription = null;
          this._dropFolders.state.next({ loading: false, errorMessage: null });
          this._dropFolders.data.next({
            items: <any[]>response.objects,
            totalCount: <number>response.totalCount
          });
        },
        error => {
          this._querySubscription = null;
          const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
          this._dropFolders.state.next({ loading: false, errorMessage });
        });


  }

  private _buildQueryRequest(reloadFolders: boolean): Observable<any> {
    return this.loadDropFoldersList(reloadFolders)
      .pipe(switchMap(({ dropFoldersList, error }) => {
        if (!dropFoldersList.length || error) {
          this._browserService.alert({
              header: this._appLocalization.get('app.common.attention'),
            message: error || this._appLocalization.get(
                'applications.content.dropFolders.errors.dropFoldersAlert',
                [serverConfig.externalLinks.kaltura.contactUs, serverConfig.externalLinks.kaltura.dropFoldersManual]
            )
          });

          return of({
            objects: [],
            totalCount: 0
          });
        }

        // create request items
        const filter = new KalturaDropFolderFileFilter({});
        let pager: KalturaFilterPager = null;

        const data: DropFoldersFilters = this._getFiltersAsReadonly();

        // use selected folders - list of folders ids separated by comma
        filter.dropFolderIdIn = dropFoldersList.reduce((ids, kdf) => `${ids}${kdf.id},`, '');

        // filter 'freeText'
        if (data.freeText) {
          filter.fileNameLike = data.freeText;
        }

        // update the sort by args
        if (data.sortBy) {
          filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
        }

        // filter 'createdAt'
        if (data.createdAt) {
          if (data.createdAt.fromDate) {
            filter.createdAtGreaterThanOrEqual = KalturaUtils.getStartDateValue(data.createdAt.fromDate);
          }

          if (data.createdAt.toDate) {
            filter.createdAtLessThanOrEqual = KalturaUtils.getEndDateValue(data.createdAt.toDate);
          }
        }

        // filters of joined list
        this._updateFilterWithJoinedList(data.status, filter, 'statusIn');

        // handle default value for statuses
        if (!filter.statusIn) {
          filter.statusIn = this._allStatusesList;
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

        if (data.dropFoldersNames && data.dropFoldersNames['dropFolders'] && data.dropFoldersNames['dropFolders'].length) {
            filter.dropFolderIdIn = data.dropFoldersNames['dropFolders'].join(',');
        }

        // build the request
        return <any>this._kalturaServerClient
          .request(new DropFolderFileListAction({ filter, pager }))
          .pipe(map(response => {
            response.objects.forEach(object => {
              dropFoldersList.forEach(folder => {
                if (object.dropFolderId === folder.id) {
                  object.dropFolderId = <any>folder.name;
                }
              });
            });

            return response;
          }));
      }));

  }

  private _updateFilterWithJoinedList(list: string[], requestFilter: KalturaDropFolderFileFilter, requestFilterProperty: keyof KalturaDropFolderFileFilter): void {
    const value = (list || []).map(item => item).join(',');

    if (value) {
      requestFilter[requestFilterProperty.toString()] = value;
    }
  }

  public loadDropFoldersList(reloadFolders: boolean): Observable<{ dropFoldersList: KalturaDropFolder[], error?: string }> {
    if (!reloadFolders && this._dropFoldersList$) {
      return this._dropFoldersList$;
    }

    this._dropFolders.state.next({ loading: true, errorMessage: null });

    this._dropFoldersList$ = this._kalturaServerClient
      .request(new DropFolderListAction({
        pager: new KalturaFilterPager({ pageSize: globalConfig.client.views.dropFolders.maxItems }),
        filter: new KalturaDropFolderFilter({
          orderBy: KalturaDropFolderOrderBy.createdAtDesc.toString(),
          statusEqual: KalturaDropFolderStatus.enabled
        })
      }).setRequestOptions({
          acceptedTypes: [KalturaDropFolder, KalturaDropFolderContentFileHandlerConfig]
      }))
      .pipe(map(response => {
        this._dropFolders.state.next({ loading: false, errorMessage: null });
        if (response.objects.length) {
          let df: KalturaDropFolder;

          const dropFoldersList = [];
          response.objects.forEach(object => {
            if (object instanceof KalturaDropFolder) {
              df = object;
              if (df.fileHandlerType === KalturaDropFolderFileHandlerType.content) {
                const cfg: KalturaDropFolderContentFileHandlerConfig = df.fileHandlerConfig as KalturaDropFolderContentFileHandlerConfig;
                if (cfg.contentMatchPolicy === KalturaDropFolderContentFileHandlerMatchPolicy.addAsNew) {
                  dropFoldersList.push(df);
                } else if (cfg.contentMatchPolicy === KalturaDropFolderContentFileHandlerMatchPolicy.matchExistingOrKeepInFolder) {
                  dropFoldersList.push(df);
                } else if (cfg.contentMatchPolicy === KalturaDropFolderContentFileHandlerMatchPolicy.matchExistingOrAddAsNew) {
                  dropFoldersList.push(df);
                }
              } else if (df.fileHandlerType === KalturaDropFolderFileHandlerType.xml) {
                dropFoldersList.push(df);
              }
            } else {
              throw new Error(`invalid type provided, expected KalturaDropFolder, got ${typeof object}`);
            }
          });

          return { dropFoldersList, error: null };
        } else {
          return {
              dropFoldersList: [],
              error: this._appLocalization.get(
                  'applications.content.dropFolders.errors.dropFoldersAlert',
                  [serverConfig.externalLinks.kaltura.contactUs, serverConfig.externalLinks.kaltura.dropFoldersManual]
              )
          };
        }
      }))
      .pipe(publishReplay(1))
      .pipe(refCount());

    return this._dropFoldersList$;
  }

  public isEntryExist(entryId: string): Observable<boolean> {
    return this._kalturaServerClient.request(new BaseEntryGetAction({ entryId }))
      .pipe(map(Boolean));
  }

  protected _createDefaultFiltersValue(): DropFoldersFilters {
    return {
      pageSize: 50,
      pageIndex: 0,
      freeText: '',
      createdAt: { fromDate: null, toDate: null },
      status: [],
      sortBy: 'createdAt',
      sortDirection: SortDirection.Desc,
      dropFoldersNames: {},
    };
  }

  protected _getTypeAdaptersMapping(): TypeAdaptersMapping<DropFoldersFilters> {
    return {
      pageSize: new NumberTypeAdapter(),
      pageIndex: new NumberTypeAdapter(),
      freeText: new StringTypeAdapter(),
      createdAt: new DatesRangeAdapter(),
      status: new ListTypeAdapter<string>(),
      sortBy: new StringTypeAdapter(),
      sortDirection: new NumberTypeAdapter(),
      dropFoldersNames: new GroupedListAdapter<string>(),
    };
  }

  public reload(): void {
    if (this._dropFolders.state.getValue().loading) {
      return;
    }

    if (this._isReady) {
      this._executeQuery();
    } else {
      this._prepare();
    }
  }

  public deleteDropFiles(ids: number[]): Observable<{}> {
    if (!ids || !ids.length) {
      return EMPTY;
    }

    const requests = ids.map(id => new DropFolderFileDeleteAction({ dropFolderFileId: id }));

    const maxRequestsPerMultiRequest = subApplicationsConfig.shared.bulkActionsLimit;

    // split request on chunks => [[], [], ...], each of inner arrays has length of maxRequestsPerMultiRequest
    const splittedRequests = [];
    let start = 0;
    while (start < requests.length) {
      const end = start + maxRequestsPerMultiRequest;
      splittedRequests.push(requests.slice(start, end));
      start = end;
    }
    const multiRequests = splittedRequests
      .map(reqChunk => this._kalturaServerClient.multiRequest(reqChunk));

    return forkJoin(multiRequests)
      .pipe(map(responses => {
        const errorMessage = [].concat.apply([], responses)
          .filter(response => !!response.error)
          .reduce((acc, { error }) => `${acc}\n${error.message}`, '')
          .trim();

        if (!!errorMessage) {
          throw new Error(errorMessage);
        } else {
          return {};
        }
      }));
  }
}

