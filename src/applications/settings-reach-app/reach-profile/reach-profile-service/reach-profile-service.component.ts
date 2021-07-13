import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReachProfileStore } from '../reach-profile-store.service';
import { ReachProfileServiceWidget } from './reach-profile-service-widget.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KalturaReachProfile } from "kaltura-ngx-client";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kReachProfileService',
  templateUrl: './reach-profile-service.component.html',
  styleUrls: ['./reach-profile-service.component.scss']
})
export class ReachProfileServiceComponent implements OnInit, OnDestroy {
  public _currentProfile: KalturaReachProfile;

  constructor(public _widgetService: ReachProfileServiceWidget,
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

