import { NgModule }           from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule, ReactiveFormsModule }        from '@angular/forms';
import { KalturaUIModule } from '@kaltura-ng2/kaltura-ui';
import { DropdownModule } from 'ng2-bootstrap/ng2-bootstrap';
import { TieredMenuModule, CheckboxModule, DataTableModule, SharedModule, InputTextModule, ButtonModule, AccordionModule, PaginatorModule} from 'primeng/primeng';


import { routing} from './content-entries-app.routes';
import { EntriesComponent } from './components/entries.component';
import { KMCShellModule } from 'kmc-shell';
import { KMCContentUIModule } from 'kmc-content-ui';
import {SortDirectionPipe} from "./pipes/sort-direction.pipe";

@NgModule({
  imports:      [
    TieredMenuModule,
    CheckboxModule,
    CommonModule,
    FormsModule,
    routing,
    ReactiveFormsModule,
    KMCShellModule,
    DropdownModule,
    DataTableModule,
    SharedModule,
    InputTextModule,
    ButtonModule,
    AccordionModule,
    KMCContentUIModule,
    PaginatorModule,
    KalturaUIModule],
  declarations: [
    EntriesComponent,
    SortDirectionPipe],
  providers:    []
})
export class ContentEntriesAppModule { }
