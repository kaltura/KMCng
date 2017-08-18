import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AreaBlockerModule } from '@kaltura-ng/kaltura-ui';
import {
  DataTableModule,
  ButtonModule,
  InputTextModule,
  MenuModule,
  SharedModule,
  DropdownModule
} from 'primeng/primeng';
import { KalturaCommonModule } from '@kaltura-ng/kaltura-common';
import { KalturaPrimeNgUIModule } from '@kaltura-ng/kaltura-primeng-ui';
import { KalturaUIModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { PopupWidgetModule } from '@kaltura-ng/kaltura-ui/popup-widget';

import { UploadMenuComponent } from './upload-menu/upload-menu.component';
import { UploadSettingsComponent } from './upload-settings/upload-settings.component';
import { UploadSettingsHandler } from './upload-settings/upload-settings-handler';
import { KMCShellModule } from 'app-shared/kmc-shell';
import { AutofocusDirective } from './directives/input-autofocus';
import { UploadControlService } from './upload-control.service';

@NgModule({
  imports: [
    CommonModule,
    AreaBlockerModule,
    DataTableModule,
    KalturaCommonModule,
    KalturaUIModule,
    TooltipModule,
    ButtonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    DropdownModule,
    PopupWidgetModule,
    MenuModule,
    KalturaPrimeNgUIModule,
    SharedModule
  ],
  declarations: [
    UploadMenuComponent,
    UploadSettingsComponent,
    AutofocusDirective
  ],
  exports: [
    UploadMenuComponent,
    UploadSettingsComponent
  ],
  providers: [
    UploadSettingsHandler,
    UploadControlService
  ]
})
export class KmcUploadAppModule {
}
