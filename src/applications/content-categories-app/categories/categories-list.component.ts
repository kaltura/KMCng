import {ISubscription} from 'rxjs/Subscription';
import {KalturaCategory} from 'kaltura-typescript-client/types/KalturaCategory';
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import {CategoriesService, NewCategoryData, SortDirection} from './categories.service';
import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';
import {AppLocalization} from "@kaltura-ng/kaltura-common";
import {PopupWidgetComponent} from "@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component";

@Component({
    selector: 'kCategoriesList',
    templateUrl: './categories-list.component.html',
    styleUrls: ['./categories-list.component.scss']
})

export class CategoriesListComponent implements OnInit, OnDestroy {

    public _isBusy = false
    public _blockerMessage: AreaBlockerMessage = null;
    public _selectedCategories: KalturaCategory[] = [];
    public _categories: KalturaCategory[] = [];
    public _categoriesTotalCount: number = null;
    public _selectedCategoryIdToMove: number;
    private categoriesSubscription: ISubscription;
    private querySubscription: ISubscription;
    @ViewChild('moveCategory') moveCategoryPopup: PopupWidgetComponent;

    public _filter = {
        pageIndex: 0,
        freetextSearch: '',
        pageSize: null, // pageSize is set to null by design. It will be modified after the first time loading entries
        sortBy: 'createdAt',
        sortDirection: SortDirection.Desc
    };

    constructor(private _categoriesService: CategoriesService,
                private router: Router,
                private _browserService: BrowserService,
                private _appLocalization: AppLocalization) {
    }

    ngOnInit() {

        this.querySubscription = this._categoriesService.queryData$.subscribe(
            query => {
                this._filter.pageSize = query.pageSize;
                this._filter.pageIndex = query.pageIndex - 1;
                this._filter.sortBy = query.sortBy;
                this._filter.sortDirection = query.sortDirection;
                this._browserService.scrollToTop();
            });

        this.categoriesSubscription = this._categoriesService.categories$.subscribe(
            (data) => {
                this._categories = data.items;
                this._categoriesTotalCount = data.totalCount;
            }
        );
    }

    ngOnDestroy() {
        this.categoriesSubscription.unsubscribe();
        this.querySubscription.unsubscribe();
    }

    public _reload() {
        this._clearSelection();
        this._categoriesService.reload(true);
    }
    _clearSelection() {
        this._selectedCategories = [];
    }

    _onSortChanged(event): void {
        this._categoriesService.reload({
            sortBy: event.field,
            sortDirection: event.order === 1 ? SortDirection.Asc : SortDirection.Desc
        });
    }

    _onPaginationChanged(state: any): void {
        if (state.page !== this._filter.pageIndex || state.rows !== this._filter.pageSize) {

            this._clearSelection();
            this._categoriesService.reload({
                pageIndex: state.page + 1,
                pageSize: state.rows
            });
        }
    }

    _onActionSelected(event: { action: string, categoryID: number }) {
        switch (event.action) {
            case 'edit':
                this.router.navigate(['/content/categories/category', event.categoryID]);
                break;

            case 'delete':
                const currentCategory = this._categories.find(category => category.id == event.categoryID);
                let message: string;
                if (currentCategory.directSubCategoriesCount > 0) {
                    message = this._appLocalization.get('applications.content.categories.confirmDeleteWithSubCategories',
                      { 0: currentCategory.id });
                } else {
                    message = this._appLocalization.get('applications.content.categories.confirmDeleteSingle', { 0: currentCategory.id });
                }
                this._browserService.confirm(
                    {
                        header: this._appLocalization.get('applications.content.categories.deleteCategory'),
                        message: message,
                        accept: () => {
                            this._deleteCategory(event.categoryID);
                        }
                    }
                );
                break;
            case 'moveCategory':
              this._selectedCategoryIdToMove = event.categoryID;
              this.moveCategoryPopup.open();
              break;
            default:
                break;
        }
    }

    private _deleteCategory(categoryId: number): void {
        this._isBusy = true;
        this._blockerMessage = null;
        this._categoriesService.deleteCategory(categoryId).subscribe(
          () => {
            this._isBusy = false;
            this._browserService.showGrowlMessage({
              severity: 'success',
              detail: this._appLocalization.get('applications.content.categories.deleted')
            });
            this._categoriesService.reload(true);
          },
          error => {
            this._isBusy = false;

            this._blockerMessage = new AreaBlockerMessage(
              {
                message: error.message,
                buttons: [
                  {
                    label: this._appLocalization.get('app.common.retry'),
                    action: () => {
                      this._deleteCategory(categoryId);
                    }
                  },
                  {
                    label: this._appLocalization.get('app.common.cancel'),
                    action: () => {
                      this._blockerMessage = null;
                    }
                  }
                ]
              }
            )
          }
        );
      }

    onBulkChange(event): void {
        if (event.reload === true) {
            this._reload();
        }
    }

    onAddNewCategory(newCategory: NewCategoryData): void {
      this._isBusy = true;
      this._blockerMessage = null;
      this._categoriesService.addNewCategory({
        parentCategoryId: newCategory.parentCategoryId,
        name: newCategory.name
      })
        .subscribe(category => {
            this._isBusy = false;
            // todo: add a flag so the categories will be refreshed upon clicking 'back' from the category page
          this.router.navigate([`/content/categories/category/${category.id}/metadata`]);
        },
          error => {
            this._isBusy = false;

            this._blockerMessage = new AreaBlockerMessage(
              {
                message: error.message,
                buttons: [
                  {
                    label: this._appLocalization.get('app.common.cancel'),
                    action: () => {
                      this._blockerMessage = null;
                    }
                  }
                ]
              });
        });
    }

    onMoveCategory(newCategory: NewCategoryData): void {
      this._categoriesService.moveCategory({
        categoryId: this._selectedCategoryIdToMove.toString(),
        targetCategoryParentId: newCategory.parentCategoryId
      })
        .subscribe(category => {
          // todo: implement according to PRD of move category
        },
          error => {
          // todo: add error handling according to PRD of move category
            this._isBusy = false;

            this._blockerMessage = new AreaBlockerMessage(
              {
                message: error.message,
                buttons: [
                  {
                    label: this._appLocalization.get('app.common.cancel'),
                    action: () => {
                      this._blockerMessage = null;
                    }
                  }
                ]
              });
        });
    }
}
