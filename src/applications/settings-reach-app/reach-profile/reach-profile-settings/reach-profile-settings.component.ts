import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReachProfileStore } from '../reach-profile-store.service';
import { ReachProfileSettingsWidget } from './reach-profile-settings-widget.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KalturaReachProfile } from "kaltura-ngx-client";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kReachProfileSettings',
  templateUrl: './reach-profile-settings.component.html',
  styleUrls: ['./reach-profile-settings.component.scss']
})
export class ReachProfileSettingsComponent implements OnInit, OnDestroy {
  public _currentProfile: KalturaReachProfile;

  constructor(public _widgetService: ReachProfileSettingsWidget,
              public _profileStore: ReachProfileStore) {
  }

  ngOnInit() {
    this._widgetService.attachForm();

    this._widgetService.data$
      .pipe(cancelOnDestroy(this))
      .pipe(filter(Boolean))
      .subscribe(
          (data: KalturaReachProfile) => {
          this._currentProfile = data;
        });
  }

  ngOnDestroy() {
    this._widgetService.detachForm();
  }
}

