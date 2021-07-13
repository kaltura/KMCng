import { Host, Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { KalturaClient, KalturaMultiRequest, KalturaObjectBaseFactory } from 'kaltura-ngx-client';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { BaseEntryGetAction } from 'kaltura-ngx-client';
import { BaseEntryUpdateAction } from 'kaltura-ngx-client';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';
import { EntryWidgetsManager } from './entry-widgets-manager';
import { OnDataSavingReasons } from '@kaltura-ng/kaltura-ui';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { EntriesStore } from 'app-shared/content-shared/entries/entries-store/entries-store.service';
import { PageExitVerificationService } from 'app-shared/kmc-shell/page-exit-verification';
import { ContentEntryViewService } from 'app-shared/kmc-shared/kmc-views/details-views';
import { ContentEntriesMainViewService } from 'app-shared/kmc-shared/kmc-views';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import { FlavorAssetGetFlavorAssetsWithParamsAction } from 'kaltura-ngx-client';
import { BaseEntryDeleteAction } from 'kaltura-ngx-client';
import { BehaviorSubject, Observable, Subject, Unsubscribable } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { timer, EMPTY } from 'rxjs';
import { filter, map, flatMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

export enum ActionTypes
{
	EntryLoading,
	EntryLoaded,
	EntryLoadingFailed,
	EntrySaving,
	EntryPrepareSavingFailed,
	EntrySavingFailed,
	EntryDataIsInvalid,
	ActiveSectionBusy,
}

export enum NotificationTypes {
    ViewEntered
}

declare interface StatusArgs {
	action : ActionTypes;
	error? : Error;

}

@Injectable()
export class EntryStore implements OnDestroy {
	private _loadEntrySubscription: Unsubscribable;
	private _state = new BehaviorSubject<StatusArgs>({ action : ActionTypes.EntryLoading, error : null});
    private _pageExitVerificationToken: string;
    private _notifications = new Subject<{ type: NotificationTypes, error?: Error }>();
    public notifications$ = this._notifications.asObservable();
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
	private _isNewDraftEntry = false;
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
        private _contentEntryViewService: ContentEntryViewService,
        private _contentEntriesMainViewService: ContentEntriesMainViewService,
        private _pageExitVerificationService: PageExitVerificationService,
        private _appLocalization: AppLocalization) {


		this._widgetsManager.entryStore = this;

		this._onSectionsStateChanges();
		this._onRouterEvents();

        const { reloadEntriesListOnNavigateOut, draftEntry } = this._contentEntryViewService.popOpenArgs() || { reloadEntriesListOnNavigateOut: false, draftEntry: false };
        this._refreshEntriesListUponLeave = !!reloadEntriesListOnNavigateOut;
        this._isNewDraftEntry = !!draftEntry;
    }
    private _onSectionsStateChanges()
	{
		this._widgetsManager.widgetsState$
            .pipe(cancelOnDestroy(this))
            .pipe(debounce(() => timer(500)))
            .subscribe(
				sectionsState =>
				{
					const newDirtyState = Object.keys(sectionsState).reduce((result, sectionName) => result || sectionsState[sectionName].isDirty,false);

					if (this._entryIsDirty !== newDirtyState)
					{
						console.log(`entry store: update entry is dirty state to ${newDirtyState}`);
						this._entryIsDirty = newDirtyState;
                        this._isNewDraftEntry = false;

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
            .pipe(cancelOnDestroy(this))
            .subscribe(
                event => {
                    if (event instanceof NavigationEnd) {
                        // we must defer the loadEntry to the next event cycle loop to allow components
                        // to init them-selves when entering this module directly.
                        setTimeout(() => {
                            const currentEntryId = this._entryRoute.snapshot.params.id;
                            const entry = this._entry.getValue();
                            if (!entry || (entry && entry.id !== currentEntryId)) {
                                this._loadEntry(currentEntryId);
                            } else {
                                this._notifications.next({ type: NotificationTypes.ViewEntered });
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
            .pipe(cancelOnDestroy(this))
            .pipe(tag('block-shell'))
            .pipe(flatMap(
				(response) => {
					if (response.ready) {
						this._refreshEntriesListUponLeave = true;

						return this._kalturaServerClient.multiRequest(request)
                            .pipe(tag('block-shell'))
                            .pipe(map(
								response => {
									if (response.hasErrors()) {
										this._state.next({action: ActionTypes.EntrySavingFailed});
									} else {
                                        this._isNewDraftEntry = false;
										this._loadEntry(this.entryId);
									}

									return EMPTY;
								}
							))
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

						return EMPTY;
					}
				}
			))
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

		const newEntry = KalturaObjectBaseFactory.createObject(this.entry);

		if (newEntry && newEntry instanceof KalturaMediaEntry) {
			this._transmitSaveRequest(newEntry)
		} else {
			console.error(new Error(`Failed to create a new instance of the entry type '${this.entry ? typeof this.entry : 'n/a'}`));
			this._state.next({action: ActionTypes.EntryPrepareSavingFailed});
		}
	}

	public reloadEntry() : void
	{
		if (this.entryId)
		{
			this._loadEntry(this.entryId);
		}
	}

    private _deleteEntry(entryId: string): Observable<void> {
        return this._kalturaServerClient
            .request(new BaseEntryDeleteAction({ entryId }))
            .pipe(map(() => {}));
    }

	private _loadEntry(entryId : string) : void {
		if (this._loadEntrySubscription) {
			this._loadEntrySubscription.unsubscribe();
			this._loadEntrySubscription = null;
		}

		this._entryId = entryId;
		this._entryIsDirty = false;
		this._updatePageExitVerification();

		this._state.next({action: ActionTypes.EntryLoading});
		this._widgetsManager.notifyDataLoading(entryId);

		this._loadEntrySubscription = this._getEntry(entryId)
            .pipe(cancelOnDestroy(this))
            .subscribe(
                ({ entry, hasSource }) => {
                    this._entry.next(entry);
                    this._entryId = entry.id;
                    this._hasSource.next(hasSource);
                    this._notifications.next({ type: NotificationTypes.ViewEntered });

                    if (this._contentEntryViewService.isAvailable({
                        entry,
                        activatedRoute: this._entryRoute,
                        section: ContentEntryViewSections.ResolveFromActivatedRoute
                    })) {
                        const dataLoadedResult = this._widgetsManager.notifyDataLoaded(entry, { isNewData: false });

                        if (dataLoadedResult.errors.length) {
                            this._state.next({
                                action: ActionTypes.EntryLoadingFailed,
                                error: new Error(`one of the widgets failed while handling data loaded event`)
                            });
                        } else {
                            this._state.next({ action: ActionTypes.EntryLoaded });
                        }
                    }
				},
				error => {
					this._state.next({action: ActionTypes.EntryLoadingFailed, error});

				}
			);
	}

    public openSection(sectionKey: ContentEntryViewSections): void {
        this._contentEntryViewService.open({ section: sectionKey, entry: this.entry });
    }

    private _getEntry(entryId: string): Observable<{ entry: KalturaMediaEntry, hasSource: boolean }> {
        if (entryId) {
            return this._kalturaServerClient.multiRequest(
                new KalturaMultiRequest(
                    new BaseEntryGetAction({ entryId }),
                    new FlavorAssetGetFlavorAssetsWithParamsAction({ entryId })
                )
            ).pipe(map(responses => {
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
            }));
        } else {
            return throwError(new Error('missing entryId'));
        }
    }

    public openEntry(entry: KalturaMediaEntry | string): void {
        const entryId = entry instanceof KalturaMediaEntry ? entry.id : entry;
        if (entryId !== this.entryId) {
            this.canLeave()
                .pipe(filter(({ allowed }) => allowed))
                .pipe(cancelOnDestroy(this))
                .subscribe(() => {
                    if (entry instanceof KalturaMediaEntry) {
                        this._contentEntryViewService.open({ entry, section: ContentEntryViewSections.Metadata });
                    } else {
                        this._contentEntryViewService.openById(entry, ContentEntryViewSections.Metadata);
                    }
                });
        }
    }

    public canLeave(): Observable<{ allowed: boolean }> {
        const dispatchValue = observer => value => () => {
            observer.next(value);
            observer.complete();
        };
        return Observable.create(observer => {
            const allowed = dispatchValue(observer)({ allowed: true });
            const disallowed = dispatchValue(observer)({ allowed: false });

            if (this._isNewDraftEntry) {
                this._entryIsDirty = false;
                this._browserService.confirm(
                    {
                        header: this._appLocalization.get('applications.content.entryDetails.save'),
                        message: this._appLocalization.get('applications.content.entryDetails.newDraftEntryWarning'),
                        accept: () => {
                            allowed();
                        },
                        reject: () => {
                            this._deleteEntry(this._entryId)
                                .pipe(
                                    tag('block-shell'),
                                    cancelOnDestroy(this)
                                )
                                .subscribe(
                                    () => allowed(),
                                    error => {
                                        this._browserService.alert({
                                            header: this._appLocalization.get('app.common.error'),
                                            message: error.message,
                                            accept: () => allowed()
                                        });
                                    }
                                );
                        }
                    }
                );
            } else if (this._entryIsDirty) {
                this._browserService.confirm(
                    {
                        header: this._appLocalization.get('applications.content.entryDetails.captions.cancelEdit'),
                        message: this._appLocalization.get('applications.content.entryDetails.captions.discard'),
                        accept: () => {
                            this._entryIsDirty = false;
                            allowed();
                        },
                        reject: () => {
                            disallowed();
                        }
                    }
                );
            } else {
                allowed();
            }
        });
    }

    public returnToEntries(): void {
	    if (this._contentEntriesMainViewService.isAvailable()) {
            this._contentEntriesMainViewService.open();
        } else {
            this._browserService.navigateToDefault();
        }
    }


	public setRefreshEntriesListUponLeave() {
	  this._refreshEntriesListUponLeave = true;
  }

  public updateHasSourceStatus(value: boolean) : void {
	    this._hasSource.next(value);
  }
}
