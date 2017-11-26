import {Component, OnDestroy, OnInit} from '@angular/core';
import {KalturaCategory} from 'kaltura-typescript-client/types/KalturaCategory';
import {CategorySubcategoriesWidget} from './category-subcategories-widget.service';


@Component({
  selector: 'kCategorySubcategories',
  templateUrl: './category-subcategories.component.html',
  styleUrls: ['./category-subcategories.component.scss']
})
export class CategorySubcategoriesComponent implements OnInit, OnDestroy {

  public _emptyMessage: string = null; // todo: implement
  public _selectedSubcategories: KalturaCategory[] = [];
  public _subcategories: KalturaCategory[] = [];
  public _subcategoriesCount: number;

  constructor(public _widgetService: CategorySubcategoriesWidget) {
  }

  public rowTrackBy: Function = (index: number, item: any) => {
    return item.id
  };

  ngOnInit() {
    this._widgetService.attachForm();
    this._widgetService.subcategories$.subscribe(subcategories => {
      this._subcategories = subcategories;
      this._subcategoriesCount = subcategories.length;
    })
  }

  ngOnDestroy() {
    this._widgetService.detachForm();
  }

  public _clearSelection() {
    this._selectedSubcategories = [];
  }

  public _onActionSelected(event: { action: 'delete' | 'moveUp' | 'moveDown', subcategory: KalturaCategory }): void {
    this._clearSelection();
    this._widgetService.onActionSelected(event);
  }

  public _deleteSelected(selectedSubcategories: KalturaCategory[]): void {
    // this._clearSelection();
    this._widgetService.deleteSelectedSubcategories(selectedSubcategories);
  }
}
