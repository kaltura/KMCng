import {Injectable} from '@angular/core';
import {KMCPermissionsService} from '../../kmc-permissions';
import {Observable} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {AppLocalization} from '@kaltura-ng/mc-shared';
import {DetailsViewMetadata, KmcDetailsViewBaseService} from 'app-shared/kmc-shared/kmc-views/kmc-details-view-base.service';
import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';
import {KalturaPlaylist, KalturaPlaylistType} from 'kaltura-ngx-client';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {Title} from '@angular/platform-browser';
import {ContextualHelpService} from 'app-shared/kmc-shared/contextual-help/contextual-help.service';
import { from as fromPromise} from 'rxjs';

export enum ContentPlaylistViewSections {
    Metadata = 'Metadata',
    Content = 'Content',
    ContentRuleBased = 'ContentRuleBased',
    ResolveFromActivatedRoute = 'ResolveFromActivatedRoute'
}

export interface ContentPlaylistViewArgs {
    playlist: KalturaPlaylist;
    section: ContentPlaylistViewSections;
    activatedRoute?: ActivatedRoute;
}


@Injectable()
export class ContentPlaylistViewService extends KmcDetailsViewBaseService<ContentPlaylistViewArgs> {

    constructor(private _appPermissions: KMCPermissionsService,
                private _appLocalization: AppLocalization,
                private _router: Router,
                _browserService: BrowserService,
                _logger: KalturaLogger,
                _titleService: Title,
                _contextualHelpService: ContextualHelpService) {
        super(_logger.subLogger('ContentPlaylistViewService'), _browserService, _titleService, _contextualHelpService);
    }

    getViewMetadata(args: ContentPlaylistViewArgs): DetailsViewMetadata {
        const mainTitle = this._appLocalization.get('app.titles.contentPlaylistsPageTitle');
        const playlistId = args.playlist.id;
        const section = args.section === ContentPlaylistViewSections.ResolveFromActivatedRoute ? this._getSectionFromActivatedRoute(args.activatedRoute, args.playlist) : args.section;
        const sectionTitle = this._appLocalization.get(`applications.content.playlistDetails.sections.${section.toLowerCase()}`);
        return {
            title: `${mainTitle} > ${playlistId} > ${sectionTitle}`,
            viewKey: `content-playlist-${section.toLowerCase()}`
        };
    }

    isAvailable(args: ContentPlaylistViewArgs): boolean {
        const section = args.section === ContentPlaylistViewSections.ResolveFromActivatedRoute ? this._getSectionFromActivatedRoute(args.activatedRoute, args.playlist) : args.section;
        this._logger.info(`handle isAvailable action by user`, { playlistId: args.playlist.id, section });
        return this._isSectionEnabled(section, args.playlist);
    }

    private _getSectionFromActivatedRoute(activatedRoute: ActivatedRoute, playlist: KalturaPlaylist): ContentPlaylistViewSections {
        let result = null;

        if (activatedRoute) {
            try {
                const sectionToken = activatedRoute.snapshot.firstChild.url[0].path;
                switch (sectionToken) {
                    case 'content':
                        result = (playlist.playlistType === KalturaPlaylistType.staticList || playlist.playlistType === KalturaPlaylistType.path)
                            ? ContentPlaylistViewSections.Content
                            : ContentPlaylistViewSections.ContentRuleBased;
                        break;
                    case 'metadata':
                        result = ContentPlaylistViewSections.Metadata;
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

    private _getSectionRouteToken(section?: ContentPlaylistViewSections): string {
        let result;

        switch (section) {
            case ContentPlaylistViewSections.Content:
            case ContentPlaylistViewSections.ContentRuleBased:
                result = 'content';
                break;
            case ContentPlaylistViewSections.Metadata:
            default:
                result = 'metadata';
                break;
        }

        this._logger.debug(`section mapped to token`, { section, token: result });

        return result;
    }

    private _isSectionEnabled(section: ContentPlaylistViewSections, playlist: KalturaPlaylist): boolean {
        let result = false;
        switch (section) {
            case ContentPlaylistViewSections.Content:
                result = playlist.playlistType === KalturaPlaylistType.staticList || playlist.playlistType === KalturaPlaylistType.path;
                break;
            case ContentPlaylistViewSections.ContentRuleBased:
                result = playlist.playlistType === KalturaPlaylistType.dynamic;
                break;
            case ContentPlaylistViewSections.Metadata:
                // metadata section is always available to the user.
                // if you need to change this you will need to resolve at runtime
                // the default section to open
                result = true;
                break;
            default:
                break;
        }

        this._logger.debug(`availability result`, { result });

        return result;
    }

    protected _open(args: ContentPlaylistViewArgs): Observable<boolean> {
        this._logger.info('handle open playlist view request by the user', { playlistId: args.playlist.id });
        const sectionToken = this._getSectionRouteToken(args.section);
        return fromPromise(this._router.navigateByUrl(`/content/playlists/playlist/${args.playlist.id}/${sectionToken}`));
    }
}
