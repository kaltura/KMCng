import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { routing } from './content-playlists-app.routes';

import { AreaBlockerModule } from '@kaltura-ng/kaltura-ui';
import {
	DataTableModule,
	PaginatorModule,
	ButtonModule,
	TieredMenuModule,
	CheckboxModule,
	InputTextModule,
	CalendarModule,
	MenuModule,
	SharedModule
} from 'primeng/primeng';
import { KalturaCommonModule } from '@kaltura-ng/kaltura-common';
import { KalturaPrimeNgUIModule } from '@kaltura-ng/kaltura-primeng-ui';
import {
	KalturaUIModule,
	TooltipModule
} from '@kaltura-ng/kaltura-ui';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui/auto-complete';
import { TagsModule } from '@kaltura-ng/kaltura-ui/tags';
import { PopupWidgetModule } from '@kaltura-ng/kaltura-ui/popup-widget';

import { ContentPlaylistsComponent } from './content-playlists.component';
import { PlaylistsComponentsList } from './playlists/playlists-components-list';
import { PlaylistComponentsList } from './playlist/playlist-components-list';
import { PlaylistsStore } from './playlists/playlists-store/playlists-store.service';
import { PlaylistStore } from './playlist/playlist-store.service';
import { BulkDeleteService } from './playlists/bulk-service/bulk-delete.service';

@NgModule({
    imports: [
      CommonModule,
      AreaBlockerModule,
      DataTableModule,
      KalturaCommonModule,
      KalturaUIModule,
      PaginatorModule,
      TooltipModule,
      ButtonModule,
      TieredMenuModule,
      CheckboxModule,
      FormsModule,
      ReactiveFormsModule,
      InputTextModule,
      PopupWidgetModule,
      CalendarModule,
      MenuModule,
      TagsModule,
      KalturaPrimeNgUIModule,
      AutoCompleteModule,
      SharedModule,
      RouterModule.forChild(routing)
    ],
    declarations: [
      ContentPlaylistsComponent,
      PlaylistsComponentsList,
      PlaylistComponentsList
    ],
    exports: [],
    providers: [
      PlaylistsStore,
      PlaylistStore,
      BulkDeleteService
	],
})
export class ContentPlaylistsAppModule {
}
