import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit,OnInit, OnDestroy } from '@angular/core';
import { ISubscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { KalturaUser } from '@kaltura-ng2/kaltura-api/types';
import { SuggestionsProviderData } from '@kaltura-ng2/kaltura-primeng-ui/auto-complete';
import { PopupWidgetComponent } from '@kaltura-ng2/kaltura-ui/popup-widget/popup-widget.component';
import { EntryUsersHandler } from './entry-users-handler';

@Component({
  selector: 'kEntryUsers',
  templateUrl: './entry-users.component.html',
  styleUrls: ['./entry-users.component.scss']
})
export class EntryUsers implements AfterViewInit, OnInit, OnDestroy {

    public _loading = false;
    public _loadingError = null;

	@ViewChild('ownerPopup') ownerPopup: PopupWidgetComponent;

	private _searchUsersSubscription : ISubscription;
	public _usersProvider = new Subject<SuggestionsProviderData>();

    constructor(public _handler : EntryUsersHandler) {
    }


    ngOnInit() {
    }

    ngOnDestroy() {
    }


    ngAfterViewInit() {

    }

    _onLoadingAction(actionKey: string) {
        if (actionKey === 'retry') {
        }
    }

    public _openChangeOwner(): void{
	    this._handler.usersForm.patchValue({owners: null});
	    this.ownerPopup.open();
    }

    public _saveAndClose(): void{
	    this._handler.saveOwner();
	    this.ownerPopup.close();
    }

	public _searchUsers(event, formControl) : void {
		this._usersProvider.next({ suggestions : [], isLoading : true});

		if (this._searchUsersSubscription)
		{
			// abort previous request
			this._searchUsersSubscription.unsubscribe();
			this._searchUsersSubscription = null;
		}

		this._searchUsersSubscription = this._handler.searchUsers(event.query).subscribe(data => {
				const suggestions = [];
				(data || []).forEach((suggestedUser: KalturaUser) => {
					let isSelectable = true;
					if (formControl){
						const owners = this._handler.usersForm.value[formControl] || [];
						isSelectable = !owners.find(user => {
							return user.id === suggestedUser.id;
						});
					}
					suggestions.push({
						name: suggestedUser.screenName + "(" + suggestedUser.id + ")",
						item: suggestedUser,
						isSelectable: isSelectable
					});
				});
				this._usersProvider.next({suggestions: suggestions, isLoading: false});
			},
			(err) => {
				this._usersProvider.next({ suggestions : [], isLoading : false, errorMessage : <any>(err.message || err)});
			});
	}
}

