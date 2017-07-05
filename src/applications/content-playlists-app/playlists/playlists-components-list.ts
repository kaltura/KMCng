import { PlaylistsListComponent } from "./playlists-list.component";
import { PlaylistsTableComponent } from './playlists-table.component';
import { PlaylistTypePipe } from './pipes/playlist-type.pipe';
import { PlaylistsAdditionalFiltersComponent } from "./playlists-additional-filters/playlists-additional-filters.component";
import { PrimeTableSortDirectionPipe } from './pipes/prime-table-sort-direction.pipe';

export const PlaylistsComponentsList = [
  PlaylistsListComponent,
  PlaylistsTableComponent,
  PlaylistsAdditionalFiltersComponent,
  PlaylistTypePipe,
  PrimeTableSortDirectionPipe
];
