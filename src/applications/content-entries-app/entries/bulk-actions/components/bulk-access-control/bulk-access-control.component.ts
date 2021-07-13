import { Component, OnInit, OnDestroy, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { ISubscription } from 'rxjs/Subscription';

import { KalturaClient } from 'kaltura-ngx-client';
import { BrowserService } from 'app-shared/kmc-shell/providers';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui';


import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { SelectItem } from 'primeng/api';

import { KalturaAccessControl } from 'kaltura-ngx-client';
import { KalturaSiteRestriction } from 'kaltura-ngx-client';
import { KalturaSiteRestrictionType } from 'kaltura-ngx-client';
import { KalturaCountryRestriction } from 'kaltura-ngx-client';
import { KalturaCountryRestrictionType } from 'kaltura-ngx-client';
import { KalturaIpAddressRestriction } from 'kaltura-ngx-client';
import { KalturaIpAddressRestrictionType } from 'kaltura-ngx-client';
import { KalturaLimitFlavorsRestriction } from 'kaltura-ngx-client';
import { KalturaLimitFlavorsRestrictionType } from 'kaltura-ngx-client';
import { KalturaSessionRestriction } from 'kaltura-ngx-client';
import { KalturaPreviewRestriction } from 'kaltura-ngx-client';
import { KalturaFlavorParams } from 'kaltura-ngx-client';
import { KalturaUtils } from '@kaltura-ng/kaltura-common';
import { AppLocalization } from '@kaltura-ng/mc-shared';
import { AccessControlProfileStore, FlavoursStore } from 'app-shared/kmc-shared';
import { throwError } from 'rxjs';
import { forkJoin } from 'rxjs';
import * as R from 'ramda';
import { cancelOnDestroy, tag } from '@kaltura-ng/kaltura-common';

@Component({
	selector: 'kBulkAccessControl',
	templateUrl: './bulk-access-control.component.html',
	styleUrls: ['./bulk-access-control.component.scss']
})
export class BulkAAccessControl implements OnInit, OnDestroy, AfterViewInit {

	@Input() parentPopupWidget: PopupWidgetComponent;
	@Output() accessControlChangedChanged = new EventEmitter<KalturaAccessControl>();

	public _loading = false;
	public _sectionBlockerMessage: AreaBlockerMessage;


	public accessControlProfiles: KalturaAccessControl[] = [];


	private _accessControlProfiles = new BehaviorSubject<{ items: SelectItem[]}>({items: []});
	public _accessControlProfiles$ = this._accessControlProfiles.asObservable();

	public _selectedProfile: KalturaAccessControl = null;
	public set selectedProfile(profile: KalturaAccessControl) {
		this._selectedProfile = profile;
		this._setRestrictions();
	}

	public get selectedProfile() {
		return this._selectedProfile;
	}

	public _domainsRestriction: string = "";
	public _countriesRestriction: string = "";
	public _ipRestriction: string = "";
	public _flavourRestriction: string = "";
	public _advancedRestriction: string = "";

	private _flavourParams: KalturaFlavorParams[] = [];

	private _parentPopupStateChangeSubscribe: ISubscription;
	private _confirmClose: boolean = true;
	private isDirty = false;

	constructor(private _kalturaServerClient: KalturaClient, private _appLocalization: AppLocalization, private _browserService: BrowserService, private _accessControlProfileStore: AccessControlProfileStore, private _flavoursStore: FlavoursStore) {
	}

	ngOnInit() {
		this.loadAccessControlProfiles();
	}

	private loadAccessControlProfiles(): void {
		this.accessControlProfiles = [];
		this.fetchAccessControlProfiles().subscribe(
			response => {
				let ACProfiles = response[0].items;
				if (ACProfiles.length) {
					// check if any of the access control profiles is defined as default
					const defaultIndex = R.findIndex(R.propEq('isDefault', 1))(ACProfiles);
					if (defaultIndex > -1) {
						// put the default profile at the beginning of the profiles array
						const defaultProfile: KalturaAccessControl[] = ACProfiles.splice(defaultIndex, 1);
						ACProfiles.splice(0, 0, defaultProfile[0]);
					}
					let profilesDataProvider: SelectItem[] = [];
					ACProfiles.forEach((profile: KalturaAccessControl) => {
						profilesDataProvider.push({"label": profile.name, "value": profile});
						if (profile.isDefault === 1) {
							this.selectedProfile = profile;
						}
					});
					if (!this.selectedProfile && profilesDataProvider.length) {
						this.selectedProfile = profilesDataProvider[0].value;
					}
					this._flavourParams = response[1].items;
					this._accessControlProfiles.next({items: profilesDataProvider});
					this._loading = false;
				}

			},
			error => {
				this._loading = false;
				this._sectionBlockerMessage = new AreaBlockerMessage(
					{
						message: error.message,
						buttons: [
							{
								label: this._appLocalization.get('app.common.retry'),
								action: () => {
									this.loadAccessControlProfiles();
								}
							}
						]
					}
				);
				this._accessControlProfiles.next({items: []});
				return throwError(error);
			}
		);
	}

	ngAfterViewInit() {
		if (this.parentPopupWidget) {
			this._parentPopupStateChangeSubscribe = this.parentPopupWidget.state$
				.subscribe(event => {
					if (event.state === PopupWidgetStates.Open) {
						this._confirmClose = true;
					}
					if (event.state === PopupWidgetStates.BeforeClose) {
						if (event.context && event.context.allowClose) {
							if (this.isDirty && this._confirmClose) {
								event.context.allowClose = false;
								this._browserService.confirm(
									{
										header: this._appLocalization.get('applications.content.entryDetails.captions.cancelEdit'),
										message: this._appLocalization.get('applications.content.entryDetails.captions.discard'),
										accept: () => {
											this._confirmClose = false;
											this.parentPopupWidget.close();
										}
									}
								);
							}
						}
					}
				});
		}
	}

	ngOnDestroy() {
		this._parentPopupStateChangeSubscribe.unsubscribe();
	}


	public _apply() {
		this.accessControlChangedChanged.emit(this.selectedProfile);
		this._confirmClose = false;
		this.parentPopupWidget.close();
	}

	private fetchAccessControlProfiles(): Observable<any> {
		this._loading = true;
		this._accessControlProfiles.next({items: []});

		const getAPProfiles$ = this._accessControlProfileStore.get().pipe(cancelOnDestroy(this));
		const getFlavours$ = this._flavoursStore.get().pipe(cancelOnDestroy(this));

		return forkJoin(getAPProfiles$, getFlavours$).pipe(cancelOnDestroy(this));
	}

	private _setRestrictions() {

		this._domainsRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyDomain');
		this._countriesRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyCountry');
		this._ipRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyIP');
		this._flavourRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.anyFlavour');
		this._advancedRestriction = "";

		const restrictions = this.selectedProfile.restrictions;
		if (restrictions.length) {
			restrictions.forEach(restriction => {
				// domains restrictions
				if (restriction instanceof KalturaSiteRestriction) {
					if (restriction.siteRestrictionType === KalturaSiteRestrictionType.allowSiteList) {
						this._domainsRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowDomains', {"0": restriction.siteList});
					}
					if (restriction.siteRestrictionType === KalturaSiteRestrictionType.restrictSiteList) {
						this._domainsRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockDomains', {"0": restriction.siteList});
					}
				}
				// countries restrictions
				if (restriction instanceof KalturaCountryRestriction) {
					if (restriction.countryRestrictionType === KalturaCountryRestrictionType.allowCountryList) {
						this._countriesRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowCountries', {"0": this._getCountriesByCode(restriction.countryList)});
					}
					if (restriction.countryRestrictionType === KalturaCountryRestrictionType.restrictCountryList) {
						this._countriesRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockCountries', {"0": this._getCountriesByCode(restriction.countryList)});
					}
				}
				// IP restrictions
				if (restriction instanceof KalturaIpAddressRestriction) {
					if (restriction.ipAddressRestrictionType === KalturaIpAddressRestrictionType.allowList) {
						this._ipRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowIPs', {"0": restriction.ipAddressList});
					}
					if (restriction.ipAddressRestrictionType === KalturaIpAddressRestrictionType.restrictList) {
						this._ipRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockIPs', {"0": restriction.ipAddressList});
					}
				}
				// Flavour restrictions
				if (restriction instanceof KalturaLimitFlavorsRestriction && this._flavourParams.length) {
					// convert flavour IDs to flavour names
					let flavourIDs = restriction.flavorParamsIds.split(",");
					let flavourNames = [];
					flavourIDs.forEach(flavourId => {
						let flavour: KalturaFlavorParams = R.find(R.propEq('id', parseInt(flavourId)))(this._flavourParams);
						if (flavour !== undefined) {
							flavourNames.push(flavour.name);
						}
					});

					if (restriction.limitFlavorsRestrictionType === KalturaLimitFlavorsRestrictionType.allowList) {
						this._flavourRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.allowFlavours', {"0": flavourNames.join(", ")});
					}
					if (restriction.limitFlavorsRestrictionType === KalturaLimitFlavorsRestrictionType.restrictList) {
						this._flavourRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.blockFlavours', {"0": flavourNames.join(", ")});
					}
				}
				// Advanced restrictions
				if (restriction instanceof KalturaSessionRestriction) {
					this._advancedRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.ks');
				}
				if (restriction instanceof KalturaPreviewRestriction) {
					this._advancedRestriction = this._appLocalization.get('applications.content.entryDetails.accessControl.freePreview', {"0": KalturaUtils.formatTime(restriction.previewLength, true)});
				}
			});
		}
	}

	private _getCountriesByCode(codesList: string): string {
		let countries = [];
		const codes = codesList.split(",");
		codes.forEach(code => {
			const country = this._appLocalization.get('countries.' + code.toLowerCase());
			if (country) {
				countries.push(country);
			}
		});
		return countries.join(", ");
	}

	public onChange() {
		this.isDirty = true;
	}
}

