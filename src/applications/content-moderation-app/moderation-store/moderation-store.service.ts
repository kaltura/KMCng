import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { KalturaModerationFlagListResponse } from 'kaltura-ngx-client/api/types/KalturaModerationFlagListResponse';
import { KalturaClient } from 'kaltura-ngx-client';
import { BaseEntryGetAction } from 'kaltura-ngx-client/api/types/BaseEntryGetAction';
import { MediaListFlagsAction } from 'kaltura-ngx-client/api/types/MediaListFlagsAction';
import { KalturaFilterPager } from 'kaltura-ngx-client/api/types/KalturaFilterPager';
import { UserNotifyBanAction } from 'kaltura-ngx-client/api/types/UserNotifyBanAction';
import { AppLocalization } from '@kaltura-ng/kaltura-common/localization/app-localization.service';

@Injectable()
export class ModerationStore implements OnDestroy {
  constructor(private _kalturaServerClient: KalturaClient, private _appLocalization: AppLocalization) {
  }

  ngOnDestroy() {
  }

  public loadEntryModerationDetails(entryId: string): Observable<{ entry: KalturaMediaEntry, flag: KalturaModerationFlagListResponse }> {
    return this._kalturaServerClient
      .multiRequest([
        new BaseEntryGetAction(
          {
            entryId: entryId,
          }
        ).setRequestOptions({
            acceptedTypes: [KalturaMediaEntry]
        }),
        new MediaListFlagsAction({
          entryId: entryId,
          pager: new KalturaFilterPager({
            pageSize: 500,
            pageIndex: 0
          })
        })
      ])
        .monitor('ModerationStore: loadEntryModerationDetails')
      .map(([entry, flag]) => ({
        entry: entry.result,
        flag: flag.result
      }))
      .catch(() => {
        return Observable.throw(new Error(this._appLocalization.get('applications.content.moderationDetails.errors.entryDetails')));
      });
  }

  public banCreator(userId: string): Observable<void> {
    return this._kalturaServerClient
      .request(new UserNotifyBanAction({ userId }))
        .monitor('ModerationStore: banCreator')
      .catch(() => {
        return Observable.throw(new Error(this._appLocalization.get('applications.content.moderationDetails.errors.ban')));
      });
  }
}

