import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { PlaylistStore } from '../playlist-store.service';

@Component({
  selector: 'kPlaylistContent',
  templateUrl: './playlist-content.component.html',
  styleUrls: ['./playlist-content.component.scss']
})
export class PlaylistContentComponent implements AfterViewInit, OnInit, OnDestroy {

    constructor(public _playlistStore: PlaylistStore) {}

    ngOnInit() {
      /*this._playlistStore.entries$
        .subscribe(
          response => {
            if(response.items) {

            } else {
              // TODO [kmc] missing implementation
            }
          }
        );*/
    }

    ngOnDestroy() {}

    ngAfterViewInit() {}

}

