import {KalturaCategory} from 'kaltura-typescript-client/types/KalturaCategory';
import {Injectable, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AppLocalization, KalturaUtils} from '@kaltura-ng/kaltura-common';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import {CategoryWidget} from '../category-widget';
import {CategoryWidgetKeys} from '../category-widget-keys';
import {KalturaCategoryFilter} from 'kaltura-typescript-client/types/KalturaCategoryFilter';
import {KalturaCategoryListResponse} from 'kaltura-typescript-client/types/KalturaCategoryListResponse';
import {CategoryListAction} from 'kaltura-typescript-client/types/CategoryListAction';
import {environment} from 'app-environment';
import {KalturaFilterPager} from 'kaltura-typescript-client/types/KalturaFilterPager';
import {KalturaDetachedResponseProfile} from 'kaltura-typescript-client/types/KalturaDetachedResponseProfile';
import {KalturaResponseProfileType} from 'kaltura-typescript-client/types/KalturaResponseProfileType';
import {KalturaCategoryOrderBy} from 'kaltura-typescript-client/types/KalturaCategoryOrderBy';
import {KalturaClient} from '@kaltura-ng/kaltura-client';
import {KalturaMultiRequest} from 'kaltura-typescript-client';
import {CategoryUpdateAction} from 'kaltura-typescript-client/types/CategoryUpdateAction';
import {BrowserService} from 'app-shared/kmc-shell';
import {CategoryDeleteAction} from 'kaltura-typescript-client/types/CategoryDeleteAction';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {CategoriesUtilsService} from '../../categories-utils.service';

@Injectable()
export class CategorySubcategoriesWidget extends CategoryWidget implements OnDestroy {
  private _subcategories = new BehaviorSubject<KalturaCategory[]>([]);
  public subcategories$ = this._subcategories.asObservable();
  private _subcategoriesMarkedForDelete: KalturaCategory[];

  constructor(private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              private _categoriesUtilsService: CategoriesUtilsService,
              private _appLocalization: AppLocalization) {
    super(CategoryWidgetKeys.SubCategories);
  }

  protected onActivate(firstTimeActivating: boolean): Observable<{ failed: boolean }> {
    return this._fetchSubcategories('activation', true);

  }

  protected onReset() {
  }

  public _fetchSubcategories(origin: 'activation' | 'reload', reset: boolean = true, showLoader: boolean = true): Observable<{ failed: boolean, error?: Error }> {
    return Observable.create(observer => {
      if (showLoader) {
        super._showLoader();
      }
      if (reset) {
        this._subcategories.next([]);
        this._subcategoriesMarkedForDelete = [];
      }

      let requestSubscription = this._getSubcategories(this.data)
        .monitor('get category subcategories')
        .cancelOnDestroy(this, this.widgetReset$)
        .subscribe(
          response => {
            super._hideLoader();
            this._subcategories.next(response.objects || []);
            this._subcategoriesMarkedForDelete = [];
            observer.next({failed: false});
            observer.complete();
          }, error => {
            this._subcategories.next([]);
            super._hideLoader();
            if (origin === 'activation') {
              super._showActivationError();
            } else {
              this._showBlockerMessage(new AreaBlockerMessage(
                {
                  message: this._appLocalization.get('applications.content.entryDetails.errors.flavorsLoadError'),
                  buttons: [
                    {
                      label: this._appLocalization.get('applications.content.entryDetails.errors.retry'),
                      action: () => {
                        this.refresh(reset);
                      }
                    }
                  ]
                }
              ), true);
            }
            observer.error({failed: true, error});
          }
        );
      return () => {
        if (requestSubscription) {
          requestSubscription.unsubscribe();
          requestSubscription = null;
        }
      }
    });
  }

  private _getSubcategories(parentCategory: KalturaCategory): Observable<KalturaCategoryListResponse> {
    const subcategoriesLimit: number = environment.categoriesShared.SUB_CATEGORIES_LIMIT || 50;
    if (!parentCategory) {
      return Observable.throw(new Error('parentCategory to get subcategories for is not defined'));
    }
    if (parentCategory.directSubCategoriesCount > subcategoriesLimit) {
      return Observable.throw(new Error(`parent category subcategories count exceeds ${{subcategoriesLimit}} limit`));
    }
    try {
      const filter: KalturaCategoryFilter = new KalturaCategoryFilter({
        parentIdEqual: parentCategory.id,
        orderBy: KalturaCategoryOrderBy.partnerSortValueAsc.toString()
      });
      const pagination: KalturaFilterPager = new KalturaFilterPager(
        {
          pageSize: subcategoriesLimit,
          pageIndex: 1
        }
      );

      const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile({
        type: KalturaResponseProfileType.includeFields,
        fields: 'id,name, createdAt, directSubCategoriesCount, entriesCount, tags'
      });

      // build the request
      return <any>this._kalturaClient.request(
        new CategoryListAction({
          filter,
          pager: pagination,
          responseProfile
        })
      );
    } catch (err) {
      return Observable.throw(err);
    }
  }

  public onActionSelected({action, subcategory}: { action: 'delete' | 'moveUp' | 'moveDown', subcategory: KalturaCategory }): void {
    switch (action) {
      case 'delete':
        this._deleteSubcategory(subcategory);
        break;
      case 'moveUp':
        this._moveUpSubcategories([subcategory]);
        break;
      case 'moveDown':
        this._moveDownSubcategories([subcategory]);
        break;
      default:
        break;
    }
  }

  private _deleteSubcategory(subcategory: KalturaCategory) {
    this._categoriesUtilsService.confirmDelete(subcategory, this._subcategories.getValue())
      .subscribe(confirmationResult => {
        if (confirmationResult.confirmed) {
          this._subcategories.getValue().splice(confirmationResult.categoryIndex, 1);
          this._subcategoriesMarkedForDelete.push(subcategory);
          this._setDirty();
          this._subcategories.next(this._subcategories.getValue());
        }
      }, error => {
        const deleteError = new AreaBlockerMessage({
          message: this._appLocalization.get('applications.content.categoryDetails.subcategories.errors.categoryCouldNotBeDeleted'),
          buttons: [{
            label: this._appLocalization.get('app.common.ok'),
            action: () => {
              this._removeBlockerMessage();
            }
          }]
        });
        this._showBlockerMessage(deleteError, false);
      });
  }

  public deleteSelectedSubcategories(subcategories: KalturaCategory[]): void {
    this._categoriesUtilsService.confirmDeleteMultiple(subcategories, this._subcategories.getValue())
      .subscribe(result => {
        if (result.confirmed) {
          setTimeout(() => { // need to use a timeout between multiple confirm dialogues (if more than 50 entries are selected)
            let deleted = false;
            subcategories.forEach((category) => {
              const selectedIndex = this._subcategories.getValue().indexOf(category);
              if (selectedIndex > -1) {
                this._subcategories.getValue().splice(selectedIndex, 1);
                this._subcategoriesMarkedForDelete.push(category);
                deleted = true;
              }
            });
            if (deleted) {
              this._subcategories.next(this._subcategories.getValue());
              this._setDirty();
            }
          }, 0);
        }
      }, error => {
        const deleteError = new AreaBlockerMessage({
          message: this._appLocalization.get('applications.content.categoryDetails.subcategories.errors.categoriesCouldNotBeDeleted'),
          buttons: [{
            label: this._appLocalization.get('app.common.ok'),
            action: () => {
              this._removeBlockerMessage();
            }
          }]
        });
        this._showBlockerMessage(deleteError, false);
      });
  }


  public moveSubcategories({items, direction}: { items: KalturaCategory[], direction: 'up' | 'down' }): void {
    if (direction === 'up') {
      this._moveUpSubcategories(items);
    } else {
      this._moveDownSubcategories(items);
    }
  }

  private _moveUpSubcategories(selectedSubcategories: KalturaCategory[]): void {
    if (KalturaUtils.moveUpItems(this._subcategories.getValue(), selectedSubcategories)) {
      this._setDirty();
    }
  }

  private _moveDownSubcategories(selectedSubcategories: KalturaCategory[]): void {
    if (KalturaUtils.moveDownItems(this._subcategories.getValue(), selectedSubcategories)) {
      this._setDirty();
    }
  }

  protected onDataSaving(newData: KalturaCategory, request: KalturaMultiRequest): void {
    if (this.isDirty) {
      this._subcategoriesMarkedForDelete.forEach(subcategory => {
        request.requests.push(new CategoryDeleteAction({id: subcategory.id}));
      });
      this._subcategories.getValue().forEach((subcategory, index) => {
        request.requests.push(new CategoryUpdateAction({
          id: subcategory.id,
          category: new KalturaCategory({
            partnerSortValue: index
          })
        }));
      });
    }
  }

  private _setDirty(): void {
    this.updateState({isDirty: true});
  }


  public refresh(reset = false, showLoader = true) {
    this._fetchSubcategories('reload', reset, showLoader)
      .cancelOnDestroy(this, this.widgetReset$)
      .subscribe(() => {
        // reload flavors on refresh
      });
  }

  ngOnDestroy() {
  }
}
