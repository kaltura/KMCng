import {Injectable} from '@angular/core';
import {KalturaClient} from 'kaltura-ngx-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {ConversionProfileListAction} from 'kaltura-ngx-client';
import {KalturaConversionProfileFilter} from 'kaltura-ngx-client';
import {KalturaConversionProfileType} from 'kaltura-ngx-client';
import {KalturaFilterPager} from 'kaltura-ngx-client';
import {KalturaConversionProfile} from 'kaltura-ngx-client';

@Injectable()
export class KalturaLiveStreamService {

  constructor(private _kalturaServerClient: KalturaClient) {
  }

  public getKalturaConversionProfiles(): Observable<KalturaConversionProfile[]> {
    // filter
    const kalturaConversionProfileFilter = new KalturaConversionProfileFilter({
      typeEqual: KalturaConversionProfileType.liveStream
    });

    // pager
    const kalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});

    return this._kalturaServerClient
      .request(new ConversionProfileListAction({filter: kalturaConversionProfileFilter, pager: kalturaFilterPager}))
      .pipe(map(response => (<KalturaConversionProfile[]>response.objects)))
  }
}
