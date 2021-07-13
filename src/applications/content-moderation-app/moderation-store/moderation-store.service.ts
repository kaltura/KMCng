import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { KalturaModerationFlagListResponse } from 'kaltura-ngx-client';
import { KalturaClient } from 'kaltura-ngx-client';
import { BaseEntryGetAction } from 'kaltura-ngx-client';
import { MediaListFlagsAction } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { UserNotifyBanAction } from 'kaltura-ngx-client';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
      .pipe(map(([entry, flag]) => ({
        entry: entry.result,
        flag: flag.result
      })))
      .pipe(catchError(() => {
        return throwError(new Error(this._appLocalization.get('applications.content.moderationDetails.errors.entryDetails')));
      }));
  }

  public banCreator(userId: string): Observable<void> {
    return this._kalturaServerClient
      .request(new UserNotifyBanAction({ userId }))
      .pipe(catchError(() => {
        return throwError(new Error(this._appLocalization.get('applications.content.moderationDetails.errors.ban')));
      }))
  }
}

