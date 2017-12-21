import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routing } from './administration-users-app.routes';
import { AdministrationUsersComponent } from './administration-users.component';
import { UsersComponentsList } from './users/users-components-list';
import { EditUserComponent } from './users/edit-user/edit-user.component';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { AreaBlockerModule, KalturaUIModule, TooltipModule, StickyModule } from '@kaltura-ng/kaltura-ui';
import { KalturaPrimeNgUIModule } from "@kaltura-ng/kaltura-primeng-ui";
import {
  ButtonModule,
  DataTableModule,
  DropdownModule,
  MenuModule,
  PaginatorModule
} from 'primeng/primeng';
import { KalturaCommonModule } from '@kaltura-ng/kaltura-common';
import { PopupWidgetModule } from '@kaltura-ng/kaltura-ui/popup-widget';

@NgModule({
    imports: [
      CommonModule,
      AreaBlockerModule,
      DataTableModule,
      KalturaCommonModule,
      PaginatorModule,
      MenuModule,
      ButtonModule,
      PopupWidgetModule,
      FormsModule,
      ReactiveFormsModule,
      KalturaPrimeNgUIModule,
      DropdownModule,
      KalturaUIModule,
      TooltipModule,
      StickyModule,
      RouterModule.forChild(routing)
    ],
    declarations: [
      AdministrationUsersComponent,
      UsersComponentsList,
      EditUserComponent
    ],
    exports: [],
    providers: []
})
export class AdministrationUsersAppModule {}
