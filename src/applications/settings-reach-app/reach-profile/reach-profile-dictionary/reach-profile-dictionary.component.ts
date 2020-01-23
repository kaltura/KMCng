import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReachProfileStore } from '../reach-profile-store.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { KalturaReachProfile } from "kaltura-ngx-client";
import { ReachProfileDictionaryWidget } from "./reach-profile-dictionary-widget.service";

@Component({
    selector: 'kReachProfileDictionary',
    templateUrl: './reach-profile-dictionary.component.html',
    styleUrls: ['./reach-profile-dictionary.component.scss']
})
export class ReachProfileDictionaryComponent implements OnInit, OnDestroy {
    public _currentProfile: KalturaReachProfile;
    
    constructor(public _widgetService: ReachProfileDictionaryWidget,
                public _profileStore: ReachProfileStore) {
    }
    
    ngOnInit() {
        this._widgetService.attachForm();
        
        this._widgetService.data$
            .pipe(cancelOnDestroy(this))
            .filter(Boolean)
            .subscribe(
                data => {
                    this._currentProfile = data;
                });
    }
    
    ngOnDestroy() {
        this._widgetService.detachForm();
    }
}

