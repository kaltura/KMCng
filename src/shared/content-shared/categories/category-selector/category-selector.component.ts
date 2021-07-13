import {
    Component,
    EventEmitter, Input, OnChanges,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {ISubscription} from 'rxjs/Subscription';
import {Subject} from 'rxjs';
import {AutoComplete, SuggestionsProviderData} from '@kaltura-ng/kaltura-primeng-ui';
import {
  CategoriesTreeComponent
} from 'app-shared/content-shared/categories/categories-tree/categories-tree.component';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import {CategoriesSearchService} from 'app-shared/content-shared/categories/categories-search.service';

export type SelectedCategory = number | 'missing' | null;

@Component({
    selector: 'kCategorySelector',
    templateUrl: './category-selector.component.html',
    styleUrls: ['./category-selector.component.scss']
})
export class CategorySelectorComponent implements OnDestroy, OnInit, OnChanges {

  @Output() onCategorySelected = new EventEmitter<number>();

  @ViewChild('categoriesTree', { static: true }) _categoriesTree: CategoriesTreeComponent;
  @ViewChild('autoComplete', { static: true }) private _autoComplete: AutoComplete = null;
    @Input() enableNoParentSelection: boolean = true;

  public _categoriesLoaded = false;
  public _selectedCategory: SelectedCategory = 'missing';
  public _selectionTooltip = '';

  private _searchCategoriesSubscription: ISubscription;
  public _categoriesProvider = new Subject<SuggestionsProviderData>();

  constructor(private _categoriesSearchService: CategoriesSearchService,
              private _appLocalization: AppLocalization) {

  }

  ngOnChanges(changes)
  {
      if (typeof changes.enableNoParentSelection !== 'undefined')
      {
          this._updateSelectionTooltip();
      }
  }

  ngOnInit() {
      this._updateSelectionTooltip();
  }

  ngOnDestroy() {

    if (this._searchCategoriesSubscription) {
      this._searchCategoriesSubscription.unsubscribe();
      this._searchCategoriesSubscription = null;
    }
  }

  private _updateSelectionTooltip(): void {
      let tooltip = '';
      if (this._selectedCategory && this._selectedCategory !== 'missing') {
          const selectedCategory = this._categoriesSearchService.getCachedCategory(this._selectedCategory);
          tooltip = this._selectedCategory ? selectedCategory.fullName : '';
      } else {
          tooltip = this._appLocalization.get(`applications.content.addNewCategory.${this.enableNoParentSelection ? 'noParent' : 'noSelection'}`);
      }

      this._selectionTooltip = tooltip ? this._appLocalization.get(
          'applications.content.categories.selectedCategory',
          {0: tooltip}
      ) : null;
  }

  public _onAutoCompleteSearch(event): void {
    this._categoriesProvider.next({ suggestions: [], isLoading: true });

    if (this._searchCategoriesSubscription) {
      // abort previous request
      this._searchCategoriesSubscription.unsubscribe();
      this._searchCategoriesSubscription = null;
    }

    this._searchCategoriesSubscription = this._categoriesSearchService.getSuggestions(event.query).subscribe(data => {
        const suggestions = [];
        const selectedCategoryValue = this._selectedCategory ? this._selectedCategory : null;

        (data || []).forEach(suggestedCategory => {
          const label = suggestedCategory.fullName +
              (suggestedCategory.referenceId ?
              ` (${suggestedCategory.referenceId})` : '');

          const isSelectable = selectedCategoryValue !== suggestedCategory.id;
          suggestions.push({ name: label, isSelectable: isSelectable, item: suggestedCategory });
        });
        this._categoriesProvider.next({ suggestions: suggestions, isLoading: false });
      },
      (err) => {
        this._categoriesProvider.next({ suggestions: [], isLoading: false, errorMessage: <any>(err.message || err) });
      });
  }

  public _onAutoCompleteSelected() {

      const selectedItem = this._autoComplete.getValue();

      // clear user text from component
      this._autoComplete.clearValue();

      if (selectedItem && selectedItem.id) {
          this._selectedCategory = <number>selectedItem.id;
          this.onCategorySelected.emit(this._selectedCategory);

          this._categoriesTree.expandNode(selectedItem.id);
          this._updateSelectionTooltip();
      }
  }

  public _onCategorySelected(category: number) {
      this._selectedCategory = category;
      this._updateSelectionTooltip();
      this.onCategorySelected.emit(this._selectedCategory);
  }

  public _clearSelection(): void {
    this._selectedCategory = null;
    this._updateSelectionTooltip();
    this.onCategorySelected.emit(null);
  }
}
