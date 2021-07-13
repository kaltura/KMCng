import { ExternalAppsAdapter } from './server-config-utils';

/*************************************
 * Developer Notice:
 * When you add/edit/remove server configuration you should sync the following places:
 * - server-config-schema.ts > 'ServerConfigSchema' constant
 * - this file > 'ServerConfig' interface
 * - server-config.example.json (used during development)
 * - server-config.template.json (used by CI server)
 *
 * If you are modifing an External application (a.k.a standalone application):
 * - file '__local_machine_only__/README.md' > section 'Test external applications integration'
 * - for new external apps you should also update the zip file 'samples-for-tests-only.zip'
 *************************************/

export interface ExternalApplications {
    studioV2?: {
        uri: string,
        html5_version: string,
        html5lib: string,
    };
    studioV3?: {
        uri: string,
        html5_version: string,
        html5lib: string,
        playerVersionsMap?: string,
        playerConfVars?: string,
        playerBetaVersionsMap?: string,
        playerBetaConfVars?: string
    };
    liveDashboard?: {
        uri: string,
    };
    kava?: {
        uri: string
    };
    usageDashboard?: {
        uri: string,
    };
    kmcAnalytics?: {
        uri: string
    };
    liveAnalytics?: {
        uri: string,
        uiConfId?: string,
        mapUrls?: string[],
        mapZoomLevels?: string
    };
    editor?: {
        uri?: string
    };
    reach?: {
        uri?: string;
    };
}

export interface ServerConfig {
    ks?: string,
    kalturaServer: {
        uri: string,
        defaultPrivileges?: string,
        deployUrl?: string,
        previewUIConf: number,
        previewUIConfV7: number,
        resetPasswordUri?: string,
        freeTrialExpiration?: {
            trialPeriodInDays: number
        },
        limitAccess?: {
            serviceUrl: string
        }
    };
    cdnServers: {
        serverUri: string,
        securedServerUri: string
    };
    externalAPI: {
        youtube: {
            uri: string;
        }
    };
    externalApps: ExternalApplications;
    externalLinks: {
        previewAndEmbed?: {
            embedTypes?: string,
            deliveryProtocols?: string
        },
        entitlements?: {
            manage?: string
        },
        kaltura?: {
            userManual?: string,
            kmcOverview?: string,
            mediaManagement?: string,
            support?: string,
            signUp?: string,
            contactUs?: string,
            search?: string,
            upgradeAccount?: string,
            contactSalesforce?: string,
            dropFoldersManual?: string,
            customerCare?: string,
            customerPortal?: string
        },
        uploads?: {
            highSpeedUpload?: string,
            needHighSpeedUpload?: string,
            bulkUploadSamples?: string
        },
        live?: {
            akamaiEdgeServerIpURL?: string
        }
    };
}



export const externalAppsConfigurationAdapter: ExternalAppsAdapter<ExternalApplications> = {
    editor: (configuration) => {
        {
            let result = false;

            if (configuration) {

                result = !!configuration.uri &&
                    !configuration.uri.match(/\s/g); // not contains white spaces
                if (result) {
                    configuration.uri = buildBaseUri(configuration.uri);
                }
            }

            return result;
        }
    },
    studioV2: (configuration) => {
        let result = false;
        if (configuration) {
            result =  !!configuration.uri &&
                !configuration.uri.match(/\s/g) && // not contains white spaces
                !!configuration.html5_version &&
                !!configuration.html5lib;

            if (result) {
                configuration.uri = buildBaseUri(configuration.uri);
            }
        }

        return result;
    },
    studioV3: (configuration) => {
        let result = false;

        if (configuration) {
            result = !!configuration.uri &&
                !configuration.uri.match(/\s/g) && // not contains white spaces
                !!configuration.html5_version &&
                !!configuration.html5lib;

            if (result) {
                configuration.uri = buildBaseUri(configuration.uri);
            }
        }

        return result;
    },
    liveDashboard: (configuration) => {
        let result = false;

        if (configuration) {
            result = !!configuration.uri &&
                !configuration.uri.match(/\s/g); // not contains white spaces

            if (result) {
                configuration.uri = buildBaseUri(configuration.uri);
            }
        }

        return result;
    },
    kava: (configuration) => {
        let result = false;

        if (configuration) {
            result = !!configuration.uri &&
                !configuration.uri.match(/\s/g); // not contains white spaces

            if (result) {
                configuration.uri = buildBaseUri(configuration.uri);
            }
        }

        return result;
    },
    usageDashboard: (configuration) => {
        let result = false;

        if (configuration) {
            result = !!configuration.uri &&
                !configuration.uri.match(/\s/g); // not contains white spaces

            if (result) {
                configuration.uri = buildBaseUri(configuration.uri);
            }
        }

        return result;
    },
    liveAnalytics: (configuration) => {
        let result = false;

        if (configuration) {
            result = !!configuration.uri &&
                !configuration.uri.match(/\s/g); // not contains white spaces

            if (result) {
                configuration.uri = buildBaseUri(configuration.uri);
            }
        }

        return result;
    },
    kmcAnalytics: (configuration) => {
        let result = false;

        if (configuration) {
            result = !!configuration.uri &&
                !configuration.uri.match(/\s/g); // not contains white spaces

            if (result) {
                configuration.uri = configuration.uri.indexOf('http') === 0 ? configuration.uri : buildBaseUri(configuration.uri);
            }
        }

        return result;
    },
    reach: (configuration) => {
        let result = false;

        if (configuration) {
            result = !!configuration.uri &&
                !configuration.uri.match(/\s/g); // not contains white spaces
            if (result) {
                configuration.uri = buildBaseUri(configuration.uri);
            }
        }

        return result;
    }
};

export function buildBaseUri(suffix: string): string {
    let result = '';
    try {
        const port = (window.location.port) ? ':' + window.location.port : '';
        const base_host = window.location.hostname + port;
        const base_url = window.location.protocol + '//' + base_host;
        return `${base_url}${suffix}`;
    } catch (e) {
        result = '';
    }

    return result;
}

export function buildUrlWithClientProtocol(urlWithoutProtocol) {
    let protocol =  (location.protocol || '').toLowerCase();
    if (protocol[protocol.length - 1] === ':') {
        protocol =  location.protocol.substring(0, location.protocol.length - 1);
    }
    return `${protocol}://${urlWithoutProtocol}`;
}

export function buildCDNUrl(suffix: string): string {
    let protocol =  (location.protocol || '').toLowerCase();
    if (protocol[protocol.length - 1] === ':') {
        protocol =  location.protocol.substring(0, location.protocol.length - 1);
    }
    let baseUrl = '';
    if (protocol === 'https') {
        baseUrl = serverConfig.cdnServers.securedServerUri;
    } else {
        baseUrl = serverConfig.cdnServers.serverUri;
    }

    return `${baseUrl}${suffix}`;
}

export function buildDeployUrl(suffix: string): string {
    return `${serverConfig.kalturaServer.deployUrl || ''}${suffix}`;
}

export function getKalturaServerUri(suffix: string = ''): string {
    if (serverConfig.kalturaServer && serverConfig.kalturaServer.uri) {
        const serverEndpoint = serverConfig.kalturaServer.uri;
        return buildUrlWithClientProtocol(`${serverEndpoint}${suffix}`);
    } else {
        throw new Error(`cannot provide kaltura server uri. server configuration wasn't loaded already`);
    }
}

export const serverConfig: ServerConfig = <any>{};
