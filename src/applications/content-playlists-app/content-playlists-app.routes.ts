import { Route } from '@angular/router';

import { PlaylistsListComponent } from './playlists/playlists-list.component';
import { PlaylistComponent } from './playlist/playlist.component';
import { PlaylistMetadataComponent } from './playlist/playlist-metadata/playlist-metadata.component';
import { PlaylistContentComponent } from './playlist/playlist-content/playlist-content.component';
import { PlaylistWidgetKeys } from './playlist/playlist-widget-keys';

export const routing: Route[] = [
	{path: '', redirectTo: 'list', pathMatch: 'full'},
	{path: 'list', component: PlaylistsListComponent},
	{path: 'playlist/:id', component: PlaylistComponent,
		data : {
			entryRoute : true
		},
		children : [
			{path: '', redirectTo: 'metadata', pathMatch: 'full'},
			{ path: 'metadata', component: PlaylistMetadataComponent, data : { sectionKey : PlaylistWidgetKeys.Metadata }},
			{ path: 'content', component: PlaylistContentComponent, data : { sectionKey : PlaylistWidgetKeys.Content }}
		]
	}
];
