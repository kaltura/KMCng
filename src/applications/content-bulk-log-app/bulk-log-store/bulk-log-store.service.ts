import { Injectable, OnDestroy } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { KalturaClient, KalturaMultiResponse } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { KalturaBulkUploadFilter } from 'kaltura-ngx-client';
import { KalturaBulkUpload } from 'kaltura-ngx-client';
import { BulkUploadAbortAction } from 'kaltura-ngx-client';
import { BulkListAction } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';
import { DatesRangeAdapter, DatesRangeType } from '@kaltura-ng/mc-shared';
import { ListTypeAdapter } from '@kaltura-ng/mc-shared';
import { FiltersStoreBase, TypeAdaptersMapping } from '@kaltura-ng/mc-shared';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaSearchOperator } from 'kaltura-ngx-client';
import { KalturaSearchOperatorType } from 'kaltura-ngx-client';
import { KalturaBaseEntryListResponse } from 'kaltura-ngx-client';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import { NumberTypeAdapter } from '@kaltura-ng/mc-shared';
import { ContentBulkUploadsMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { throwError } from 'rxjs';

const localStoragePageSizeKey = 'bulklog.list.pageSize';

export interface BulkLogFilters {
    pageSize: number,
    pageIndex: number,
    createdAt: DatesRangeType,
    uploadedItem: string[],
    status: string[]
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
              contentBulkUploadsMainView: ContentBulkUploadsMainViewService,
              _logger: KalturaLogger) {
    super(_logger.subLogger('BulkLogStoreService'));
    if (contentBulkUploadsMainView.isAvailable()) {
        this._prepare();
    }
  }

  ngOnDestroy() {
    this._bulkLog.data.complete();
    this._bulkLog.state.complete();
  }

  private _prepare(): void {

      // NOTICE: do not execute here any logic that should run only once.
      // this function will re-run if preparation failed. execute your logic
      // only after the line where we set isReady to true

    if (!this._isReady) {
      this._logger.info(`initiate service`);
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

    this._logger.info(`handle loading of bulk-log data`);
    this._bulkLog.state.next({ loading: true, errorMessage: null });
    this._querySubscription = this._buildQueryRequest()
      .pipe(cancelOnDestroy(this))
      .subscribe(
        response => {
          this._logger.info(`handle successful loading of bulk-log data`);
          this._querySubscription = null;

          this._bulkLog.state.next({ loading: false, errorMessage: null });

          this._bulkLog.data.next({
            items: <any[]>response.objects,
            totalCount: <number>response.totalCount
          });
        },
        error => {
          this._logger.warn(`handle failed loading of bulk-log data, show alert`, { errorMessage: error.message });
          this._querySubscription = null;
          const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
          this._bulkLog.state.next({ loading: false, errorMessage });
        });


  }

  private _buildQueryRequest(): Observable<KalturaBaseEntryListResponse> {
    try {

      // create request items
      const filter = new KalturaBulkUploadFilter({});
      let responseProfile: KalturaDetachedResponseProfile = null;
      let pagination: KalturaFilterPager = null;

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

      // filter bulkUploadObjectTypeIn
      filter.bulkUploadObjectTypeIn = '1,2,3,4';

      // filters of joined list
      this._updateFilterWithJoinedList(data.uploadedItem, filter, 'bulkUploadObjectTypeIn');
      this._updateFilterWithJoinedList(data.status, filter, 'statusIn');

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
        }).setRequestOptions({
            responseProfile
        })
      );
    } catch (err) {
      return throwError(err);
    }

  }

  private _updateFilterWithJoinedList(list: string[], requestFilter: KalturaBulkUploadFilter, requestFilterProperty: keyof KalturaBulkUploadFilter): void {
    const value = (list || []).map(item => item).join(',');

    if (value) {
      requestFilter[requestFilterProperty.toString()] = value;
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
        uploadedItem: new ListTypeAdapter<string>(),
      status: new ListTypeAdapter<string>()
    };
  }

  public reload(): void {
    this._logger.info(`reload bulk-log list data`);
    if (this._bulkLog.state.getValue().loading) {
      this._logger.info(`reloading in progress, skip duplicating request`);
      return;
    }

    if (this._isReady) {
      this._executeQuery();
    } else {
      this._prepare();
    }
  }

  public deleteBulkLog(id: number): Observable<KalturaBulkUpload> {
    return this._kalturaServerClient
      .request(new BulkUploadAbortAction({ id }));
  }

  public deleteBulkLogs(files: Array<KalturaBulkUpload>): Observable<KalturaMultiResponse> {
    return this._kalturaServerClient.multiRequest(files.map(({ id }) => new BulkUploadAbortAction({ id })));
  }
}

