import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { PartnerProfileStore } from '../partner-profile';

import { KalturaClient } from 'kaltura-ngx-client';
import { AccessControlListAction } from 'kaltura-ngx-client';
import { throwError } from 'rxjs';
import { KalturaAccessControlFilter } from 'kaltura-ngx-client';
import { KalturaAccessControl } from 'kaltura-ngx-client';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { KalturaAccessControlListResponse } from 'kaltura-ngx-client';
import { AppEventsService } from '../app-events';
import { AccessControlProfileUpdatedEvent } from '../events/access-control-profile-updated.event';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { map, catchError, publishReplay, refCount} from 'rxjs/operators';

@Injectable()
export class AccessControlProfileStore extends PartnerProfileStore implements OnDestroy {
  private _cachedProfiles$: Observable<{ items: KalturaAccessControl[] }>;

  constructor(private _kalturaServerClient: KalturaClient, _appEvents: AppEventsService) {
    super();

    _appEvents.event(AccessControlProfileUpdatedEvent)
      .pipe(cancelOnDestroy(this))
      .subscribe(() => {
        this._clearCache();
      });
  }

  ngOnDestroy() {
  }

  private _clearCache(): void {
    this._cachedProfiles$ = null;
  }

  public get(): Observable<{ items: KalturaAccessControl[] }> {
    if (!this._cachedProfiles$) {
      // execute the request
      this._cachedProfiles$ = this._buildGetRequest()
        .pipe(cancelOnDestroy(this))
        .pipe(map(
          response => {
            return ({items: response ? response.objects : []});
          }))
        .pipe(catchError(error => {
          // re-throw the provided error
          this._cachedProfiles$ = null;
          return throwError(new Error('failed to retrieve access control profiles list'));
        }))
        .pipe(publishReplay(1))
        .pipe(refCount());
    }

    return this._cachedProfiles$;
  }

  private _buildGetRequest(): Observable<KalturaAccessControlListResponse> {
    const filter = new KalturaAccessControlFilter({ orderBy: '-createdAt' });
    const pager = new KalturaFilterPager({ pageSize: 1000 });
    return <any>this._kalturaServerClient.request(new AccessControlListAction({ filter, pager }));
  }
}
