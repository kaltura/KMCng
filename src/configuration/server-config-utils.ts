import { serverConfig, ServerConfig } from './server-config';
import {globalConfig} from './global-config';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import {environment} from 'environments/environment';
import * as Ajv from 'ajv';
import { ServerConfigSchema } from './server-config-schema';
import { takeUntil, tap, delay, map } from 'rxjs/operators';

export type ExternalAppsAdapter<T> = { [K in keyof T]: (configuration: T[K]) => boolean };

function validateSeverConfig(data: ServerConfig): { isValid: boolean, error?: string } {
    const ajv = new Ajv({allErrors: true, verbose: true});
    const validate = ajv.compile(ServerConfigSchema);
    const isValid = !!validate(data);
    let error = null;

    if (!isValid) {
        error = ajv.errorsText(validate.errors);
    }

    return { isValid, error };
}


function getConfiguration(): Observable<ServerConfig> {
    if (window && (<any>window).kmcConfig) {
        return of((<any>window).kmcConfig);
    }

    return Observable.create(observer =>
    {
        let completed = false;
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                let resp;

                completed = true;

                try {
                    if (xhr.status === 200) {
                        resp = JSON.parse(xhr.response);
                    } else {
                        if (globalConfig.client.production) {
                            resp = new Error('failed to load configuration file from server with error ' + xhr.statusText);
                        }else {
                            resp = new Error('failed to load configuration file from server with error ' + xhr.statusText + ' (did you remember to create a configuration file from the provided template in the app folder?)');
                        }

                    }
                } catch (e) {
                    resp = e;
                }

                if (resp instanceof Error) {
                    observer.error(resp);
                } else {
                    observer.next(resp);
                    observer.complete();
                }
            }
        };

        xhr.open('Get', `${environment.configurationUri}?v=${globalConfig.client.appVersion}`);

        xhr.send();

        return () =>
        {
            if (!completed) {
                console.warn('request to get application configuration was aborted');
                xhr.abort();
            }
        }
    });
}

export function initializeConfiguration<TExternalApplications>(externalAppsAdapter: ExternalAppsAdapter<TExternalApplications>): Observable<void> {

    return getConfiguration()
        .pipe(takeUntil(of(true).pipe(delay(environment.configurationTimeout))))
        .pipe(tap(response => {
            const validationResult = validateSeverConfig(response);
            if (validationResult.isValid) {
                for (const externalAppName of Object.keys(response.externalApps)) {
                    const externalAppAdapter = (<any>externalAppsAdapter)[externalAppName];

                    const externalAppConfiguration = response.externalApps[externalAppName];
                    if (!externalAppAdapter || !externalAppAdapter(externalAppConfiguration)) {
                        if (!externalAppAdapter) {
                            console.warn(`missing external app adapter for '${externalAppName}'. ignoring external app.`);
                        } else {
                            console.warn(`external app adapter for '${externalAppName}' resulted with false response. ignoring external app.`);
                        }
                        response.externalApps[externalAppName] = null;
                    }
                }

                Object.assign(serverConfig, response);
            } else {
                throw Error(validationResult.error || 'Invalid server configuration');
            }
        }))
        .pipe(map(() => {
            return undefined;
        }));
}
