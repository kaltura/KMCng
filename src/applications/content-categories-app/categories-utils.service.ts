import {Injectable} from '@angular/core';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { Observable } from 'rxjs';
import {BrowserService} from 'app-shared/kmc-shell';
import {KalturaCategory} from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { throwError } from 'rxjs';

@Injectable()
export class CategoriesUtilsService {

  constructor(private _appLocalization: AppLocalization,
              private _browserService: BrowserService,
              private _logger: KalturaLogger) {
      this._logger = _logger.subLogger('CategoriesUtilsService');
  }

  public confirmDelete(categoryToDelete: KalturaCategory, categories?: KalturaCategory[]): Observable<{ confirmed: boolean, error?: Error, categoryIndex?: number }> {
      this._logger.info(
          `handle confirm delete action, show confirmation`,
          { categoryId: categoryToDelete ? categoryToDelete.id : null }
      );
    if (!categoryToDelete) {
        this._logger.warn(`no category provided, abort action, throw error`);
      return throwError(new Error('Invalid category parameter'));
    }

    return Observable.create(observer => {
      const selectedIndex = categories && categories.indexOf(categoryToDelete);
      if (categories && selectedIndex === -1) {
          this._logger.warn(`provided category is not found, abort action, throw error`);
        observer.error(new Error('category could not be found in given list'));
      } else {
        const hasSubcategories: boolean = categoryToDelete.directSubCategoriesCount > 0;
        let message: string;
        if (this.hasEditWarnings(categoryToDelete)) {
          message = hasSubcategories ?
            this._appLocalization.get('applications.content.categories.deleteAction.deleteWarningSubcategoriesConfirmation') :
            this._appLocalization.get('applications.content.categories.deleteAction.deleteWarningConfirmation');
        } else {
          message = hasSubcategories ?
            this._appLocalization.get('applications.content.categories.deleteAction.deleteSubcategoriesConfirmation') :
            this._appLocalization.get('applications.content.categories.deleteAction.deleteConfirmation');
        }

        this._browserService.confirm(
          {
            header: this._appLocalization.get('applications.content.categories.deleteCategory'),
            message: message,
            accept: () => {
                this._logger.info(`user confirmed, proceed action`);
              observer.next({failed: false, confirmed: true, categoryIndex: selectedIndex});
              observer.complete();
            }, reject: () => {
                  this._logger.info(`user didn't confirm, abort action`);
            observer.next({failed: false, confirmed: false});
            observer.complete();
          }
          }
        );
      }
      return () => {
      }
    });
  }

  // bulk delete
  public confirmDeleteMultiple(categoriesToDelete: KalturaCategory[], categories?: KalturaCategory[]): Observable<{ confirmed: boolean, error?: Error }> {
      this._logger.info(`handle confirm delete multiple action, show confirmation`, { categoriesToDelete });
    return Observable.create(observer => {
      if (!categoriesToDelete || !categoriesToDelete.length || (categories && !categoriesToDelete.every(c => categories.indexOf(c) > -1))) {
          this._logger.warn(`no categories provided, abort action, throw error`);
        observer.error(new Error('At least one of the categories to delete could not be found in given list'));
      } else {
        let message = '';
        const isSubCategoriesExist = !!categoriesToDelete.find(c => {
          return (c.directSubCategoriesCount && c.directSubCategoriesCount > 0);
        });

        if (this.hasEditWarnings(categoriesToDelete)) {
          message = isSubCategoriesExist ?
            this._appLocalization.get('applications.content.categories.deleteActionMultiple.deleteWarningSubcategoriesConfirmation') :
            this._appLocalization.get('applications.content.categories.deleteActionMultiple.deleteWarningConfirmation');
        } else {
          message = isSubCategoriesExist ?
            this._appLocalization.get('applications.content.categories.deleteActionMultiple.deleteSubcategoriesConfirmation') :
            this._appLocalization.get('applications.content.categories.deleteActionMultiple.deleteConfirmation');
        }

        this._browserService.confirm(
          {
            header: this._appLocalization.get('applications.content.categories.deleteCategories'),
            message: message,
            accept: () => {
                this._logger.info(`user confirmed, proceed action`);
              observer.next({confirmed: true});

            }, reject: () => {
                  this._logger.info(`user didn't confirm, abort action`);
            observer.next({confirmed: false});
          }
          }
        );
      }
    });
  }

  public hasEditWarnings(categories: KalturaCategory | KalturaCategory[]): boolean {
    categories = categories && (!Array.isArray(categories)) ? [categories] : categories;
    const editWarningsExists: boolean =
      // Find one of the selected categories that has '__EditWarning' in its 'tags' property
      !!(<KalturaCategory[]>categories).find(category => {
        return (category.tags && category.tags.indexOf('__EditWarning') > -1);
      });

    return editWarningsExists;
  }
}
