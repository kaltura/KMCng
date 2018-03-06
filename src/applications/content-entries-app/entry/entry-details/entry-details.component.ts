import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { EntryStore } from '../entry-store.service';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { KalturaEntryStatus } from 'kaltura-ngx-client/api/types/KalturaEntryStatus';
import { KalturaSourceType } from 'kaltura-ngx-client/api/types/KalturaSourceType';
import { KalturaMediaType } from 'kaltura-ngx-client/api/types/KalturaMediaType';
import { BrowserService } from 'app-shared/kmc-shell';
import { EntryDetailsWidget } from './entry-details-widget.service';

export interface EntryDetailsKalturaMediaEntry extends KalturaMediaEntry {
  recordedEntryId?: string
}

@Component({
	selector: 'kEntryDetails',
	templateUrl: './entry-details.component.html',
	styleUrls: ['./entry-details.component.scss']
})
export class EntryDetails implements OnInit, OnDestroy {

	public _entryHasContent: boolean = false;
	public _entryReady: boolean = false;
	public _isLive: boolean = false;
	public _isRecordedLive: boolean = false;
	public _hasDuration: boolean = false;
	public _isClip: boolean = false;

	public _currentEntry: EntryDetailsKalturaMediaEntry;

	get currentEntry(): EntryDetailsKalturaMediaEntry {
		return this._currentEntry;
	}



	constructor(public _widgetService: EntryDetailsWidget,
				private browserService: BrowserService,

				public _entryStore: EntryStore) {
	}

	ngOnInit() {
        this._widgetService.attachForm();

		this._widgetService.data$.subscribe(
			data => {
				if (data) {
					this._currentEntry = data;
					this._entryHasContent = this._currentEntry.status !== KalturaEntryStatus.noContent;
					this._entryReady = this._currentEntry.status === KalturaEntryStatus.ready;
					const sourceType = this._currentEntry.sourceType;
					this._isLive = (sourceType === KalturaSourceType.liveStream ||
					sourceType === KalturaSourceType.akamaiLive ||
					sourceType === KalturaSourceType.akamaiUniversalLive ||
					sourceType === KalturaSourceType.manualLiveStream);
					this._isRecordedLive = (sourceType === KalturaSourceType.recordedLive);
					this._hasDuration = (this._currentEntry.status !== KalturaEntryStatus.noContent && !this._isLive && this._currentEntry.mediaType !== KalturaMediaType.image);
					this._isClip = !this._isRecordedLive && (this._currentEntry.id !== this._currentEntry.rootEntryId);
				}
			}
		);
	}

	openPreviewAndEmbed() {
		alert("Open Preview & Embed Window");
	}

	openLandingPage(landingPage: string) {
		this.browserService.openLink(landingPage);
	}

	navigateToEntry(entryId) {
		this._entryStore.openEntry(entryId);
	}


	ngOnDestroy() {
        this._widgetService.detachForm();
	}
}

