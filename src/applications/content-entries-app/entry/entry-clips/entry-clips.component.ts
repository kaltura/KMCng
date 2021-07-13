import {Component, OnDestroy, OnInit} from '@angular/core';

import {globalConfig} from 'config/global';
import {EntryClipsWidget} from './entry-clips-widget.service';
import {KalturaLogger} from "@kaltura-ng/kaltura-logger";
import { ClipAndTrimAppViewService } from 'app-shared/kmc-shared/kmc-views/component-views';
import { EntryStore } from '../entry-store.service';
import { Observable, merge } from 'rxjs';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

@Component({
    selector: 'kEntryClips',
    templateUrl: './entry-clips.component.html',
    styleUrls: ['./entry-clips.component.scss'],
    providers: [
      KalturaLogger.createLogger('EntryClipsComponent')
    ]
})
export class EntryClips implements OnInit, OnDestroy {
    public _defaultSortOrder = globalConfig.client.views.tables.defaultSortOrder;
    public _loading = false;
    public _loadingError = null;
    public _clipAndTrimEnabled = false;
    public _clipAndTrimDisabledReason: string = null;

    constructor(public _widgetService: EntryClipsWidget,
                private _clipAndTrimAppViewService: ClipAndTrimAppViewService,
                logger: KalturaLogger,
                private _store: EntryStore) {
    }

    public _rowTrackBy(index: number, item: any): string {
        return item.id;
    }

    public _convertSortValue(value: boolean): number {
        return value ? 1 : -1;

    }

    public _onSortChanged(event: any) {
        if (event.field && event.order && (this._widgetService.sortOrder !== event.order || this._widgetService.sortBy !== event.field)) {
            this._widgetService.sortOrder = event.order;
            this._widgetService.sortBy = event.field;

            this._widgetService.updateClips();
        }
    }

    public _onPaginationChanged(state: any): void {
        if (state.page !== this._widgetService.pageIndex || state.rows !== this._widgetService.pageSize) {
            this._widgetService.pageIndex = state.page;
            this._widgetService.pageSize = state.rows;
            this._widgetService.updateClips();
        }
    }

    ngOnInit() {
        this._widgetService.attachForm();

        merge(
            this._widgetService.data$,
            this._store.hasSource.value$
        )
            .pipe(cancelOnDestroy(this))
            .subscribe(
                () => {
                    if (this._widgetService.data) {
                        this._clipAndTrimEnabled = this._clipAndTrimAppViewService.isAvailable({
                            entry: this._widgetService.data,
                            hasSource: this._store.hasSource.value()
                        });
                    }else {
                        this._clipAndTrimEnabled = false;
                    }
                }
            );
    }

    ngOnDestroy() {
        this._widgetService.detachForm();
    }
}

