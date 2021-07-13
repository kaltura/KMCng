import { Injectable } from '@angular/core';
import { KMCPermissionsService } from '../../kmc-permissions';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { DetailsViewMetadata, KmcDetailsViewBaseService } from 'app-shared/kmc-shared/kmc-views/kmc-details-view-base.service';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { KalturaReachProfile} from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { Title } from '@angular/platform-browser';
import { ContextualHelpService } from 'app-shared/kmc-shared/contextual-help/contextual-help.service';
import { from as fromPromise} from 'rxjs';

export enum SettingsReachProfileViewSections {
    Settings = 'Settings',
    Service = 'Service',
    Credit = 'Credit',
    Dictionary = 'Dictionary',
    Rules = 'Rules',
    ResolveFromActivatedRoute = 'ResolveFromActivatedRoute'
}

export interface SettingReachProfileViewArgs {
    profile: KalturaReachProfile;
    section: SettingsReachProfileViewSections;
    activatedRoute?: ActivatedRoute;
}


@Injectable()
export class SettingsReachProfileViewService extends KmcDetailsViewBaseService<SettingReachProfileViewArgs> {

    constructor(private _appPermissions: KMCPermissionsService,
                private _appLocalization: AppLocalization,
                private _router: Router,
                _browserService: BrowserService,
                _logger: KalturaLogger,
                _titleService: Title,
                _contextualHelpService: ContextualHelpService) {
        super(_logger.subLogger('SettingsTranscodingProfileViewService'), _browserService, _titleService, _contextualHelpService);
    }

    getViewMetadata(args: SettingReachProfileViewArgs): DetailsViewMetadata {
        const mainTitle = this._appLocalization.get('app.titles.settingsTranscodingPageTitle');
        const profileId = args.profile.id;
        const section = args.section === SettingsReachProfileViewSections.ResolveFromActivatedRoute ? this._getSectionFromActivatedRoute(args.activatedRoute) : args.section;
        const sectionTitle = this._appLocalization.get(`applications.settings.transcoding.sections.${section.toLowerCase()}`);
        return {
            title: `${mainTitle} > ${profileId} > ${sectionTitle}`,
            viewKey: `settings-transcoding-profile-${section.toLowerCase()}`
        };
    }

    isAvailable(args: SettingReachProfileViewArgs): boolean {
        const section = args.section === SettingsReachProfileViewSections.ResolveFromActivatedRoute ? this._getSectionFromActivatedRoute(args.activatedRoute) : args.section;
        this._logger.info(`handle isAvailable action by user`, { profileId: args.profile.id, section });
        return this._isSectionEnabled(section, args.profile);
    }

    private _getSectionFromActivatedRoute(activatedRoute: ActivatedRoute): SettingsReachProfileViewSections {
        let result = null;

        if (activatedRoute) {
            try {
                const sectionToken = activatedRoute.snapshot.firstChild.url[0].path;
                switch (sectionToken) {
                    case 'settings':
                        result = SettingsReachProfileViewSections.Settings;
                        break;
                    case 'service':
                        result = SettingsReachProfileViewSections.Service;
                        break;
                    case 'credit':
                        result = SettingsReachProfileViewSections.Credit;
                        break;
                    case 'dictionary':
                        result = SettingsReachProfileViewSections.Dictionary;
                        break;
                    case 'rules':
                        result = SettingsReachProfileViewSections.Rules;
                        break;
                    default:
                        break;
                }

                this._logger.debug(`sectionToken mapped to section`, { section: result, sectionToken });
            } catch (e) {
                this._logger.error(`failed to resolve section from activated route`);
            }
        }

        return result;
    }

    private _getSectionRouteToken(section?: SettingsReachProfileViewSections): string {
        let result;

        switch (section) {
            case SettingsReachProfileViewSections.Settings:
                result = 'settings';
                break;
            case SettingsReachProfileViewSections.Service:
                result = 'service';
                break;
            case SettingsReachProfileViewSections.Credit:
                result = 'credit';
                break;
            case SettingsReachProfileViewSections.Dictionary:
                result = 'dictionary';
                break;
            case SettingsReachProfileViewSections.Rules:
                result = 'rules';
                break;
        }

        this._logger.debug(`section mapped to token`, { section, token: result });

        return result;
    }

    private _isSectionEnabled(section: SettingsReachProfileViewSections, profile: KalturaReachProfile): boolean {
        let result = false;
        switch (section) {
            case SettingsReachProfileViewSections.Settings:
            case SettingsReachProfileViewSections.Service:
            case SettingsReachProfileViewSections.Credit:
            case SettingsReachProfileViewSections.Dictionary:
            case SettingsReachProfileViewSections.Rules:
                result = true;
                break;
            default:
                break;
        }

        this._logger.debug(`availability result`, { result });

        return result;
    }

    protected _open(args: SettingReachProfileViewArgs): Observable<boolean> {
        const sectionToken = this._getSectionRouteToken(args.section);
        this._logger.info('handle open transcoding profile view request by the user', { profileId: args.profile.id, sectionToken });
        return fromPromise(this._router.navigateByUrl(`/settings/reach/profile/${args.profile.id}/${sectionToken}`));
    }
}
