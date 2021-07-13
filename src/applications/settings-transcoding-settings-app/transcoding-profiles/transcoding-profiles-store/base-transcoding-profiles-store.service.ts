import {Directive, OnDestroy} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, forkJoin } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { KalturaClient, KalturaMultiRequest, KalturaRequest } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { BrowserService } from 'shared/kmc-shell/providers/browser.service';
import { KalturaConversionProfileType } from 'kaltura-ngx-client';
import { KalturaConversionProfileFilter } from 'kaltura-ngx-client';
import { KalturaConversionProfileOrderBy } from 'kaltura-ngx-client';
import { ConversionProfileListAction } from 'kaltura-ngx-client';
import { ConversionProfileAssetParamsListAction } from 'kaltura-ngx-client';
import { KalturaConversionProfileAssetParamsFilter } from 'kaltura-ngx-client';
import { KalturaConversionProfileAssetParams } from 'kaltura-ngx-client';
import { KalturaConversionProfile } from 'kaltura-ngx-client';
import { ConversionProfileSetAsDefaultAction } from 'kaltura-ngx-client';
import { subApplicationsConfig } from 'config/sub-applications';
import { ConversionProfileDeleteAction } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { FiltersStoreBase, TypeAdaptersMapping } from '@kaltura-ng/mc-shared';
import { NumberTypeAdapter } from '@kaltura-ng/mc-shared';
import { SettingsTranscodingMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { globalConfig } from 'config/global';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ExtendedKalturaConversionProfileAssetParams extends KalturaConversionProfileAssetParams {
  updated?: boolean;
}

export interface KalturaConversionProfileWithAsset extends KalturaConversionProfile {
  assets?: ExtendedKalturaConversionProfileAssetParams[];
  flavors?: number; // number of flavors in flavorParamsIds
}

export interface TranscodingProfilesFilters {
  pageSize: number;
  pageIndex: number;
}

@Directive()
export abstract class BaseTranscodingProfilesStore extends FiltersStoreBase<TranscodingProfilesFilters> implements OnDestroy {
  private _profiles = {
    data: new BehaviorSubject<{ items: KalturaConversionProfileWithAsset[], totalCount: number }>({ items: [], totalCount: 0 }),
    state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({ loading: false, errorMessage: null })
  };
  private _isReady = false;
  private _querySubscription: ISubscription;

  protected abstract localStoragePageSizeKey: string;
  protected abstract transcodingProfilesListType: KalturaConversionProfileType;

  public readonly profiles = {
    data$: this._profiles.data.asObservable(),
    state$: this._profiles.state.asObservable(),
    data: () => this._profiles.data.value
  };

  protected constructor(private _kalturaServerClient: KalturaClient,
                        private _browserService: BrowserService,
                        settingsTranscodingMainView: SettingsTranscodingMainViewService,
                        _logger: KalturaLogger) {
    super(_logger);
    if (settingsTranscodingMainView.isAvailable()) {
        setTimeout(() => {
            this._prepare();
        });
    }
  }

  ngOnDestroy() {
    this._profiles.data.complete();
    this._profiles.state.complete();
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
      this._browserService.setInLocalStorage(this.localStoragePageSizeKey, pageSize);
    }

    this._logger.info(`loading data from the server`);
    this._profiles.state.next({ loading: true, errorMessage: null });
    this._querySubscription = this._buildQueryRequest()
      .pipe(cancelOnDestroy(this))
      .subscribe(
        response => {
          this._logger.info(`handle success loading data from the server`);
          this._querySubscription = null;

          this._profiles.state.next({ loading: false, errorMessage: null });

          this._profiles.data.next({
            items: response.objects,
            totalCount: response.totalCount
          });
        },
        error => {
          this._querySubscription = null;
          const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
          this._logger.warn(`handle failed loading data from the server`, { errorMessage });
          this._profiles.state.next({ loading: false, errorMessage });
        });
  }

  private _buildQueryRequest(): Observable<{ objects: KalturaConversionProfileWithAsset[], totalCount: number }> {
    try {
      // create request items
      const filter = new KalturaConversionProfileFilter({
        orderBy: KalturaConversionProfileOrderBy.createdAtDesc.toString(),
        typeEqual: this.transcodingProfilesListType
      });
      let pager: KalturaFilterPager = null;

      const data: TranscodingProfilesFilters = this._getFiltersAsReadonly();

      // update pagination args
      if (data.pageIndex || data.pageSize) {
        pager = new KalturaFilterPager(
          {
            pageSize: data.pageSize,
            pageIndex: data.pageIndex + 1
          }
        );
      }

      const conversionProfileAction = new ConversionProfileListAction({ filter, pager });
      const conversionProfileAssetParamsAction = new ConversionProfileAssetParamsListAction({
        filter: new KalturaConversionProfileAssetParamsFilter({ conversionProfileIdFilter: filter }),
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

          const profiles = profilesResponse.result.objects;
          const assets = assetsResponse.result.objects;
          const totalCount = profilesResponse.result.totalCount;

          const objects = profiles.map(profile => {
            const relevantAssets = assets.filter(({ conversionProfileId }) => conversionProfileId === profile.id);
            const flavorsCount = profile.flavorParamsIds ? (profile.flavorParamsIds || '').split(',').length : 0;
            return Object.assign(profile, { assets: relevantAssets, flavors: flavorsCount });
          });

          // put default profile on top of the table if there's default profile in the response
          const defaultProfileIndex = objects.findIndex(profile => profile.isDefault);
          if (defaultProfileIndex !== -1) {
            const defaultProfile = objects.splice(defaultProfileIndex, 1);
            objects.unshift(...defaultProfile);
          }

          return { objects, totalCount };
        }));
    } catch (err) {
      return throwError(err);
    }
  }

  private _transmitChunkRequest(requests: KalturaRequest<any>[]): Observable<void> {
    const maxRequestsPerMultiRequest = subApplicationsConfig.shared.bulkActionsLimit || requests.length;

    // split request on chunks => [[], [], ...], each of inner arrays has length of maxRequestsPerMultiRequest
    const splitRequests = [];
    let start = 0;
    while (start < requests.length) {
      const end = start + maxRequestsPerMultiRequest;
      splitRequests.push(requests.slice(start, end));
      start = end;
    }
    const multiRequests = splitRequests
      .map(reqChunk => this._kalturaServerClient.multiRequest(reqChunk));

    return forkJoin(multiRequests)
      .pipe(map(responses => {
        const errorMessage = [].concat.apply([], responses)
          .filter(response => !!response.error)
          .reduce((acc, { error }) => `${acc}\n${error.message}`, '')
          .trim();

        if (!!errorMessage) {
          throw new Error(errorMessage);
        }
      }));
  }

  private _prepare(): void {
    // NOTICE: do not execute here any logic that should run only once.
    // this function will re-run if preparation failed. execute your logic
    // only after the line where we set isReady to true

    if (!this._isReady) {
      this._logger.info(`initiate service`);
      this._isReady = true;

      this._registerToFilterStoreDataChanges();
      this._executeQuery();
    }
  }

  protected _preFilter(updates: Partial<TranscodingProfilesFilters>): Partial<TranscodingProfilesFilters> {
    if (typeof updates.pageIndex === 'undefined') {
      // reset page index to first page everytime filtering the list by any filter that is not page index
      updates.pageIndex = 0;
    }

    return updates;
  }

  protected _createDefaultFiltersValue(): TranscodingProfilesFilters {
    const pageSize = this._browserService.getFromLocalStorage(this.localStoragePageSizeKey) || globalConfig.client.views.tables.defaultPageSize;
    return {
      pageSize: pageSize,
      pageIndex: 0,
    };
  }

  protected _getTypeAdaptersMapping(): TypeAdaptersMapping<TranscodingProfilesFilters> {
    return {
      pageSize: new NumberTypeAdapter(),
      pageIndex: new NumberTypeAdapter(),
    };
  }

  public reload(): void {
    this._logger.info(`reload profiles list`);
    if (this._profiles.state.getValue().loading) {
      this._logger.info(`reloading already in progress skip duplicating request`);
      return;
    }

    if (this._isReady) {
      this._executeQuery();
    } else {
      this._prepare();
    }
  }

  public setAsDefault(profile: KalturaConversionProfileWithAsset): Observable<void> {
    return this._kalturaServerClient
      .request(new ConversionProfileSetAsDefaultAction({ id: profile.id }))
      .pipe(map(() => {
      }));
  }

  public deleteProfiles(profiles: KalturaConversionProfileWithAsset[]): Observable<void> {
    return this._transmitChunkRequest(
      profiles.map(profile => new ConversionProfileDeleteAction({ id: profile.id }))
    );
  }
}

