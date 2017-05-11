import { Component, OnInit, OnDestroy } from '@angular/core';
import { KalturaMediaType } from 'kaltura-typescript-client/types/all';
import { BrowserService } from 'kmc-shell';
import { EntryStore, ActionTypes } from '../entry-store/entry-store.service';
import { EntrySectionsListHandler } from './entry-sections-list/entry-sections-list-handler';
import { EntryMetadataHandler } from './entry-metadata/entry-metadata-handler';
import { EntryPreviewHandler } from './entry-preview/entry-preview-handler';
import { EntryCaptionsHandler } from './entry-captions/entry-captions-handler';
import { EntryAccessControlHandler } from './entry-access-control/entry-access-control-handler';
import { EntryClipsHandler } from './entry-clips/entry-clips-handler';
import { EntryRelatedHandler } from './entry-related/entry-related-handler';
import { EntryLiveHandler } from './entry-live/entry-live-handler';
import { EntryFlavoursHandler } from './entry-flavours/entry-flavours-handler';
import { EntryThumbnailsHandler } from './entry-thumbnails/entry-thumbnails-handler';
import { EntrySchedulingHandler } from './entry-scheduling/entry-scheduling-handler';
import { EntryUsersHandler } from './entry-users/entry-users-handler';
import { EntriesStore } from '../entries-store/entries-store.service';
import { EntrySectionsManager } from '../entry-store/entry-sections-manager';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng2/kaltura-ui';

@Component({
    selector: 'kEntry',
    templateUrl: './entry.component.html',
    styleUrls: ['./entry.component.scss'],
	providers : [
		EntryStore,
		EntrySectionsManager,
		EntrySectionsListHandler,
		EntryPreviewHandler,
		EntryMetadataHandler,
		EntryAccessControlHandler,
		EntryCaptionsHandler,
		EntryClipsHandler,
		EntryFlavoursHandler,
		EntryLiveHandler,
		EntryRelatedHandler,
		EntrySchedulingHandler,
		EntryThumbnailsHandler,
		EntryUsersHandler
	]
})
export class EntryComponent implements OnInit, OnDestroy {

	_entryName: string;
	_entryType: KalturaMediaType;

	public _showLoader = false;
	public _areaBlockerMessage: AreaBlockerMessage;
	public _currentEntryId: string;
	public _enablePrevButton: boolean;
	public _enableNextButton: boolean;

	public isSafari: boolean = false; // used for Safari specific styling

	constructor(public _entryStore: EntryStore,
				private  _entriesStore: EntriesStore,
				private _browserService: BrowserService) {
	}

	ngOnDestroy() {
	}

	private _updateNavigationState() {
		const entries = this._entriesStore.entries;
		if (entries && this._currentEntryId) {
			const currentEntry = entries.find(entry => entry.id === this._currentEntryId);
			const currentEntryIndex = currentEntry ? entries.indexOf(currentEntry) : -1;
			this._enableNextButton = currentEntryIndex >= 0 && (currentEntryIndex < entries.length - 1);
			this._enablePrevButton = currentEntryIndex > 0;

		} else {
			this._enableNextButton = false;
			this._enablePrevButton = false;
		}
	}

	ngOnInit() {
		this.isSafari = this._browserService.isSafari();

		this._entryStore.status$
            .cancelOnDestroy(this)
            .subscribe(
				status => {
					if (status) {
						switch (status.action) {
							case ActionTypes.EntryLoading:
								this._showLoader = true;
								this._areaBlockerMessage = null;

								// when loading new entry in progress, the 'entryID' property
								// reflect the entry that is currently being loaded
								// while 'entry$' stream is null
								this._currentEntryId = this._entryStore.entryId;
								this._updateNavigationState();
								break;
							case ActionTypes.EntryLoaded:
								this._showLoader = false;
								this._entryName = this._entryStore.entry.name;
								this._entryType = this._entryStore.entry.mediaType;
								break;
							case ActionTypes.EntryLoadingFailed:
								this._showLoader = false;
								this._areaBlockerMessage = new AreaBlockerMessage({
									message: status.error.message,
									buttons: [
										this._createBackToEntriesButton(),
										{
											label: 'Retry',
											action: () => {
												this._entryStore.reloadEntry();
											}
										}
									]
								});
								break;
							case ActionTypes.EntrySaving:
								this._showLoader = true;
								break;
							case ActionTypes.EntrySavingFailed:
								this._showLoader = false;
								this._areaBlockerMessage = new AreaBlockerMessage({
									message: 'Something happened during the save, please review your changes',
									buttons: [
										{
											label: 'Dismiss',
											action: () => {
												this._entryStore.reloadEntry();
												this._areaBlockerMessage = null;
											}
										}
									]
								});
								break;
							case ActionTypes.NavigateOut:
								this._showLoader = true;
								break;
							default:
								break;
						}
					}
				},
				error => {
					// TODO [kmc] navigate to error page
					throw error;
				});
	}

	private _createBackToEntriesButton(): AreaBlockerMessageButton {
		return {
			label: 'Back To Entries',
			action: () => {
				this._entryStore.returnToEntries();
			}
		};
	}

    public _backToList(){
    	this._entryStore.returnToEntries();
    }

    public _save()
	{
		this._entryStore.saveEntry();
	}

    public _navigateToPrevious() : void
	{
		const entries = this._entriesStore.entries;

		if (entries && this._currentEntryId) {
			const currentEntry = entries.find(entry => entry.id === this._currentEntryId);
			const currentEntryIndex =  currentEntry ? entries.indexOf(currentEntry) : -1;
			if (currentEntryIndex > 0)
			{
				const prevEntry = entries[currentEntryIndex-1];
				this._entryStore.openEntry(prevEntry.id);
			}
		}
	}

	public _navigateToNext() : void
	{
		const entries = this._entriesStore.entries;

		if (entries && this._currentEntryId) {
			const currentEntry = entries.find(entry => entry.id === this._currentEntryId);
			const currentEntryIndex =  currentEntry ? entries.indexOf(currentEntry) : -1;
			if (currentEntryIndex >= 0 && (currentEntryIndex < entries.length -1))
			{
				const nextEntry = entries[currentEntryIndex+1];
				this._entryStore.openEntry(nextEntry.id);
			}
		}
	}

	public _onLoadingAction(actionKey : string)
	{
		if (actionKey === 'returnToEntries')
		{
			this._entryStore.returnToEntries({force:true});
		}else if (actionKey == 'retry')
		{

		}
	}

}

