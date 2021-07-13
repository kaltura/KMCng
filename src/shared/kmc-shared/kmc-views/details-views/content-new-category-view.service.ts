import { Injectable, OnDestroy } from '@angular/core';
import { KMCPermissionsService } from '../../kmc-permissions';
import { Observable } from 'rxjs';
import { DetailsViewMetadata, KmcDetailsViewBaseService } from 'app-shared/kmc-shared/kmc-views/kmc-details-view-base.service';
import {BrowserService} from 'app-shared/kmc-shell/providers/browser.service';
import {KalturaMediaEntry} from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { ContentCategoriesMainViewService } from '../main-views/content-categories-main-view.service';
import { Title } from '@angular/platform-browser';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { ContentCategoryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-category-view.service';
import { ContextualHelpService } from 'app-shared/kmc-shared/contextual-help/contextual-help.service';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ContentNewCategoryViewArgs {
    entries: KalturaMediaEntry[];
}


@Injectable()
export class ContentNewCategoryViewService extends KmcDetailsViewBaseService<ContentNewCategoryViewArgs> implements OnDestroy {
    private _newCategoryData: ContentNewCategoryViewArgs;

    constructor(private _appPermissions: KMCPermissionsService,
                private _contentCategoriesMainView: ContentCategoriesMainViewService,
                private _appLocalization: AppLocalization,
                _logger: KalturaLogger,
                _browserService: BrowserService,
                _titleService: Title,
                _contextualHelpService: ContextualHelpService) {
        super(_logger.subLogger('ContentNewCategoryViewService'), _browserService, _titleService, _contextualHelpService);
    }

    getViewMetadata(args: ContentNewCategoryViewArgs): DetailsViewMetadata {
        const mainTitle = this._appLocalization.get('app.titles.contentCategoriesPageTitle');
        const categoryId = 'new';
        const section = ContentCategoryViewSections.Metadata;
        const sectionTitle = this._appLocalization.get(`applications.content.categoryDetails.sections.${section.toLowerCase()}`);
        return {
            title: `${mainTitle} > ${categoryId} > ${sectionTitle}`,
            viewKey: `content-new-category-${section.toLowerCase()}`
        };
    }

    isAvailable(args: ContentNewCategoryViewArgs): boolean {
        return true;
    }

    protected _open(args: ContentNewCategoryViewArgs): Observable<boolean> {
        return Observable.create(observer => {
            this._logger.info('handle open new category view request by the user', {entriesCount: (args.entries || []).length});
            this._newCategoryData = args;

            this._contentCategoriesMainView.openWithState()
                .pipe(cancelOnDestroy(this))
                .pipe(catchError((error, caught) => {
                    return of(false);
                }))
                .subscribe(
                    result => {
                        if (!result) {
                            this._logger.warn('action aborted, cannot open categories view');
                            this._clearNewCategoryData();
                        }
                    }
                );
        });
    }

    public popNewCategoryData(): ContentNewCategoryViewArgs {
        const tempNewCategoryData = this._newCategoryData;

        if (tempNewCategoryData) {
            this._logger.info('provide information needed for creating the new category', {entriesCount: (tempNewCategoryData.entries || []).length});
            this._clearNewCategoryData();
        }

        return tempNewCategoryData;
    }

    private _clearNewCategoryData(): void {
        this._logger.debug('remove information provided by the user needed for creating the new category');
        this._newCategoryData = null;
    }

    ngOnDestroy() {
    }
}
