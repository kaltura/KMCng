import {KalturaCategory} from 'kaltura-typescript-client/types/KalturaCategory';
import {Injectable, OnDestroy} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {AppLocalization} from '@kaltura-ng/kaltura-common';
import {CategorySectionsList} from './category-sections-list';
import {CategoryWidgetKeys} from '../category-widget-keys';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import {CategoryWidget} from '../category-widget';
import {environment} from 'app-environment';

export interface SectionWidgetItem {
  label: string,
  isValid: boolean,
  attached: boolean,
  key: string
}

@Injectable()
export class CategorySectionsListWidget extends CategoryWidget implements OnDestroy {
  private _sections = new BehaviorSubject<SectionWidgetItem[]>([]);
  public sections$: Observable<SectionWidgetItem[]> = this._sections.asObservable();

  constructor(private _appLocalization: AppLocalization) {
    super('categorySectionsList');
  }

  protected onDataLoading(dataId: any): void {
    this._clearSectionsList();
  }

  protected onActivate(firstTimeActivating: boolean) {
    if (firstTimeActivating) {
      this._initialize();
    }
  }

  protected onDataLoaded(data: KalturaCategory): void {
    this._reloadSections(data);
  }

  private _initialize(): void {
    this.form.widgetsState$
      .cancelOnDestroy(this)
      .subscribe(
        sectionsState => {
          this._sections.getValue().forEach((section: SectionWidgetItem) => {
            const sectionState = sectionsState[section.key];
            const isValid = (!sectionState || sectionState.isBusy || sectionState.isValid || !sectionState.isActive);
            const isAttached = (!!sectionState && sectionState.isAttached);

            if (section.attached !== isAttached || section.isValid !== isValid) {
              section.attached = isAttached;
              section.isValid = isValid;
            }
          });
        }
      );
  }

  /**
   * Do some cleanups if needed once the section is removed
   */
  protected onReset() {
  }

  private _clearSectionsList(): void {
    this._sections.next([]);

  }

  private _reloadSections(category: KalturaCategory): void {
    const sections = [];
    const formWidgetsState = this.form.widgetsState;

    if (category) {
      CategorySectionsList.forEach((section) => {

        const sectionFormWidgetState = formWidgetsState ? formWidgetsState[section.key] : null;
        const isSectionActive = sectionFormWidgetState && sectionFormWidgetState.isActive;

        if (this._isSectionEnabled(section.key, category)) {
          sections.push(
            {
              label: this._appLocalization.get(section.label),
              active: isSectionActive,
              hasErrors: sectionFormWidgetState ? sectionFormWidgetState.isValid : false,
              key: section.key
            }
          );
        }
      });
    }

    this._sections.next(sections);
  }

  private _isSectionEnabled(sectionKey: string, category: KalturaCategory): boolean {
    switch (sectionKey) {
      case CategoryWidgetKeys.Metadata:
        return true;
      case CategoryWidgetKeys.Entitlements:
        // Enable if any of these conditions are met:
        // TODO [kmc] Permissions: showEndUsersTab is set to true
        // KalturaCategory.privacyContexts is defined
        return category.privacyContexts && typeof(category.privacyContexts) !== 'undefined';
      case CategoryWidgetKeys.SubCategories:
        return category.directSubCategoriesCount > 0 &&
          category.directSubCategoriesCount <= environment.categoriesShared.SUB_CATEGORIES_LIMIT;
      default:
        return true;
    }
  }

  ngOnDestroy() {
  }
}
