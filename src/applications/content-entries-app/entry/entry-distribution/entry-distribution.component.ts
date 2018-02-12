import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { EntryDistributionWidget, ExtendedKalturaEntryDistribution } from './entry-distribution-widget.service';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { KalturaDistributionProfile } from 'kaltura-ngx-client/api/types/KalturaDistributionProfile';


@Component({
  selector: 'kEntryDistribution',
  templateUrl: './entry-distribution.component.html',
  styleUrls: ['./entry-distribution.component.scss']
})
export class EntryDistributionComponent implements OnInit, OnDestroy {
  @ViewChild('editProfile') _editProfilePopup: PopupWidgetComponent;

  public _loading = false;
  public _loadingError = null;
  public _selectedDistributedProfile: ExtendedKalturaEntryDistribution;
  public _selectedUndistributedProfile: KalturaDistributionProfile;

  constructor(public _widgetService: EntryDistributionWidget) {
  }


  ngOnInit() {
    this._widgetService.attachForm();
  }

  ngOnDestroy() {
    this._widgetService.detachForm();
  }

  public _distributeProfile(profile: KalturaDistributionProfile): void {
    this._selectedUndistributedProfile = profile;
    this._selectedDistributedProfile = null;
    this._editProfilePopup.open();
  }

  public _editProfile(profile: ExtendedKalturaEntryDistribution): void {
    this._widgetService.distributionProfiles$.partnerProfiles
      .cancelOnDestroy(this)
      .subscribe(({ items }) => {
        this._selectedDistributedProfile = profile;
        this._selectedUndistributedProfile = items.find(({ id }) => {
          return profile.distributionProfileId === id
        });
        this._editProfilePopup.open();
      });
  }

  public _distributeSelectedProfile(payload: { entryId: string, profileId: number, submitWhenReady: boolean }): void {
    this._widgetService.distributeProfile(payload, () => {
      this._editProfilePopup.close();
    });
  }

  public _updateSelectedProfile(): void {

  }
}

