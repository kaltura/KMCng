import { Injectable,  OnDestroy, Host } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, NavigationStart, UrlSegment } from '@angular/router';
import { AppLocalization } from '@kaltura-ng/kaltura-common';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/subscribeOn';
import 'rxjs/add/operator/switchMap';

import { KalturaClient } from '@kaltura-ng/kaltura-client';
import { KalturaMediaEntry } from 'kaltura-typescript-client/types/KalturaMediaEntry';
import { KalturaMultiRequest } from 'kaltura-typescript-client';
import { BaseEntryGetAction } from 'kaltura-typescript-client/types/BaseEntryGetAction';
import { BaseEntryUpdateAction } from 'kaltura-typescript-client/types/BaseEntryUpdateAction';
import '@kaltura-ng/kaltura-common/rxjs/add/operators';
import { EntryFormManager } from './entry-form-manager';
import { KalturaTypesFactory } from 'kaltura-typescript-client';
import { OnDataSavingReasons } from '@kaltura-ng/kaltura-ui';
import { BrowserService } from 'app-shared/kmc-shell/providers/browser.service';
import { EntriesStore } from 'app-shared/content-shared/entries-store/entries-store.service';
import { EntryWidgetKeys } from './entry-widget-keys';
import { KalturaMediaType } from 'kaltura-typescript-client/types/KalturaMediaType';

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
  PermissionDenied
}

declare type StatusArgs =
{
	action : ActionTypes;
	error? : Error;

}

@Injectable()
export class EntryStore implements  OnDestroy {

	private _loadEntrySubscription : ISubscription;
	private _sectionToRouteMapping : { [key : number] : string} = {};
	private _state = new BehaviorSubject<StatusArgs>({ action : ActionTypes.EntryLoading, error : null});
  private _defaultSectionKey = EntryWidgetKeys.Metadata;

	public state$ = this._state.asObservable();
	private _entryIsDirty : boolean;

	public get entryIsDirty() : boolean{
		return this._entryIsDirty;
	}



	private _saveEntryInvoked = false;
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
				@Host() private _sectionsManager : EntryFormManager,
				private _entryRoute: ActivatedRoute,
                private _appLocalization: AppLocalization) {


		this._sectionsManager.entryStore = this;

		this._mapSections();

		this._onSectionsStateChanges();
		this._onRouterEvents();
    }

    private _onSectionsStateChanges()
	{
		this._sectionsManager.widgetsState$
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
			this._browserService.enablePageExitVerification();
		}
		else {
			this._browserService.disablePageExitVerification();
		}
	}

	ngOnDestroy() {
		this._loadEntrySubscription && this._loadEntrySubscription.unsubscribe();
		this._state.complete();
		this._entry.complete();

		this._browserService.disablePageExitVerification();

		if (this._saveEntryInvoked)
		{
			this._entriesStore.reload(true);
		}
	}

	private _mapSections() : void{
		if (!this._entryRoute || !this._entryRoute.snapshot.data.entryRoute)
		{
			throw new Error("this service can be injected from component that is associated to the entry route");
		}

		this._entryRoute.snapshot.routeConfig.children.forEach(childRoute =>
		{
			const routeSectionType = childRoute.data ? childRoute.data.sectionKey : null;

			if (routeSectionType !== null)
			{
				this._sectionToRouteMapping[routeSectionType] = childRoute.path;
			}
		});
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

		this._sectionsManager.onDataSaving(newEntry, request, this.entry)
            .cancelOnDestroy(this)
            .monitor('entry store: prepare entry for save')
            .flatMap(
				(response) => {
					if (response.ready) {
						this._saveEntryInvoked = true;

						return this._kalturaServerClient.multiRequest(request)
                            .monitor('entry store: save entry')
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

		const newEntry = KalturaTypesFactory.createObject(this.entry);

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

	private _canShowSection(data: KalturaMediaEntry) {
    const [currentSegment] = (<BehaviorSubject<UrlSegment[]>>this._entryRoute.firstChild.url).value;
    switch (data.mediaType) {
      case KalturaMediaType.image:
        return [
          EntryWidgetKeys.Metadata.toLowerCase(),
          EntryWidgetKeys.AccessControl.toLowerCase(),
          EntryWidgetKeys.Scheduling.toLowerCase(),
          EntryWidgetKeys.Related.toLowerCase(),
          EntryWidgetKeys.Users.toLowerCase()
        ].includes(currentSegment.path);
      default:
        return Object.values(EntryWidgetKeys).map(item => item.toLowerCase()).includes(currentSegment.path);
    }
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
		this._sectionsManager.onDataLoading(entryId);

		this._loadEntrySubscription = this._getEntry(entryId)
            .cancelOnDestroy(this)
            .subscribe(
				response => {
            if (this._canShowSection(response)) {
              this._entry.next(response);
              this._entryId = response.id;

              const dataLoadedResult = this._sectionsManager.onDataLoaded(response);

              if (dataLoadedResult.errors.length) {
                this._state.next({
                  action: ActionTypes.EntryLoadingFailed,
                  error: new Error(`one of the widgets failed while handling data loaded event`)
                });
              } else {
                this._state.next({ action: ActionTypes.EntryLoaded });
              }
            } else {
              this.openSection(this._defaultSectionKey);
            }
				},
				error => {
					this._state.next({action: ActionTypes.EntryLoadingFailed, error});

				}
			);
	}

    public openSection(sectionKey : string) : void{
		const navigatePath = this._sectionToRouteMapping[sectionKey];

		if (navigatePath) {
			this._router.navigate([navigatePath], {relativeTo: this._entryRoute});
		}
	}

	private _getEntry(entryId:string) : Observable<KalturaMediaEntry>
	{
		if (entryId)
		{
			return this._kalturaServerClient.request(
                new BaseEntryGetAction({entryId})
			).map(response =>
			{
				if (response instanceof KalturaMediaEntry)
				{
					return response;
				}else {
					throw new Error(`invalid type provided, expected KalturaMediaEntry, got ${typeof response}`);
				}
			});
		}else
		{
			return Observable.throw(new Error('missing entryId'));
		}
	}

	public openEntry(entryId : string)
	{
		this.canLeave()
            .cancelOnDestroy(this)
			.subscribe(
			response =>
			{
				if (response.allowed)
				{
					this._router.navigate(["entry", entryId],{ relativeTo : this._entryRoute.parent});
				}
			}
		);
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

	public returnToEntries(params : {force? : boolean} = {})
	{
		this._router.navigate(['content/entries']);
	}

}
