import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { ISubscription } from 'rxjs/Subscription';
import { KalturaClient, KalturaMultiRequest } from 'kaltura-ngx-client';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { FiltersStoreBase, NumberTypeAdapter, TypeAdaptersMapping } from '@kaltura-ng/mc-shared';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { StringTypeAdapter } from '@kaltura-ng/mc-shared';
import { SortDirection } from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaAccessControlFilter } from 'kaltura-ngx-client';
import { AccessControlListAction } from 'kaltura-ngx-client';
import { KalturaLimitFlavorsRestriction } from 'kaltura-ngx-client';
import { KalturaSiteRestriction } from 'kaltura-ngx-client';
import { KalturaCountryRestriction } from 'kaltura-ngx-client';
import { KalturaIpAddressRestriction } from 'kaltura-ngx-client';
import { KalturaSessionRestriction } from 'kaltura-ngx-client';
import { KalturaSiteRestrictionType } from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { KalturaCountryRestrictionType } from 'kaltura-ngx-client';
import { KalturaIpAddressRestrictionType } from 'kaltura-ngx-client';
import { KalturaLimitFlavorsRestrictionType } from 'kaltura-ngx-client';
import { KalturaPreviewRestriction } from 'kaltura-ngx-client';
import { KalturaAccessControl } from 'kaltura-ngx-client';
import { AccessControlDeleteAction } from 'kaltura-ngx-client';
import { KalturaFlavorParams } from 'kaltura-ngx-client';
import { AccessControlUpdateAction } from 'kaltura-ngx-client';
import { AccessControlAddAction } from 'kaltura-ngx-client';
import { KalturaNullableBoolean } from 'kaltura-ngx-client';
import { SettingsAccessControlMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { FlavoursStore } from 'app-shared/kmc-shared';
import { switchMap, map } from 'rxjs/operators';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { throwError } from 'rxjs';

const localStoragePageSizeKey = 'accessControlProfiles.list.pageSize';

export interface AccessControlProfilesFilters {
  pageSize: number;
  pageIndex: number;
  sortBy: string;
  sortDirection: number;
}

export interface AccessControlProfileRestriction<T> {
  isAuthorized: boolean | null;
  details: T;
  label: string;
}

export interface ExtendedKalturaAccessControl extends KalturaAccessControl {
  view: {
    hasAdditionalInfo: boolean,
    domain: AccessControlProfileRestriction<string[]>;
    countries: AccessControlProfileRestriction<string[]>;
    ips: AccessControlProfileRestriction<string[]>;
    flavors: AccessControlProfileRestriction<{ id: number, label: string }[]>;
    advancedSecurity: AccessControlProfileRestriction<{ preview?: number, secureVideo?: boolean, label: string }>
  };
}

@Injectable()
export class AccessControlProfilesStore extends FiltersStoreBase<AccessControlProfilesFilters> implements OnDestroy {
  private _profiles = {
    data: new BehaviorSubject<{ items: ExtendedKalturaAccessControl[], totalCount: number }>({ items: [], totalCount: 0 }),
    state: new BehaviorSubject<{ loading: boolean, errorMessage: string }>({ loading: false, errorMessage: null })
  };

  private _isReady = false;
  private _querySubscription: ISubscription;

  public flavors: { label: string, value: string }[] = [];
  public readonly profiles = {
    data$: this._profiles.data.asObservable(),
    state$: this._profiles.state.asObservable(),
    data: () => this._profiles.data.getValue().items
  };


  constructor(private _kalturaServerClient: KalturaClient,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _flavorsStore: FlavoursStore,
              settingsAccessControlMainView: SettingsAccessControlMainViewService,
              _logger: KalturaLogger) {
    super(_logger.subLogger('AccessControlProfilesStore'));
    if (settingsAccessControlMainView.isAvailable()) {
        this._prepare();
    }
  }

  ngOnDestroy() {
    this._profiles.data.complete();
    this._profiles.state.complete();
  }

  private _prepare(): void {
    if (!this._isReady) {
      this._logger.info(`initiate service`);
      this._isReady = true;

      this._registerToFilterStoreDataChanges();
      this._executeQuery();
    }
  }

  protected _preFilter(updates: Partial<AccessControlProfilesFilters>): Partial<AccessControlProfilesFilters> {
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

    this._logger.info(`loading data from the server`);
    this._profiles.state.next({ loading: true, errorMessage: null });
    this._querySubscription = this._buildQueryRequest()
      .pipe(cancelOnDestroy(this))
      .subscribe(
        ({ accessControlList, flavorsList }) => {
          this._querySubscription = null;

          this._logger.info(`handle success data loading`);
          this._profiles.state.next({ loading: false, errorMessage: null });
          this._profiles.data.next({
            items: accessControlList.items,
            totalCount: accessControlList.totalCount
          });
          this.flavors = flavorsList.map(flavor => ({ label: flavor.name, value: String(flavor.id) }));
        },
        error => {
          this._querySubscription = null;
          const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
          this._logger.info(`handle failing data loading`, { errorMessage });
          this._profiles.state.next({ loading: false, errorMessage });
        });


  }

  private _buildQueryRequest(): Observable<{ accessControlList: { items: ExtendedKalturaAccessControl[], totalCount: number }, flavorsList: KalturaFlavorParams[] }> {
    try {
      // create request items
      const filter = new KalturaAccessControlFilter({});
      const data: AccessControlProfilesFilters = this._getFiltersAsReadonly();
      let pager: KalturaFilterPager = null;

      // update the sort by args
      if (data.sortBy) {
        filter.orderBy = `${data.sortDirection === SortDirection.Desc ? '-' : '+'}${data.sortBy}`;
      }

      // update pagination args
      if (data.pageIndex || data.pageSize) {
        pager = new KalturaFilterPager({
          pageSize: data.pageSize,
          pageIndex: data.pageIndex + 1
        });
      }

      // build the request
      return this._kalturaServerClient.request(new AccessControlListAction({ filter, pager }))
          .pipe(
             switchMap((accessControlList) => this._flavorsStore.get().pipe(map(flavors => ({ accessControlList, flavors })))  ),
              map(({ accessControlList: originalAccessControlList, flavors }) => {

                  const extendedAccessControlList = this._mapProfilesResponse(originalAccessControlList.objects, flavors.items);
                  return {
                      accessControlList: {
                          items: extendedAccessControlList,
                          totalCount: originalAccessControlList.totalCount
                      },
                      flavorsList: flavors.items
                  };
              })
          );
    } catch (err) {
      return throwError(err);
    }
  }

  private _createExtendedAccessControl(item: KalturaAccessControl): ExtendedKalturaAccessControl {
    return Object.assign(item, {
      view: {
        hasAdditionalInfo: false,
        domain: {
          isAuthorized: null,
          details: [],
          label: null
        },
        countries: {
          isAuthorized: null,
          details: [],
          label: null
        },
        ips: {
          isAuthorized: null,
          details: [],
          label: null
        },
        flavors: {
          isAuthorized: null,
          details: [],
          label: null
        },
        advancedSecurity: {
          isAuthorized: false,
          details: { preview: null, secureVideo: false, label: null },
          label: null
        }
      }
    });
  }

  private _mapProfilesResponse(accessControlList: KalturaAccessControl[], flavorsList): ExtendedKalturaAccessControl[] {
    const result = accessControlList.map(item => this._createExtendedAccessControl(item));

    result.forEach((item) => {
      let hasAdditionalInfo = !!item.description; // default to has additional if has description
      if (item.restrictions && item.restrictions.length) {
        item.restrictions.forEach(restriction => {
          if (restriction instanceof KalturaSiteRestriction) {
            hasAdditionalInfo = true;
            const details = restriction.siteList.split(',');
            const isAuthorized = restriction.siteRestrictionType === KalturaSiteRestrictionType.allowSiteList;
            const label = isAuthorized
              ? this._appLocalization.get('applications.settings.accessControl.restrictions.authorized', [details.length])
              : this._appLocalization.get('applications.settings.accessControl.restrictions.blocked', [details.length]);

            item.view.domain = {
              label,
              isAuthorized,
              details
            };
          }

          if (restriction instanceof KalturaCountryRestriction) {
            hasAdditionalInfo = true;
            const isAuthorized = restriction.countryRestrictionType === KalturaCountryRestrictionType.allowCountryList;
            const details = restriction.countryList.split(',').map(countryCode => countryCode.toLowerCase());
            const label = isAuthorized
              ? this._appLocalization.get('applications.settings.accessControl.restrictions.authorized', [details.length])
              : this._appLocalization.get('applications.settings.accessControl.restrictions.blocked', [details.length]);

            item.view.countries = {
              label,
              isAuthorized,
              details
            };
          }

          if (restriction instanceof KalturaIpAddressRestriction) {
            hasAdditionalInfo = true;
            const details = restriction.ipAddressList.split(',');
            const isAuthorized = restriction.ipAddressRestrictionType === KalturaIpAddressRestrictionType.allowList;
            const label = isAuthorized
              ? this._appLocalization.get('applications.settings.accessControl.restrictions.authorized', [details.length])
              : this._appLocalization.get('applications.settings.accessControl.restrictions.blocked', [details.length]);

            item.view.ips = {
              label,
              isAuthorized,
              details
            };
          }

          if (restriction instanceof KalturaLimitFlavorsRestriction) {
            hasAdditionalInfo = true;
            const flavorParamsIds = restriction.flavorParamsIds.split(',');
            const isAuthorized = restriction.limitFlavorsRestrictionType === KalturaLimitFlavorsRestrictionType.allowList;
            const label = isAuthorized
              ? this._appLocalization.get('applications.settings.accessControl.restrictions.authorized', [flavorParamsIds.length])
              : this._appLocalization.get('applications.settings.accessControl.restrictions.blocked', [flavorParamsIds.length]);
            const getFlavorNameById = (flavorId): { id: number, label: string } => {
              const relevantFlavor = flavorsList.find(({ id }) => Number(flavorId) === id);
              const flavorLabel = relevantFlavor ? relevantFlavor.name : flavorId;
              return { id: flavorId, label: flavorLabel };
            };
            const details = flavorParamsIds.map(getFlavorNameById);

            item.view.flavors = {
              label,
              isAuthorized,
              details
            };
          }

          if (restriction instanceof KalturaSessionRestriction) {
            // this restriction shouldn't set 'hasAdditionalInfo' because it has no impact on the details area
            item.view.advancedSecurity.label = this._appLocalization.get('applications.settings.accessControl.restrictions.ks');
            item.view.advancedSecurity.details.secureVideo = true;
          }

          if (restriction instanceof KalturaPreviewRestriction) {
            hasAdditionalInfo = true;
            item.view.advancedSecurity.label += this._appLocalization.get('applications.settings.accessControl.restrictions.freePreview');
            item.view.advancedSecurity.details.preview = restriction.previewLength;
            // for expanded panel details
            const len = restriction.previewLength;
            const min = Math.floor(len / 60);
            const sec = len % 60;
            item.view.advancedSecurity.details.label = this._appLocalization.get(
              'applications.settings.accessControl.restrictions.freePreviewDetails',
              [min, sec]
            );
          }
        });
      }

      item.view.hasAdditionalInfo = hasAdditionalInfo;
    });

    // put default profile on top of the table if there's default profile in the response
    const defaultProfileIndex = result.findIndex(profile => profile.isDefault === KalturaNullableBoolean.trueValue);
    if (defaultProfileIndex !== -1) {
      const defaultProfile = result.splice(defaultProfileIndex, 1);
      result.unshift(...defaultProfile);
    }

    return result;
  }

  protected _createDefaultFiltersValue(): AccessControlProfilesFilters {
    const pageSize = this._browserService.getFromLocalStorage(localStoragePageSizeKey) || 25;
    return {
      pageSize: pageSize,
      pageIndex: 0,
      sortBy: 'createdAt',
      sortDirection: SortDirection.Desc,
    };
  }

  protected _getTypeAdaptersMapping(): TypeAdaptersMapping<AccessControlProfilesFilters> {
    return {
      pageSize: new NumberTypeAdapter(),
      pageIndex: new NumberTypeAdapter(),
      sortBy: new StringTypeAdapter(),
      sortDirection: new NumberTypeAdapter(),
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

  public deleteProfiles(profiles: KalturaAccessControl[]): Observable<void> {
    const actions = profiles.map(({ id }) => new AccessControlDeleteAction({ id }));
    return this._kalturaServerClient
      .multiRequest(new KalturaMultiRequest(...actions))
      .pipe(map((response) => {
        if (response && response.length) {
          const failedResponse = response.find(res => !!res.error);
          if (failedResponse) {
            throw throwError(failedResponse.error);
          }
        }
      }));
  }

  public saveProfile(profile: KalturaAccessControl): Observable<void> {
    const saveAction = profile.id
      ? new AccessControlUpdateAction({ id: profile.id, accessControl: profile })
      : new AccessControlAddAction({ accessControl: profile });

    profile.allowEmptyArray('restrictions');

    return this._kalturaServerClient.request(saveAction)
      .pipe(map(() => {
      }));
  }
}

