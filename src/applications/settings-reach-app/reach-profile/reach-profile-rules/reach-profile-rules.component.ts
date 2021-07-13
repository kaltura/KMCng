import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReachProfileStore } from '../reach-profile-store.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { KalturaReachProfile } from "kaltura-ngx-client";
import { ReachProfileRulesWidget } from "./reach-profile-rules-widget.service";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'kReachProfileRules',
  templateUrl: './reach-profile-rules.component.html',
  styleUrls: ['./reach-profile-rules.component.scss']
})
export class ReachProfileRulesComponent implements OnInit, OnDestroy {
  public _currentProfile: KalturaReachProfile;

  constructor(public _widgetService: ReachProfileRulesWidget,
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

