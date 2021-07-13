import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { globalConfig } from 'config/global';
import { buildDeployUrl } from 'config/server';
import { BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import * as Ajv from 'ajv';
import { ContextualHelpDataSchema } from './contextual-help-data-schema';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { of } from 'rxjs';

export interface ContextualHelpData {
    viewKey: string;
    links: ContextualHelpLink[];
}

export interface ContextualHelpLink {
    label: string;
    value: string;
}

@Injectable()
export class ContextualHelpService implements OnDestroy {
    private _inited = false;
    private _contextualHelpData: ContextualHelpData[] = [];
    private _contextualHelp = new BehaviorSubject<ContextualHelpLink[]>([]);

    public readonly contextualHelpData$ = this._contextualHelp.asObservable();

    constructor(private _http: HttpClient,
                private _logger: KalturaLogger) {
        this._logger = this._logger.subLogger('ContextualHelpService');
    }

    ngOnDestroy() {

    }

    private _validateResponse(data: ContextualHelpData[]): { isValid: boolean, error?: string } {
        const ajv = new Ajv({ allErrors: true, verbose: true });
        const validate = ajv.compile(ContextualHelpDataSchema);
        const isValid = !!validate(data);
        let error = null;

        if (!isValid) {
            error = ajv.errorsText(validate.errors);
        }

        return { isValid, error };
    }

    private _load(): Observable<any> {
        const url = buildDeployUrl(`public/contextual-help.json?v=${globalConfig.client.appVersion}`);
        return this._http.get(url)
            .pipe(map((response: ContextualHelpData[]) => {
                const validationResult = this._validateResponse(response);
                if (validationResult.isValid) {
                    return response;
                } else {
                    this._logger.warn(validationResult.error || 'Invalid contextual help data');
                    return [];
                }
            }))
            .pipe(catchError(error => {
                this._logger.warn(`Failed to load contextual help data`, { errorMessage: error.message });
                return of([]);
            }));
    }

    public updateHelpItems(viewKey: string): void {
        this._logger.info(`Handle update help items action`, { viewKey });
        const relevantData = this._contextualHelpData.find(item => item.viewKey === viewKey);
        if (relevantData) {
            this._contextualHelp.next(relevantData.links);
        } else {
            this._logger.info(`Relevant data was not found reset links`);
            this._contextualHelp.next([]);
        }
    }

    public init(): void {
        this._logger.info(`Handle contextual help service init action`);
        if (!this._inited) {
            this._inited = false;
            this._load()
                .pipe(cancelOnDestroy(this))
                .subscribe(data => {
                    this._logger.info(`Contextual help data loaded`);
                    this._contextualHelpData = data;
                });
        } else {
            this._logger.info(`Service has already inited. Skip action`);
        }
    }
}
