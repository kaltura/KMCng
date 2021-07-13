import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { PartnerProfileStore } from '../partner-profile';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaStorageProfileStatus } from 'kaltura-ngx-client';
import { KalturaStorageProfileFilter } from 'kaltura-ngx-client';
import { StorageProfileListAction } from 'kaltura-ngx-client';
import { KalturaStorageProfileListResponse } from 'kaltura-ngx-client';
import { KalturaStorageProfile } from 'kaltura-ngx-client';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { throwError } from 'rxjs';
import { map, catchError, publishReplay, refCount } from 'rxjs/operators';

@Injectable()
export class StorageProfilesStore extends PartnerProfileStore implements OnDestroy {

  private _getStorageProfiles$: Observable<{ items: KalturaStorageProfile[] }>;

  constructor(private _kalturaServerClient: KalturaClient) {
    super();
  }

  public get(): Observable<{ items: KalturaStorageProfile[] }> {
    if (!this._getStorageProfiles$) {
      // execute the request
      this._getStorageProfiles$ = this._buildGetRequest()
        .pipe(cancelOnDestroy(this))
        .pipe(map(response => ({ items: response ? response.objects : [] })))
        .pipe(catchError(
          error => {
            // re-throw the provided error
            this._getStorageProfiles$ = null;
            return throwError(error);
          }
        ))
        .pipe(publishReplay(1))
        .pipe(refCount());
    }

    return this._getStorageProfiles$;
  }

  ngOnDestroy() {
  }

  private _buildGetRequest(): Observable<KalturaStorageProfileListResponse> {
    return this._kalturaServerClient.request(new StorageProfileListAction({
      filter: new KalturaStorageProfileFilter({
        statusIn: [KalturaStorageProfileStatus.automatic, KalturaStorageProfileStatus.manual].join(',')
      })
    }));
  }
}
