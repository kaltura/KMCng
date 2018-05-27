import { Host, Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/subscribeOn';
import 'rxjs/add/operator/switchMap';

import { KalturaClient, KalturaMultiRequest, KalturaTypesFactory } from 'kaltura-ngx-client';
import { KalturaMediaEntry } from 'kaltura-ngx-client/api/types/KalturaMediaEntry';
import { BaseEntryGetAction } from 'kaltura-ngx-client/api/types/BaseEntryGetAction';
import { BaseEntryUpdateAction } from 'kaltura-ngx-client/api/types/BaseEntryUpdateAction';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { EntryWidgetsManager } from './entry-widgets-manager';
import { OnDataSavingReasons } from '@kaltura-ng/kaltura-ui';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { EntriesStore } from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { PageExitVerificationService } from 'app-shared/kmc-shell/page-exit-verification';
import { ContentEntryViewService } from 'app-shared/kmc-shared/kmc-views/details-views';
import { ContentEntriesMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger/kaltura-logger.service';
import { FlavorAssetGetFlavorAssetsWithParamsAction } from 'kaltura-ngx-client/api/types/FlavorAssetGetFlavorAssetsWithParamsAction';

export enum ActionTypes
{
	EntryLoading,
	EntryLoaded,
	EntryLoadingFailed,
	EntrySaving,
	EntryPrepareSavingFailed,
	EntrySavingFailed,
	EntryDataIsInvalid,
	ActiveSectionBusy
}

declare type StatusArgs =
{
	action : ActionTypes;
	error? : Error;

}

@Injectable()
export class EntryStore implements  OnDestroy {

	private _loadEntrySubscription : ISubscription;
	private _state = new BehaviorSubject<StatusArgs>({ action : ActionTypes.EntryLoading, error : null});
  private _pageExitVerificationToken: string;

	public state$ = this._state.asObservable();
	private _entryIsDirty : boolean;

	public get entryIsDirty() : boolean{
		return this._entryIsDirty;
	}

    private _hasSource = new BehaviorSubject<boolean>(false);
    public  readonly hasSource = {
        value$: this._hasSource.asObservable(),
        value: () => this._hasSource.getValue()
    };

	private _refreshEntriesListUponLeave = false;
	private _entry : BehaviorSubject<KalturaMediaEntry> = new BehaviorSubject<KalturaMediaEntry>(null);
	public entry$ = this._entry.asObservable();
	private _entryId : string;

	public get entryId() : string{
		return this._entryId;
	}
	public get entry() : KalturaMediaEntry
	{
		return this._entry.getValue();
	}

    constructor(private _kalturaServerClient: KalturaClient,
				private _router: Router,
				private _browserService : BrowserService,
				private _entriesStore : EntriesStore,
				@Host() private _widgetsManager: EntryWidgetsManager,
				private _entryRoute: ActivatedRoute,
        private _logger: KalturaLogger,
        private _contentEntryViewService: ContentEntryViewService,
        private _contentEntriesMainViewService: ContentEntriesMainViewService,
        private _pageExitVerificationService: PageExitVerificationService,
        private _appLocalization: AppLocalization) {

        this._logger = _logger.subLogger('EntryStore');
		this._widgetsManager.entryStore = this;

		this._onSectionsStateChanges();
		this._onRouterEvents();

		// hard reload the entries upon navigating back from entry (by adding 'reloadEntriesListOnNavigateOut' to the queryParams)
    this._entryRoute.queryParams.cancelOnDestroy(this)
      .first()
      .subscribe(queryParams => {
         const reloadEntriesListOnNavigateOut = !!queryParams['reloadEntriesListOnNavigateOut']; // convert string to boolean
         if (reloadEntriesListOnNavigateOut) {
           this._refreshEntriesListUponLeave = reloadEntriesListOnNavigateOut;
         }
       });
    }

    private _onSectionsStateChanges()
	{
		this._widgetsManager.widgetsState$
            .cancelOnDestroy(this)
            .debounce(() => Observable.timer(500))
            .subscribe(
				sectionsState =>
				{
					const newDirtyState = Object.keys(sectionsState).reduce((result, sectionName) => result || sectionsState[sectionName].isDirty,false);

					if (this._entryIsDirty !== newDirtyState)
					{
						console.log(`entry store: update entry is dirty state to ${newDirtyState}`);
						this._entryIsDirty = newDirtyState;

						this._updatePageExitVerification();

					}
				}
			);

	}

	private _updatePageExitVerification() {
    if (this._entryIsDirty) {
      this._pageExitVerificationToken = this._pageExitVerificationService.add();
    } else {
    	if (this._pageExitVerificationToken) {
            this._pageExitVerificationService.remove(this._pageExitVerificationToken);
        }
      this._pageExitVerificationToken = null;
    }
	}

	ngOnDestroy() {
		this._loadEntrySubscription && this._loadEntrySubscription.unsubscribe();
		this._state.complete();
		this._entry.complete();

		if (this._pageExitVerificationToken) {
            this._pageExitVerificationService.remove(this._pageExitVerificationToken);
        }

		if (this._refreshEntriesListUponLeave)
		{
			this._entriesStore.reload();
		}
	}

	private _onRouterEvents() : void {
		this._router.events
            .cancelOnDestroy(this)
            .subscribe(
				event => {
					if (event instanceof NavigationStart) {
					} else if (event instanceof NavigationEnd) {

						// we must defer the loadEntry to the next event cycle loop to allow components
						// to init them-selves when entering this module directly.
						setTimeout(() =>
						{
							const currentEntryId = this._entryRoute.snapshot.params.id;
							const entry = this._entry.getValue();
							if (!entry || (entry && entry.id !== currentEntryId)) {
								this._loadEntry(currentEntryId);
							}
						});
					}
				}
			)
	}

	private _transmitSaveRequest(newEntry : KalturaMediaEntry) {
		this._state.next({action: ActionTypes.EntrySaving});

		const request = new KalturaMultiRequest(
			new BaseEntryUpdateAction({
				entryId: this.entryId,
				baseEntry: newEntry
			})
		);

		this._widgetsManager.notifyDataSaving(newEntry, request, this.entry)
            .cancelOnDestroy(this)
            .tag('block-shell')
			.monitor('entry store: prepare entry for save')
            .flatMap(
				(response) => {
					if (response.ready) {
						this._refreshEntriesListUponLeave = true;

						return this._kalturaServerClient.multiRequest(request)
                            .monitor('entry store: save entry')
                            .tag('block-shell')
                            .map(
								response => {
									if (response.hasErrors()) {
										this._state.next({action: ActionTypes.EntrySavingFailed});
									} else {
										this._loadEntry(this.entryId);
									}

									return Observable.empty();
								}
							)
					}
					else {
						switch (response.reason) {
							case OnDataSavingReasons.validationErrors:
								this._state.next({action: ActionTypes.EntryDataIsInvalid});
								break;
							case OnDataSavingReasons.attachedWidgetBusy:
								this._state.next({action: ActionTypes.ActiveSectionBusy});
								break;
							case OnDataSavingReasons.buildRequestFailure:
								this._state.next({action: ActionTypes.EntryPrepareSavingFailed});
								break;
						}

						return Observable.empty();
					}
				}
			)
            .subscribe(
				response => {
					// do nothing - the service state is modified inside the map functions.
				},
				error => {
					// should not reach here, this is a fallback plan.
					this._state.next({action: ActionTypes.EntrySavingFailed});
				}
			);
	}
	public saveEntry() : void {

	    this._logger.info(`handle save entry action`, { entry: this.entry });
		const newEntry = KalturaTypesFactory.createObject(this.entry);

		if (newEntry && newEntry instanceof KalturaMediaEntry) {
			this._transmitSaveRequest(newEntry)
		} else {
			this._logger.warn(`Failed to create a new instance of the entry type '${this.entry ? typeof this.entry : 'n/a'}`);
			this._state.next({action: ActionTypes.EntryPrepareSavingFailed});
		}
	}

    public reloadEntry(): void {
        if (this.entryId) {
            this._logger.info(`handle reload entry action`);
            this._loadEntry(this.entryId);
        }
    }

	private _loadEntry(entryId : string) : void {
	    this._logger.info(`handle load entry request`, { entryId });
		if (this._loadEntrySubscription) {
		    this._logger.info(`another load entry request is in progres, abort it, start a new one`);
			this._loadEntrySubscription.unsubscribe();
			this._loadEntrySubscription = null;
		}

		this._entryId = entryId;
		this._entryIsDirty = false;
		this._updatePageExitVerification();

		this._state.next({action: ActionTypes.EntryLoading});
		this._widgetsManager.notifyDataLoading(entryId);

		this._loadEntrySubscription = this._getEntry(entryId)
            .cancelOnDestroy(this)
            .subscribe(
                ({ entry, hasSource }) => {
                    this._hasSource.next(hasSource);
				    this._logger.info(`handle successful load entry request`);
                    if (this._contentEntryViewService.isAvailable({
                        entry,
                        activatedRoute: this._entryRoute,
                        section: ContentEntryViewSections.ResolveFromActivatedRoute
                    })) {
                        this._entry.next(entry);
                        this._entryId = entry.id;

                        const dataLoadedResult = this._widgetsManager.notifyDataLoaded(entry, { isNewData: false });

                        if (dataLoadedResult.errors.length) {
                            this._state.next({
                                action: ActionTypes.EntryLoadingFailed,
                                error: new Error(`one of the widgets failed while handling data loaded event`)
                            });
                        } else {
                            this._state.next({ action: ActionTypes.EntryLoaded });
                        }
                    } else {
                        this._browserService.handleUnpermittedAction(true);
                    }
				},
				error => {
                    this._logger.info(`handle failed load entry request`, { errorMessage: error.message });
					this._state.next({action: ActionTypes.EntryLoadingFailed, error});

				}
			);
	}

    public openSection(sectionKey: ContentEntryViewSections): void {
	    this._logger.info(`handle open section action`, { sectionKey });
        this._contentEntryViewService.open({ section: sectionKey, entry: this.entry });
    }

    private _getEntry(entryId: string): Observable<{ entry: KalturaMediaEntry, hasSource: boolean }> {
        if (entryId) {
            return this._kalturaServerClient.multiRequest(
                new KalturaMultiRequest(
                    new BaseEntryGetAction({ entryId }),
                    new FlavorAssetGetFlavorAssetsWithParamsAction({ entryId })
                )
            ).map(responses => {
                if (responses.hasErrors()) {
                    const errorMessage = responses.reduce((acc, val) => `${acc}\n${val.error ? val.error.message : ''}`, '');
                    throw new Error(errorMessage);
                }

                const [baseEntryResponse, flavorsResponse] = responses;
                const entry = baseEntryResponse.result;
                const flavors = flavorsResponse.result;
                if (entry instanceof KalturaMediaEntry) {
                    const hasSource = !!flavors.filter(({ flavorAsset }) => flavorAsset && flavorAsset.isOriginal).length;
                    return { entry, hasSource };
                } else {
                    throw new Error(`invalid type provided, expected KalturaMediaEntry, got ${typeof entry}`);
                }
            });
        } else {
            return Observable.throw(new Error('missing entryId'));
        }
    }

    public openEntry(entry: KalturaMediaEntry | string): void {
        const entryId = entry instanceof KalturaMediaEntry ? entry.id : entry;
        this._logger.info(`handle open entry action`, { entryId });
        if (entryId !== this.entryId) {
            this.canLeave()
                .filter(({ allowed }) => allowed)
                .cancelOnDestroy(this)
                .subscribe(() => {
                    if (entry instanceof KalturaMediaEntry) {
                        this._contentEntryViewService.open({ entry, section: ContentEntryViewSections.Metadata });
                    } else {
                        this._contentEntryViewService.openById(entry, ContentEntryViewSections.Metadata);
                    }
                });
        } else {
            this._logger.info(`attemtp to navigate to the same entry, abort action`);
        }
    }

	public canLeave() : Observable<{ allowed : boolean}>
	{
		return Observable.create(observer =>
		{
			if (this._entryIsDirty) {
				this._browserService.confirm(
					{
						header: this._appLocalization.get('applications.content.entryDetails.captions.cancelEdit'),
						message: this._appLocalization.get('applications.content.entryDetails.captions.discard'),
						accept: () => {
							this._entryIsDirty = false;
							observer.next({allowed: true});
							observer.complete();
						},
						reject: () => {
							observer.next({allowed: false});
							observer.complete();
						}
					}
				)
			}else
			{
				observer.next({allowed: true});
				observer.complete();
			}
		}).monitor('entry store: check if can leave section without saving');
	}

    public returnToEntries(): void {
        this._contentEntriesMainViewService.open();
    }


	public setRefreshEntriesListUponLeave() {
	  this._refreshEntriesListUponLeave = true;
  }

  public updateHasSourceStatus(value: boolean) : void {
	    this._hasSource.next(value);
  }
}
