import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import {CategoriesService} from '../categories.service';

import {AppLocalization} from '@kaltura-ng/kaltura-common';


@Component({
  selector: 'kNewCategory',
  templateUrl: './new-category.component.html',
  styleUrls: ['./new-category.component.scss']
})
export class NewCategoryComponent implements OnInit, OnDestroy {

  @Input() parentPopupWidget: PopupWidgetComponent;
  @Input() linkedEntries: {entryId: string}[] = [];
  @Output() onApply = new EventEmitter<{ categoryId: number }>();

  public _blockerMessage: AreaBlockerMessage = null;
  public _selectedParentCategory: number = null;
  public newCategoryForm: FormGroup;

  constructor(private _appLocalization: AppLocalization,
              private _fb: FormBuilder,
              private _categoriesService: CategoriesService) {
    this.newCategoryForm = this._fb.group({
      name: ['', Validators.required]
    });
  }

  ngOnInit() {

  }

  ngOnDestroy() {
  }

  public _onCategorySelected(event: number) {
    this._selectedParentCategory = event;
  }

  public _apply(): void {
    this._blockerMessage = null;
    this._createNewCategory();
  }

  private _createNewCategory() {
    const categoryName = this.newCategoryForm.controls['name'].value;
    if (!categoryName || !categoryName.length) {
      this._blockerMessage = new AreaBlockerMessage({
        message: this._appLocalization.get('applications.content.addNewCategory.errors.requiredName'),
        buttons: [
          {
            label: this._appLocalization.get('app.common.cancel'),
            action: () => {
              this._blockerMessage = null;
            }
          }
        ]
      });
    } else {
      this._categoriesService
        .addNewCategory({
          categoryParentId: this._selectedParentCategory ? this._selectedParentCategory : null,
          name: categoryName,
          linkedEntriesIds: this.linkedEntries.map(entry => entry.entryId)
        })
        .cancelOnDestroy(this)
        .tag('block-shell')
        .subscribe(({category}) => {
            this.onApply.emit({categoryId: category.id});
            if (this.parentPopupWidget) {
              this.parentPopupWidget.close();
            }
          },
          error => {

              const message = 'An error occurred while trying to add new category';
            this._blockerMessage = new AreaBlockerMessage(
              {
                message: error.message || message,
                buttons: [
                  {
                    label: this._appLocalization.get('app.common.ok'),
                    action: () => {
                      this._blockerMessage = null;
                    }
                  }
                ]
              });
          });
    }
  }

  public _cancel(): void {
    if (this.parentPopupWidget) {
      this.parentPopupWidget.close();
    }
  }
}
