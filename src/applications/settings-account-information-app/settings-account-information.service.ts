import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaPartnerStatistics } from 'kaltura-ngx-client';
import { PartnerGetStatisticsAction } from 'kaltura-ngx-client';
import { serverConfig } from 'config/server';
import { throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SettingsAccountInformationService {

    constructor(private _http: HttpClient, private _kalturaServerClient: KalturaClient) {
    }

    public canContactSalesForceInformation(): boolean {
        try {
            return !!serverConfig.externalLinks.kaltura && !!serverConfig.externalLinks.kaltura.contactSalesforce;
        } catch (ex) {
            return false;
        }
    }

    public sendContactSalesForceInformation(data: string): Observable<void> {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/x-www-form-urlencoded'
            })
        };
        try {
            return this._http
                .post(serverConfig.externalLinks.kaltura.contactSalesforce, data, httpOptions)
                .pipe(map(() => undefined));
        } catch (ex) {
            return throwError(new Error('An error occurred while trying to contact SalesForce'));
        }
    }

    public getStatistics(): Observable<KalturaPartnerStatistics> {
        return this._kalturaServerClient.request(new PartnerGetStatisticsAction());
    }
}
