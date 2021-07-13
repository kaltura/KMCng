import { Injectable, OnDestroy } from '@angular/core';
import { DistributionProfileDeleteAction, DistributionProfileListAction, KalturaClient, KalturaDistributionProfileFilter,
    KalturaDistributionProfileListResponse, KalturaDistributionProfileStatus, KalturaFilterPager } from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { throwError } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Injectable()
export class DistributionService implements OnDestroy{

  constructor(private _kalturaServerClient: KalturaClient) {
  }

  public loadDistributionProfiles(): Observable<KalturaDistributionProfileListResponse> {
    const pager = new KalturaFilterPager({pageSize: 500, pageIndex: 0});
    const filter = new KalturaDistributionProfileFilter({statusEqual: KalturaDistributionProfileStatus.enabled})
    const request = new DistributionProfileListAction({pager, filter});
    return this._kalturaServerClient.request(request).pipe(cancelOnDestroy(this));
  }

  public deleteProfile(id: number): Observable<void> {
      if (!id) {
          return throwError(new Error('Error occurred while trying to delete profile'));
      }
      return this._kalturaServerClient.request(new DistributionProfileDeleteAction({id})).pipe(cancelOnDestroy(this));
  }

  ngOnDestroy() {
  }

}
