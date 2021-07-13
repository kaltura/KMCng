import { Injectable, OnDestroy } from '@angular/core';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { Observable } from 'rxjs';
import { subApplicationsConfig } from 'config/sub-applications';
import { KalturaClient, KalturaRequest } from 'kaltura-ngx-client';
import { BaseEntryApproveAction } from 'kaltura-ngx-client';
import { BaseEntryRejectAction } from 'kaltura-ngx-client';
import { throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class BulkService implements OnDestroy {
  constructor(private _kalturaServerClient: KalturaClient,
              private _appLocalization: AppLocalization) {
  }

  ngOnDestroy() {
  }

  private _transmit(requests: KalturaRequest<any>[], chunk: boolean): Observable<{}> {
    let maxRequestsPerMultiRequest = requests.length;
    if (chunk) {
      maxRequestsPerMultiRequest = subApplicationsConfig.shared.bulkActionsLimit;
    }

    // split request on chunks => [[], [], ...], each of inner arrays has length of maxRequestsPerMultiRequest
    const splittedRequests = [];
    let start = 0;
    while (start < requests.length) {
      const end = start + maxRequestsPerMultiRequest;
      splittedRequests.push(requests.slice(start, end));
      start = end;
    }
    const multiRequests = splittedRequests
      .map(reqChunk => this._kalturaServerClient.multiRequest(reqChunk));

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
      })).pipe(catchError(error => {
        const message = error && error.message
          ? error.message
          : typeof error === 'string'
            ? error
            : this._appLocalization.get('applications.content.moderation.errorConnecting');
        throw new Error(message)
      }));
  }

  public approveEntry(entryIds: string[]): Observable<{}> {
    if (!entryIds || entryIds.length <= 0) {
      return throwError(new Error(this._appLocalization.get('applications.content.moderation.missingIds')));
    }

    return this._transmit(entryIds.map(entryId => new BaseEntryApproveAction({ entryId })), true);
  }

  public rejectEntry(entryIds: string[]): Observable<{}> {
    if (!entryIds || entryIds.length <= 0) {
      return throwError(new Error(this._appLocalization.get('applications.content.moderation.missingIds')));
    }

    return this._transmit(entryIds.map(entryId => new BaseEntryRejectAction({ entryId })), true);
  }
}

