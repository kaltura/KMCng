import { Component, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { ISubscription } from 'rxjs/Subscription';
import { PopupWidgetComponent, PopupWidgetStates } from '@kaltura-ng/kaltura-ui/popup-widget/popup-widget.component';
import { KalturaClient } from '@kaltura-ng/kaltura-client';
import { KalturaMediaEntry } from 'kaltura-typescript-client/types/KalturaMediaEntry';
import { FlavorAssetGetUrlAction } from 'kaltura-typescript-client/types/FlavorAssetGetUrlAction';
import { Flavor } from '../flavor';


@Component({
	selector: 'kFlavorPreview',
	templateUrl: './flavor-preview.component.html',
	styleUrls: ['./flavor-preview.component.scss']
})
export class FlavorPreview implements AfterViewInit, OnDestroy {

	@Input() currentFlavor: Flavor;
	@Input() currentEntry: KalturaMediaEntry;
	@Input() parentPopupWidget: PopupWidgetComponent;

	private _parentPopupStateChangeSubscribe: ISubscription;
	public _previewSource = "";
	public _loadingError = "";

	constructor(private _kalturaServerClient: KalturaClient) {

	}

	ngAfterViewInit() {
		this._previewSource = "";
		this._loadingError = "";
		if (this.parentPopupWidget) {
			this._parentPopupStateChangeSubscribe = this.parentPopupWidget.state$
				.subscribe(event => {
					if (event.state === PopupWidgetStates.Open) {
						this._kalturaServerClient.request(new FlavorAssetGetUrlAction({
							id: this.currentFlavor.id
						}))
							.cancelOnDestroy(this)
							.monitor('get flavor url')
							.subscribe(
								url => {
									this._previewSource = url;},
								error => {
									this._loadingError = error.message;
								}
							);
					}
					if (event.state === PopupWidgetStates.Close) {
						this._previewSource = "";
					}
				});
		}
	}

	ngOnDestroy() {
		this._parentPopupStateChangeSubscribe.unsubscribe();
	}

}

