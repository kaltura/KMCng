import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranscodingProfileStore } from '../transcoding-profile-store.service';
import { TranscodingProfileDetailsWidget } from './transcoding-profile-details-widget.service';
import { KalturaConversionProfileWithAsset } from '../../transcoding-profiles/transcoding-profiles-store/base-transcoding-profiles-store.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kTranscodingProfileDetails',
  templateUrl: './transcoding-profile-details.component.html',
  styleUrls: ['./transcoding-profile-details.component.scss']
})
export class TranscodingProfileDetailsComponent implements OnInit, OnDestroy {
  public _currentProfile: KalturaConversionProfileWithAsset;
  public _isNew = false;

  constructor(public _widgetService: TranscodingProfileDetailsWidget,
              public _profileStore: TranscodingProfileStore) {
  }

  ngOnInit() {
    this._widgetService.attachForm();

    this._widgetService.data$
      .pipe(cancelOnDestroy(this))
      .pipe(filter(Boolean))
      .subscribe(
          (data: KalturaConversionProfileWithAsset) => {
          this._currentProfile = data;
          this._isNew = !this._currentProfile.id;
        });
  }

  ngOnDestroy() {
    this._widgetService.detachForm();
  }
}

