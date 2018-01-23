import { ModuleWithProviders, NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import {AreaBlockerModule, KalturaUIModule, StickyModule, TooltipModule} from '@kaltura-ng/kaltura-ui';

import {
  ButtonModule,
  CalendarModule,
  CheckboxModule,
  DataTableModule,
  InputTextModule,
  MenuModule,
  PaginatorModule,
  RadioButtonModule, TieredMenuModule,
  TreeModule
} from 'primeng/primeng';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {KalturaCommonModule} from '@kaltura-ng/kaltura-common';
import {AutoCompleteModule, KalturaPrimeNgUIModule} from '@kaltura-ng/kaltura-primeng-ui';
import {PopupWidgetModule} from '@kaltura-ng/kaltura-ui/popup-widget';

import { CategoriesTreeComponent } from './categories-tree/categories-tree.component';
import { CategoriesFilterPrefsComponent } from './categories-filter-preferences/categories-filter-preferences.component';
import { CategoriesFilterComponent } from './categories-filter/categories-filter.component';
import { TagsModule } from '@kaltura-ng/kaltura-ui/tags';
import { FiltersModule } from '@kaltura-ng/mc-shared/filters';
import { CategoriesTreePropagationDirective } from './categories-tree/categories-tree-propagation.directive';
import { CategoriesSearchService } from 'app-shared/content-shared/categories/categories-search.service';
import { CategoryTooltipPipe } from 'app-shared/content-shared/categories/category-tooltip.pipe';

@NgModule({
  imports: [
    AreaBlockerModule,
    TooltipModule,
    AutoCompleteModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    KalturaCommonModule,
    KalturaPrimeNgUIModule,
    KalturaUIModule,
    ButtonModule,
    CalendarModule,
    RadioButtonModule,
    CheckboxModule,
    PopupWidgetModule,
    DataTableModule,
    MenuModule,
    TagsModule,
    PaginatorModule,
    TieredMenuModule,
    InputTextModule,
    StickyModule,
    FiltersModule
  ],
  declarations: [
    CategoriesTreeComponent,
    CategoriesFilterPrefsComponent,
    CategoriesFilterComponent,
      CategoryTooltipPipe,
    CategoriesTreePropagationDirective
  ],
  exports: [
    CategoriesTreeComponent,
    CategoriesFilterPrefsComponent,
    CategoriesFilterComponent,
      CategoryTooltipPipe
  ]
})
export class CategoriesModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: CategoriesModule,
            providers: <any[]>[
                CategoriesSearchService // singleton by design: this service sync inner state when needed thus can be shareable/provided by the module
            ]
        };
    }
}
