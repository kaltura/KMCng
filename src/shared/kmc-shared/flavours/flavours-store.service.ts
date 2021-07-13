import {Injectable, OnDestroy} from '@angular/core';
import { Observable } from 'rxjs';
import {PartnerProfileStore} from '../partner-profile';
import {KalturaClient} from 'kaltura-ngx-client';
import {FlavorParamsListAction} from 'kaltura-ngx-client';
import {KalturaFlavorParams} from 'kaltura-ngx-client';
import {KalturaFilterPager} from 'kaltura-ngx-client';
import {KalturaFlavorParamsListResponse} from 'kaltura-ngx-client';
import {KalturaDetachedResponseProfile} from 'kaltura-ngx-client';
import {KalturaResponseProfileType} from 'kaltura-ngx-client';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { throwError } from 'rxjs';
import { map, catchError, publishReplay, refCount } from 'rxjs/operators';

@Injectable()
export class FlavoursStore extends PartnerProfileStore implements OnDestroy {

  private _getFlavorsFilters$: Observable<{ items: KalturaFlavorParams[] }>;

  constructor(private _kalturaServerClient: KalturaClient) {
    super();
  }

  public get(): Observable<{ items: KalturaFlavorParams[] }> {
    if (!this._getFlavorsFilters$) {
      // execute the request
      this._getFlavorsFilters$ = this._buildGetRequest()
        .pipe(cancelOnDestroy(this))
        .pipe(map(
          response => {
            return ({items: response ? response.objects : []});
          }))
        .pipe(catchError(error => {
            // re-throw the provided error
            this._getFlavorsFilters$ = null;
            return throwError(new Error('failed to retrieve flavors list'));
        }))
        .pipe(publishReplay(1))
        .pipe(refCount());
    }

    return this._getFlavorsFilters$;
  }

  ngOnDestroy()
  {
  }

  private _buildGetRequest(): Observable<KalturaFlavorParamsListResponse> {

    const responseProfile: KalturaDetachedResponseProfile = new KalturaDetachedResponseProfile(
      {
        fields: 'id,format,name,width,height,videoCodec,audioBitrate,videoBitrate,tags',
        type: KalturaResponseProfileType.includeFields
      }
    );

    const favourParamsPager = new KalturaFilterPager();
    favourParamsPager.pageSize = 500;

    return this._kalturaServerClient.request(new FlavorParamsListAction({pager: favourParamsPager})
        .setRequestOptions({
            responseProfile
        }));
  }
}
