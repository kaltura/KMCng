import { Component, ViewChild, AfterViewInit,OnInit, OnDestroy } from '@angular/core';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { ISubscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs';
import { KalturaUser } from 'kaltura-ngx-client';
import { SuggestionsProviderData } from '@kaltura-ng/kaltura-primeng-ui';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { EntryUsersWidget } from './entry-users-widget.service';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { KMCPermissions } from 'app-shared/kmc-shared/kmc-permissions';


@Component({
  selector: 'kEntryUsers',
  templateUrl: './entry-users.component.html',
  styleUrls: ['./entry-users.component.scss']
})
export class EntryUsers implements AfterViewInit, OnInit, OnDestroy {

	@ViewChild('ownerPopup', { static: true }) ownerPopup: PopupWidgetComponent;

	private _searchUsersSubscription : ISubscription;
	public _usersProvider = new Subject<SuggestionsProviderData>();
	public _kmcPermissions = KMCPermissions;
	public _disableSaveButton = true;

	constructor(public _widgetService: EntryUsersWidget,
              private _appLocalization: AppLocalization,
              private _browserService: BrowserService) {
		this._convertUserInputToValidValue = this._convertUserInputToValidValue.bind(this); // fix scope issues when binding to a property
    }


    ngOnInit() {
		this._widgetService.attachForm();
    }

    ngOnDestroy() {
		this._widgetService.detachForm();
	}


    ngAfterViewInit() {
    }

    public _openChangeOwner(): void {
      this._disableSaveButton = true;
      this._widgetService.usersForm.patchValue({owners: []});
      this.ownerPopup.open();
    }

    public _saveAndClose(): void{
      const [owner] = this._widgetService.usersForm.value.owners;
      const hasScreenName = owner && (owner.screenName || '').trim() !== '';
      if (hasScreenName) {
        this._widgetService.saveOwner();
        this.ownerPopup.close();
      } else {
        this._browserService.alert({
          message: this._appLocalization.get('applications.content.entryDetails.users.noScreenName')
        });
      }
    }

	public _convertUserInputToValidValue(value : string) : any {
		let result = null;
		const tooltip = this._appLocalization.get('applications.content.entryDetails.users.tooltip', {0: value});
		if (value) {
			result =
				{
					id : value,
					screenName: value,
					__tooltip: tooltip,
					__class: 'userAdded'
				};

		}

		return result;
	}


	public _searchUsers(event, formControl?) : void {
		this._usersProvider.next({ suggestions : [], isLoading : true});

		if (this._searchUsersSubscription)
		{
			// abort previous request
			this._searchUsersSubscription.unsubscribe();
			this._searchUsersSubscription = null;
		}

		this._searchUsersSubscription = this._widgetService.searchUsers(event.query).subscribe(data => {
				const suggestions = [];
				(data || []).forEach((suggestedUser: KalturaUser) => {
                    suggestedUser['__tooltip'] = suggestedUser.id;
					let isSelectable = true;
					if (formControl){
						const owners = this._widgetService.usersForm.value[formControl] || [];
						isSelectable = !owners.find(user => {
							return user.id === suggestedUser.id;
						});
					}
					suggestions.push({
                        name: `${suggestedUser.screenName} (${suggestedUser.id})`,
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

  public _updateApplyButtonState(): void {
      const [owner] = this._widgetService.usersForm.value.owners;
      this._disableSaveButton = !owner || (owner.screenName || '').trim() === '';
  }
}

