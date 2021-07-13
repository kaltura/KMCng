import {Injectable} from '@angular/core';
import { Observable } from 'rxjs';
import { subApplicationsConfig } from 'config/sub-applications';
import {HttpClient} from '@angular/common/http';
import { serverConfig } from 'config/server';
import { throwError } from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class UniversalLiveService {

  constructor(private _http: HttpClient) {
  }

  public getDefaultIp(): Observable<string> {
    if (!(!!serverConfig.externalLinks.live && !!serverConfig.externalLinks.live.akamaiEdgeServerIpURL)){
        return throwError(new Error("Failed to load Akamai Edge Server IP URL.\nPlease update primary and secondary encoder IP manually."));
    }
    let akamaiEdgeServerIpURL = serverConfig.externalLinks.live.akamaiEdgeServerIpURL;
    const pattern = /^https?:\/\//;

    if (!pattern.test(akamaiEdgeServerIpURL)) {
      akamaiEdgeServerIpURL = window.location.protocol + '//' + akamaiEdgeServerIpURL;
    }

    return this._http.get(akamaiEdgeServerIpURL, { responseType: 'text' })
      .pipe(
          map(res => {
              const defaultIP = res;
              const match = defaultIP.match(/<serverip>(.*)<\/serverip>/);
              if (match.length > 1) {
                  return match[1];
              }
              return '';
          })
      );
  }
}
