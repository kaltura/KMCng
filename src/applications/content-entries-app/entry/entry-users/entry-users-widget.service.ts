import { Injectable, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ISubscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs';
import {
    KalturaClient,
    KalturaFilterPager,
    KalturaMediaEntry,
    KalturaMultiRequest,
    KalturaMultiResponse,
    KalturaResponse,
    KalturaUser,
    KalturaUserFilter,
    UserGetAction,
    UserListAction
} from 'kaltura-ngx-client';

import { EntryWidget } from '../entry-widget';
import { asyncScheduler } from 'rxjs';
import { KMCPermissions, KMCPermissionsService } from 'app-shared/kmc-shared/kmc-permissions';
import { ContentEntryViewSections } from 'app-shared/kmc-shared/kmc-views/details-views/content-entry-view.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { merge, forkJoin } from 'rxjs';
import { observeOn, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class EntryUsersWidget extends EntryWidget implements OnDestroy
{

    public _creator: string = "";
	public _owner: KalturaUser = null;

	public usersForm : FormGroup;

	constructor(private _formBuilder: FormBuilder,
              private _kalturaServerClient: KalturaClient,
              private _permissionsService: KMCPermissionsService,
                logger: KalturaLogger)
    {
        super(ContentEntryViewSections.Users, logger);
	    this._buildForm();
    }
	private _buildForm() : void{
		this.usersForm = this._formBuilder.group({
			owners : null,
			editors: [],
			publishers: [],
			viewers: [],
		});

		merge(this.usersForm.valueChanges,
			this.usersForm.statusChanges)
            .pipe(observeOn(asyncScheduler)) // using async scheduler so the form group status/dirty mode will be synchornized
            .pipe(cancelOnDestroy(this))
            .subscribe(
				() => {
					super.updateState({
						isValid: this.usersForm.status !== 'INVALID',
						isDirty: this.usersForm.dirty
					});
				}
			);
	}

	protected onDataSaving(data: KalturaMediaEntry, request: KalturaMultiRequest){
		if (this.usersForm.dirty){
			// save owner
			if (this._owner && this._owner.id) {
				data.userId = this._owner.id;
			}
			// save editors
			const editors: KalturaUser[] = this.usersForm.value.editors;

			if (editors && editors.length){
				let entitledUsersEdit = '';
				editors.forEach(editor => {
					entitledUsersEdit += editor.id + ",";
				});
				entitledUsersEdit = entitledUsersEdit.substring(0, entitledUsersEdit.length-1); // remove last comma
				data.entitledUsersEdit = entitledUsersEdit;
			}else{
				data.entitledUsersEdit = null;
			}
			// save publishers
			const publishers: KalturaUser[] = this.usersForm.value.publishers;
			if (publishers && publishers.length){
				let entitledUsersPublish = '';
				publishers.forEach(publisher => {
					entitledUsersPublish += publisher.id + ",";
				});
				entitledUsersPublish = entitledUsersPublish.substring(0, entitledUsersPublish.length-1); // remove last comma
				data.entitledUsersPublish = entitledUsersPublish;
			}else{
				data.entitledUsersPublish = null;
			}

            // save viewers
            const viewers: KalturaUser[] = this.usersForm.value.viewers;
            if (viewers && viewers.length) {
                data.entitledUsersView = viewers.map(({ id }) => id).join(',');
            } else {
                data.entitledUsersView = null;
            }
		}
	}
    /**
     * Do some cleanups if needed once the section is removed
     */
    protected onReset()
    {
	    this._creator = "";
	    this._owner = null;
	    this.usersForm.reset({
		    owners: [],
		    editors: [],
		    publishers: []
	    });
    }

    protected onActivate(firstTimeActivating: boolean) {

	    super._showLoader();

	    let actions : Observable<void>[] = [];

	    if (!this._permissionsService.hasPermission(KMCPermissions.CONTENT_MANAGE_ENTRY_USERS)) {
        this.usersForm.disable({ emitEvent: false });
      }

        if (!this.data.creatorId && !this.data.userId) {
            this._creator = '';
            this._owner = new KalturaUser({ screenName: '' });
        } else {
            const getUserActions = [];
            // if creatorId and userId is the same make single call to reduce number of calls
            if (this.data.creatorId && this.data.userId && this.data.creatorId === this.data.userId) {
                getUserActions.push(new UserGetAction({ userId: this.data.creatorId }));
            } else { // otherwise call for each user separately
                if (this.data.creatorId) {
                    getUserActions.push(new UserGetAction({ userId: this.data.creatorId }));
                }

                if (this.data.userId) {
                    getUserActions.push(new UserGetAction({ userId: this.data.userId }));
                }
            }

            const fetchUsersData$ = this._kalturaServerClient.multiRequest(new KalturaMultiRequest(...getUserActions))
                .pipe(cancelOnDestroy(this, this.widgetReset$))
                .pipe(map((responses: KalturaMultiResponse) => {
                    if (responses.hasErrors()) {
                        this._creator = this.data.creatorId;
                        this._owner = new KalturaUser({ screenName: this.data.userId });
                    } else {
                        const creatorResponse = responses.find((item: KalturaResponse<KalturaUser>) => item.result.id === this.data.creatorId);
                        const ownerResponse = responses.find((item: KalturaResponse<KalturaUser>) => item.result.id === this.data.userId);

                        this._creator = creatorResponse
                            ? (creatorResponse.result.screenName ? creatorResponse.result.screenName : creatorResponse.result.id)
                            : this.data.creatorId;

                        this._owner = ownerResponse ? ownerResponse.result : new KalturaUser({ screenName: this.data.userId });
                    }

                    return undefined;
                }));
            actions.push(fetchUsersData$);
        }

	    if (this.data.entitledUsersEdit && this.data.entitledUsersEdit.length) {
		    const entitledUsersEdit = this.data.entitledUsersEdit.split(",");
		    const request = new KalturaMultiRequest();
		    entitledUsersEdit.forEach(entitledUser=>{
			    request.requests.push(new UserGetAction({userId: entitledUser}));
		    });

		    const fetchEditorsData$ = this._kalturaServerClient.multiRequest(request)
			    .pipe(cancelOnDestroy(this, this.widgetReset$))
                .pipe(map(
                    responses => {
                        const editors = responses.map((response, index) => {
                            if (response.error) {
                                const userId = entitledUsersEdit[index];
                                return new KalturaUser({ id: userId, screenName: userId });
                            }
                            return response.result;
                        });
                        this.usersForm.patchValue({ editors });
                        return undefined;
                    }
                ));

		    actions.push(fetchEditorsData$);
	    }

	    if (this.data.entitledUsersPublish && this.data.entitledUsersPublish.length) {
		    const entitledUsersPublish = this.data.entitledUsersPublish.split(",");
		    const request = new KalturaMultiRequest();
		    entitledUsersPublish.forEach(entitledUser=>{
			    request.requests.push(new UserGetAction({userId: entitledUser}));
		    });

		    const fetchPublishersData$ = this._kalturaServerClient.multiRequest(request)
			    .pipe(cancelOnDestroy(this, this.widgetReset$))
                .pipe(map(
                    responses => {
                        const publishers = responses.map((response, index) => {
                            if (response.error) {
                                const userId = entitledUsersPublish[index];
                                return new KalturaUser({ id: userId, screenName: userId });
                            }
                            return response.result;
                        });
                        this.usersForm.patchValue({ publishers });
                        return undefined;
                    }
                ));

		    actions.push(fetchPublishersData$);
	    }

        if (this.data.entitledUsersView && this.data.entitledUsersView.length) {
            const entitledUsersView = this.data.entitledUsersView.split(',');
            const getViewersActions = entitledUsersView.map(userId => new UserGetAction({ userId }));

            const fetchPublishersData$ = this._kalturaServerClient.multiRequest(new KalturaMultiRequest(...getViewersActions))
                .pipe(cancelOnDestroy(this, this.widgetReset$))
                .pipe(map(
                    responses => {
                        const viewers = responses.map((response, index) => {
                            if (response.error) {
                                const userId = entitledUsersView[index];
                                return new KalturaUser({ id: userId, screenName: userId });
                            }
                            return response.result;
                        });
                        this.usersForm.patchValue({ viewers });

                        return undefined;
                    }
                ));

            actions.push(fetchPublishersData$);
        }

	    return forkJoin(actions)
		    .pipe(map(responses => {
			    super._hideLoader();
			    return {failed : false};
		    }))
		    .pipe(catchError((error, caught) =>
		    {
		        console.warn(error);
			    super._hideLoader();
			    super._showActivationError();

			    return of({failed : true, error});
		    }));

    }

	public searchUsers(text : string)
	{
		return Observable.create(
			observer => {
				const requestSubscription: ISubscription = this._kalturaServerClient.request(
					new UserListAction(
						{
							filter: new KalturaUserFilter({
								idOrScreenNameStartsWith : text
							}),
							pager: new KalturaFilterPager({
								pageIndex : 0,
								pageSize : 30
							})
						}
					)
				)
				.pipe(cancelOnDestroy(this, this.widgetReset$))
				.subscribe(
					result =>
					{
						observer.next(result.objects);
						observer.complete();
					},
					err =>
					{
						observer.error(err);
					}
				);

				return () =>
				{
					console.log("entryUsersHandler.searchOwners(): cancelled");
					requestSubscription.unsubscribe();
				}
			});
	}

	public saveOwner(): void{
		this._owner = this.usersForm.value.owners[0];
	}

    ngOnDestroy()
    {

    }

}
