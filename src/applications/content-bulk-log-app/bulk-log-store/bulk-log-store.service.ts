import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ISubscription } from 'rxjs/Subscription';
import { KalturaClient, KalturaMultiResponse } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client/api/types/KalturaDetachedResponseProfile';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { KalturaBulkUploadFilter } from 'kaltura-ngx-client/api/types/KalturaBulkUploadFilter';
import { KalturaBulkUpload } from 'kaltura-ngx-client/api/types/KalturaBulkUpload';
import { BulkUploadAbortAction } from 'kaltura-ngx-client/api/types/BulkUploadAbortAction';
import { BulkListAction } from 'kaltura-ngx-client/api/types/BulkListAction';
import { KalturaResponseProfileType } from 'kaltura-ngx-client/api/types/KalturaResponseProfileType';
import {
  DatesRangeAdapter, DatesRangeType, FiltersStoreBase, ListAdapter, ListType, NumberTypeAdapter,
  TypeAdaptersMapping
} from '@kaltura-ng/mc-shared/filters';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaSearchOperator } from 'kaltura-ngx-client/api/types/KalturaSearchOperator';
import { KalturaSearchOperatorType } from 'kaltura-ngx-client/api/types/KalturaSearchOperatorType';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import { BulkUploadService } from 'app-shared/kmc-shell/bulk-upload/bulk-upload.service';
import { KalturaBulkUploadListResponse } from 'kaltura-ngx-client/api/types/KalturaBulkUploadListResponse';

const localStoragePageSizeKey = 'bulklog.list.pageSize';

export interface BulkLogFilters {
    pageSize: number,
    pageIndex: number,
    createdAt: DatesRangeType,
    uploadedItem: ListType,
    status: ListType
}

@Injectable()
export class BulkLogStoreService extends FiltersStoreBase<BulkLogFilters> implements OnDestroy {
  private _bulkLog = {
    data: new BehaviorSubject<{ items: KalturaBulkUpload[], totalCount: number }>({ items: [], totalCount: 0 }),
    state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({ loading: false, errorMessage: null })
  };

  private _isReady = false;
  private _querySubscription: ISubscription;

  public readonly bulkLog =
    {
      data$: this._bulkLog.data.asObservable(),
      state$: this._bulkLog.state.asObservable(),
      data: () => {
        return this._bulkLog.data.getValue().items;
      }
    };


  constructor(private _kalturaServerClient: KalturaClient,
              private _browserService: BrowserService,
              private _bulkUploadService: BulkUploadService,
              _logger: KalturaLogger) {
    super(_logger);
    this._prepare();
  }

  ngOnDestroy() {
    this._bulkLog.data.complete();
    this._bulkLog.state.complete();
  }

  private _prepare(): void {
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

    protected _preFilter(updates: Partial<BulkLogFilters>): Partial<BulkLogFilters> {
        if (typeof updates.pageIndex === 'undefined') {
            // reset page index to first page everytime filtering the list by any filter that is not page index
            updates.pageIndex = 0;
        }

        return updates;
    }

  private _registerToFilterStoreDataChanges(): void {
    this.filtersChange$
      .cancelOnDestroy(this)
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

    this._bulkLog.state.next({ loading: true, errorMessage: null });
    this._querySubscription = this._buildQueryRequest()
      .cancelOnDestroy(this)
      .map(response => {
        const { objects, totalCount } = response;
        const updatedNewBulkUploads = this._bulkUploadService.getNewBulkUploads(objects);

        return {
          objects: [...updatedNewBulkUploads, ...objects],
          totalCount
        }
      })
      .subscribe(
        response => {
          this._querySubscription = null;

          this._bulkLog.state.next({ loading: false, errorMessage: null });

          this._bulkLog.data.next({
            items: <any[]>response.objects,
            totalCount: <number>response.totalCount
          });
        },
        error => {
          this._querySubscription = null;
          const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
          this._bulkLog.state.next({ loading: false, errorMessage });
        });


  }

  private _buildQueryRequest(): Observable<KalturaBulkUploadListResponse> {
    try {

      // create request items
      const filter = new KalturaBulkUploadFilter({});
      let responseProfile: KalturaDetachedResponseProfile = null;
      let pagination: KalturaFilterPager = null;

      const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
      advancedSearch.type = KalturaSearchOperatorType.searchAnd;

      const data: BulkLogFilters = this._getFiltersAsReadonly();

      // filter 'createdAt'
      if (data.createdAt) {
        if (data.createdAt.fromDate) {
          filter.uploadedOnGreaterThanOrEqual = KalturaUtils.getStartDateValue(data.createdAt.fromDate);
        }

        if (data.createdAt.toDate) {
          filter.uploadedOnLessThanOrEqual = KalturaUtils.getEndDateValue(data.createdAt.toDate);
        }
      }

      // filters of joined list
      this._updateFilterWithJoinedList(data.uploadedItem, filter, 'bulkUploadObjectTypeIn');
      this._updateFilterWithJoinedList(data.status, filter, 'statusIn');

      // handle default value for media types
      if (!filter.bulkUploadObjectTypeIn) {
        filter.bulkUploadObjectTypeIn = '1,2,3,4';
      }

      // handle default value for statuses
      if (!filter.statusIn) {
        filter.statusIn = '0,1,2,3,4,5,6,7,8,9,10,11,12';
      }

      responseProfile = new KalturaDetachedResponseProfile({
        type: KalturaResponseProfileType.includeFields,
        fields: 'id,fileName,bulkUploadType,bulkUploadObjectType,uploadedBy,uploadedByUserId,uploadedOn,numOfObjects,status,error'
      });

      // update pagination args
      if (data.pageIndex || data.pageSize) {
        pagination = new KalturaFilterPager(
          {
            pageSize: data.pageSize,
            pageIndex: data.pageIndex + 1
          }
        );
      }

      // build the request
      return <any>this._kalturaServerClient.request(
        new BulkListAction({
          bulkUploadFilter: filter,
          pager: pagination,
          responseProfile: responseProfile
        })
      );
    } catch (err) {
      return Observable.throw(err);
    }

  }

  private _updateFilterWithJoinedList(list: ListType, requestFilter: KalturaBulkUploadFilter, requestFilterProperty: keyof KalturaBulkUploadFilter): void {
    const value = (list || []).map(item => item.value).join(',');

    if (value) {
      requestFilter[requestFilterProperty] = value;
    }
  }

  protected _createDefaultFiltersValue(): BulkLogFilters {
    return {
      pageSize: 50,
      pageIndex: 0,
      createdAt: { fromDate: null, toDate: null },
        uploadedItem: [],
      status: []
    };
  }

  protected _getTypeAdaptersMapping(): TypeAdaptersMapping<BulkLogFilters> {
    return {
      pageSize: new NumberTypeAdapter(),
      pageIndex: new NumberTypeAdapter(),
      createdAt: new DatesRangeAdapter(),
        uploadedItem: new ListAdapter(),
      status: new ListAdapter()
    };
  }

  public reload(): void {
    if (this._bulkLog.state.getValue().loading) {
      return;
    }

    if (this._isReady) {
      this._executeQuery();
    } else {
      this._prepare();
    }
  }

  public deleteBulkLog(id: number): Observable<KalturaBulkUpload> {
    return this._kalturaServerClient.request(new BulkUploadAbortAction({ id }));
  }

  public deleteBulkLogs(files: Array<KalturaBulkUpload>): Observable<KalturaMultiResponse> {
    return this._kalturaServerClient.multiRequest(files.map(({ id }) => new BulkUploadAbortAction({ id })));
  }
}

