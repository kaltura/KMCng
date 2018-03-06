import {KalturaCategory} from 'kaltura-ngx-client/api/types/KalturaCategory';
import {Injectable, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AppLocalization, KalturaUtils} from '@kaltura-ng/kaltura-common';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import {CategoryWidget} from '../category-widget';
import {CategoryWidgetKeys} from '../category-widget-keys';
import {KalturaCategoryFilter} from 'kaltura-ngx-client/api/types/KalturaCategoryFilter';
import {KalturaCategoryListResponse} from 'kaltura-ngx-client/api/types/KalturaCategoryListResponse';
import {CategoryListAction} from 'kaltura-ngx-client/api/types/CategoryListAction';
import {KalturaFilterPager} from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import {KalturaDetachedResponseProfile} from 'kaltura-ngx-client/api/types/KalturaDetachedResponseProfile';
import {KalturaResponseProfileType} from 'kaltura-ngx-client/api/types/KalturaResponseProfileType';
import {KalturaCategoryOrderBy} from 'kaltura-ngx-client/api/types/KalturaCategoryOrderBy';
import {KalturaClient, KalturaMultiRequest} from 'kaltura-ngx-client';
import {CategoryUpdateAction} from 'kaltura-ngx-client/api/types/CategoryUpdateAction';
import {BrowserService} from 'app-shared/kmc-shell';
import {CategoryDeleteAction} from 'kaltura-ngx-client/api/types/CategoryDeleteAction';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {CategoriesUtilsService} from '../../categories-utils.service';
import {CategoryService} from '../category.service';
import { modulesConfig } from 'config/modules';

@Injectable()
export class CategorySubcategoriesWidget extends CategoryWidget implements OnDestroy {
  private _subcategories = new BehaviorSubject<KalturaCategory[]>([]);
  public subcategories$ = this._subcategories.asObservable();
  private _subcategoriesMarkedForDelete: KalturaCategory[];

  constructor(private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              private _categoriesUtilsService: CategoriesUtilsService,
              private _categoryService: CategoryService,
              private _appLocalization: AppLocalization) {
    super(CategoryWidgetKeys.SubCategories);
  }

  protected onActivate(firstTimeActivating: boolean) {
    if (this.data && !this.data.directSubCategoriesCount) {
      this._categoryService.openSection(CategoryWidgetKeys.Metadata);
      return;
    }


    super._showLoader();

    return this._loadSubcategories()
      .map(() => {
        super._hideLoader();
        return {failed: false};
      })
      .catch((error, caught) => {
        super._hideLoader();
        super._showActivationError();
        return Observable.of({failed: true, error});
      });
  }

  protected onReset() {
    this._subcategories.next([]);
  }


  private _loadSubcategories(): Observable<void> {
    return this._getSubcategories(this.data)
      .cancelOnDestroy(this, this.widgetReset$)
      .monitor('load Sub-Categories')
      .map(
        response => {
          this._subcategories.next(response.objects || []);
          this._subcategoriesMarkedForDelete = [];
          return undefined;
        }
      );
  }


  private _getSubcategories(parentCategory: KalturaCategory): Observable<KalturaCategoryListResponse> {
    const subcategoriesLimit: number = modulesConfig.contentShared.categories.subCategoriesLimit || 50;
    if (!parentCategory) {
      return Observable.throw(new Error('parentCategory to get subcategories for is not defined'));
    }
    if (parentCategory.directSubCategoriesCount > subcategoriesLimit) {
      return Observable.throw(new Error(`parent category subcategories count exceeds ${{subcategoriesLimit}} limit`));
    }
    try {
      const filter: KalturaCategoryFilter = new KalturaCategoryFilter({
        parentIdEqual: parentCategory.id,
        orderBy: KalturaCategoryOrderBy.partnerSortValueAsc
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
        request.requests.push(new CategoryDeleteAction({
          id: subcategory.id,
          moveEntriesToParentCategory: 1
        }));
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


  public refresh() {
    super._showLoader();

    this._loadSubcategories()
      .cancelOnDestroy(this, this.widgetReset$)
      .subscribe(() => {
          super._hideLoader();
        },
        (error) => {
          super._hideLoader();

          this._showBlockerMessage(new AreaBlockerMessage(
            {
              message:
                this._appLocalization.get('applications.content.categoryDetails.subcategories.errors.applications.content.categoryDetails.subcategories.errors.subcategoriesLoadError'),
              buttons: [
                {
                  label: this._appLocalization.get('app.common.retry'),
                  action: () => {
                    this.refresh();
                  }
                }
              ]
            }
          ), true);
        });
  }

  ngOnDestroy() {
  }

  public addSubcategoryToList({category}: {category: KalturaCategory}) {
    this._subcategories.next([...this._subcategories.getValue(), category]);
    this._categoryService.notifyChangesInCategory();
  }
}
