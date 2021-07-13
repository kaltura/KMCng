import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DetailsBarModule} from '@kaltura-ng/kaltura-ui';
import {TagsModule} from '@kaltura-ng/kaltura-ui';
import {KMCShellModule} from 'app-shared/kmc-shell';

import {routing} from './content-entries-app.routes';
import {ContentEntriesComponent} from './content-entries.component';

import {DynamicMetadataFormModule} from 'app-shared/kmc-shared';

import {LocalizationModule} from '@kaltura-ng/mc-shared';
import {KalturaPrimeNgUIModule} from '@kaltura-ng/kaltura-primeng-ui';
import {AreaBlockerModule, KalturaUIModule, StickyModule, TooltipModule} from '@kaltura-ng/kaltura-ui';
import {AutoCompleteModule} from '@kaltura-ng/kaltura-primeng-ui';
import {AutoCompleteModule as PrimeAutoCompleteModule} from 'primeng/autocomplete';
import {SliderModule} from '@kaltura-ng/kaltura-primeng-ui';
import {PopupWidgetModule} from '@kaltura-ng/kaltura-ui';
import {DynamicFormModule} from '@kaltura-ng/kaltura-ui';
import {DynamicFormModule as PrimeDynamicFormModule} from '@kaltura-ng/kaltura-primeng-ui';
import {EntryComponentsList} from './entry/entry-components-list';
import {EntriesComponentsList} from './entries/entries-components-list';

import {EntryCanDeactivate} from './entry/entry-can-deactivate.service';
import {EntriesModule} from 'app-shared/content-shared/entries/entries.module';
import {ContentEntriesAppService} from './content-entries-app.service';
import {CategoriesModule} from 'app-shared/content-shared/categories/categories.module';
import {CopyToClipboardModule} from '@kaltura-ng/mc-shared';
import {KEditHosterModule} from 'app-shared/kmc-shared/kedit-hoster/kedit-hoster.module';
import { KMCPermissionsModule } from 'app-shared/kmc-shared/kmc-permissions';
import { TableModule } from 'primeng/table';
import { EntriesListService } from './entries/entries-list.service';
import { InputHelperModule } from '@kaltura-ng/kaltura-ui';
import { AnalyticsLiveModule } from 'app-shared/kmc-shared/analytics-live/analytics-live.module';
import { KPTableModule } from '@kaltura-ng/kaltura-primeng-ui';
import { ClearableInputModule } from '@kaltura-ng/kaltura-primeng-ui';
import { DateFormatModule } from 'app-shared/kmc-shared/date-format/date-format.module';
import { ToggleLiveComponent } from './entry/components/toggle-live/toggle-live.component';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SharedModule } from 'primeng/api';
import { SpinnerModule } from 'primeng/spinner';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { TreeModule } from 'primeng/tree';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ConfirmationService } from 'primeng/api';
import { InputSwitchModule } from 'primeng/inputswitch';

@NgModule({
  imports: [
    AccordionModule,
    AreaBlockerModule,
    AutoCompleteModule,
    PrimeAutoCompleteModule,
    SliderModule,
    ButtonModule,
    CalendarModule,
    CheckboxModule,
    CommonModule,
    ConfirmDialogModule,
    CategoriesModule,
    DropdownModule,
    DynamicFormModule,
    FormsModule,
    InputTextareaModule,
    InputTextModule,
    LocalizationModule,
    DynamicMetadataFormModule,
    KalturaPrimeNgUIModule,
    KalturaUIModule,
    KMCShellModule,
    MenuModule,
    MultiSelectModule,
    PaginatorModule,
    PopupWidgetModule,
    PrimeDynamicFormModule,
    RadioButtonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routing),
    SharedModule,
    SpinnerModule,
    TagsModule,
    TieredMenuModule,
    TooltipModule,
    TreeModule,
    DetailsBarModule,
    EntriesModule,
    StickyModule,
    CopyToClipboardModule,
    OverlayPanelModule,
    KEditHosterModule,
    StickyModule,
    KMCPermissionsModule,
    TableModule,
    InputSwitchModule,
    InputHelperModule,
    AnalyticsLiveModule,
    KPTableModule,
    ClearableInputModule,
    DateFormatModule,
  ],
  declarations: [
    ContentEntriesComponent,
    EntryComponentsList,
    EntriesComponentsList,
    ToggleLiveComponent,
  ],
  exports: [],
  providers: [
    ConfirmationService,
    EntryCanDeactivate,
    EntriesListService,
    ContentEntriesAppService
  ],
})
export class ContentEntriesAppModule {
}
