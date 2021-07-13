import { Injectable } from '@angular/core';
import {Observable, forkJoin, EMPTY} from 'rxjs';
import { PlaylistsStore } from '../playlists-store/playlists-store.service';
import { PlaylistDeleteAction } from 'kaltura-ngx-client';
import { KalturaRequest } from 'kaltura-ngx-client';
import { subApplicationsConfig } from 'config/sub-applications';
import { KalturaClient } from 'kaltura-ngx-client';
import { map } from 'rxjs/operators';

@Injectable()
export class BulkDeleteService {
  constructor(public _playlistsStore: PlaylistsStore, public _kalturaServerClient: KalturaClient) {
  }

  public deletePlaylist(ids: string[]): Observable<{}> {
    if (!ids || ids.length <= 0) {
      return EMPTY;
    }

    return this._transmit(ids.map(id => new PlaylistDeleteAction({ id })), true);
  }

  private _transmit(requests: KalturaRequest<any>[], chunk: boolean): Observable<{}> {
    let maxRequestsPerMultiRequest = requests.length;
    if (chunk) {
      maxRequestsPerMultiRequest = subApplicationsConfig.shared.bulkActionsLimit || requests.length;
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
      }));
  }
}
