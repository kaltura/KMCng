import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { KalturaClient } from 'kaltura-ngx-client';
import { ConversionProfileListAction } from 'kaltura-ngx-client';
import { KalturaConversionProfileFilter } from 'kaltura-ngx-client';
import { KalturaConversionProfileType } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaConversionProfileListResponse } from 'kaltura-ngx-client';
import { KalturaConversionProfile } from 'kaltura-ngx-client';
import { AppEventsService } from 'app-shared/kmc-shared';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranscodingProfilesUpdatedEvent } from 'app-shared/kmc-shared/events';
import { throwError } from 'rxjs';
import { publishReplay, refCount, catchError, map } from 'rxjs/operators';

@Injectable()
export class TranscodingProfileManagement implements OnDestroy {
  private _transcodingProfileCache$;

  constructor(private _serverClient: KalturaClient,
              _appEvents: AppEventsService) {
      _appEvents.event(TranscodingProfilesUpdatedEvent)
          .pipe(cancelOnDestroy(this))
          .subscribe(() => {
              this._clearCache();
          });
  }

    ngOnDestroy() {
    }

    private _clearCache(): void {
        this._transcodingProfileCache$ = null;
    }

  private _loadTranscodingProfiles(): Observable<KalturaConversionProfile[]> {
    return this._serverClient
      .request(
          new ConversionProfileListAction({
              filter: new KalturaConversionProfileFilter({ typeEqual: KalturaConversionProfileType.media }),
              pager: new KalturaFilterPager({ pageSize: 500 })
          })
      )
      .pipe(map((res: KalturaConversionProfileListResponse) => res.objects));
  }

  public get(): Observable<KalturaConversionProfile[]> {
    if (!this._transcodingProfileCache$) {
      this._transcodingProfileCache$ = this._loadTranscodingProfiles()
        .pipe(catchError(err => {
          console.log(`log: [warn] [transcodingProfile-management] Error during load transcoding profiles: ${err}`);
          this._transcodingProfileCache$ = null;
          return throwError(err);
        }))
        .pipe(publishReplay(1))
        .pipe(refCount());
    }

    return this._transcodingProfileCache$;
  }
}
