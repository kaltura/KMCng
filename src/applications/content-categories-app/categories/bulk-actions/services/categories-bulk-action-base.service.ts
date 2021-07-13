import { Observable, forkJoin } from 'rxjs';
import { subApplicationsConfig } from 'config/sub-applications';
import { KalturaClient, KalturaCategory, KalturaRequest, KalturaMultiRequest, KalturaMultiResponse } from 'kaltura-ngx-client';
import { map } from 'rxjs/operators';

export abstract class CategoriesBulkActionBaseService<T> {
  constructor(public _kalturaServerClient: KalturaClient) {
  }

  public abstract execute(selectedCategories: KalturaCategory[], params: T): Observable<any>;

  transmit(requests: KalturaRequest<any>[], chunk: boolean): Observable<void> {
    let maxRequestsPerMultiRequest = requests.length;
    if (chunk) {
      maxRequestsPerMultiRequest = subApplicationsConfig.shared.bulkActionsLimit;
    }

    const multiRequests: Observable<KalturaMultiResponse>[] = [];
    let mr: KalturaMultiRequest = new KalturaMultiRequest();

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
          const mergedResponses = [].concat.apply([], responses);
          const errorMessage = mergedResponses.reduce((acc, val) => `${acc}${val.error ? val.error.message : ''}\n`, '').trim();
          if (errorMessage) {
              throw new Error(errorMessage);
          }
      }));
  }
}
