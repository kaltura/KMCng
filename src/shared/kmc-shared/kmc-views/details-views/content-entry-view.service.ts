import { Injectable } from '@angular/core';
import { KMCPermissionsService, KMCPermissions } from '../../kmc-permissions';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { DetailsViewMetadata, KmcDetailsViewBaseService } from 'app-shared/kmc-shared/kmc-views/kmc-details-view-base.service';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { KalturaMediaType } from 'kaltura-ngx-client';
import { KalturaExternalMediaEntry } from 'kaltura-ngx-client';
import { BaseEntryGetAction } from 'kaltura-ngx-client';
import { KalturaClient } from 'kaltura-ngx-client';
import { KalturaResponseProfileType } from 'kaltura-ngx-client';
import { KalturaDetachedResponseProfile } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { Title } from '@angular/platform-browser';
import { ContextualHelpService } from 'app-shared/kmc-shared/contextual-help/contextual-help.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { from as fromPromise} from 'rxjs';
import { map} from 'rxjs/operators';

export enum ContentEntryViewSections {
    Metadata = 'Metadata',
    Thumbnails = 'Thumbnails',
    AccessControl = 'AccessControl',
    Scheduling = 'Scheduling',
    Flavours = 'Flavours',
    Captions = 'Captions',
    Live = 'Live',
    Related = 'Related',
    Clips = 'Clips',
    Advertisements = 'Advertisements',
    Users = 'Users',
    Distribution = 'Distribution',
    ResolveFromActivatedRoute = 'ResolveFromActivatedRoute'
}

export interface ContentEntryViewArgs {
    entry: KalturaMediaEntry;
    section: ContentEntryViewSections;
    activatedRoute?: ActivatedRoute;
    reloadEntriesListOnNavigateOut?: boolean;
    draftEntry?: boolean;
}


@Injectable()
export class ContentEntryViewService extends KmcDetailsViewBaseService<ContentEntryViewArgs> {
    constructor(private _appPermissions: KMCPermissionsService,
                private _appLocalization: AppLocalization,
                private _kalturaClient: KalturaClient,
                private _router: Router,
                _browserService: BrowserService,
                _logger: KalturaLogger,
                _titleService: Title,
                _contextualHelpService: ContextualHelpService) {
        super(_logger.subLogger('ContentEntryViewService'), _browserService, _titleService, _contextualHelpService);
    }

    getViewMetadata(args: ContentEntryViewArgs): DetailsViewMetadata {
        const mainTitle = this._appLocalization.get('app.titles.contentEntriesPageTitle');
        const entryId = args.entry.id;
        const section = args.section === ContentEntryViewSections.ResolveFromActivatedRoute ? this._getSectionFromActivatedRoute(args.activatedRoute) : args.section;
        const sectionTitle = this._appLocalization.get(`applications.content.entryDetails.sections.${section.toLowerCase()}`);
        return {
            title: `${mainTitle} > ${entryId} > ${sectionTitle}`,
            viewKey: `content-entry-${section.toLowerCase()}`
        };
    }

    isAvailable(args: ContentEntryViewArgs): boolean {
        const section = args.section === ContentEntryViewSections.ResolveFromActivatedRoute ? this._getSectionFromActivatedRoute(args.activatedRoute) : args.section;
        this._logger.info(`handle isAvailable action by user`, { categoryId: args.entry.id, section });
        return this._isSectionEnabled(section, args.entry);
    }

    private _isLiveMediaEntry(mediaType: KalturaMediaType): boolean {
        return mediaType === KalturaMediaType.liveStreamFlash ||
            mediaType === KalturaMediaType.liveStreamWindowsMedia ||
            mediaType === KalturaMediaType.liveStreamRealMedia ||
            mediaType === KalturaMediaType.liveStreamQuicktime;
    }

    private _getSectionFromActivatedRoute(activatedRoute: ActivatedRoute): ContentEntryViewSections {
        let result = null;

        if (activatedRoute) {
            try {
                const sectionToken = activatedRoute.snapshot.firstChild.url[0].path;

                switch (sectionToken) {
                    case 'metadata':
                        result = ContentEntryViewSections.Metadata;
                        break;
                    case 'thumbnails':
                        result = ContentEntryViewSections.Thumbnails;
                        break;
                    case 'accesscontrol':
                        result = ContentEntryViewSections.AccessControl;
                        break;
                    case 'scheduling':
                        result = ContentEntryViewSections.Scheduling;
                        break;
                    case 'flavours':
                        result = ContentEntryViewSections.Flavours;
                        break;
                    case 'captions':
                        result = ContentEntryViewSections.Captions;
                        break;
                    case 'live':
                        result = ContentEntryViewSections.Live;
                        break;
                    case 'related':
                        result = ContentEntryViewSections.Related;
                        break;
                    case 'clips':
                        result = ContentEntryViewSections.Clips;
                        break;
                    case 'advertisements':
                        result = ContentEntryViewSections.Advertisements;
                        break;
                    case 'users':
                        result = ContentEntryViewSections.Users;
                        break;
                    case 'distribution':
                        result = ContentEntryViewSections.Distribution;
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

    private _getSectionRouteToken(section?: ContentEntryViewSections): string {
        let result;
        switch (section) {
            case ContentEntryViewSections.Thumbnails:
                result = 'thumbnails';
                break;
            case ContentEntryViewSections.AccessControl:
                result = 'accesscontrol';
                break;
            case ContentEntryViewSections.Scheduling:
                result = 'scheduling';
                break;
            case ContentEntryViewSections.Flavours:
                result = 'flavours';
                break;
            case ContentEntryViewSections.Captions:
                result = 'captions';
                break;
            case ContentEntryViewSections.Live:
                result = 'live';
                break;
            case ContentEntryViewSections.Related:
                result = 'related';
                break;
            case ContentEntryViewSections.Clips:
                result = 'clips';
                break;
            case ContentEntryViewSections.Advertisements:
                result = 'advertisements';
                break;
            case ContentEntryViewSections.Users:
                result = 'users';
                break;
            case ContentEntryViewSections.Distribution:
                result = 'distribution';
                break;
            case ContentEntryViewSections.Metadata:
            default:
                result = 'metadata';
                break;
        }

        this._logger.debug(`section mapped to token`, { section, token: result });

        return result;
    }

    private _isSectionEnabled(section: ContentEntryViewSections, entry: KalturaMediaEntry): boolean {
        const availableByData = this._isAvailableByData(section, entry);
        const availableByPermission = this._isAvailableByPermission(section);

        this._logger.debug('check if section is enabled', { availableByData, availableByPermission });
        return availableByData && availableByPermission;
    }

    private _isAvailableByData(section: ContentEntryViewSections, entry: KalturaMediaEntry): boolean {
        this._logger.debug(`check section availability by data for entry`, { categoryId: entry.id, section });
        const mediaType = entry.mediaType;
        const externalMedia = entry instanceof KalturaExternalMediaEntry;
        let result = false;
        switch (section) {
            case ContentEntryViewSections.Thumbnails:
                result = mediaType !== KalturaMediaType.image;
                break;
            case ContentEntryViewSections.Flavours:
                result = mediaType !== KalturaMediaType.image && !this._isLiveMediaEntry(entry.mediaType) && !externalMedia;
                break;
            case ContentEntryViewSections.Captions:
            case ContentEntryViewSections.Advertisements:
                result = mediaType !== KalturaMediaType.image && !this._isLiveMediaEntry(entry.mediaType);
                break;
            case ContentEntryViewSections.Live:
                result = this._isLiveMediaEntry(entry.mediaType);
                break;
            case ContentEntryViewSections.Clips:
                result = mediaType !== KalturaMediaType.image && !externalMedia;
                break;
            case ContentEntryViewSections.Distribution:
                result = !this._isLiveMediaEntry(entry.mediaType) && mediaType !== KalturaMediaType.audio && mediaType !== KalturaMediaType.image;
                break;
            case ContentEntryViewSections.AccessControl:
            case ContentEntryViewSections.Scheduling:
            case ContentEntryViewSections.Related:
            case ContentEntryViewSections.Users:
            case ContentEntryViewSections.Metadata:
                result = true;
                break;
            default:
                break;
        }

        this._logger.debug(`availability by data result`, { result });

        return result;
    }

    private _isAvailableByPermission(section: ContentEntryViewSections): boolean {
        this._logger.debug(`check section availability by permissions`, { section });
        let result = false;
        switch (section) {
            case ContentEntryViewSections.Users:
                result = this._appPermissions.hasPermission(KMCPermissions.FEATURE_END_USER_MANAGE);
                break;
            case ContentEntryViewSections.Related:
                result = this._appPermissions.hasPermission(KMCPermissions.ATTACHMENT_PLUGIN_PERMISSION);
                break;
            case ContentEntryViewSections.Live:
                result = this._appPermissions.hasPermission(KMCPermissions.FEATURE_LIVE_STREAM);
                break;
            case ContentEntryViewSections.Advertisements:
                result = this._appPermissions.hasPermission(KMCPermissions.ADCUEPOINT_PLUGIN_PERMISSION);
                break;
            case ContentEntryViewSections.Captions:
                result = this._appPermissions.hasPermission(KMCPermissions.CAPTION_PLUGIN_PERMISSION);
                break;
            case ContentEntryViewSections.Distribution:
                result = this._appPermissions.hasPermission(KMCPermissions.CONTENT_MANAGE_DISTRIBUTION_BASE);
                break;
            case ContentEntryViewSections.Thumbnails:
            case ContentEntryViewSections.Flavours:
            case ContentEntryViewSections.Clips:
            case ContentEntryViewSections.AccessControl:
            case ContentEntryViewSections.Scheduling:
                result = true;
                break;
            case ContentEntryViewSections.Metadata:
                // metadata section is always available to the user.
                // if you need to change this you will need to resolve at runtime
                // the default section to open
                result = true;
                break;
            default:
                result = true;
                break;
        }

        this._logger.debug(`availability by permissions result`, { result });

        return result;
    }

    protected _open(args: ContentEntryViewArgs): Observable<boolean> {
        const sectionToken = this._getSectionRouteToken(args.section);
        this._logger.info('handle open entry view request by the user', { entryId: args.entry.id, sectionToken });
        return fromPromise(this._router.navigateByUrl(`/content/entries/entry/${args.entry.id}/${sectionToken}`));
    }

    public openById(entryId: string, section: ContentEntryViewSections, reloadEntriesListOnNavigateOut?: boolean, draftEntry?: boolean): void {
        this._logger.info('handle open entry view by id request by the user, load entry data', { entryId });
        const baseEntryAction = new BaseEntryGetAction({ entryId })
            .setRequestOptions({
                responseProfile: new KalturaDetachedResponseProfile({
                    type: KalturaResponseProfileType.includeFields,
                    fields: 'id,mediaType'
                })
            });

        this._kalturaClient
            .request(baseEntryAction)
            .pipe(tag('block-shell'))
            .pipe(map(response => {
                if (response instanceof KalturaMediaEntry) {
                    return response;
                } else {
                    throw new Error(`invalid type provided, expected KalturaMediaEntry, got ${typeof response}`);
                }
            }))
            .subscribe(
                (entry) => {
                    this.open({ entry, section: ContentEntryViewSections.Metadata, reloadEntriesListOnNavigateOut, draftEntry });
                },
                (error) => {
                    this._logger.info(`handle failed request, show alert, abort navigation`);
                    this._browserService.alert({
                        header: this._appLocalization.get('app.common.error'),
                        message: error.message
                    });
                }
            );
    }
}
