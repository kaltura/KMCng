import { Component, OnDestroy, ViewChild } from '@angular/core';
import {KalturaMediaType} from 'kaltura-ngx-client/api/types/KalturaMediaType';
import {PopupWidgetComponent} from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import {DraftEntry, PrepareEntryService} from './prepare-entry.service';
import {BrowserService} from 'app-shared/kmc-shell';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions/kmc-permissions.service';
import { KMCPermissions } from 'app-shared/kmc-shared/kmc-permissions';
import { ContentEntryViewService } from 'app-shared/kmc-shared/kmc-views/details-views';
import {AppLocalization} from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'kPrepareEntry',
  templateUrl: './prepare-entry.component.html',
  styleUrls: ['./prepare-entry.component.scss'],
  providers: [PrepareEntryService]
})
export class PrepareEntryComponent implements OnDestroy {
  public _selectedMediaType: KalturaMediaType;
  @ViewChild('transcodingProfileSelectMenu') transcodingProfileSelectMenu: PopupWidgetComponent;

  constructor(private _prepareEntryService: PrepareEntryService,
              private _permissionsService: KMCPermissionsService,
              private _contentEntryViewService: ContentEntryViewService,
              private _browserService: BrowserService,
              private _appLocalization: AppLocalization) {
  }

  ngOnDestroy() {
  }

  public prepareEntry(kalturaMediaType: KalturaMediaType) {
    this._selectedMediaType = kalturaMediaType;
    const transcodingProfileSettingPermission = this._permissionsService.hasPermission(KMCPermissions.FEATURE_DRAFT_ENTRY_CONV_PROF_SELECTION);
    if (transcodingProfileSettingPermission) {
      this.transcodingProfileSelectMenu.open();
    } else {
        this._loadEntry({profileId: null});
    }
  }


  private _loadEntry(selectedProfile: { profileId?: number }) {

    /// passing profileId null will cause to create with default profileId
    this._prepareEntryService.createDraftEntry(this._selectedMediaType, selectedProfile.profileId)
        .tag('block-shell')
      .subscribe((draftEntry: DraftEntry) => {
            this._contentEntryViewService.openById(draftEntry.id, true)
                .cancelOnDestroy(this)
                .tag('block-shell')
                .subscribe(() => {
                    this.transcodingProfileSelectMenu.close();
                });
        },
        error => {
          this._browserService.alert({
              header: this._appLocalization.get('app.common.error'),
            message: error.message
          });
        });
  }
}
