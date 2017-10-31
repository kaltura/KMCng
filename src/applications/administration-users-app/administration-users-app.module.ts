import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routing } from './administration-users-app.routes';
import { AdministrationUsersComponent } from './administration-users.component';
import { UsersComponentsList } from './users-table/users-components-list';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { AreaBlockerModule } from '@kaltura-ng/kaltura-ui';
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
      RouterModule.forChild(routing)
    ],
    declarations: [
      AdministrationUsersComponent,
      UsersComponentsList
    ],
    exports: [],
    providers: []
})
export class AdministrationUsersAppModule {}
