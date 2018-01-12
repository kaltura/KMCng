import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DetailsBarModule } from '@kaltura-ng/kaltura-ui/details-bar';

import { routing } from './content-playlists-app.routes';

import { AreaBlockerModule, KalturaUIModule, StickyModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import {
  ButtonModule, CalendarModule, CheckboxModule, DataTableModule, DropdownModule, InputTextModule, MenuModule, PaginatorModule,
  RadioButtonModule,
  SharedModule, TieredMenuModule
} from 'primeng/primeng';
import { KalturaCommonModule } from '@kaltura-ng/kaltura-common';
import { KalturaPrimeNgUIModule } from '@kaltura-ng/kaltura-primeng-ui';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui/auto-complete';
import { TagsModule } from '@kaltura-ng/kaltura-ui/tags';
import { PopupWidgetModule } from '@kaltura-ng/kaltura-ui/popup-widget';

import { ContentPlaylistsComponent } from './content-playlists.component';
import { PlaylistsComponentsList } from './playlists/playlists-components-list';
import { PlaylistComponentsList } from './playlist/playlist-components-list';
import { PlaylistCanDeactivate } from './playlist/playlist-can-deactivate.service';
import { EntriesModule } from 'app-shared/content-shared/entries/entries.module';
import { FiltersModule } from '@kaltura-ng/mc-shared/filters/filters.module';
import { SliderModule } from '@kaltura-ng/kaltura-primeng-ui/slider/slider.module';

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
    RadioButtonModule,
    TagsModule,
    KalturaPrimeNgUIModule,
    AutoCompleteModule,
    SharedModule,
    DetailsBarModule,
    RouterModule.forChild(routing),
    StickyModule,
    EntriesModule,
    FiltersModule,
    DropdownModule,
    SliderModule
  ],
  declarations: [
    ContentPlaylistsComponent,
    PlaylistsComponentsList,
    PlaylistComponentsList
  ],
  exports: [],
  providers: [
    PlaylistCanDeactivate
  ]
})
export class ContentPlaylistsAppModule {
}
