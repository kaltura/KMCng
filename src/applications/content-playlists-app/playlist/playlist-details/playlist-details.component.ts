import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaPlaylist } from 'kaltura-ngx-client';
import { PlaylistDetailsWidget } from './playlist-details-widget.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { AppLocalization } from "@kaltura-ng/mc-shared";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kPlaylistDetails',
  templateUrl: './playlist-details.component.html',
  styleUrls: ['./playlist-details.component.scss']
})
export class PlaylistDetailsComponent implements OnInit, OnDestroy {

  @Input() isRapt: boolean;

  public _currentPlaylist: KalturaPlaylist;
  public _isNew = false;

  constructor(
    public _widgetService: PlaylistDetailsWidget,
    public _appLocalization: AppLocalization) {
  }

  ngOnInit() {
    this._widgetService.attachForm();
    this._widgetService.data$
      .pipe(cancelOnDestroy(this))
      .pipe(filter(Boolean))
      .subscribe((data: KalturaPlaylist) => {
        this._currentPlaylist = data;
        this._isNew = !this._currentPlaylist.id;
      });
  }

  ngOnDestroy() {
    this._widgetService.detachForm();
  }
}

