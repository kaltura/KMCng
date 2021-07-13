import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';
import {KalturaCategoryFilter} from 'kaltura-ngx-client';
import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import {ISubscription} from 'rxjs/Subscription';
import { map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {KalturaDetachedResponseProfile} from 'kaltura-ngx-client';
import {KalturaFilterPager} from 'kaltura-ngx-client';
import {KalturaResponseProfileType} from 'kaltura-ngx-client';
import {CategoryListAction} from 'kaltura-ngx-client';
import {KalturaClient, KalturaMultiRequest} from 'kaltura-ngx-client';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {KalturaCategoryListResponse} from 'kaltura-ngx-client';
import {KalturaCategory} from 'kaltura-ngx-client';
import {CategoryDeleteAction} from 'kaltura-ngx-client';
import {
    DatesRangeAdapter,
    DatesRangeType,
    FiltersStoreBase,
     ListTypeAdapter,
    GroupedListAdapter, GroupedListType,
    NumberTypeAdapter,
    StringTypeAdapter,
    TypeAdaptersMapping
} from '@kaltura-ng/mc-shared';
import {
    AppEventsService, MetadataProfileCreateModes, MetadataProfileStore,
    MetadataProfileTypes
} from 'app-shared/kmc-shared';
import {KalturaSearchOperator} from 'kaltura-ngx-client';
import {KalturaSearchOperatorType} from 'kaltura-ngx-client';
import {KalturaUtils} from '@kaltura-ng/kaltura-common';
import {AppLocalization} from '@kaltura-ng/mc-shared';
import {KalturaMetadataSearchItem} from 'kaltura-ngx-client';
import {KalturaSearchCondition} from 'kaltura-ngx-client';
import {CategoryMoveAction} from 'kaltura-ngx-client';
import {CategoryAddAction} from 'kaltura-ngx-client';
import {KalturaInheritanceType} from 'kaltura-ngx-client';
import {KalturaContributionPolicyType} from 'kaltura-ngx-client';
import {KalturaAppearInListType} from 'kaltura-ngx-client';
import {KalturaPrivacyType} from 'kaltura-ngx-client';
import {KalturaCategoryEntry} from 'kaltura-ngx-client';
import {CategoryEntryAddAction} from 'kaltura-ngx-client';

import {
  CategoriesModeAdapter,
  CategoriesModes,
  CategoriesModeType
} from 'app-shared/content-shared/categories/categories-mode-type';
import { CategoriesGraphUpdatedEvent } from 'app-shared/kmc-shared/app-events/categories-graph-updated/categories-graph-updated';
import { CategoriesSearchService, CategoryData } from 'app-shared/content-shared/categories/categories-search.service';
import { ContentCategoriesMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

export interface UpdateStatus {
  loading: boolean;
  errorMessage: string;
}

export interface Categories {
  items: KalturaCategory[],
  totalCount: number
}

export enum SortDirection {
  Desc = -1,
  Asc = 1
}

export interface MoveCategoryData {
  categories: KalturaCategory[];
  categoryParent: { id?: number, fullIds: number[] };
}

export interface NewCategoryData {
    categoryParentId?: number;
    name: string;
  linkedEntriesIds?: string[]
}

export interface CategoriesFilters {
  freetext: string,
  pageSize: number,
  pageIndex: number,
  sortBy: string,
  sortDirection: number,
  createdAt: DatesRangeType,
  privacyTypes: string[],
  categoryListing: string[],
  contributionPolicy: string[],
  endUserPermissions: string[],
    categories: number[],
    categoriesMode: CategoriesModeType,
  customMetadata: GroupedListType<string>
}


@Injectable()
export class CategoriesService extends FiltersStoreBase<CategoriesFilters> implements OnDestroy {

    private _categories = {
        data: new BehaviorSubject<Categories>({items: [], totalCount: 0}),
        state: new BehaviorSubject<UpdateStatus>({loading: false, errorMessage: null})
    };

    public readonly categories =
        {
            data$: this._categories.data.asObservable(),
            state$: this._categories.state.asObservable(),
            data: () => {
                return this._categories.data.getValue().items;
            }
        };

    private _isReady = false;
    private _metadataProfiles: { id: number, name: string, lists: { id: string, name: string }[] }[];
    private _querySubscription: ISubscription;
    private readonly _pageSizeCacheKey = 'categories.list.pageSize';


    constructor(private _kalturaClient: KalturaClient,
                private browserService: BrowserService,
                private metadataProfileService: MetadataProfileStore,
                private _appEvents: AppEventsService,
                private _categoriesSearchService: CategoriesSearchService,
                private _appLocalization: AppLocalization,
                contentCategoriesMainViewService: ContentCategoriesMainViewService,
                _logger: KalturaLogger) {
        super(_logger.subLogger('CategoriesService'));
        if (contentCategoriesMainViewService.isAvailable()) {
            this._prepare();
        }
    }

    private _prepare(): void {
        // NOTICE: do not execute here any logic that should run only once.
        // this function will re-run if preparation failed. execute your logic
        // only after the line where we set isReady to true

        if (!this._isReady) {
            this._logger.info(`handle loading additional categories data`);
            this._categories.state.next({loading: true, errorMessage: null});
            this.metadataProfileService.get(
                {
                    type: MetadataProfileTypes.Category,
                    ignoredCreateMode: MetadataProfileCreateModes.App
                })
                .pipe(cancelOnDestroy(this))
                .subscribe(
                    metadataProfiles => {
                        this._logger.info(`handle successful loading additional categories data`);
                        this._isReady = true;
                        this._metadataProfiles = metadataProfiles.items.map(metadataProfile => (
                            {
                                id: metadataProfile.id,
                                name: metadataProfile.name,
                                lists: (metadataProfile.items || []).map(item => ({id: item.id, name: item.name}))
                            }));

                        const defaultPageSize = this.browserService.getFromLocalStorage(this._pageSizeCacheKey);
                        if (defaultPageSize !== null) {
                            this.filter({
                                pageSize: defaultPageSize
                            });
                        }

                        this._registerToFilterStoreDataChanges();
                        this._executeQuery();
                    },
                    (error) => {
                        this._logger.warn(`handle failed loading additional categories data`, { errorMessage: error.message });
                        this._categories.state.next({loading: false, errorMessage: error.message});
                    }
                );
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
        this._categories.state.complete();
        this._categories.data.complete();
    }

    public reload(): void {
        if (this._categories.state.getValue().loading) {
            return;
        }

        if (this._isReady) {
            this._executeQuery();
        } else {
            this._prepare();
        }
    }

    public getNextCategoryId(categoryId: number): number | null {
        const categories = this._categories.data.getValue().items;
        if (!categories || !categories.length) {
            return null;
        }

        // validate category exists
        const currentCategoryIndex = categories.findIndex(category => category.id === categoryId);
        if (currentCategoryIndex === -1) {
            return null;
        }

        // get next category ID
        if (currentCategoryIndex < categories.length - 1) {
            return (categories[currentCategoryIndex + 1].id);
        } else {
            return null;
        }
    }

    public getPrevCategoryId(categoryId: number): number | null {
        const categories = this._categories.data.getValue().items;
        if (!categories || !categories.length) {
            return null;
        }

        // validate category exists
        const currentCategoryIndex = categories.findIndex(category => category.id === categoryId);
        if (currentCategoryIndex === -1) {
            return null;
        }

        // get previous category ID
        if (currentCategoryIndex !== 0) {
            return (categories[currentCategoryIndex - 1].id);
        } else {
            return null;
        }
    }

    private _executeQuery(): void {

        if (this._querySubscription) {
            this._querySubscription.unsubscribe();
            this._querySubscription = null;
        }

        const pageSize = this.cloneFilter('pageSize', null);
        if (pageSize) {
            this.browserService.setInLocalStorage(this._pageSizeCacheKey, pageSize);
        }

        this._categories.state.next({loading: true, errorMessage: null});

        this._logger.info(`handle loading categories data`);

        this._querySubscription = this.buildQueryRequest()
            .pipe(cancelOnDestroy(this)).subscribe(
                response => {
                    this._logger.info(`handle successful loading categories data`);
                    this._querySubscription = null;

                    this._categories.state.next({loading: false, errorMessage: null});

                    this._categories.data.next({
                        items: response.objects,
                        totalCount: response.totalCount
                    });
                },
                error => {
                    this._querySubscription = null;
                    const errorMessage = error && error.message ? error.message : typeof error === 'string' ? error : 'invalid error';
                    this._logger.warn(`handle failed loading categories data`, { errorMessage });
                    this._categories.state.next({loading: false, errorMessage});
                });
    }

  private buildQueryRequest(): Observable<KalturaCategoryListResponse> {
    try {
      // create request items
      const filter: KalturaCategoryFilter = new KalturaCategoryFilter({});
      let pagination: KalturaFilterPager = null;
      // update desired fields of entries
      const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
        type: KalturaResponseProfileType.includeFields,
        fields: 'id, name, createdAt, directSubCategoriesCount, entriesCount, fullName, tags, parentId, privacyContexts'
      });

      const advancedSearch = filter.advancedSearch = new KalturaSearchOperator({});
      advancedSearch.type = KalturaSearchOperatorType.searchAnd;

      const data: CategoriesFilters = this._getFiltersAsReadonly();

      // filter 'freeText'
      if (data.freetext) {
        filter.freeText = data.freetext;
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

      // filters of custom metadata lists
      if (this._metadataProfiles && this._metadataProfiles.length > 0) {

        this._metadataProfiles.forEach(metadataProfile => {
          // create advanced item for all metadata profiles regardless if the user filtered by them or not.
          // this is needed so freetext will include all metadata profiles while searching.
          const metadataItem: KalturaMetadataSearchItem = new KalturaMetadataSearchItem(
            {
              metadataProfileId: metadataProfile.id,
              type: KalturaSearchOperatorType.searchAnd,
              items: []
            }
          );
          advancedSearch.items.push(metadataItem);

          metadataProfile.lists.forEach(list => {
            const metadataProfileFilters = data.customMetadata[list.id];
            if (metadataProfileFilters && metadataProfileFilters.length > 0) {
              const innerMetadataItem: KalturaMetadataSearchItem = new KalturaMetadataSearchItem({
                metadataProfileId: metadataProfile.id,
                type: KalturaSearchOperatorType.searchOr,
                items: []
              });
              metadataItem.items.push(innerMetadataItem);

              metadataProfileFilters.forEach(filterItem => {
                const searchItem = new KalturaSearchCondition({
                  field: `/*[local-name()='metadata']/*[local-name()='${list.name}']`,
                  value: filterItem
                });

                innerMetadataItem.items.push(searchItem);
              });
            }
          });
        });
      }


        if (data.categories && data.categories.length) {
            const categoriesValue = data.categories.join(',');
            if (data.categoriesMode === CategoriesModes.SelfAndChildren) {
                filter.ancestorIdIn = categoriesValue;
            } else {
                filter.parentIdIn = categoriesValue;
            }
        }

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

      // filter 'privacyTypes'
      if (data.privacyTypes && data.privacyTypes.length > 0) {
        filter.privacyIn = data.privacyTypes.map(e => e).join(',');
      }

      // filter 'categoryListing', set filter if only one option selected
      if (data.categoryListing) {
        if (data.categoryListing.length === 1) {
          switch (data.categoryListing[0]) {
            case KalturaAppearInListType.categoryMembersOnly.toString():
              filter.appearInListEqual = KalturaAppearInListType.categoryMembersOnly;
              break;
            case KalturaAppearInListType.partnerOnly.toString():
              filter.appearInListEqual = KalturaAppearInListType.partnerOnly;
              break;
            default:
              break
          }
        }
      }

      // filter 'contributionPolicy', set filter if only one option selected
      if (data.contributionPolicy) {
        if (data.contributionPolicy.length === 1) {
          data.contributionPolicy.forEach(item => {
            switch (item) {
              case KalturaContributionPolicyType.all.toString():
                filter.contributionPolicyEqual = KalturaContributionPolicyType.all;
                break;
              case KalturaContributionPolicyType.membersWithContributionPermission.toString():
                filter.contributionPolicyEqual = KalturaContributionPolicyType.membersWithContributionPermission;
                break;
              default:
                break
            }
          });
        }
      }

      // filter 'endUserPermissions', set filter if only one option selected
      if (data.endUserPermissions) {
        if (data.endUserPermissions.length === 1) {
          data.endUserPermissions.forEach(item => {
            switch (item) {
              case 'has':
                filter.membersCountGreaterThanOrEqual = 1;
                filter.membersCountLessThanOrEqual = undefined;
                break;
              case 'no':
                filter.membersCountLessThanOrEqual = 0;
                filter.membersCountGreaterThanOrEqual = undefined;
                break;
              default:
                break
            }
          });
        }
      }

      // remove advanced search arg if it is empty
      if (advancedSearch.items && advancedSearch.items.length === 0) {
        delete filter.advancedSearch;
      }

      // build the request
      return this._kalturaClient.request(
        new CategoryListAction({
          filter,
          pager: pagination
        }).setRequestOptions({
            responseProfile
        })
      );
    } catch (err) {
      return throwError(err);
    }

  }

    public deleteCategory(categoryId: number): Observable<void> {

        return Observable.create(observer => {
            let subscription: ISubscription;
            if (categoryId && categoryId > 0) {
                subscription = this._kalturaClient.request(new CategoryDeleteAction({id: categoryId})).subscribe(
                    result => {
                        this._appEvents.publish(new CategoriesGraphUpdatedEvent());
                        observer.next();
                        observer.complete();
                    },
                    error => {
                        observer.error(error);
                    }
                );
            } else {
                observer.error(new Error('missing categoryId argument'));
            }
            return () => {
                if (subscription) {
                    subscription.unsubscribe();
                }
            }
        });
    }

    protected _preFiltersReset(updates: Partial<CategoriesFilters>): Partial<CategoriesFilters> {
        delete updates.sortBy;
        delete updates.sortDirection;
        return updates;
    }

    protected _preFilter(updates: Partial<CategoriesFilters>): Partial<CategoriesFilters> {
        if (typeof updates.pageIndex === 'undefined') {
            // reset page index to first page everytime filtering the list by any filter that is not page index
            updates.pageIndex = 0;
        }

        if (typeof updates.categoriesMode !== 'undefined')
        {
            this.browserService.setInLocalStorage('contentShared.categoriesTree.selectionMode', updates.categoriesMode);
        }

        return updates;
    }

    protected _createDefaultFiltersValue(): CategoriesFilters {

        const savedAutoSelectChildren: CategoriesModes = this.browserService
            .getFromLocalStorage('contentShared.categoriesTree.selectionMode');
        const categoriesMode = typeof savedAutoSelectChildren === 'number'
            ? savedAutoSelectChildren
            : CategoriesModes.SelfAndChildren;

        return {
            freetext: '',
            pageSize: 50,
            pageIndex: 0,
            sortBy: 'createdAt',
            sortDirection: SortDirection.Desc,
            createdAt: {fromDate: null, toDate: null},
            privacyTypes: [],
            categoryListing: [],
            contributionPolicy: [],
            endUserPermissions: [],
            categories: [],
            categoriesMode,
            customMetadata: {}
        };
    }

    protected _getTypeAdaptersMapping(): TypeAdaptersMapping<CategoriesFilters> {
        return {
            freetext: new StringTypeAdapter(),
            pageSize: new NumberTypeAdapter(),
            pageIndex: new NumberTypeAdapter(),
            sortBy: new StringTypeAdapter(),
            sortDirection: new NumberTypeAdapter(),
            createdAt: new DatesRangeAdapter(),
            privacyTypes: new ListTypeAdapter<string>(),
            categoryListing: new ListTypeAdapter<string>(),
            contributionPolicy: new ListTypeAdapter<string>(),
            endUserPermissions: new ListTypeAdapter<string>(),
            categories: new ListTypeAdapter<number>(),
            categoriesMode: new CategoriesModeAdapter(),
            customMetadata: new GroupedListAdapter<string>()
        };
    }

    /**
     * Add new category to be existed under parent given as parameter
     * @param newCategoryData {NewCategoryData} holds name and desired categoryParentId (if null - move to root)
     * @return {Observable<number>} new category ID
     */
    public addNewCategory(newCategoryData: NewCategoryData): Observable<{ category: KalturaCategory }> {
        const newCategoryName = newCategoryData ? (newCategoryData.name || '').trim() : null;
        if (!newCategoryName) {
            const error = new Error('missing category name');
            (<any>error).code = 'missing_category_name';
            return throwError(error);
        }
        const category = new KalturaCategory({
            name: newCategoryData.name,
            parentId: Number(newCategoryData.categoryParentId) || 0,
            privacy: KalturaPrivacyType.all,
            appearInList: KalturaAppearInListType.partnerOnly,
            contributionPolicy: KalturaContributionPolicyType.all,
            inheritanceType: KalturaInheritanceType.manual
        });

        const multiRequest: KalturaMultiRequest = new KalturaMultiRequest(
            new CategoryAddAction({category})
        );

        if (newCategoryData.linkedEntriesIds && newCategoryData.linkedEntriesIds.length) {
            newCategoryData.linkedEntriesIds.forEach((entryId) => {
                const categoryEntry = new KalturaCategoryEntry({
                    entryId: entryId
                }).setDependency(['categoryId', 0, 'id']);

                multiRequest.requests.push(
                    new CategoryEntryAddAction({categoryEntry})
                );
            });
        }

        return this._kalturaClient.multiRequest(multiRequest)
            .pipe(map(
                data => {
                    if (data.hasErrors()) {
                        const message = this._appLocalization.get('applications.content.moveCategory.errors.creationError');
                        let errorCode = '';
                        if (data[0].error) { // show error of CategoryAddAction
                            errorCode = data[0].error.code === 'DUPLICATE_CATEGORY'
                                ? 'duplicate_category'
                                : 'category_creation_failure';
                        } else if (multiRequest.requests.length > 1) {
                            errorCode = 'entries_link_issue';
                        }
                        const error = new Error(message);
                        (<any>error).code = errorCode;
                        if (data[0].result) {
                            (<any>error).context = { categoryId: data[0].result.id };
                        }

                        throw error;
                    }

                    if (data[0].result) {
                        this._appEvents.publish(new CategoriesGraphUpdatedEvent());
                    }

                    return {category: data[0].result};
                }));
    }

    /**
     * Move category to be existed under new parent
     * @param moveCategoryData {MoveCategoryData} holds category to move ID and selected category parent (if null - move to root)
     * @return {Observable<void>}
     */
    public moveCategory(moveCategoryData: MoveCategoryData): Observable<void> {
        if (!moveCategoryData || !this.isParentCategorySelectionValid(moveCategoryData)) {
            const categoryMovedFailureErrorMessage = this._appLocalization.get('applications.content.moveCategory.errors.categoryMovedFailure');
            return throwError(new Error(categoryMovedFailureErrorMessage));
        }

        return <any>this._kalturaClient.request(
            new CategoryMoveAction({
                categoryIds: moveCategoryData.categories.map(category => (category.id)).join(','),
                targetCategoryParentId: moveCategoryData.categoryParent ? moveCategoryData.categoryParent.id : 0
            })
        ).pipe(map(categoryMoved => (undefined)));
    }

    /**
     * Check if selected category can be assigned under the target category parent
     * @param moveCategoryData {MoveCategoryData} contains category and its selected parent
     * @return {boolean}
     */
    public isParentCategorySelectionValid(moveCategoryData: MoveCategoryData): boolean {
      const isValid = (category) => {
        // Only siblings are allowed to be moved
        if (!category || !category.id || category.parentId !== moveCategoryData.categories[0].parentId) {
          console.log('[CategoriesService.isParentCategorySelectionValid] invalid category');
          return false;
        }
        // Check if we put the category as a descendant of itself
        const selectedCategoryIdSameAsParent = moveCategoryData.categoryParent &&
          category.id === moveCategoryData.categoryParent.id;

        // Check that the parent category isn't a descendant of the category
        const selectedParentIsDescendantOfCategoryToMove =
          moveCategoryData.categoryParent.fullIds.indexOf(category.id) !== -1;
        return !selectedCategoryIdSameAsParent && !selectedParentIsDescendantOfCategoryToMove;
      };

      if (!moveCategoryData) {
        console.log('[CategoriesService.isParentCategorySelectionValid] invalid move category data parameter');
        return false;
      }

      if (!moveCategoryData.categories || !moveCategoryData.categories.length) {
        console.log('[CategoriesService.isParentCategorySelectionValid] invalid categories parameter');
        return false;
      }

      if (!moveCategoryData.categoryParent || !moveCategoryData.categoryParent.fullIds) {
        console.log('[CategoriesService.isParentCategorySelectionValid] invalid selected parent category');
        return false;
      }

      return moveCategoryData.categories.every(isValid);
    }

    public getCategoryById(id: number): Observable<CategoryData> {
      const category = this._categoriesSearchService.getCachedCategory(id);

      if (!category) {
        return this._categoriesSearchService.getCategory(id);
      }

      return of(category);
    }
}
