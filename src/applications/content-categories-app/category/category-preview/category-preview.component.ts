import {ActionTypes, CategoryService} from './../category.service';
import {AppLocalization} from '@kaltura-ng/kaltura-common';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {KalturaCategory} from 'kaltura-typescript-client/types/KalturaCategory';

@Component({
  selector: 'kCategoryPreview',
  templateUrl: './category-preview.component.html',
  styleUrls: ['./category-preview.component.scss']
})
export class CategoryPreviewComponent implements OnInit, OnDestroy {
  public _currentCategory: KalturaCategory;

  constructor(private _categoryStore: CategoryService,
    private _appLocalization: AppLocalization) {
  }




  ngOnInit() {
    this._categoryStore.state$
      .cancelOnDestroy(this)
      .subscribe(
      status => {

        if (status) {
          switch (status.action) {
            case ActionTypes.CategoryLoading:
              break;
            case ActionTypes.CategoryLoaded:
              this._currentCategory = this._categoryStore.category;
              break;
            case ActionTypes.CategoryLoadingFailed:
              break;
            case ActionTypes.CategorySaving:
              break;
            case ActionTypes.CategorySavingFailed:
              break;
            case ActionTypes.CategoryDataIsInvalid:
              break;
            case ActionTypes.ActiveSectionBusy:
              break;
            case ActionTypes.CategoryPrepareSavingFailed:
              break;
            default:
              break;
          }
        }
      },
      error => {
        // TODO [kmc] navigate to error page
        throw error;
      });
  }


  ngOnDestroy() {
  }
}
