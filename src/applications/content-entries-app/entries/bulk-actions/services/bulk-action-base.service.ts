import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { subApplicationsConfig } from 'config/sub-applications';

import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaRequest, KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';


export abstract class BulkActionBaseService<T> {

  constructor(public _kalturaServerClient: KalturaClient) {
  }

  public abstract execute(selectedEntries: KalturaMediaEntry[] , params : T) : Observable<any>;

  transmit(requests : KalturaRequest<any>[], chunk : boolean) : Observable<{}>
  {
    let maxRequestsPerMultiRequest = requests.length;
    if (chunk){
      maxRequestsPerMultiRequest = subApplicationsConfig.shared.bulkActionsLimit;
    }

    let multiRequests: Observable<KalturaMultiResponse>[] = [];
    let mr :KalturaMultiRequest = new KalturaMultiRequest();

    let counter = 0;
    for (let i = 0; i < requests.length; i++){
      if (counter === maxRequestsPerMultiRequest){
        multiRequests.push(this._kalturaServerClient.multiRequest(mr));
        mr = new KalturaMultiRequest();
        counter = 0;
      }
      mr.requests.push(requests[i]);
      counter++;
    }
    multiRequests.push(this._kalturaServerClient.multiRequest(mr));

    return forkJoin(multiRequests)
      .pipe(map(responses => {
        const errorMessage = [].concat.apply([], responses)
          .filter(response => !!response.error)
          .reduce((acc, { error }) => `${acc}\n${error.message}`, '')
          .trim();

        if (!!errorMessage) {
          throw new Error(errorMessage);
        } else {
          return {};
        }
      }));
  }

}
