import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { publishReplay, refCount, map, catchError } from 'rxjs/operators';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KalturaClient } from 'kaltura-ngx-client';
import { CategoryListAction } from 'kaltura-ngx-client';
import { KalturaCategoryFilter } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaCategory } from 'kaltura-ngx-client';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';
import { KalturaCategoryListResponse } from 'kaltura-ngx-client';
import { AppEventsService } from 'app-shared/kmc-shared';
import { CategoriesGraphUpdatedEvent } from "app-shared/kmc-shared/app-events/categories-graph-updated/categories-graph-updated";
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { CategoryGetAction } from 'kaltura-ngx-client';
import { KalturaAppearInListType } from 'kaltura-ngx-client';
import { KalturaPrivacyType } from 'kaltura-ngx-client';
import { KalturaContributionPolicyType } from 'kaltura-ngx-client';
import { of } from 'rxjs';

export interface CategoryData {
    parentId?: number,
    id: number,
    fullIdPath: number[],
    name: string,
    referenceId: string,
    sortValue: number,
    fullName: string,
    childrenCount: number,
    membersCount: number,
    appearInList: KalturaAppearInListType,
    contributionPolicy: KalturaContributionPolicyType,
    privacy: KalturaPrivacyType;
    privacyContexts: string;
    privacyContext: string;
}

export interface CategoriesQuery {
  items: CategoryData[];
}


@Injectable()
export class CategoriesSearchService implements OnDestroy {
  private _groupedCategoriesCache: { [key: string]: Observable<{ items: CategoryData[] }> } = {};
  private _categoriesMap: Map<number, CategoryData> = new Map<number, CategoryData>();
  private _logger: KalturaLogger;

  constructor(private kalturaServerClient: KalturaClient, logger: KalturaLogger, private _appEvents: AppEventsService) {
      this._logger = logger.subLogger('CategoriesSearchService');

      this._appEvents.event(CategoriesGraphUpdatedEvent)
          .pipe(cancelOnDestroy(this))
          .subscribe(() => {
              this._logger.info(`clear categories cache (triggered by categories graph updated event)`);
              this._groupedCategoriesCache = {};
              this._categoriesMap.clear();
          });
  }

  ngOnDestroy()
  {
  }


  public getAllCategories(): Observable<CategoriesQuery> {
    return this._getCategoriesWithCache({ cacheToken: 'all_categories_token' });
  }

  public getRootCategories(): Observable<CategoriesQuery> {
    return this._getCategoriesWithCache({ cacheToken: 'root_categories', parentId: 0 });
  }

  public getCachedCategory(categoryId: number): CategoryData{
    return this._categoriesMap.get(categoryId);
  }

  public getCategory(categoryId: number): Observable<CategoryData> {
      // DEVELOPER NOTICE: this method always query the server bypassing the cache. this is by design.
      // changing it prioritize cache will require refactoring places that are using this method.

      const responseProfile = this._createResponseProfile();

      return <any>this.kalturaServerClient.request(
          new CategoryGetAction({id: categoryId}).setRequestOptions({
              responseProfile
          })
      ).pipe(map(category => {
          return this.parseAndCacheCategories([category])[0];
      }))
  }

  public getCategories(categoriesList: number[]): Observable<CategoriesQuery> {
      // DEVELOPER NOTICE: this method always query the server bypassing the cache. this is by design.
      // changing it prioritize cache will require refactoring places that are using this method.
    if (categoriesList && categoriesList.length) {
        return this.buildCategoryListRequest({ categoriesList })
            .pipe(map(response => {
                // parse response into categories items
                return { items: this.parseAndCacheCategories(response.objects) };
            }));
    } else {
      return throwError({ message: 'missing categoriesList argument' });
    }
  }

  public getChildrenCategories(parentId: number): Observable<CategoriesQuery> {

    if (parentId === null) {
      return throwError({ message: 'missing parentId argument' });
    }

    return this._getCategoriesWithCache({ cacheToken: parentId + '', parentId });
  }

  public getSuggestions(text: string): Observable<CategoryData[]> {
      // DEVELOPER NOTICE: this method always query the server bypassing the cache. this is by design.
      // changing it prioritize cache will require refactoring places that are using this method.
    if (text) {
      return Observable.create(observer => {
        const filter = new KalturaCategoryFilter({
          nameOrReferenceIdStartsWith: text,
          orderBy: '+fullName'
        });

        const pager = new KalturaFilterPager({
          pageIndex: 0,
          pageSize: 30
        });

        const requestSubscription = this.kalturaServerClient.request(
          new CategoryListAction({ filter })
        ).subscribe(result => {
            const items = this.parseAndCacheCategories(result.objects);

            observer.next(items);
            observer.complete();
          },
          err => {
            observer.error(err);
          });

        return () => {
          if (requestSubscription) {
            requestSubscription.unsubscribe();
          }
        }
      });
    } else {
      return of([]);
    }
  }

  private _getCategoriesWithCache({ cacheToken, parentId, categoriesList }: { cacheToken: string, parentId?: number, categoriesList?: number[] }): Observable<CategoriesQuery> {
    // no request found in queue - get from cache if already queried those categories
    let cachedResponse = this._groupedCategoriesCache[cacheToken];

    if (!cachedResponse) {
        this._logger.info(`caching categories for token '${cacheToken}'`);
        this._groupedCategoriesCache[cacheToken] = cachedResponse = this.buildCategoryListRequest({ parentId, categoriesList })
        .pipe(map(response => {
          // parse response into categories items
          return { items: this.parseAndCacheCategories(response.objects) };
        })).pipe(catchError(error => {
          this._groupedCategoriesCache[cacheToken] = null;

          // re-throw the provided error
          return throwError(error);
        }))
        .pipe(publishReplay(1))
        .pipe(refCount());
    }

    return cachedResponse;
  }

  private parseAndCacheCategories(kalturaCategories: KalturaCategory[]): CategoryData[] {
    const result = [];

    if (kalturaCategories) {
        kalturaCategories.map((category) => {
        const fullIdPath = (category.fullIds ? category.fullIds.split('>') : []).map((item: any) => Number(item));
        const newCategoryData = {
            id: category.id,
            name: category.name,
            fullIdPath: fullIdPath,
            referenceId: category.referenceId,
            parentId: category.parentId !== 0 ? category.parentId : null,
            sortValue: category.partnerSortValue,
            fullName: category.fullName,
            childrenCount: category.directSubCategoriesCount,
            membersCount: category.membersCount,
            appearInList: category.appearInList,
            privacy: category.privacy,
            privacyContext: category.privacyContext,
            privacyContexts: category.privacyContexts,
            contributionPolicy: category.contributionPolicy,
            partnerSortValue: category.partnerSortValue
        };

        this._categoriesMap.set(newCategoryData.id, newCategoryData);
        result.push(newCategoryData);
      });
    }

    return result;
  }

  private buildCategoryListRequest({ parentId, categoriesList }: { parentId?: number, categoriesList?: number[] }): Observable<KalturaCategoryListResponse> {
    const filter = new KalturaCategoryFilter({});
    filter.orderBy = '+name';
    if (parentId !== null && typeof parentId !== 'undefined') {
      filter.parentIdEqual = parentId;
    }

    if (categoriesList && categoriesList.length) {
      filter.idIn = categoriesList.join(',');
    }

    const responseProfile = this._createResponseProfile();

    return <any>this.kalturaServerClient.request(
      new CategoryListAction({ filter }).setRequestOptions({
          responseProfile
      })
    )
  }

  private _createResponseProfile(): KalturaDetachedResponseProfile {
      return new KalturaDetachedResponseProfile({
          fields: 'id,name,parentId,partnerSortValue,fullName,fullIds,directSubCategoriesCount,contributionPolicy,privacyContext,privacyContexts,appearInList,privacy,membersCount',
          type: KalturaResponseProfileType.includeFields
      });
  }
}
