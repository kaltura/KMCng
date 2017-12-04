import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { PlaylistDeleteAction } from 'kaltura-ngx-client/api/types/PlaylistDeleteAction';
import { KalturaRequest } from 'kaltura-ngx-client';
import { environment } from 'app-environment';
import { KalturaClient } from 'kaltura-ngx-client';
import { PlaylistsStore } from 'app-shared/content-shared/playlists-store/playlists-store.service';

@Injectable()
export class BulkDeleteService {
  constructor(public _playlistsStore: PlaylistsStore, public _kalturaServerClient: KalturaClient) {
  }

  public deletePlaylist(ids: string[]): Observable<{}> {
    if (!ids || ids.length <= 0) {
      return Observable.empty();
    }

    return this._transmit(ids.map(id => new PlaylistDeleteAction({ id })), true);
  }

  private _transmit(requests: KalturaRequest<any>[], chunk: boolean): Observable<{}> {
    let maxRequestsPerMultiRequest = requests.length;
    if (chunk) {
      maxRequestsPerMultiRequest = environment.modules.contentPlaylists.bulkActionsLimit || requests.length;
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

    return Observable.forkJoin(multiRequests)
      .map(responses => {
        const errorMessage = [].concat.apply([], responses)
          .filter(response => !!response.error)
          .reduce((acc, { error }) => `${acc}\n${error.message}`, '')
          .trim();

        if (!!errorMessage) {
          throw new Error(errorMessage);
        } else {
          return {};
        }
      });
  }
}
